const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'logos');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!LOGO_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato não permitido. Use PNG, JPG ou SVG.'));
    }
    const allowed = /\.(png|jpe?g|svg)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Formato não permitido. Use PNG, JPG ou SVG.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  try {
    const stmt = prepare('SELECT * FROM logos ORDER BY sort_order ASC, company_name ASC');
    const logos = [];
    while (stmt.step()) logos.push(stmt.getAsObject());
    res.json(logos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar logos' });
  }
});

router.post('/', authMiddleware, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const company = req.body.company_name || path.parse(req.file.originalname).name;
    prepare('INSERT INTO logos (filename, company_name) VALUES (?, ?)').run([req.file.filename, sanitize(company)]);
    saveDB();
    res.json({ success: true, filename: req.file.filename, company_name: sanitize(company) });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar logo' });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { company_name, sort_order } = req.body;
  try {
    const cn = company_name ? sanitize(company_name) : null;
    const so = sort_order !== undefined ? sort_order : null;
    if (cn === null && so === null) return res.status(400).json({ error: 'Nada para atualizar' });
    prepare('UPDATE logos SET company_name = COALESCE(?, company_name), sort_order = COALESCE(?, sort_order) WHERE id = ?')
      .run([cn, so, req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const stmt = prepare('SELECT filename FROM logos WHERE id = ?');
    stmt.bind([req.params.id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const filePath = path.join(UPLOAD_DIR, row.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    prepare('DELETE FROM logos WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
