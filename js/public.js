// =========================================================
// MaintainIQ — Public Asset Page (no auth required)
// =========================================================

let __publicAsset = null;

async function initPublicPage() {
  const params = new URLSearchParams(window.location.search);
  const assetCode = params.get("asset");
  const assetId = params.get("id");
  const content = document.getElementById("public-content");

  if (!assetCode && !assetId) {
    content.innerHTML = emptyStateHtml("This QR code is missing an asset reference.");
    return;
  }

  let query = supabaseClient.from(TABLES.assets).select("*").limit(1);
  query = assetId ? query.eq("id", assetId) : query.eq("code", assetCode);
  const { data, error } = await query.single();

  if (error || !data) {
    content.innerHTML = emptyStateHtml("Asset not found. Please check the QR code and try again.");
    return;
  }

  __publicAsset = data;

  const { data: tickets } = await supabaseClient
    .from(TABLES.tickets)
    .select("*")
    .eq("asset_id", data.id)
    .order("updated_at", { ascending: false });

  const lastResolved = (tickets || []).find(t => t.status === "resolved");
  const latestAssigned = (tickets || []).find(t => t.assigned_to);

  renderAssetInfo(data, lastResolved, latestAssigned);
  document.getElementById("issue-form").addEventListener("submit", handleIssueSubmit);
}

function emptyStateHtml(message) {
  return `<div class="glass-card empty-state" style="padding:50px 20px">
    <i data-lucide="search-x"></i><span>${escapeHtml(message)}</span>
  </div>` + iconRefresh();
}
function iconRefresh() { if (window.lucide) setTimeout(() => lucide.createIcons(), 0); return ""; }

function renderAssetInfo(asset, lastResolved, latestAssigned) {
  const content = document.getElementById("public-content");
  content.innerHTML = `
    <div class="glass-card card-pad" style="margin-bottom:16px">
      <div class="flex justify-between items-center" style="margin-bottom:10px">
        <div class="item-code">${escapeHtml(asset.code)}</div>
        ${statusBadge(asset.status)}
      </div>
      <h2 style="font-size:22px;margin-bottom:14px">${escapeHtml(asset.name)}</h2>
      <div class="flex-col gap-12">
        <div class="flex justify-between"><span class="muted">Category</span><strong>${escapeHtml(asset.category || "—")}</strong></div>
        <div class="flex justify-between"><span class="muted">Location</span><strong>${escapeHtml(asset.location || "—")}</strong></div>
        <div class="flex justify-between"><span class="muted">Last Maintenance</span><strong>${lastResolved ? formatDate(lastResolved.updated_at) : "—"}</strong></div>
        <div class="flex justify-between"><span class="muted">Assigned Technician</span><strong>${latestAssigned ? escapeHtml(latestAssigned.assigned_to) : "Unassigned"}</strong></div>
      </div>
    </div>

    <div class="glass-card card-pad">
      <div class="card-title">Report an Issue</div>
      <form id="issue-form">
        <div class="field">
          <label>Reporter Name</label>
          <input class="input" id="reporter-name" required placeholder="Your name">
        </div>
        <div class="field">
          <label>Issue Description</label>
          <textarea class="input" id="issue-description" required placeholder="Describe what's wrong..."></textarea>
        </div>
        <div class="field">
          <label>Urgency Level</label>
          <select class="input" id="issue-urgency">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button type="submit" id="issue-submit-btn" class="btn btn-primary btn-block">Submit Issue</button>
      </form>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

async function handleIssueSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("issue-submit-btn");
  const payload = {
    asset_id: __publicAsset.id,
    asset_code: __publicAsset.code,
    reporter_name: document.getElementById("reporter-name").value.trim(),
    description: document.getElementById("issue-description").value.trim(),
    urgency: document.getElementById("issue-urgency").value,
    status: "reported"
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';

  const { error } = await supabaseClient.from(TABLES.tickets).insert(payload);

  if (error) {
    showToast(error.message || "Failed to submit issue", "error");
    btn.disabled = false;
    btn.textContent = "Submit Issue";
    return;
  }

  document.getElementById("public-content").insertAdjacentHTML("beforeend", `
    <div class="glass-card card-pad" style="margin-top:16px;text-align:center">
      <i data-lucide="check-circle-2" style="width:36px;height:36px;color:var(--emerald-500)"></i>
      <h3 style="margin-top:10px">Issue Reported</h3>
      <p class="muted" style="margin-top:6px">Thank you — our maintenance team has been notified.</p>
    </div>
  `);
  document.getElementById("issue-form").closest(".glass-card").style.display = "none";
  showToast("Issue Reported", "success");
  if (window.lucide) lucide.createIcons();
}
