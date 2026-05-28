const express = require('express');
const rateLimit = require('express-rate-limit');
const SqliteStore = require('../rate-limit-store');
const { prepare, saveDB } = require('../db');
const { authMiddleware } = require('./auth');
const { isValidEmail, isValidPhone, isValidBrazilianPhone, isValidId, sanitize, maxLength, validateEmailFull, isValidName, isValidCompany } = require('../validate');
const { notifyNewLead } = require('../mailer');
const https = require('https');
const router = express.Router();

const submissionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas solicitações enviadas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new SqliteStore('submissions'),
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const stmt = prepare('SELECT * FROM submissions ORDER BY created_at DESC');
    const submissions = [];
    while (stmt.step()) submissions.push(stmt.getAsObject());
    res.json(submissions);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

router.post('/', submissionsLimiter, async (req, res) => {
  var name = (req.body.name || '').trim();
  var company = (req.body.company || '').trim();
  var phone = (req.body.phone || '').trim();
  var email = (req.body.email || '').trim();
  var service = (req.body.service || '').trim();
  var message = (req.body.message || '').trim();

  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (!company) return res.status(400).json({ error: 'Empresa é obrigatória' });
  if (!phone) return res.status(400).json({ error: 'WhatsApp é obrigatório' });
  if (!service) return res.status(400).json({ error: 'Serviço é obrigatório' });

  if (!maxLength(name, 200)) return res.status(400).json({ error: 'Nome muito longo (máx. 200 caracteres)' });
  if (!maxLength(company, 200)) return res.status(400).json({ error: 'Empresa muito longa (máx. 200 caracteres)' });
  if (!isValidName(name)) return res.status(400).json({ error: 'Nome inválido. Deve conter ao menos 2 caracteres e letras.' });
  if (!isValidCompany(company)) return res.status(400).json({ error: 'Empresa inválida (mín. 2 caracteres).' });

  if (!isValidPhone(phone)) return res.status(400).json({ error: 'WhatsApp inválido. Use o formato (11) 99999-9999' });
  if (!isValidBrazilianPhone(phone)) return res.status(400).json({ error: 'WhatsApp inválido. Verifique o número (DDD + 8 ou 9 dígitos)' });

  if (email) {
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' });
    var emailCheck = await validateEmailFull(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });
  }

  if (!maxLength(service, 200)) return res.status(400).json({ error: 'Serviço muito longo (máx. 200 caracteres)' });
  if (message && !maxLength(message, 2000)) return res.status(400).json({ error: 'Mensagem muito longa (máx. 2000 caracteres)' });

  try {
    prepare('INSERT INTO submissions (name, email, phone, company, service, message) VALUES (?, ?, ?, ?, ?, ?)')
      .run([sanitize(name), sanitize(email), sanitize(phone), sanitize(company), sanitize(service), sanitize(message)]);
    saveDB();
    notifyNewLead({ name, email, phone, company, service, message });

    // Notify via Web3Forms (server-side, não expõe a chave no cliente)
    var wfKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (wfKey) {
      var wfBody = JSON.stringify({
        access_key: wfKey,
        subject: 'Novo lead: ' + name + ' - ' + company,
        Nome: name,
        Empresa: company,
        WhatsApp: phone,
        'E-mail': email || '-',
        'Serviço': service,
        Mensagem: message || '-'
      });
      var wfReq = https.request('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(wfBody) }
      });
      wfReq.on('error', function() {});
      wfReq.write(wfBody);
      wfReq.end();
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar solicitação' });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    prepare('DELETE FROM submissions WHERE id = ?').run([req.params.id]);
    saveDB();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

module.exports = { router };
