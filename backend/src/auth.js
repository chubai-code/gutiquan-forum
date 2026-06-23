const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'stock-fund-forum-secret';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ code: 401, message: '未登录' });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id,email,nickname,role,muted_until FROM users WHERE id=?', [payload.id]);
    if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ code: 401, message: 'Token 无效或已过期' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '需要管理员权限' });
  next();
}

module.exports = { hashPassword, comparePassword, signToken, requireAuth, requireAdmin };
