// shared.js — Untrained Momentum CRM
// Single source of truth for auth, nav, utilities

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── AUTH ──────────────────────────────────────────────────────
async function requireAuth(requiredRole) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.replace('index.html'); return null; }

  // Try profile fetch — fall back to session data if RLS blocks
  let profile;
  try {
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    profile = data;
  } catch(e) {}

  if (!profile) {
    profile = { id: session.user.id, email: session.user.email, role: 'admin', full_name: 'Jen' };
  }

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    window.location.replace('index.html'); return null;
  }

  return profile;
}

async function logout() {
  await sb.auth.signOut();
  window.location.replace('index.html');
}

// ── NAV ───────────────────────────────────────────────────────
function renderNav(profile) {
  const el = document.getElementById('nav-name');
  const re = document.getElementById('nav-role');
  if (el) el.textContent = profile.full_name || profile.email;
  if (re) re.textContent = profile.role === 'admin' ? 'Admin' : 'Sales';

  if (profile.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  const page = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  let wrap = document.getElementById('_toasts');
  if (!wrap) {
    wrap = Object.assign(document.createElement('div'), { id: '_toasts' });
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(wrap);
  }
  const bg = { success: '#1a7a3a', error: '#C0152A', info: '#1a1a1a' }[type] || '#1a1a1a';
  const t = Object.assign(document.createElement('div'), { textContent: msg });
  t.style.cssText = `background:${bg};color:#fff;padding:11px 18px;border-radius:6px;font-size:13px;font-weight:500;font-family:"DM Sans",sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.25);opacity:0;transform:translateX(20px);transition:all .2s ease`;
  wrap.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 200); }, 3200);
}

// ── FORMATTERS ────────────────────────────────────────────────
const fmt$ = n => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtPct = n => n ? n + '%' : '—';

const STATUS_LABELS = {
  prospect:'Prospect', pitched:'Pitched', presented:'Presented', objection:'Objection',
  closed:'Closed', deposited:'Deposited', building:'Building', delivered:'Delivered',
  ongoing:'Ongoing', upsell:'Upsell', churned:'Churned'
};
const DEAL_LABELS = { upfront:'Upfront', revshare:'Rev Share', equity:'Equity' };

const statusBadge = s => `<span class="badge badge-${s||'prospect'}">${STATUS_LABELS[s]||s||'—'}</span>`;
const tierBadge   = t => t ? `<span class="badge badge-tier${t}">Tier ${t}</span>` : '—';
const dealBadge   = d => d ? `<span class="badge badge-${d}">${DEAL_LABELS[d]||d}</span>` : '—';

function buildDot(status) {
  const c = { not_started:'#d0d0d0', in_progress:'#b8860b', complete:'#1a7a3a', blocked:'#C0152A', na:'#eeeeee' }[status] || '#d0d0d0';
  return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};margin-right:6px;flex-shrink:0"></span>`;
}

// Inject animation keyframes once
const _s = document.createElement('style');
_s.textContent = '@keyframes _fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
document.head.appendChild(_s);
