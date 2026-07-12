// =========================================================
// MaintainIQ — Dashboard
// =========================================================

async function initDashboard() {
  try {
    const [{ data: assets, error: aErr }, { data: tickets, error: tErr }] = await Promise.all([
      supabaseClient.from(TABLES.assets).select("*"),
      supabaseClient.from(TABLES.tickets).select("*").order("created_at", { ascending: false })
    ]);
    if (aErr) throw aErr;
    if (tErr) throw tErr;

    renderStats(assets || [], tickets || []);
    renderCategoryChart(assets || [], tickets || []);
    renderStatusChart(tickets || []);
    renderRecentActivity(assets || [], tickets || []);
    renderUpcomingMaintenance(assets || []);
  } catch (err) {
    console.error(err);
    showToast("Failed to load dashboard data", "error");
  }
}

function renderStats(assets, tickets) {
  document.getElementById("stat-total-assets").textContent = assets.length;
  document.getElementById("stat-active-issues").textContent =
    tickets.filter(t => t.status !== "resolved").length;
  document.getElementById("stat-assigned").textContent =
    tickets.filter(t => t.status === "assigned").length;
  document.getElementById("stat-resolved").textContent =
    tickets.filter(t => t.status === "resolved").length;
}

function renderCategoryChart(assets, tickets) {
  const el = document.getElementById("chart-category");
  const assetById = Object.fromEntries(assets.map(a => [a.id, a]));
  const counts = {};
  tickets.forEach(t => {
    const cat = assetById[t.asset_id]?.category || "Uncategorized";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><i data-lucide="bar-chart-3"></i><span>No issues yet</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  const max = Math.max(...entries.map(e => e[1]));
  el.innerHTML = entries.map(([cat, count]) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(cat)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
      <div class="bar-value">${count}</div>
    </div>
  `).join("");
}

function renderStatusChart(tickets) {
  const el = document.getElementById("chart-status");
  const colors = { reported: "var(--red-500)", assigned: "var(--amber-500)", resolved: "var(--emerald-500)" };
  const counts = { reported: 0, assigned: 0, resolved: 0 };
  tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
  const total = tickets.length;

  if (!total) {
    el.innerHTML = `<div class="empty-state"><i data-lucide="pie-chart"></i><span>No tickets yet</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  let cumulative = 0;
  const stops = Object.entries(counts).map(([status, count]) => {
    const start = (cumulative / total) * 360;
    cumulative += count;
    const end = (cumulative / total) * 360;
    return `${colors[status]} ${start}deg ${end}deg`;
  }).join(", ");

  el.innerHTML = `
    <div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(${stops});display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;">
      <div style="width:78px;height:78px;border-radius:50%;background:var(--bg-elevated);display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div class="donut-center-value">${total}</div>
        <div class="donut-center-label">Total</div>
      </div>
    </div>
    <div class="chart-legend" style="flex-direction:column;align-items:flex-start;">
      ${Object.entries(counts).map(([status, count]) => `
        <div class="legend-item"><span class="legend-dot" style="background:${colors[status]}"></span>${escapeHtml(status)} · ${count}</div>
      `).join("")}
    </div>
  `;
}

function renderRecentActivity(assets, tickets) {
  const el = document.getElementById("recent-activity");
  const items = [
    ...assets.map(a => ({ type: "asset", label: `Asset ${a.code} added`, ts: a.created_at, icon: "box", cls: "icon-indigo" })),
    ...tickets.map(t => ({ type: "ticket", label: `Issue reported on ${t.asset_code || t.asset_id}`, ts: t.created_at, icon: "ticket", cls: "icon-red" }))
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 6);

  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><i data-lucide="activity"></i><span>No recent activity</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  el.innerHTML = items.map(i => `
    <div class="activity-item">
      <div class="activity-icon ${i.cls}"><i data-lucide="${i.icon}"></i></div>
      <div>
        <div class="activity-text">${escapeHtml(i.label)}</div>
        <div class="activity-time">${timeAgo(i.ts)}</div>
      </div>
    </div>
  `).join("");
  if (window.lucide) lucide.createIcons();
}

function renderUpcomingMaintenance(assets) {
  const el = document.getElementById("upcoming-maintenance");
  const pending = assets.filter(a => a.status === "maintenance");

  if (!pending.length) {
    el.innerHTML = `<div class="empty-state"><i data-lucide="calendar-check"></i><span>Nothing scheduled right now</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  el.innerHTML = pending.slice(0, 6).map(a => `
    <div class="activity-item">
      <div class="activity-icon icon-amber"><i data-lucide="wrench"></i></div>
      <div>
        <div class="activity-text">${escapeHtml(a.name)} <span class="muted">(${escapeHtml(a.code)})</span></div>
        <div class="activity-time">${escapeHtml(a.location || "No location")}</div>
      </div>
    </div>
  `).join("");
  if (window.lucide) lucide.createIcons();
}
