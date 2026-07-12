// =========================================================
// MaintainIQ — Asset History
// =========================================================

async function initHistoryPage() {
  const { data: assets, error } = await supabaseClient.from(TABLES.assets).select("*").order("created_at", { ascending: false });
  const select = document.getElementById("history-asset-select");
  if (error) {
    showToast("Failed to load assets", "error");
    return;
  }
  select.innerHTML = `<option value="">Select an asset...</option>` +
    (assets || []).map(a => `<option value="${a.id}">${escapeHtml(a.code)} — ${escapeHtml(a.name)}</option>`).join("");

  select.addEventListener("change", () => loadAssetHistory(select.value));

  const params = new URLSearchParams(window.location.search);
  const preselectCode = params.get("asset");
  if (preselectCode) {
    const match = (assets || []).find(a => a.code === preselectCode);
    if (match) { select.value = match.id; loadAssetHistory(match.id); }
  }
}

async function loadAssetHistory(assetId) {
  const container = document.getElementById("history-container");
  if (!assetId) {
    container.innerHTML = `<div class="empty-state"><i data-lucide="mouse-pointer-click"></i><span>Choose an asset above to view its history</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  container.innerHTML = `<div class="loading-row"><span class="spinner"></span> Loading history...</div>`;

  const [{ data: asset }, { data: tickets }] = await Promise.all([
    supabaseClient.from(TABLES.assets).select("*").eq("id", assetId).single(),
    supabaseClient.from(TABLES.tickets).select("*").eq("asset_id", assetId).order("created_at", { ascending: true })
  ]);

  const events = [];
  if (asset) {
    events.push({ icon: "box", title: `Asset Created — ${asset.code}`, desc: asset.name, ts: asset.created_at });
  }
  (tickets || []).forEach(t => {
    events.push({ icon: "flag", title: `Issue Reported on ${t.asset_code}`, desc: t.description, ts: t.created_at, user: t.reporter_name });
    (Array.isArray(t.notes) ? t.notes : []).forEach(n => {
      const iconMap = { note: "sticky-note", status: "refresh-ccw", assignment: "user-check", completion: "calendar-check" };
      const titleMap = { note: "Maintenance Note Added", status: "Status Changed", assignment: "Technician Assigned", completion: "Completion Date Set" };
      events.push({ icon: iconMap[n.type] || "sticky-note", title: titleMap[n.type] || "Update", desc: n.text, ts: n.created_at });
    });
    if (t.status === "resolved") {
      events.push({ icon: "check-circle-2", title: `Issue Resolved`, desc: t.description, ts: t.updated_at });
    }
  });

  events.sort((a, b) => new Date(a.ts) - new Date(b.ts));

  if (!events.length) {
    container.innerHTML = `<div class="empty-state"><i data-lucide="history"></i><span>No history recorded for this asset yet</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = `<div class="timeline">
    ${events.map(e => `
      <div class="timeline-item">
        <div class="timeline-dot"><i data-lucide="${e.icon}"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">${escapeHtml(e.title)}</div>
          <div class="timeline-meta">${formatDateTime(e.ts)}${e.user ? " · " + escapeHtml(e.user) : ""}</div>
          ${e.desc ? `<div class="timeline-desc">${escapeHtml(e.desc)}</div>` : ""}
        </div>
      </div>
    `).join("")}
  </div>`;
  if (window.lucide) lucide.createIcons();
}
