const fs = require('fs');
const path = require('path');
const { db, run } = require('./db');
const { hashPassword } = require('./auth');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf-8');
  await new Promise((resolve, reject) => db.exec(sql, err => err ? reject(err) : resolve()));

  const demoPwd = await hashPassword('123456');
  const adminPwd = await hashPassword('admin123');
  await run('INSERT INTO users(email,password_hash,nickname,bio,role,verify_status,risk_level) VALUES(?,?,?,?,?,?,?)', ['demo@example.com', demoPwd, '演示用户', '关注基金和价值投资的普通用户', 'user', '基础认证', '稳健型']);
  await run('INSERT INTO users(email,password_hash,nickname,bio,role,verify_status,risk_level) VALUES(?,?,?,?,?,?,?)', ['admin@example.com', adminPwd, '管理员', '负责内容审核和运营管理', 'admin', '专业认证', '专业型']);

  const boards = [
    ['A股讨论', '市场讨论区', 'A股行情、个股和行业交流', 1],
    ['基金投资', '主题专区', '主动基金、指数基金和基金组合讨论', 2],
    ['量化投资', '主题专区', '量化策略、因子和回测讨论', 3],
    ['宏观策略', '主题专区', '宏观经济、政策和资产配置讨论', 4],
    ['问答求助', '问答区', '新手提问和投资知识答疑', 5]
  ];
  for (const b of boards) await run('INSERT INTO boards(name,category,description,sort_order) VALUES(?,?,?,?)', b);

  await run('INSERT INTO posts(author_id,board_id,title,content,post_type,stock_tags,is_elite,view_count) VALUES(?,?,?,?,?,?,?,?)', [1, 2, '指数基金定投需要注意哪些风险？', '定投并不等于稳赚，仍需关注估值、仓位和现金流。本文仅用于学习交流，不构成投资建议。', 'article', '沪深300,中证500', 1, 128]);
  await run('INSERT INTO posts(author_id,board_id,title,content,post_type,stock_tags,view_count) VALUES(?,?,?,?,?,?,?)', [1, 1, '今天市场缩量反弹，大家怎么看？', '盘中反弹强度一般，个人更关注成交量变化和板块轮动。', 'flash', 'A股', 56]);
  await run('INSERT INTO comments(post_id,user_id,content) VALUES(?,?,?)', [1, 2, '观点比较稳健，风险提示也很清楚。']);
  await run('INSERT INTO groups(owner_id,name,description,join_type) VALUES(?,?,?,?)', [1, '长期基金定投小组', '讨论指数基金、资产配置和长期投资纪律', 'public']);
  console.log('数据库初始化完成：backend/forum.db');
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
