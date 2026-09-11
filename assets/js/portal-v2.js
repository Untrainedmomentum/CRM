const portalSb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const portalToken = new URLSearchParams(window.location.search).get('token');
let portalData = null;

function esc(v='') { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function money(cents=0) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100); }
function date(v) { if(!v) return ''; const d=new Date(v); return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); }

const SERVICES = [
  ['website','Website'],['gbp','Google Listing'],['voice_ai','Voice AI'],['email','Business Email'],
  ['booking','Booking'],['invoicing','Invoicing'],['payments','Payments'],['social','Social Media'],
  ['automation','Automation'],['managed_it','Managed IT']
];
const STATUS_LABEL = {not_started:'Not Started',in_progress:'In Progress',complete:'Complete',blocked:'Needs Info',na:'N/A'};

async function loadPortal() {
  if (!portalToken) return show404();
  const { data, error } = await portalSb.rpc('portal_snapshot', { p_token: portalToken });
  if (error || !data) return show404();
  portalData = data;
  renderPortal(data);
}

function renderPortal(data) {
  const c = data.client || {};
  const b = data.build || {};
  const work = Array.isArray(data.work_orders) ? data.work_orders : [];
  const ledger = Array.isArray(data.account_entries) ? data.account_entries : [];
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  const included = SERVICES.filter(([key]) => b[`${key}_status`] && b[`${key}_status`] !== 'na');
  const done = included.filter(([key]) => b[`${key}_status`] === 'complete').length;
  const open = work.filter(w => !['complete','paid','cancelled'].includes(w.status)).length;
  const completed = work.filter(w => ['complete','invoiced','paid'].includes(w.status)).length;

  document.getElementById('wrap').innerHTML = `
    <div class="card hero-card">
      <div><div class="card-title">Hi, ${esc((c.owner_name||'there').split(' ')[0])}</div><div class="card-sub">Your Untrained Momentum workspace for <strong>${esc(c.business_name||'your account')}</strong>.</div></div>
      <div class="balance-box"><span>Current balance</span><strong>${money(data.balance_cents||0)}</strong></div>
    </div>

    <div class="summary-grid">
      <div class="summary-card"><strong>${open}</strong><span>Open work</span></div>
      <div class="summary-card"><strong>${completed}</strong><span>Completed</span></div>
      <div class="summary-card"><strong>${tickets.filter(t=>['open','in_progress'].includes(t.status)).length}</strong><span>Open requests</span></div>
    </div>

    ${b.waiting_on_client ? `<div class="alert"><strong>We need something from you:</strong> ${esc(b.waiting_on_client)}</div>` : ''}

    ${included.length ? `<div class="section-label">Project Progress · ${done} of ${included.length} complete</div><div class="progress-grid">${included.map(([key,name])=>{const st=b[`${key}_status`]||'not_started';return `<div class="prog-item ${esc(st)}"><div class="prog-name">${esc(name)}</div><div class="prog-status">${esc(STATUS_LABEL[st]||st)}</div></div>`}).join('')}</div>`:''}

    <div class="section-label">Your Work</div>
    <div class="card">
      <div id="work-list">${work.length ? work.map(w => `<div class="work-row"><div><strong>${esc(w.title)}</strong><div class="work-meta">${esc(w.status.replaceAll('_',' '))}${w.completed_at?` · Completed ${date(w.completed_at)}`:''}</div>${w.completion_summary?`<p>${esc(w.completion_summary)}</p>`:''}</div><div class="work-amount">${w.fixed_amount_cents!=null?money(w.fixed_amount_cents):(w.billable_hours!=null&&w.hourly_rate_cents!=null?money(Math.round(Number(w.billable_hours)*Number(w.hourly_rate_cents))):'')}</div></div>`).join('') : '<div class="empty">No work has been posted to your account yet.</div>'}</div>
    </div>

    <div class="section-label">Account Activity</div>
    <div class="card">${ledger.length ? ledger.map(a=>`<div class="ledger-row"><div><strong>${esc(a.description)}</strong><span>${date(a.occurred_at)}</span></div><strong class="${Number(a.amount_cents)>0?'due':'credit'}">${Number(a.amount_cents)>0?'+':''}${money(a.amount_cents)}</strong></div>`).join('') : '<div class="empty">No charges or payments have been posted yet.</div>'}</div>

    <div class="section-label">Request Work or Support</div>
    <div class="card">
      <div class="success" id="ok">Your request was sent. It is now in our work queue.</div>
      <div id="request-form">
        <div class="form-group"><label class="label">Your Name</label><input class="input" id="t-name" value="${esc(c.owner_name||'')}" maxlength="160"></div>
        <div class="form-group"><label class="label">Your Email</label><input class="input" type="email" id="t-email" value="${esc(c.email||'')}" maxlength="320"></div>
        <div class="form-group"><label class="label">Request</label><input class="input" id="t-subject" placeholder="What do you need?" maxlength="180"></div>
        <div class="form-group"><label class="label">Priority</label><select class="select" id="t-priority"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="low">Low — no rush</option></select></div>
        <div class="form-group"><label class="label">Details</label><textarea class="textarea" id="t-desc" maxlength="8000" placeholder="Tell us what you need, what changed, or what is not working."></textarea></div>
        <button class="btn" id="send-request" type="button">Submit Work Request</button>
      </div>
    </div>

    ${tickets.length ? `<div class="section-label">Recent Requests</div><div class="card">${tickets.slice(0,10).map(t=>`<div class="ticket-row"><div><strong>${esc(t.subject)}</strong><span>${date(t.created_at)}</span></div><span class="ticket-status">${esc(t.status.replaceAll('_',' '))}</span></div>`).join('')}</div>`:''}
  `;
  document.getElementById('send-request')?.addEventListener('click', submitRequest);
}

async function submitRequest() {
  const btn=document.getElementById('send-request');
  const name=document.getElementById('t-name')?.value.trim();
  const email=document.getElementById('t-email')?.value.trim();
  const subject=document.getElementById('t-subject')?.value.trim();
  const description=document.getElementById('t-desc')?.value.trim();
  const priority=document.getElementById('t-priority')?.value||'normal';
  if(!name||!subject||!description){ alert('Please enter your name, request, and details.'); return; }
  btn.disabled=true; btn.textContent='Sending…';
  const { error } = await portalSb.rpc('portal_submit_request', {
    p_token: portalToken, p_name:name, p_email:email||null, p_subject:subject, p_description:description, p_priority:priority
  });
  if(error){ btn.disabled=false; btn.textContent='Submit Work Request'; alert('Your request could not be sent. Please try again.'); return; }
  document.getElementById('ok').classList.add('show');
  await loadPortal();
}

function show404(){ document.getElementById('wrap').innerHTML='<div class="not-found"><div style="font-size:16px;font-weight:600;margin-bottom:8px">Portal not found</div><div style="font-size:13px">This link may have expired or is invalid.<br>Contact info@untrainedmomentum.com</div></div>'; }

loadPortal();
