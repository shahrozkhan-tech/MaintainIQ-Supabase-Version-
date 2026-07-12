// =========================================================
// MaintainIQ — Assets
// =========================================================

let __allAssets = [];

async function initAssetsPage() {
  await loadAssets();
  document.getElementById("asset-search").addEventListener("input", renderAssetsTable);
  document.getElementById("filter-category").addEventListener("change", renderAssetsTable);
  document.getElementById("filter-location").addEventListener("change", renderAssetsTable);
  document.getElementById("filter-status").addEventListener("change", renderAssetsTable);
  document.getElementById("asset-form").addEventListener("submit", handleSaveAsset);
}

async function loadAssets() {
  const tbody = document.getElementById("assets-tbody");
  const { data, error } = await supabaseClient
    .from(TABLES.assets)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="alert-circle"></i><span>Failed to load assets</span></div></td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  __allAssets = data || [];
  populateFilterOptions();
  renderAssetsTable();
}

function populateFilterOptions() {
  const cats = [...new Set(__allAssets.map(a => a.category).filter(Boolean))];
  const locs = [...new Set(__allAssets.map(a => a.location).filter(Boolean))];
  const catSelect = document.getElementById("filter-category");
  const locSelect = document.getElementById("filter-location");
  const catList = document.getElementById("category-list");
  const locList = document.getElementById("location-list");

  catSelect.innerHTML = `<option value="">All Categories</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  locSelect.innerHTML = `<option value="">All Locations</option>` + locs.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
  catList.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join("");
  locList.innerHTML = locs.map(l => `<option value="${escapeHtml(l)}">`).join("");
}

function renderAssetsTable() {
  const tbody = document.getElementById("assets-tbody");
  const q = document.getElementById("asset-search").value.trim().toLowerCase();
  const category = document.getElementById("filter-category").value;
  const location = document.getElementById("filter-location").value;
  const status = document.getElementById("filter-status").value;

  const filtered = __allAssets.filter(a => {
    const matchesQ = !q || a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q);
    const matchesCat = !category || a.category === category;
    const matchesLoc = !location || a.location === location;
    const matchesStatus = !status || a.status === status;
    return matchesQ && matchesCat && matchesLoc && matchesStatus;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="package-search"></i><span>No assets found</span></div></td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td data-label="Code"><strong>${escapeHtml(a.code)}</strong></td>
      <td data-label="Name">${escapeHtml(a.name)}</td>
      <td data-label="Category">${escapeHtml(a.category || "—")}</td>
      <td data-label="Location">${escapeHtml(a.location || "—")}</td>
      <td data-label="Status">${statusBadge(a.status)}</td>
      <td data-label="Actions">
        <div class="row-actions">
          <button class="btn-icon btn-sm" title="View" onclick="viewAsset('${a.id}')"><i data-lucide="eye" style="width:15px;height:15px"></i></button>
          <button class="btn-icon btn-sm" title="Edit" onclick="editAsset('${a.id}')"><i data-lucide="pencil" style="width:15px;height:15px"></i></button>
          <button class="btn-icon btn-sm" title="Generate QR" onclick="location.href='qr.html?asset=${encodeURIComponent(a.code)}'"><i data-lucide="qr-code" style="width:15px;height:15px"></i></button>
          <button class="btn-icon btn-sm" title="Delete" onclick="deleteAsset('${a.id}')"><i data-lucide="trash-2" style="width:15px;height:15px;color:var(--red-500)"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
  if (window.lucide) lucide.createIcons();
}

async function openAddAssetModal() {
  document.getElementById("asset-modal-title").textContent = "Add Asset";
  document.getElementById("asset-form").reset();
  document.getElementById("asset-id").value = "";
  document.getElementById("asset-code").value = "Generating...";
  openModal("asset-modal");
  document.getElementById("asset-code").value = await generateNextAssetCode();
}

function editAsset(id) {
  const asset = __allAssets.find(a => a.id === id);
  if (!asset) return;
  document.getElementById("asset-modal-title").textContent = "Edit Asset";
  document.getElementById("asset-id").value = asset.id;
  document.getElementById("asset-code").value = asset.code;
  document.getElementById("asset-name").value = asset.name || "";
  document.getElementById("asset-category").value = asset.category || "";
  document.getElementById("asset-location").value = asset.location || "";
  document.getElementById("asset-status").value = asset.status || "active";
  openModal("asset-modal");
}

async function handleSaveAsset(e) {
  e.preventDefault();
  const btn = document.getElementById("asset-save-btn");
  const id = document.getElementById("asset-id").value;
  const payload = {
    name: document.getElementById("asset-name").value.trim(),
    category: document.getElementById("asset-category").value.trim(),
    location: document.getElementById("asset-location").value.trim(),
    status: document.getElementById("asset-status").value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    if (id) {
      const { error } = await supabaseClient.from(TABLES.assets).update(payload).eq("id", id);
      if (error) throw error;
      showToast("Asset updated successfully", "success");
    } else {
      payload.code = document.getElementById("asset-code").value;
      const { error } = await supabaseClient.from(TABLES.assets).insert(payload);
      if (error) throw error;
      showToast("Asset Added Successfully", "success");
    }
    closeModal("asset-modal");
    await loadAssets();
  } catch (err) {
    showToast(err.message || "Failed to save asset", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Asset";
  }
}

async function deleteAsset(id) {
  if (!confirm("Delete this asset? This cannot be undone.")) return;
  const { error } = await supabaseClient.from(TABLES.assets).delete().eq("id", id);
  if (error) {
    showToast(error.message || "Failed to delete asset", "error");
    return;
  }
  showToast("Asset deleted", "success");
  await loadAssets();
}

function viewAsset(id) {
  const a = __allAssets.find(x => x.id === id);
  if (!a) return;
  document.getElementById("view-asset-body").innerHTML = `
    <div class="flex-col gap-12">
      <div class="flex justify-between items-center">
        <div>
          <div class="item-code">${escapeHtml(a.code)}</div>
          <div class="item-title">${escapeHtml(a.name)}</div>
        </div>
        ${statusBadge(a.status)}
      </div>
      <div class="flex justify-between"><span class="muted">Category</span><strong>${escapeHtml(a.category || "—")}</strong></div>
      <div class="flex justify-between"><span class="muted">Location</span><strong>${escapeHtml(a.location || "—")}</strong></div>
      <div class="flex justify-between"><span class="muted">Created</span><strong>${formatDate(a.created_at)}</strong></div>
      <div class="flex gap-12" style="margin-top:8px">
        <button class="btn btn-secondary w-full" onclick="location.href='qr.html?asset=${encodeURIComponent(a.code)}'"><i data-lucide="qr-code" style="width:15px;height:15px"></i> View QR</button>
        <button class="btn btn-secondary w-full" onclick="location.href='history.html?asset=${encodeURIComponent(a.code)}'"><i data-lucide="history" style="width:15px;height:15px"></i> History</button>
      </div>
    </div>
  `;
  openModal("view-asset-modal");
  if (window.lucide) lucide.createIcons();
}
