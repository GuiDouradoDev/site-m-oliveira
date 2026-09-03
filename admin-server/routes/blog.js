const express = require('express');
const { all, get, insert, update, remove } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const includeUnpublished = req.query.all === '1';
    const opts = { order: [{ field: 'created_at', ascending: false }] };
    if (!includeUnpublished) opts.filter = { published: true };
    const posts = await all('blog_posts', opts);
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar posts' });
  }
});

router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const post = await get('blog_posts', req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, content, excerpt } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
  if (!maxLength(title, 300)) return res.status(400).json({ error: 'Título muito longo (máx. 300 caracteres)' });
  if (!maxLength(content, 50000)) return res.status(400).json({ error: 'Conteúdo muito longo (máx. 50000 caracteres)' });
  if (excerpt && !maxLength(excerpt, 500)) return res.status(400).json({ error: 'Resumo muito longo (máx. 500 caracteres)' });
  try {
    await insert('blog_posts', { title: sanitize(title), content, excerpt: sanitize(excerpt || '') });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar post' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, content, excerpt, published } = req.body;
  try {
    const patch = {};
    if (title) patch.title = sanitize(title);
    if (content) patch.content = content;
    if (excerpt !== undefined) patch.excerpt = sanitize(excerpt);
    if (published !== undefined) patch.published = !!published;
    patch.updated_at = new Date().toISOString();
    await update('blog_posts', req.params.id, patch);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar post' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await remove('blog_posts', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir post' });
  }
});

module.exports = { router };
