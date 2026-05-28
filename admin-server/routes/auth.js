const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare, saveDB } = require('../db');
const { sanitize, maxLength } = require('../validate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠ Variável JWT_SECRET não definida. Use uma senha forte em produção.');
  process.exit(1);
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha' });
  if (!maxLength(username, 100)) return res.status(400).json({ error: 'Usuário muito longo' });
  if (!maxLength(password, 128)) return res.status(400).json({ error: 'Senha muito longa' });
  try {
    const stmt = prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (bcrypt.compareSync(password, row.password_hash)) {
        const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, username: row.username });
      }
    }
    res.status(401).json({ error: 'Usuário ou senha incorretos' });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/check', authMiddleware, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Preencha todos os campos' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
  try {
    const stmt = prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([req.user.id]);
    stmt.step();
    const row = stmt.getAsObject();
    if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    prepare('UPDATE users SET password_hash = ? WHERE id = ?').run([hash, req.user.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    console.error('Password change error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = { router, authMiddleware };
