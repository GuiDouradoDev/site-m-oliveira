const express = require('express');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, maxLength } = require('../validate');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const stmt = prepare('SELECT * FROM content');
    const content = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      content[row.section] = row.value;
    }
    res.json(content);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao carregar conteúdo' });
  }
});

router.put('/', authMiddleware, (req, res) => {
  try {
    const allowed = ['hero_title', 'hero_subtitle', 'hero_slogan', 'about_title', 'about_text',
      'services_title', 'services_desc', 'treinamentos_title', 'treinamentos_desc',
      'clientes_title', 'clientes_desc', 'contato_title', 'contato_desc', 'footer_text',
      'diferenciais_title', 'diferenciais_desc',
      'stat1_title', 'stat1_label', 'stat2_title', 'stat2_label', 'stat3_title', 'stat3_label',
      'onde_title', 'onde_desc', 'onde_servicos', 'onde_atuacao_label', 'onde_atuacao',
      'onde_horario_label', 'onde_horario_semana', 'onde_horario_sabado',
      'whatsapp', 'instagram', 'email',
      'maintenance_mode', 'maintenance_message'];
    const updates = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key) && typeof value === 'string') {
        const clean = key.endsWith('_desc') || key.endsWith('_text') || key.endsWith('_slogan') || key === 'footer_text'
          ? sanitize(value)
          : sanitize(value);
        if (!maxLength(clean, 5000)) continue;
        const existing = prepare('SELECT id FROM content WHERE section = ?');
        existing.bind([key]);
        if (existing.step()) {
          prepare('UPDATE content SET value = ? WHERE section = ?').run([clean, key]);
        } else {
          prepare('INSERT INTO content (section, value) VALUES (?, ?)').run([key, clean]);
        }
        updates.push(key);
      }
    }
    if (updates.length > 0) saveDB();
    res.json({ success: true, updated: updates });
  } catch (e) {
    console.error('Content update error:', e);
    res.status(500).json({ error: 'Erro ao salvar conteúdo' });
  }
});

module.exports = { router };
