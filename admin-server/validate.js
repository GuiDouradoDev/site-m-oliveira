const dns = require('dns');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

const DISPOSABLE_DOMAINS = new Set([
  'guerrillamail.com', 'sharklasers.com', 'grr.la', '10minutemail.com',
  'mailinator.com', 'mailinator.net', 'yopmail.com', 'yopmail.fr',
  'throwaway.email', 'tempmail.com', 'temp-mail.org', 'tempemail.co',
  'fakeinbox.com', 'mailexpire.com', 'mailnator.com', 'getairmail.com',
  'dispostable.com', 'maildrop.cc', 'trashmail.com', 'trashmail.net',
  'trashmail.me', 'spamgourmet.com', 'spam4.me', 'thankyou2010.com',
  'emailondeck.com', 'mailcatch.com', 'mintemail.com', 'harakirimail.com',
  'inboxalias.com', 'flashmail.net', 'poofy.io', 'burnermail.io',
  'tempmail.ninja', 'tmpmail.org', '33mail.com', 'eyepaste.com',
  'guerrillamail.org', 'guerrillamail.net', 'guerrillamail.biz',
  'istii.ch', 'rcpt.at', 'zzz.com', 'mailmetrash.com',
]);

const COMMON_TYPOS = {
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com', 'gmil.com': 'gmail.com', 'gmal.com': 'gmail.com',
  'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'outlook.con': 'outlook.com', 'outlok.com': 'outlook.com',
  'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'uol.con': 'uol.com.br', 'uol.con.br': 'uol.com.br',
  'bol.con': 'bol.com.br', 'bol.con.br': 'bol.com.br',
  'ig.con': 'ig.com.br', 'ig.con.br': 'ig.com.br',
  'terra.con': 'terra.com.br', 'terra.con.br': 'terra.com.br',
  'globo.con': 'globo.com', 'globo.con': 'globo.com',
};

function isValidEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v);
}

function isValidPhone(v) {
  return typeof v === 'string' && PHONE_RE.test(v);
}

function isValidId(v) {
  return /^\d+$/.test(String(v)) && Number(v) > 0;
}

function sanitize(v) {
  if (typeof v !== 'string') return '';
  return v
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function maxLength(v, max) {
  return typeof v === 'string' && v.length <= max;
}

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function checkEmailTypo(email) {
  const domain = email.split('@')[1];
  if (!domain) return null;
  const lower = domain.toLowerCase();
  if (COMMON_TYPOS[lower]) return COMMON_TYPOS[lower];
  return null;
}

function isValidName(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t.length >= 2 && t.length <= 200 && /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(t);
}

function isValidCompany(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return t.length >= 2 && t.length <= 200;
}

function isValidBrazilianPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  const number = digits.slice(2);
  if (number.length === 8) return true;
  if (number.length === 9 && number[0] === '9') return true;
  return false;
}

async function validateEmailDomain(email) {
  const domain = email.split('@')[1];
  if (!domain) return { valid: false, reason: 'Formato de email inválido' };

  const disposable = isDisposableEmail(email);
  if (disposable) return { valid: false, reason: 'Email descartável não é permitido' };

  const typo = checkEmailTypo(email);
  if (typo) return { valid: false, reason: `Você quis dizer @${typo}?` };

  try {
    const mx = await dns.promises.resolveMx(domain);
    if (!mx || mx.length === 0) {
      console.warn(`[DNS] Nenhum registro MX encontrado para ${domain}, permitindo envio`);
    }
  } catch {
    console.warn(`[DNS] Falha ao resolver MX para ${domain}, permitindo envio`);
  }
  return { valid: true };
}

async function validateEmailFull(email) {
  if (!email) return { valid: true };
  if (!isValidEmail(email)) return { valid: false, reason: 'Formato de email inválido' };
  return validateEmailDomain(email);
}

module.exports = {
  isValidEmail, isValidPhone, isValidId, sanitize, maxLength,
  isValidBrazilianPhone, isDisposableEmail, checkEmailTypo,
  validateEmailDomain, validateEmailFull, isValidName, isValidCompany,
};
