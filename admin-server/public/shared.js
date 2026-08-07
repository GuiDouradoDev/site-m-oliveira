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

// Menu deslizante (drawer) para mobile
(function () {
  var topbar = document.querySelector('.topbar');
  var sidebar = document.querySelector('.sidebar');
  if (!topbar || !sidebar) return;

  var btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.innerHTML = '&#9776;';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Abrir menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', toggleMobileMenu);
  topbar.insertBefore(btn, topbar.firstChild);

  var backdrop = null;

  function toggleMobileMenu() {
    var open = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (!backdrop || !backdrop.parentNode) {
        backdrop = document.createElement('div');
        backdrop.className = 'backdrop';
        backdrop.addEventListener('click', toggleMobileMenu);
        document.body.appendChild(backdrop);
      }
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      if (backdrop) backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  sidebar.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) toggleMobileMenu();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleMobileMenu();
  });
})();

// Link para o site público (canto inferior esquerdo da sidebar)
(function () {
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  var isLocal = ['localhost', '127.0.0.1'].indexOf(window.location.hostname) !== -1;
  var siteUrl = isLocal ? window.location.origin + '/' : 'https://moliveiraseguranca.com.br';
  var a = document.createElement('a');
  a.className = 'sidebar-site-link';
  a.href = siteUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = '🌐 Ver Site';
  a.title = 'Abrir o site em uma nova aba';
  sidebar.appendChild(a);
})();
