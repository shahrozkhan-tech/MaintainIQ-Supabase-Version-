// =========================================================
// MaintainIQ — QR Codes
// =========================================================

let __qrAssets = [];
let __currentQrCode = null;
let __currentQrInstance = null;

function publicUrlFor(assetCode) {
  const base = window.location.href.replace(/[^/]*$/, "");
  return `${base}public.html?asset=${encodeURIComponent(assetCode)}`;
}

async function initQrPage() {
  const grid = document.getElementById("qr-grid");
  const { data, error } = await supabaseClient.from(TABLES.assets).select("*").order("created_at", { ascending: false });
  if (error) {
    grid.innerHTML = `<div class="empty-state"><i data-lucide="alert-circle"></i><span>Failed to load assets</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  __qrAssets = data || [];
  renderQrGrid();
  document.getElementById("qr-search").addEventListener("input", renderQrGrid);

  const params = new URLSearchParams(window.location.search);
  const preselect = params.get("asset");
  if (preselect) {
    const match = __qrAssets.find(a => a.code === preselect);
    if (match) openQrModal(match.code, match.name);
  }
}

function renderQrGrid() {
  const grid = document.getElementById("qr-grid");
  const q = document.getElementById("qr-search").value.trim().toLowerCase();
  const filtered = __qrAssets.filter(a => !q || a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q));

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><i data-lucide="qr-code"></i><span>No assets found. Add an asset first.</span></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="glass-card item-card">
      <div class="flex justify-between items-center">
        <div class="item-code">${escapeHtml(a.code)}</div>
        ${statusBadge(a.status)}
      </div>
      <div class="item-title">${escapeHtml(a.name)}</div>
      <div class="item-meta">${escapeHtml(a.location || "No location")}</div>
      <button class="btn btn-primary btn-sm w-full" onclick="openQrModal('${a.code}', '${escapeHtml(a.name).replace(/'/g, "\\'")}')">
        <i data-lucide="qr-code" style="width:14px;height:14px"></i> View QR
      </button>
    </div>
  `).join("");
  if (window.lucide) lucide.createIcons();
}

function openQrModal(code, name) {
  __currentQrCode = code;
  document.getElementById("qr-modal-title").textContent = name || code;
  document.getElementById("qr-modal-code").textContent = code;
  const wrap = document.getElementById("qr-canvas-wrap");
  wrap.innerHTML = "";
  __currentQrInstance = new QRCode(wrap, {
    text: publicUrlFor(code),
    width: 200,
    height: 200,
    colorDark: "#191a2e",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
  openModal("qr-modal");
}

function regenerateQR() {
  if (!__currentQrCode) return;
  const wrap = document.getElementById("qr-canvas-wrap");
  wrap.innerHTML = "";
  __currentQrInstance = new QRCode(wrap, {
    text: publicUrlFor(__currentQrCode) + `&t=${Date.now()}`,
    width: 200,
    height: 200,
    colorDark: "#191a2e",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
  showToast("QR Generated", "success");
}

function downloadQR() {
  const wrap = document.getElementById("qr-canvas-wrap");
  const img = wrap.querySelector("img");
  const canvas = wrap.querySelector("canvas");
  const src = img && img.src ? img.src : (canvas ? canvas.toDataURL("image/png") : null);
  if (!src) return;
  const a = document.createElement("a");
  a.href = src;
  a.download = `${__currentQrCode}-qr.png`;
  a.click();
  showToast("QR downloaded", "success");
}

function printQR() {
  const wrap = document.getElementById("qr-canvas-wrap");
  const img = wrap.querySelector("img");
  const canvas = wrap.querySelector("canvas");
  const src = img && img.src ? img.src : (canvas ? canvas.toDataURL("image/png") : null);
  if (!src) return;
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>${__currentQrCode}</title></head>
    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
      <img src="${src}" style="width:260px;height:260px" />
      <p style="font-weight:700;font-size:16px;">${__currentQrCode}</p>
      <script>window.onload = () => window.print();<\/script>
    </body></html>
  `);
  win.document.close();
}
