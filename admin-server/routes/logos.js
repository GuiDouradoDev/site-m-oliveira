const express = require('express');
const multer = require('multer');
const path = require('path');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, isValidId, maxLength } = require('../validate');
const { getPublicUrl, uploadFile, deleteFile } = require('../storage');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!LOGO_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Formato não permitido. Use PNG, JPG ou SVG.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

function logoUrl(l) {
  return getPublicUrl('logos', l.filename);
}

router.get('/', (req, res) => {
  try {
    const stmt = prepare('SELECT * FROM logos ORDER BY sort_order ASC, company_name ASC');
    const logos = [];
    while (stmt.step()) {
      const l = stmt.getAsObject();
      l.url = logoUrl(l);
      logos.push(l);
    }
    res.json(logos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar logos' });
  }
});

router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const company = req.body.company_name || path.parse(req.file.originalname).name;
    const filename = await uploadFile('logos', req.file.buffer, req.file.originalname, req.file.mimetype);
    prepare('INSERT INTO logos (filename, company_name) VALUES (?, ?)').run([filename, sanitize(company)]);
    saveDB();
    const url = getPublicUrl('logos', filename);
    res.json({ success: true, filename, company_name: sanitize(company), url });
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

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const stmt = prepare('SELECT filename FROM logos WHERE id = ?');
    stmt.bind([req.params.id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      await deleteFile('logos', row.filename);
    }
    prepare('DELETE FROM logos WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
