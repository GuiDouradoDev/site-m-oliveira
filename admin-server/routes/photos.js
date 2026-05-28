const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'photos');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
    const allowed = /\.(jpe?g|png|gif|webp)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Formato não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  try {
    const serviceId = req.query.service;
    let sql;
    if (serviceId) {
      sql = prepare('SELECT * FROM photos WHERE service_id = ? ORDER BY sort_order ASC, created_at DESC');
      sql.bind([parseInt(serviceId)]);
    } else {
      sql = prepare('SELECT * FROM photos ORDER BY sort_order ASC, created_at DESC');
    }
    const photos = [];
    while (sql.step()) photos.push(sql.getAsObject());
    res.json(photos);
  } catch (e) {
    console.error('Photos list error:', e);
    res.status(500).json({ error: 'Erro ao listar fotos' });
  }
});

router.post('/', authMiddleware, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const title = sanitize(req.body.title || req.file.originalname);
    const serviceId = parseInt(req.body.service_id) || 0;
    prepare('INSERT INTO photos (filename, title, service_id) VALUES (?, ?, ?)').run([req.file.filename, title, serviceId]);
    saveDB();
    res.json({ success: true, filename: req.file.filename, title, service_id: serviceId });
  } catch (e) {
    console.error('Photo upload error:', e);
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { title, sort_order, service_id } = req.body;
  try {
    const t = title !== undefined ? sanitize(title) : null;
    const so = sort_order !== undefined ? sort_order : null;
    const sid = service_id !== undefined ? parseInt(service_id) : null;
    if (t === null && so === null && sid === null) return res.status(400).json({ error: 'Nada para atualizar' });
    prepare('UPDATE photos SET title = COALESCE(?, title), sort_order = COALESCE(?, sort_order), service_id = COALESCE(?, service_id) WHERE id = ?')
      .run([t, so, sid, req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const stmt = prepare('SELECT filename FROM photos WHERE id = ?');
    stmt.bind([req.params.id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const filePath = path.join(UPLOAD_DIR, row.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    prepare('DELETE FROM photos WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
