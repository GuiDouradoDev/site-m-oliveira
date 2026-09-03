const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getBy, get, insert, update } = require('../db');
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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha' });
  if (!maxLength(username, 100)) return res.status(400).json({ error: 'Usuário muito longo' });
  if (!maxLength(password, 128)) return res.status(400).json({ error: 'Senha muito longa' });
  try {
    let user = await getBy('users', { username });

    const envUser = process.env.ADMIN_USERNAME;
    const envHash = process.env.ADMIN_PASSWORD_HASH;

    if (user && bcrypt.compareSync(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, username: user.username });
    }

    if (envUser && envHash && username === envUser && bcrypt.compareSync(password, envHash)) {
      if (!user) {
        await insert('users', { username, password_hash: envHash });
        user = await getBy('users', { username });
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, username: user.username });
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

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Preencha todos os campos' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
  try {
    const row = await get('users', req.user.id);
    if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    await update('users', req.user.id, { password_hash: hash });
    res.json({ success: true });
  } catch (e) {
    console.error('Password change error:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = { router, authMiddleware };
