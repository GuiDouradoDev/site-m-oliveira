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

router.get('/', async (req, res) => {
  try {
    const logos = await all('logos', { order: [{ field: 'sort_order', ascending: true }, { field: 'company_name', ascending: true }] });
    logos.forEach(l => { l.url = logoUrl(l); });
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
    const clean = sanitize(company);
    await insert('logos', { filename, company_name: clean });
    const url = getPublicUrl('logos', filename);
    res.json({ success: true, filename, company_name: clean, url });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar logo' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { company_name, sort_order } = req.body;
  try {
    const patch = {};
    if (company_name) patch.company_name = sanitize(company_name);
    if (sort_order !== undefined) patch.sort_order = sort_order;
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
    await update('logos', req.params.id, patch);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const row = await get('logos', req.params.id);
    if (row) await deleteFile('logos', row.filename);
    await remove('logos', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
