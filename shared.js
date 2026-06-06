const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

async function requireAuth(requiredRole) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.replace("index.html"); return null; }

    const { data: profile, error } = await sb
      .from("profiles").select("*").eq("id", session.user.id).single();

    if (error || !profile) {
      // Profile fetch failed — use session data as fallback so dashboard still loads
      return { id: session.user.id, email: session.user.email, role: "admin", full_name: session.user.email };
    }

    if (requiredRole && profile.role !== requiredRole && profile.role !== "admin") {
      window.location.replace("index.html"); return null;
    }

    return profile;
  } catch(e) {
    // Any error — redirect to login
    window.location.replace("index.html"); return null;
  }
}

async function logout() {
  await sb.auth.signOut();
  window.location.replace("index.html");
}

function renderNav(profile) {
  const isAdmin = profile.role === "admin";
  const nameEl = document.getElementById("nav-name");
  const roleEl = document.getElementById("nav-role");
  if (nameEl) nameEl.textContent = profile.full_name || profile.email;
  if (roleEl) roleEl.textContent = profile.role;
  if (!isAdmin) {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
  }
  const path = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === path) link.classList.add("active");
  });
}

function toast(msg, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  const colors = { success: "#1a7a3a", error: "#C0152A", info: "#0f0f0f" };
  t.style.cssText = `padding:12px 18px;border-radius:6px;font-size:13px;font-weight:500;font-family:"DM Sans",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2);background:${colors[type]||colors.info};color:#fff;max-width:320px;animation:slideIn .2s ease`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function fmt$(n) {
  if (!n) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtStatus(s) {
  const map = { prospect:"Prospect", pitched:"Pitched", presented:"Presented", objection:"Objection", closed:"Closed", deposited:"Deposited", building:"Building", delivered:"Delivered", ongoing:"Ongoing", upsell:"Upsell", churned:"Churned" };
  return map[s] || s;
}

function statusBadge(s) { return `<span class="badge badge-${s}">${fmtStatus(s)}</span>`; }
function tierBadge(t) { return t ? `<span class="badge badge-tier${t}">Tier ${t}</span>` : "—"; }
function dealBadge(d) {
  const map = { upfront: "Upfront", revshare: "Rev Share", equity: "Equity" };
  return d ? `<span class="badge badge-${d}">${map[d]||d}</span>` : "—";
}
function buildDot(status) {
  const colors = { not_started:"#ccc", in_progress:"#b8860b", complete:"#1a7a3a", blocked:"#C0152A", na:"#eee" };
  const c = colors[status] || "#ccc";
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:5px"></span>`;
}

const style = document.createElement("style");
style.textContent = "@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}";
document.head.appendChild(style);

