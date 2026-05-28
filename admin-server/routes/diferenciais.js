const express = require('express');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const onlyActive = req.query.active === '1';
    const sql = onlyActive
      ? 'SELECT * FROM diferenciais WHERE active = 1 ORDER BY sort_order ASC, id ASC'
      : 'SELECT * FROM diferenciais ORDER BY sort_order ASC, id ASC';
    const stmt = prepare(sql);
    const items = [];
    while (stmt.step()) items.push(stmt.getAsObject());
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar diferenciais' });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
  if (!maxLength(title, 200)) return res.status(400).json({ error: 'Título muito longo (máx. 200 caracteres)' });
  if (description && !maxLength(description, 1000)) return res.status(400).json({ error: 'Descrição muito longa (máx. 1000 caracteres)' });
  try {
    prepare('INSERT INTO diferenciais (title, description, icon) VALUES (?, ?, ?)')
      .run([sanitize(title), sanitize(description || ''), icon || '⭐']);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar diferencial' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, description, icon, sort_order, active } = req.body;
  try {
    const t = title !== undefined ? sanitize(title) : null;
    const d = description !== undefined ? sanitize(description) : null;
    const i = icon !== undefined ? icon : null;
    const so = sort_order !== undefined ? sort_order : null;
    const a = active !== undefined ? (active ? 1 : 0) : null;
    if (t === null && d === null && i === null && so === null && a === null)
      return res.status(400).json({ error: 'Nada para atualizar' });
    prepare('UPDATE diferenciais SET title = COALESCE(?, title), description = COALESCE(?, description), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), active = COALESCE(?, active) WHERE id = ?')
      .run([t, d, i, so, a, req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar diferencial' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    prepare('DELETE FROM diferenciais WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir diferencial' });
  }
});

module.exports = { router };
