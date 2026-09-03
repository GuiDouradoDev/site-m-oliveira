const express = require('express');
const { all, insert, update, remove } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const onlyActive = req.query.active === '1';
    const opts = { order: [{ field: 'sort_order', ascending: true }, { field: 'id', ascending: true }] };
    if (onlyActive) opts.filter = { active: true };
    const services = await all('services', opts);
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar serviços' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
  if (!maxLength(title, 200)) return res.status(400).json({ error: 'Título muito longo (máx. 200 caracteres)' });
  if (description && !maxLength(description, 1000)) return res.status(400).json({ error: 'Descrição muito longa (máx. 1000 caracteres)' });
  try {
    await insert('services', {
      title: sanitize(title),
      description: sanitize(description || ''),
      icon: sanitize(icon) || '📋',
      active: true,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, description, icon, sort_order, active } = req.body;
  try {
    const patch = {};
    if (title !== undefined) patch.title = sanitize(title);
    if (description !== undefined) patch.description = sanitize(description);
    if (icon !== undefined) patch.icon = sanitize(icon);
    if (sort_order !== undefined) patch.sort_order = sort_order;
    if (active !== undefined) patch.active = !!active;
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
    await update('services', req.params.id, patch);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await remove('services', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});

module.exports = { router };
