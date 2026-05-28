require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { initDB } = require('./db');
const authRouter = require('./routes/auth').router;
const photosRouter = require('./routes/photos').router;
const logosRouter = require('./routes/logos').router;
const contentRouter = require('./routes/content').router;
const blogRouter = require('./routes/blog').router;
const submissionsRouter = require('./routes/submissions').router;
const servicesRouter = require('./routes/services').router;
const diferenciaisRouter = require('./routes/diferenciais').router;

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_MODE = process.env.HTTPS_MODE || 'http';
const DOMAIN = process.env.DOMAIN || '';
const LETSENCRYPT_EMAIL = process.env.LETSENCRYPT_EMAIL || '';

function parseCorsOrigins(envValue) {
  if (!envValue) return null;
  return envValue.split(',').map(o => o.trim()).filter(Boolean);
}

const ALLOWED_ORIGINS = parseCorsOrigins(process.env.CORS_ORIGIN);

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || !ALLOWED_ORIGINS) {
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS bloqueado para origem:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false,
  strictTransportSecurity: HTTPS_MODE === 'http' ? false : {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  xDownloadOptions: true,
  xXSSProtection: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  crossOriginResourcePolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin/assets', express.static(path.join(__dirname, 'public')));

const rateLimit = require('express-rate-limit');
const SqliteStore = require('./rate-limit-store');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new SqliteStore('login'),
});

const submissionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas solicitações enviadas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new SqliteStore('submissions'),
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new SqliteStore('api'),
});

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Muitas tentativas de troca de senha. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new SqliteStore('changepw'),
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/change-password', changePasswordLimiter);
app.use('/api', apiLimiter);

if (HTTPS_MODE === 'http') {
  console.warn('[AVISO] HTTPS_MODE=http — A sessão do admin e tokens JWT trafegam em texto puro. Configure HTTPS para produção.');
}

initDB();

app.use('/api/auth', authRouter);
app.use('/api/photos', photosRouter);
app.use('/api/logos', logosRouter);
app.use('/api/content', contentRouter);
app.use('/api/blog', blogRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/diferenciais', diferenciaisRouter);

const { prepare } = require('./db');
app.use((req, res, next) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) return next();
  if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next();
  try {
    const stmt = prepare("SELECT value FROM content WHERE section = 'maintenance_mode'");
    if (stmt.step() && stmt.getAsObject().value === '1') {
      return res.sendFile(path.join(__dirname, 'public', 'maintenance.html'));
    }
  } catch (e) { /* ignore */ }
  next();
});

app.use(express.static(path.join(__dirname, '..'), { setHeaders: function(res, p, stat) { if (p.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8'); } }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'moliveira-seguranca.html'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});
app.get('/admin/:page', (req, res) => {
  const page = req.params.page;
  const allowed = ['dashboard', 'photos', 'logos', 'content', 'blog', 'submissions', 'services', 'diferenciais'];
  if (allowed.includes(page)) {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } else {
    res.redirect('/admin');
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

if (HTTPS_MODE === 'letsencrypt') {
  const greenlock = require('greenlock-express');
  greenlock.init({
    packageRoot: __dirname,
    configDir: path.join(__dirname, 'greenlock.d'),
    cluster: false,
    maintainerEmail: LETSENCRYPT_EMAIL
  }).serve(app);

  console.log(`[HTTPS] Servidor rodando com Let's Encrypt em https://${DOMAIN}`);
  console.log(`[HTTPS] HTTP na porta 80 redirecionando para HTTPS na porta 443`);
} else if (HTTPS_MODE === 'cert') {
  const sslKey = process.env.SSL_KEY_PATH;
  const sslCert = process.env.SSL_CERT_PATH;

  if (!sslKey || !sslCert) {
    console.error('[ERRO] SSL_KEY_PATH e SSL_CERT_PATH são obrigatórios no modo "cert"');
    process.exit(1);
  }

  const options = {
    key: fs.readFileSync(sslKey),
    cert: fs.readFileSync(sslCert)
  };

  https.createServer(options, app).listen(443, () => {
    console.log(`[HTTPS] Servidor rodando em https://${DOMAIN || 'localhost'}:443`);
  });

  http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  }).listen(80, () => {
    console.log('[HTTP] Redirecionando para HTTPS na porta 80');
  });
} else {
  app.listen(PORT, () => {
    console.log(`Painel administrativo rodando em http://localhost:${PORT}/admin`);
  });
}
