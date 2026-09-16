(() => {
  if (!window.location.pathname.endsWith('/social.html') && !window.location.pathname.endsWith('social.html')) return;

  const LABELS = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    google_business: 'Google Business Profile'
  };

  function currentClientId() {
    return document.getElementById('client-filter')?.value || '';
  }

  function ensureStyles() {
    if (document.getElementById('oauth-ui-styles')) return;
    const s = document.createElement('style');
    s.id = 'oauth-ui-styles';
    s.textContent = `
      .oauth-connect-card{border:1px solid var(--border,#e5e7eb);border-radius:12px;background:#fff;padding:16px;margin-bottom:14px}
      .oauth-connect-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
      .oauth-connect-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .oauth-provider{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid var(--border,#ddd);border-radius:9px;padding:11px 12px;background:#fafafa}
      .oauth-provider strong{font-size:13px}.oauth-provider small{display:block;color:#777;margin-top:2px}
      .oauth-status{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:3px 7px;border-radius:999px;background:#eee;color:#555}
      .oauth-status.connected{background:#e8f6ec;color:#166534}.oauth-status.error{background:#fdecec;color:#991b1b}
      .oauth-connect-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      @media(max-width:640px){.oauth-connect-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  async function connect(platform) {
    const client_id = currentClientId();
    if (!client_id) return toast('Choose a client or brand first','error');
    const { data, error } = await sb.functions.invoke('social-oauth-start', { body: { client_id, platform } });
    if (error) return toast(error.message || 'Could not start connection','error');
    if (data?.error) return toast(data.error,'error');
    if (!data?.auth_url) return toast('No authorization link was returned','error');
    window.location.href = data.auth_url;
  }

  async function disconnect(connectionId) {
    if (!connectionId) return;
    const { error } = await sb.from('social_oauth_connections').update({ connection_status:'disconnected', updated_at:new Date().toISOString() }).eq('id', connectionId);
    if (error) return toast(error.message,'error');
    toast('Connection marked disconnected');
    await renderConnections();
  }

  async function renderConnections() {
    const mount = document.getElementById('oauth-connections');
    const client_id = currentClientId();
    if (!mount || !client_id) return;
    mount.innerHTML = '<div class="text-sm text-mid">Checking connections…</div>';
    const { data, error } = await sb.from('social_oauth_connections').select('id,platform,account_name,connection_status,token_expires_at,updated_at').eq('client_id',client_id).order('platform');
    if (error) {
      mount.innerHTML = `<div class="text-sm" style="color:#991b1b">${esc(error.message)}</div>`;
      return;
    }
    const byPlatform = new Map((data||[]).map(x => [x.platform,x]));
    mount.innerHTML = Object.entries(LABELS).map(([platform,label]) => {
      const c = byPlatform.get(platform);
      const connected = c?.connection_status === 'connected';
      return `<div class="oauth-provider"><div><strong>${label}</strong><small>${connected ? esc(c.account_name || 'Connected account') : 'Not connected for publishing'}</small></div><div style="display:flex;gap:7px;align-items:center"><span class="oauth-status ${connected?'connected':''}">${connected?'Connected':'Not connected'}</span><button class="btn btn-${connected?'secondary':'primary'} btn-sm" data-oauth-platform="${platform}">${connected?'Reconnect':'Connect'}</button>${connected?`<button class="btn btn-ghost btn-sm" data-oauth-disconnect="${c.id}">Disconnect</button>`:''}</div></div>`;
    }).join('');
    mount.querySelectorAll('[data-oauth-platform]').forEach(b => b.addEventListener('click',() => connect(b.dataset.oauthPlatform)));
    mount.querySelectorAll('[data-oauth-disconnect]').forEach(b => b.addEventListener('click',() => disconnect(b.dataset.oauthDisconnect)));
  }

  function install() {
    if (document.getElementById('oauth-connect-card')) return;
    ensureStyles();
    const profiles = document.getElementById('tab-profiles');
    if (!profiles) return;
    const card = document.createElement('div');
    card.id = 'oauth-connect-card';
    card.className = 'oauth-connect-card';
    card.innerHTML = `
      <div class="oauth-connect-head"><div><div class="card-title">Publishing Connections</div><div class="text-sm text-mid">Authorize once. Passwords are never stored in the CRM. Publishing tokens are stored server-side in Supabase Vault.</div></div></div>
      <div class="oauth-connect-grid" id="oauth-connections"></div>`;
    profiles.prepend(card);

    const attach = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Attach Social Page');
    if (attach) {
      attach.textContent = 'Connect Social Account';
      attach.onclick = () => card.scrollIntoView({behavior:'smooth',block:'start'});
    }

    document.getElementById('client-filter')?.addEventListener('change', () => setTimeout(renderConnections,0));

    const qs = new URLSearchParams(window.location.search);
    if (qs.get('oauth') === 'connected') {
      toast(`${LABELS[qs.get('platform')] || 'Social account'} connected`);
      history.replaceState({},'',window.location.pathname);
    } else if (qs.get('oauth') === 'error') {
      toast(qs.get('message') || 'Social connection failed','error');
      history.replaceState({},'',window.location.pathname);
    }
    renderConnections();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(install, 250));
})();
