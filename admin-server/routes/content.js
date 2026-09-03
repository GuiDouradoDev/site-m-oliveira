const express = require('express');
const { all, upsertContent } = require('../db');
const { authMiddleware } = require('./auth');
const { sanitize, maxLength } = require('../validate');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rows = await all('content');
    const content = {};
    rows.forEach(row => { content[row.section] = row.value; });
    res.json(content);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao carregar conteúdo' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
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
        const clean = sanitize(value);
        if (!maxLength(clean, 5000)) continue;
        await upsertContent(key, clean);
        updates.push(key);
      }
    }
    res.json({ success: true, updated: updates });
  } catch (e) {
    console.error('Content update error:', e);
    res.status(500).json({ error: 'Erro ao salvar conteúdo' });
  }
});

module.exports = { router };
