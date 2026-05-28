const express = require('express');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const includeUnpublished = req.query.all === '1';
    const sql = includeUnpublished
      ? 'SELECT * FROM blog_posts ORDER BY created_at DESC'
      : 'SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC';
    const stmt = prepare(sql);
    const posts = [];
    while (stmt.step()) posts.push(stmt.getAsObject());
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar posts' });
  }
});

router.get('/:id', (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const stmt = prepare('SELECT * FROM blog_posts WHERE id = ?');
    stmt.bind([req.params.id]);
    if (stmt.step()) return res.json(stmt.getAsObject());
    res.status(404).json({ error: 'Post não encontrado' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const { title, content, excerpt } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
  if (!maxLength(title, 300)) return res.status(400).json({ error: 'Título muito longo (máx. 300 caracteres)' });
  if (!maxLength(content, 50000)) return res.status(400).json({ error: 'Conteúdo muito longo (máx. 50000 caracteres)' });
  if (excerpt && !maxLength(excerpt, 500)) return res.status(400).json({ error: 'Resumo muito longo (máx. 500 caracteres)' });
  try {
    prepare('INSERT INTO blog_posts (title, content, excerpt) VALUES (?, ?, ?)')
      .run([sanitize(title), content, sanitize(excerpt || '')]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar post' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, content, excerpt, published } = req.body;
  try {
    const t = title ? sanitize(title) : null;
    const c = content ? content : null;
    const e = excerpt !== undefined ? sanitize(excerpt) : null;
    const p = published !== undefined ? (published ? 1 : 0) : null;
    if (t === null && c === null && e === null && p === null)
      return res.status(400).json({ error: 'Nada para atualizar' });
    prepare('UPDATE blog_posts SET title = COALESCE(?, title), content = COALESCE(?, content), excerpt = COALESCE(?, excerpt), published = COALESCE(?, published), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run([t, c, e, p, req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar post' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    prepare('DELETE FROM blog_posts WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir post' });
  }
});

module.exports = { router };
