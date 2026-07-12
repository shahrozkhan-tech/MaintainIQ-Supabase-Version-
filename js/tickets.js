// =========================================================
// MaintainIQ — Tickets
// =========================================================

let __allTickets = [];
let __activeTicketId = null;

async function initTicketsPage() {
  await loadTickets();
  document.getElementById("ticket-search").addEventListener("input", renderTicketsTable);
  document.getElementById("filter-ticket-status").addEventListener("change", renderTicketsTable);
  document.getElementById("filter-ticket-urgency").addEventListener("change", renderTicketsTable);
}

async function loadTickets() {
  const tbody = document.getElementById("tickets-tbody");
  const { data, error } = await supabaseClient
    .from(TABLES.tickets)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="alert-circle"></i><span>Failed to load tickets</span></div></td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  __allTickets = data || [];
  renderTicketsTable();
}

function renderTicketsTable() {
  const tbody = document.getElementById("tickets-tbody");
  const q = document.getElementById("ticket-search").value.trim().toLowerCase();
  const status = document.getElementById("filter-ticket-status").value;
  const urgency = document.getElementById("filter-ticket-urgency").value;

  const filtered = __allTickets.filter(t => {
    const matchesQ = !q || t.asset_code?.toLowerCase().includes(q) || t.reporter_name?.toLowerCase().includes(q);
    const matchesStatus = !status || t.status === status;
    const matchesUrgency = !urgency || t.urgency === urgency;
    return matchesQ && matchesStatus && matchesUrgency;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i data-lucide="ticket"></i><span>No tickets found</span></div></td></tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td data-label="Asset"><strong>${escapeHtml(t.asset_code || "—")}</strong></td>
      <td data-label="Reporter">${escapeHtml(t.reporter_name || "—")}</td>
      <td data-label="Urgency">${urgencyBadge(t.urgency)}</td>
      <td data-label="Status">${statusBadge(t.status)}</td>
      <td data-label="Reported">${timeAgo(t.created_at)}</td>
      <td data-label="Actions">
        <button class="btn btn-secondary btn-sm" onclick="openTicketModal('${t.id}')"><i data-lucide="arrow-up-right" style="width:14px;height:14px"></i> Manage</button>
      </td>
    </tr>
  `).join("");
  if (window.lucide) lucide.createIcons();
}

function openTicketModal(id) {
  __activeTicketId = id;
  renderTicketModalBody();
  openModal("ticket-modal");
}

function renderTicketModalBody() {
  const t = __allTickets.find(x => x.id === __activeTicketId);
  if (!t) return;
  const notes = Array.isArray(t.notes) ? t.notes : [];
  document.getElementById("ticket-modal-title").textContent = `${t.asset_code || "Ticket"} — ${t.code || t.id.slice(0, 8)}`;

  document.getElementById("ticket-modal-body").innerHTML = `
    <div class="workflow-steps">
      ${TICKET_STATUS.map(s => `
        <div class="workflow-step ${t.status === s ? "current" : TICKET_STATUS.indexOf(s) < TICKET_STATUS.indexOf(t.status) ? "done" : ""}">${escapeHtml(s)}</div>
      `).join("")}
    </div>

    <div class="flex justify-between" style="margin-bottom:10px"><span class="muted">Reporter</span><strong>${escapeHtml(t.reporter_name || "—")}</strong></div>
    <div class="flex justify-between" style="margin-bottom:10px"><span class="muted">Urgency</span>${urgencyBadge(t.urgency)}</div>
    <div class="flex-col gap-8" style="margin-bottom:16px">
      <span class="muted" style="font-size:13px">Description</span>
      <p style="font-size:14px">${escapeHtml(t.description || "—")}</p>
    </div>

    <div class="field">
      <label>Assign Technician</label>
      <div class="flex gap-8">
        <input class="input" id="assign-tech-input" placeholder="Technician name" value="${escapeHtml(t.assigned_to || "")}">
        <button class="btn btn-secondary" onclick="assignTechnician()">Assign</button>
      </div>
    </div>

    <div class="field">
      <label>Update Status</label>
      <div class="flex gap-8">
        <select class="input" id="status-select">
          ${TICKET_STATUS.map(s => `<option value="${s}" ${t.status === s ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}
        </select>
        <button class="btn btn-primary" onclick="updateTicketStatus()">Update</button>
      </div>
    </div>

    <div class="field">
      <label>Completion Date</label>
      <div class="flex gap-8">
        <input class="input" type="date" id="completion-date-input">
        <button class="btn btn-secondary" onclick="setCompletionDate()">Save</button>
      </div>
    </div>

    <div class="field">
      <label>Add Maintenance Note</label>
      <div class="flex gap-8">
        <input class="input" id="new-note-input" placeholder="Note details...">
        <button class="btn btn-secondary" onclick="addMaintenanceNote()">Add</button>
      </div>
    </div>

    <div class="card-title" style="margin-top:6px">Maintenance Notes</div>
    <div class="timeline" id="ticket-notes-timeline">
      ${notes.length ? notes.slice().reverse().map(n => `
        <div class="timeline-item">
          <div class="timeline-dot"><i data-lucide="${noteIcon(n.type)}"></i></div>
          <div class="timeline-content">
            <div class="timeline-title">${escapeHtml(n.text || n.type)}</div>
            <div class="timeline-meta">${formatDateTime(n.created_at)}</div>
          </div>
        </div>
      `).join("") : `<div class="empty-state" style="padding:20px"><span>No notes yet</span></div>`}
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function noteIcon(type) {
  return { note: "sticky-note", status: "refresh-ccw", assignment: "user-check", completion: "calendar-check" }[type] || "sticky-note";
}

async function persistTicketNote(entry) {
  const t = __allTickets.find(x => x.id === __activeTicketId);
  const notes = Array.isArray(t.notes) ? t.notes : [];
  notes.push({ ...entry, created_at: new Date().toISOString() });
  const { error } = await supabaseClient.from(TABLES.tickets).update({ notes, updated_at: new Date().toISOString() }).eq("id", __activeTicketId);
  if (error) { showToast(error.message, "error"); return false; }
  t.notes = notes;
  return true;
}

async function assignTechnician() {
  const tech = document.getElementById("assign-tech-input").value.trim();
  if (!tech) return showToast("Enter a technician name", "error");
  const t = __allTickets.find(x => x.id === __activeTicketId);
  const newStatus = t.status === "reported" ? "assigned" : t.status;
  const { error } = await supabaseClient.from(TABLES.tickets)
    .update({ assigned_to: tech, status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", __activeTicketId);
  if (error) return showToast(error.message, "error");
  t.assigned_to = tech; t.status = newStatus;
  await persistTicketNote({ type: "assignment", text: `Assigned to ${tech}` });
  showToast("Status Updated", "success");
  renderTicketModalBody();
  renderTicketsTable();
}

async function updateTicketStatus() {
  const status = document.getElementById("status-select").value;
  const { error } = await supabaseClient.from(TABLES.tickets)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", __activeTicketId);
  if (error) return showToast(error.message, "error");
  const t = __allTickets.find(x => x.id === __activeTicketId);
  t.status = status;
  await persistTicketNote({ type: "status", text: `Status changed to ${status}` });
  showToast(status === "resolved" ? "Resolved Successfully" : "Status Updated", "success");
  renderTicketModalBody();
  renderTicketsTable();
}

async function setCompletionDate() {
  const date = document.getElementById("completion-date-input").value;
  if (!date) return showToast("Pick a date first", "error");
  const ok = await persistTicketNote({ type: "completion", text: `Completion date set to ${date}` });
  if (ok) {
    showToast("Status Updated", "success");
    renderTicketModalBody();
  }
}

async function addMaintenanceNote() {
  const text = document.getElementById("new-note-input").value.trim();
  if (!text) return;
  const ok = await persistTicketNote({ type: "note", text });
  if (ok) {
    showToast("Note added", "success");
    renderTicketModalBody();
  }
}
