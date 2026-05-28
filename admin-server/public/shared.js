const token = localStorage.getItem('token');
if (!token) { window.location.href = '/admin'; }
async function api(path, opts = {}) {
  const headers = { ...opts.headers };
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(path, { ...opts, headers });
  if (r.status === 401) { localStorage.removeItem('token'); window.location.href = '/admin'; }
  return r;
}
function logout() { localStorage.removeItem('token'); window.location.href = '/admin'; }
function toast(msg, type = 'success') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}
function confirmDelete(msg) { return confirm(msg || 'Tem certeza que deseja excluir?'); }
