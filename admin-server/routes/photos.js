const express = require('express');
const multer = require('multer');
const path = require('path');
const { all, insert, update, get, remove } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');
const { getPublicUrl, uploadFile, deleteFile } = require('../storage');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function photoUrl(p) {
  return getPublicUrl('photos', p.filename);
}

router.get('/', async (req, res) => {
  try {
    const serviceId = req.query.service;
    const opts = serviceId
      ? { filter: { service_id: parseInt(serviceId) }, order: [{ field: 'sort_order', ascending: true }, { field: 'created_at', ascending: false }] }
      : { order: [{ field: 'sort_order', ascending: true }, { field: 'created_at', ascending: false }] };
    const photos = await all('photos', opts);
    photos.forEach(p => { p.url = photoUrl(p); });
    res.json(photos);
  } catch (e) {
    console.error('Photos list error:', e);
    res.status(500).json({ error: 'Erro ao listar fotos' });
  }
});

router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const title = sanitize(req.body.title || req.file.originalname);
    const serviceId = parseInt(req.body.service_id) || 0;
    const filename = await uploadFile('photos', req.file.buffer, req.file.originalname, req.file.mimetype);
    await insert('photos', { filename, title, service_id: serviceId });
    const url = getPublicUrl('photos', filename);
    res.json({ success: true, filename, title, service_id: serviceId, url });
  } catch (e) {
    console.error('Photo upload error:', e);
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, sort_order, service_id } = req.body;
  try {
    const patch = {};
    if (title !== undefined) patch.title = sanitize(title);
    if (sort_order !== undefined) patch.sort_order = sort_order;
    if (service_id !== undefined) patch.service_id = parseInt(service_id);
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
    await update('photos', req.params.id, patch);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const row = await get('photos', req.params.id);
    if (row) await deleteFile('photos', row.filename);
    await remove('photos', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
