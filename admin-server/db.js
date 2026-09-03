const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

let _sb = null;

async function initDB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('ERRO: SUPABASE_URL e SUPABASE_SECRET_KEY (ou SERVICE_KEY) são obrigatórios.');
    console.error('Configure-os nas variáveis de ambiente antes de iniciar.');
    process.exit(1);
  }
  _sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await _sb.from('users').select('id').limit(1);
  if (error) {
    console.error('ERRO ao acessar o banco no Supabase:', error.message);
    console.error('Verifique se o script supabase-schema.sql foi executado no SQL Editor.');
    throw error;
  }

  if (!data || data.length === 0) {
    const hash = bcrypt.hashSync('seg123', 10);
    await _sb.from('users').insert({ username: 'admin', password_hash: hash });
    console.log('⚠  ATENÇÃO: Usuário padrão criado — admin / seg123');
    console.log('⚠  Altere a senha imediatamente após o primeiro login!');
  }

  console.log('Conexão com Supabase Postgres OK.');
}

function client() {
  return _sb;
}

async function all(table, { filter, order } = {}) {
  let q = _sb.from(table).select('*');
  if (order) {
    for (const o of order) {
      q = q.order(o.field, { ascending: o.ascending });
    }
  }
  if (filter) {
    for (const [field, value] of Object.entries(filter)) {
      if (value === null) q = q.is(field, null);
      else q = q.eq(field, value);
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function get(table, id) {
  const { data, error } = await _sb.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getBy(table, filter) {
  let q = _sb.from(table).select('*');
  for (const [k, v] of Object.entries(filter)) {
    if (v === null) q = q.is(k, null);
    else q = q.eq(k, v);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

async function first(table, filter) {
  let q = _sb.from(table).select('*').limit(1);
  for (const [k, v] of Object.entries(filter)) {
    if (v === null) q = q.is(k, null);
    else q = q.eq(k, v);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data && data[0]) || null;
}

async function insert(table, obj) {
  const { data, error } = await _sb.from(table).insert(obj).select().single();
  if (error) throw error;
  return data;
}

async function update(table, id, obj) {
  if (!obj || Object.keys(obj).length === 0) return null;
  const { data, error } = await _sb.from(table).update(obj).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function remove(table, id) {
  const { error } = await _sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

async function upsertContent(section, value) {
  const { error } = await _sb.from('content').upsert({ section, value }, { onConflict: 'section' });
  if (error) throw error;
}

module.exports = {
  initDB,
  client,
  all,
  get,
  getBy,
  first,
  insert,
  update,
  remove,
  upsertContent,
};
