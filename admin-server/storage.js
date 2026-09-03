const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Aceita a secret key nova (sb_secret_...) ou a legada service_role (eyJ...)
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
const useSupabase = !!(process.env.SUPABASE_URL && SUPABASE_KEY);

let supabase = null;

if (useSupabase) {
  supabase = createClient(process.env.SUPABASE_URL, SUPABASE_KEY);
}

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const BASE_URL = process.env.UPLOADS_BASE_URL || '';

const LOCAL_BASE = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

function ensureLocalDir(subdir) {
  const dir = path.join(LOCAL_BASE, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function generateFilename(originalname) {
  const ext = path.extname(originalname);
  return Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
}

function getPublicUrl(subdir, filename) {
  if (useSupabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    return supabaseUrl + '/storage/v1/object/public/' + SUPABASE_BUCKET + '/' + subdir + '/' + filename;
  }
  if (BASE_URL) {
    return BASE_URL + '/uploads/' + subdir + '/' + filename;
  }
  return '/uploads/' + subdir + '/' + filename;
}

async function uploadFile(subdir, buffer, originalname, mimetype) {
  const filename = generateFilename(originalname);

  if (useSupabase) {
    const storagePath = subdir + '/' + filename;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, buffer, { contentType: mimetype, upsert: false });
    if (error) throw error;
  } else {
    const dir = ensureLocalDir(subdir);
    fs.writeFileSync(path.join(dir, filename), buffer);
  }

  return filename;
}

async function deleteFile(subdir, filename) {
  if (useSupabase) {
    const storagePath = subdir + '/' + filename;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([storagePath]);
    if (error) throw error;
  } else {
    const filePath = path.join(LOCAL_BASE, subdir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = { useSupabase, getPublicUrl, uploadFile, deleteFile };
