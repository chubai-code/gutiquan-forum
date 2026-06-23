const express = require('express');
const cors = require('cors');
const { run, get, all } = require('./db');
const { hashPassword, comparePassword, signToken, requireAuth, requireAdmin } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

function ok(data = null, message = 'ok') { return { code: 0, message, data }; }
function bad(res, status, message) { return res.status(status).json({ code: status, message }); }
function sensitiveCheck(text) {
  const words = ['稳赚不赔', '保证收益', '内幕消息', '拉升', '坐庄'];
  const hit = words.find(w => text.includes(w));
  return hit ? { status: 'pending', reason: `命中敏感词：${hit}` } : { status: 'published', reason: '' };
}

app.get('/api/health', (req, res) => res.json(ok({ status: 'running' })));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) return bad(res, 400, '邮箱、密码和昵称不能为空');
    if (password.length < 6) return bad(res, 400, '密码长度不能少于 6 位');
    const exists = await get('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return bad(res, 400, '该邮箱已注册');
    const passwordHash = await hashPassword(password);
    const result = await run('INSERT INTO users(email,password_hash,nickname) VALUES(?,?,?)', [email, passwordHash, nickname]);
    res.json(ok({ id: result.id, email, nickname }));
  } catch (e) { bad(res, 500, e.message); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email=?', [email]);
    if (!user || !(await comparePassword(password, user.password_hash))) return bad(res, 401, '账号或密码错误');
    const token = signToken(user);
    res.json(ok({ token, user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } }));
  } catch (e) { bad(res, 500, e.message); }
});

app.get('/api/boards', async (req, res) => {
  const rows = await all('SELECT b.*, COUNT(p.id) AS post_count FROM boards b LEFT JOIN posts p ON p.board_id=b.id GROUP BY b.id ORDER BY b.sort_order ASC');
  res.json(ok(rows));
});

app.post('/api/boards', requireAuth, requireAdmin, async (req, res) => {
  const { name, category, description, sortOrder = 0 } = req.body;
  if (!name || !category) return bad(res, 400, '板块名称和分类不能为空');
  const result = await run('INSERT INTO boards(name,category,description,sort_order) VALUES(?,?,?,?)', [name, category, description || '', sortOrder]);
  res.json(ok({ id: result.id }));
});

app.get('/api/posts', async (req, res) => {
  const { boardId, keyword = '' } = req.query;
  const params = [];
  let where = "WHERE p.status='published'";
  if (boardId) { where += ' AND p.board_id=?'; params.push(boardId); }
  if (keyword) { where += ' AND (lower(p.title) LIKE ? OR lower(p.content) LIKE ? OR lower(p.stock_tags) LIKE ?)'; const k = `%${String(keyword).toLowerCase()}%`; params.push(k, k, k); }
  const rows = await all(`SELECT p.*, u.nickname, b.name AS board_name,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id AND c.status='published') AS comment_count,
    (SELECT COUNT(*) FROM reactions r WHERE r.target_type='post' AND r.target_id=p.id AND r.reaction_type='like') AS like_count,
    (SELECT COUNT(*) FROM reactions r WHERE r.target_type='post' AND r.target_id=p.id AND r.reaction_type='favorite') AS favorite_count
    FROM posts p JOIN users u ON p.author_id=u.id JOIN boards b ON p.board_id=b.id ${where} ORDER BY p.created_at DESC`, params);
  res.json(ok(rows));
});

app.get('/api/posts/:id', async (req, res) => {
  const id = req.params.id;
  await run('UPDATE posts SET view_count=view_count+1 WHERE id=?', [id]);
  const post = await get('SELECT p.*, u.nickname, u.verify_status, b.name AS board_name FROM posts p JOIN users u ON p.author_id=u.id JOIN boards b ON p.board_id=b.id WHERE p.id=?', [id]);
  if (!post) return bad(res, 404, '帖子不存在');
  res.json(ok(post));
});

app.post('/api/posts', requireAuth, async (req, res) => {
  const { boardId, title, content, postType = 'normal', stockTags = '' } = req.body;
  if (!title || !content || !boardId) return bad(res, 400, '板块、标题和正文不能为空');
  const check = sensitiveCheck(title + content);
  const result = await run('INSERT INTO posts(author_id,board_id,title,content,post_type,stock_tags,status) VALUES(?,?,?,?,?,?,?)', [req.user.id, boardId, title, content, postType, stockTags, check.status]);
  if (check.status === 'pending') await run('INSERT INTO audit_records(target_type,target_id,risk_level,reason,status) VALUES(?,?,?,?,?)', ['post', result.id, 'high', check.reason, 'pending']);
  res.json(ok({ id: result.id, status: check.status, reason: check.reason }));
});

app.get('/api/posts/:id/comments', async (req, res) => {
  const rows = await all('SELECT c.*, u.nickname FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? AND c.status=? ORDER BY c.created_at ASC', [req.params.id, 'published']);
  res.json(ok(rows));
});

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const { content, parentId = null } = req.body;
  if (!content) return bad(res, 400, '评论内容不能为空');
  const check = sensitiveCheck(content);
  const result = await run('INSERT INTO comments(post_id,user_id,parent_id,content,status) VALUES(?,?,?,?,?)', [req.params.id, req.user.id, parentId, content, check.status]);
  if (check.status === 'pending') await run('INSERT INTO audit_records(target_type,target_id,risk_level,reason,status) VALUES(?,?,?,?,?)', ['comment', result.id, 'high', check.reason, 'pending']);
  res.json(ok({ id: result.id, status: check.status }));
});

async function toggleReaction(req, res, type) {
  const existed = await get('SELECT id FROM reactions WHERE user_id=? AND target_type=? AND target_id=? AND reaction_type=?', [req.user.id, 'post', req.params.id, type]);
  if (existed) { await run('DELETE FROM reactions WHERE id=?', [existed.id]); return res.json(ok({ active: false })); }
  await run('INSERT INTO reactions(user_id,target_type,target_id,reaction_type) VALUES(?,?,?,?)', [req.user.id, 'post', req.params.id, type]);
  res.json(ok({ active: true }));
}
app.post('/api/posts/:id/like', requireAuth, (req, res) => toggleReaction(req, res, 'like'));
app.post('/api/posts/:id/favorite', requireAuth, (req, res) => toggleReaction(req, res, 'favorite'));

app.get('/api/users/me', requireAuth, async (req, res) => {
  const user = await get('SELECT id,email,nickname,avatar,bio,risk_level,verify_status,role,privacy_level,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(ok(user));
});

app.put('/api/users/me', requireAuth, async (req, res) => {
  const { nickname, avatar = '', bio = '', riskLevel = '未评估', privacyLevel = 'public' } = req.body;
  if (!nickname) return bad(res, 400, '昵称不能为空');
  await run('UPDATE users SET nickname=?,avatar=?,bio=?,risk_level=?,privacy_level=? WHERE id=?', [nickname, avatar, bio, riskLevel, privacyLevel, req.user.id]);
  res.json(ok({ updated: true }));
});

app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) return bad(res, 400, '不能关注自己');
  const existed = await get('SELECT id FROM follows WHERE follower_id=? AND following_id=?', [req.user.id, targetId]);
  if (existed) { await run('DELETE FROM follows WHERE id=?', [existed.id]); return res.json(ok({ following: false })); }
  await run('INSERT INTO follows(follower_id,following_id) VALUES(?,?)', [req.user.id, targetId]);
  res.json(ok({ following: true }));
});

app.get('/api/groups', async (req, res) => {
  const rows = await all('SELECT g.*, u.nickname AS owner_name FROM groups g JOIN users u ON g.owner_id=u.id ORDER BY g.created_at DESC');
  res.json(ok(rows));
});

app.post('/api/groups', requireAuth, async (req, res) => {
  const { name, description = '', joinType = 'public' } = req.body;
  if (!name) return bad(res, 400, '群组名称不能为空');
  const result = await run('INSERT INTO groups(owner_id,name,description,join_type) VALUES(?,?,?,?)', [req.user.id, name, description, joinType]);
  await run('INSERT INTO group_members(group_id,user_id,member_role) VALUES(?,?,?)', [result.id, req.user.id, 'owner']);
  res.json(ok({ id: result.id }));
});

app.get('/api/admin/audits', requireAuth, requireAdmin, async (req, res) => {
  const rows = await all('SELECT * FROM audit_records ORDER BY created_at DESC');
  res.json(ok(rows));
});

app.put('/api/admin/audits/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'deleted'].includes(status)) return bad(res, 400, '审核状态不合法');
  await run('UPDATE audit_records SET status=?, operator_id=? WHERE id=?', [status, req.user.id, req.params.id]);
  res.json(ok({ updated: true }));
});

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`股票基金投资论坛后端启动：http://localhost:${PORT}`));
}

module.exports = app;
