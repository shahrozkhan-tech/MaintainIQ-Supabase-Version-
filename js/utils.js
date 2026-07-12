// =========================================================
// MaintainIQ — Shared utilities
// =========================================================

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem("miq-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  renderThemeIcon(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("miq-theme", next);
  renderThemeIcon(next);
}
function renderThemeIcon(theme) {
  document.querySelectorAll("[data-theme-toggle]").forEach(btn => {
    btn.innerHTML = theme === "light"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
  });
  if (window.lucide) lucide.createIcons();
}

/* ---------- Toasts ---------- */
function ensureToastContainer() {
  let c = document.querySelector(".toast-container");
  if (!c) {
    c = document.createElement("div");
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}
function showToast(message, type = "info") {
  const container = ensureToastContainer();
  const icons = { success: "check-circle-2", error: "alert-circle", info: "info" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] || "info"}" style="width:18px;height:18px;flex-shrink:0"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => {
    toast.style.transition = "opacity .25s ease, transform .25s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/* ---------- Formatting ---------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
}
function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}

/* ---------- Badges ---------- */
function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const map = { reported: "reported", assigned: "assigned", resolved: "resolved", active: "active" };
  const cls = map[s] || "reported";
  return `<span class="badge badge-${cls}"><span class="badge-dot"></span>${escapeHtml(status || "—")}</span>`;
}
function urgencyBadge(level) {
  const l = (level || "low").toLowerCase();
  return `<span class="badge badge-${l}"><span class="badge-dot"></span>${escapeHtml(level || "—")}</span>`;
}

/* ---------- Mobile nav / sidebar ---------- */
function initNavToggles() {
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.querySelector(".sidebar");
  const scrim = document.querySelector(".sidebar-scrim");
  if (hamburger && sidebar) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      scrim?.classList.toggle("open");
    });
  }
  scrim?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    scrim.classList.remove("open");
  });
}

/* ---------- Modal helpers ---------- */
function openModal(id) { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }
function initModalCloseOnOverlay() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });
}

/* ---------- Asset code generator ---------- */
async function generateNextAssetCode() {
  const { data, error } = await supabaseClient
    .from(TABLES.assets)
    .select("code")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || !data.length) return "A-001";
  const last = data[0].code || "A-000";
  const num = parseInt(last.split("-")[1], 10) || 0;
  return `A-${String(num + 1).padStart(3, "0")}`;
}

/* ---------- Auth guard ---------- */
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}
async function redirectIfAuthed() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = "dashboard.html";
}

/* ---------- Common page boot ---------- */
function bootCommon() {
  initTheme();
  initNavToggles();
  initModalCloseOnOverlay();
  document.querySelectorAll("[data-theme-toggle]").forEach(btn => btn.addEventListener("click", toggleTheme));
  if (window.lucide) lucide.createIcons();
}
