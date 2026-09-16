(() => {
  if (!window.location.pathname.endsWith('bookings.html')) return;

  async function getUMClient(){
    const {data,error}=await sb.from('clients').select('id,business_name').eq('business_name','Untrained Momentum').limit(1).maybeSingle();
    if(error) throw error; return data;
  }

  async function connectGoogle(){
    const um=await getUMClient(); if(!um) return toast('Untrained Momentum CRM record not found','error');
    const {data,error}=await sb.functions.invoke('social-oauth-start',{body:{client_id:um.id,platform:'google_workspace'}});
    if(error) return toast(error.message||'Could not start Google connection','error');
    if(data?.error) return toast(data.error,'error');
    if(data?.auth_url) window.location.href=data.auth_url;
  }

  async function syncBookings(){
    const btn=document.getElementById('sync-google-bookings');
    if(btn){btn.disabled=true;btn.textContent='Syncing…'}
    const {data,error}=await sb.functions.invoke('sync-google-bookings',{body:{send_confirmations:true}});
    if(btn){btn.disabled=false;btn.textContent='Sync Google Bookings'}
    if(error) return toast(error.message||'Booking sync failed','error');
    if(data?.error) return toast(data.error,'error');
    toast(`Bookings synced${data.imported?` · ${data.imported} new`:''}${data.confirmations?` · ${data.confirmations} confirmation sent`:''}`);
    if(typeof loadBookings==='function') await loadBookings();
    await renderConnection();
  }

  async function renderConnection(){
    const mount=document.getElementById('google-booking-connection'); if(!mount)return;
    const um=await getUMClient(); if(!um){mount.innerHTML='<div class="text-sm text-mid">Untrained Momentum CRM record not found.</div>';return}
    const {data}=await sb.from('social_oauth_connections').select('id,account_name,connection_status,updated_at').eq('client_id',um.id).eq('platform','google_workspace').eq('connection_status','connected').limit(1).maybeSingle();
    mount.innerHTML=data?`<div><strong>Google Workspace connected</strong><div class="text-sm text-mid">${esc(data.account_name||'Connected account')} · Calendar + confirmation email access</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" id="reconnect-google">Reconnect</button><button class="btn btn-primary btn-sm" id="sync-google-bookings">Sync Google Bookings</button></div>`:`<div><strong>Google Workspace is not connected yet</strong><div class="text-sm text-mid">Connect once so the CRM can import booked appointments and send your branded confirmation email.</div></div><button class="btn btn-primary btn-sm" id="connect-google">Connect Google Workspace</button>`;
    document.getElementById('connect-google')?.addEventListener('click',connectGoogle);
    document.getElementById('reconnect-google')?.addEventListener('click',connectGoogle);
    document.getElementById('sync-google-bookings')?.addEventListener('click',syncBookings);
  }

  function install(){
    if(document.getElementById('google-booking-card')) return;
    const stats=document.querySelector('.booking-stats'); if(!stats)return;
    const card=document.createElement('div'); card.id='google-booking-card'; card.className='card mb-16';
    card.innerHTML='<div class="card-title">Google Booking Connection</div><div id="google-booking-connection" style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap"><div class="text-sm text-mid">Checking Google connection…</div></div>';
    stats.parentNode.insertBefore(card,stats);
    const qs=new URLSearchParams(location.search);
    if(qs.get('oauth')==='connected'&&qs.get('platform')==='google_workspace'){toast('Google Workspace connected');history.replaceState({},'',location.pathname)}
    else if(qs.get('oauth')==='error'){toast(qs.get('message')||'Google connection failed','error');history.replaceState({},'',location.pathname)}
    renderConnection();
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(install,250));
})();
