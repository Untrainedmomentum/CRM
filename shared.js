// shared.js — Untrained Momentum CRM
// Single source of truth for auth, nav, utilities

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── AUTH ──────────────────────────────────────────────────────
async function requireAuth(requiredRole) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.replace('index.html'); return null; }

  let profile = null;
  try {
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (!error && data) profile = data;
  } catch(e) {}

  if (!profile) {
    profile = { id: session.user.id, email: session.user.email, role: 'viewer', full_name: session.user.email };
  }

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    window.location.replace('dashboard.html'); return null;
  }

  return profile;
}

async function logout() {
  await sb.auth.signOut();
  window.location.replace('index.html');
}

// ── NAV ───────────────────────────────────────────────────────
function ensureOperationsNav(profile) {
  const sections = [...document.querySelectorAll('.sidebar-section')];
  const main = sections[0];
  if (main && !document.querySelector('.sidebar a[href="work.html"]')) {
    const link = document.createElement('a');
    link.className = 'nav-link sidebar-link';
    link.href = 'work.html';
    link.textContent = 'Work';
    const tickets = main.querySelector('a[href="tickets.html"]');
    tickets ? main.insertBefore(link, tickets) : main.appendChild(link);
  }

  let sales = sections.find(s => s.querySelector('.sidebar-label')?.textContent?.trim() === 'Sales');
  if (!sales) {
    sales = document.createElement('div');
    sales.className = 'sidebar-section';
    sales.innerHTML = '<div class="sidebar-label">Sales</div>';
    document.querySelector('.sidebar')?.appendChild(sales);
  }

  if (!document.querySelector('.sidebar a[href="lead-analytics.html"]')) {
    const link = document.createElement('a');
    link.className = 'nav-link sidebar-link';
    link.href = 'lead-analytics.html';
    link.textContent = 'Lead Analytics';
    const john = sales.querySelector('a[href="john.html"]');
    john ? sales.insertBefore(link, john) : sales.appendChild(link);
  }

  if (!document.querySelector('.sidebar a[href="outreach.html"]')) {
    const link = document.createElement('a');
    link.className = 'nav-link sidebar-link';
    link.href = 'outreach.html';
    link.textContent = 'Outreach';
    const john = sales.querySelector('a[href="john.html"]');
    john ? sales.insertBefore(link, john) : sales.appendChild(link);
  }

  if (profile.role === 'admin' && !document.querySelector('.sidebar a[href="inventory.html"]')) {
    let ops = sections.find(s => ['Admin','Finance','Operations'].includes(s.querySelector('.sidebar-label')?.textContent?.trim()));
    if (!ops) {
      ops = document.createElement('div');
      ops.className = 'sidebar-section admin-only';
      ops.innerHTML = '<div class="sidebar-label">Operations</div>';
      document.querySelector('.sidebar')?.appendChild(ops);
    }
    const link = document.createElement('a');
    link.className = 'nav-link sidebar-link admin-only';
    link.href = 'inventory.html';
    link.textContent = 'Inventory';
    ops.appendChild(link);
  }
}

function renderNav(profile) {
  ensureOperationsNav(profile);
  const el = document.getElementById('nav-name');
  const re = document.getElementById('nav-role');
  if (el) el.textContent = profile.full_name || profile.email;
  if (re) re.textContent = profile.role === 'admin' ? 'Admin' : profile.role === 'sales' ? 'Sales' : 'Viewer';

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

// ── FORMATTERS / SAFE OUTPUT ──────────────────────────────────
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt$ = n => n ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtPct = n => n ? n + '%' : '—';

const STATUS_LABELS = {
  prospect:'Prospect', pitched:'Pitched', presented:'Presented', objection:'Objection',
  closed:'Closed', deposited:'Deposited', building:'Building', delivered:'Delivered',
  ongoing:'Ongoing', upsell:'Upsell', churned:'Churned'
};
const DEAL_LABELS = { upfront:'Upfront', revshare:'Rev Share', equity:'Equity', mrr:'MRR', project:'Project' };

const LEAD_SOURCE_OPTIONS = [
  ['unknown','Unknown'],['cold_email','Cold Email'],['facebook','Facebook'],['referral','Referral'],
  ['website','Website / Inbound'],['networking','Networking'],['score','SCORE / Small Business'],
  ['realtor','Realtor Outreach'],['senior_care','Senior Care Outreach'],['construction','Construction Outreach'],
  ['local_outreach','Local Outreach'],['job_posting','Job Posting / Hiring Signal'],['other','Other']
];
const LEAD_SOURCE_LABELS = Object.fromEntries(LEAD_SOURCE_OPTIONS);

const statusBadge = s => `<span class="badge badge-${s||'prospect'}">${STATUS_LABELS[s]||s||'—'}</span>`;
const tierBadge = t => { const labels = {1:'Hot',2:'Warm',3:'Cold'}; return t ? `<span class="badge badge-tier${t}">${labels[t]||t}</span>` : '—'; };
const dealBadge   = d => d ? `<span class="badge badge-${d}">${DEAL_LABELS[d]||d}</span>` : '—';

function buildDot(status) {
  const c = { not_started:'#d0d0d0', in_progress:'#b8860b', complete:'#1a7a3a', blocked:'#C0152A', na:'#eeeeee' }[status] || '#d0d0d0';
  return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};margin-right:6px;flex-shrink:0"></span>`;
}

// ── LEAD SOURCE RECORD EDITOR ─────────────────────────────────
async function installLeadSourceEditor() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'client.html') return;
  const clientId = new URLSearchParams(window.location.search).get('id');
  if (!clientId || document.getElementById('lead-source-card')) return;

  const rightCol = document.querySelector('#tab-overview .detail-layout > div:nth-child(2)');
  if (!rightCol) return;

  const { data, error } = await sb.from('clients').select('lead_source,lead_source_detail').eq('id', clientId).single();
  if (error) return;

  const card = document.createElement('div');
  card.className = 'card mb-16';
  card.id = 'lead-source-card';
  card.innerHTML = `
    <div class="card-title">Lead Source</div>
    <div class="info-row"><div class="info-label">Source</div><div class="info-value">
      <select id="record-lead-source">${LEAD_SOURCE_OPTIONS.map(([v,l])=>`<option value="${v}" ${v===(data.lead_source||'unknown')?'selected':''}>${l}</option>`).join('')}</select>
    </div></div>
    <div class="info-row"><div class="info-label">Detail</div><div class="info-value"><input id="record-lead-source-detail" type="text" placeholder="Referral name, group, event..." value="${String(data.lead_source_detail||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}"></div></div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn btn-secondary btn-sm" id="save-record-source">Save Source</button></div>`;
  rightCol.insertBefore(card, rightCol.lastElementChild || null);

  document.getElementById('save-record-source')?.addEventListener('click', async () => {
    const lead_source = document.getElementById('record-lead-source').value;
    const lead_source_detail = document.getElementById('record-lead-source-detail').value.trim() || null;
    const { error: saveError } = await sb.from('clients').update({lead_source, lead_source_detail}).eq('id', clientId);
    if (saveError) { toast(saveError.message,'error'); return; }
    toast('Lead source saved');
  });
}

document.addEventListener('DOMContentLoaded', () => { installLeadSourceEditor(); });

const _s = document.createElement('style');
_s.textContent = '@keyframes _fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
document.head.appendChild(_s);
