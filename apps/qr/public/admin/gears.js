import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm";
import { db, requireAdminAuth } from "./firebase-init.js";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  writeBatch,
  where,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const GEAR_COLLECTION = "gear";

let allGears = [];
let pendingDuplicateGroups = [];

requireAdminAuth(() => {
  loadGears();
});

document.getElementById("refresh-btn").addEventListener("click", loadGears);
document.getElementById("unassign-all-btn").addEventListener("click", unassignAll);
document.getElementById("search-input").addEventListener("input", (e) => {
  renderRows(filterGears(e.target.value));
});
document.getElementById("find-duplicates-btn").addEventListener("click", showDuplicates);
document.getElementById("cancel-duplicates-btn").addEventListener("click", hideDuplicatesPanel);
document.getElementById("confirm-duplicates-btn").addEventListener("click", removeDuplicates);

async function loadGears() {
  const tbody = document.getElementById("gears-tbody");
  tbody.innerHTML = `<tr><td colspan="7" class="muted-text">Loading...</td></tr>`;
  hideDuplicatesPanel();
  try {
    const snapshot = await getDocs(query(collection(db, GEAR_COLLECTION), orderBy("gearId")));
    allGears = snapshot.docs.map((d) => d.data());
    renderRows(filterGears(document.getElementById("search-input").value));
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="error-text">Failed to load: ${err.message}</td></tr>`;
  }
}

function filterGears(term) {
  const t = term.trim().toLowerCase();
  if (!t) return allGears;
  return allGears.filter((g) =>
    [g.gearId, g.qrCode, g.type, g.status, g.assignedTo, g.siteId]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(t))
  );
}

function renderRows(gears) {
  const tbody = document.getElementById("gears-tbody");
  const emptyState = document.getElementById("empty-state");
  tbody.innerHTML = "";

  if (gears.length === 0) {
    emptyState.style.display = "";
    return;
  }
  emptyState.style.display = "none";

  for (const gear of gears) {
    const tr = document.createElement("tr");
    const statusClass = (gear.status ?? "").toLowerCase();
    tr.innerHTML = `
      <td>${escapeHtml(gear.gearId ?? "")}</td>
      <td>${escapeHtml(gear.type ?? "")}</td>
      <td>${escapeHtml(gear.qrCode ?? "")}</td>
      <td>${escapeHtml(gear.siteId ?? "")}</td>
      <td><span class="badge badge-${escapeHtml(statusClass)}">${escapeHtml(gear.status ?? "")}</span></td>
      <td>${escapeHtml(gear.assignedTo ?? "—")}</td>
      <td><button class="btn btn-secondary btn-sm">Download</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => downloadQr(gear));
    tbody.appendChild(tr);
  }
}

async function downloadQr(gear) {
  const qrLib = (typeof QRCode !== "undefined" && QRCode?.toDataURL) ? QRCode : window.QRCode;
  const dataUrl = await qrLib.toDataURL(gear.qrCode, { width: 240, margin: 1 });
  downloadBlob(dataUrlToBlob(dataUrl), `${gear.gearId}.png`);
}

// Data-URI downloads are unreliable in some Chrome versions; converting to a
// Blob + object URL is the robust cross-browser way to trigger a download.
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getCreatedAtMillis(gear) {
  const ts = gear.createdAt;
  if (ts && typeof ts.toMillis === "function") return ts.toMillis();
  return 0;
}

function findDuplicateGroups(gears) {
  const byQrCode = new Map();
  for (const gear of gears) {
    if (!gear.qrCode) continue;
    if (!byQrCode.has(gear.qrCode)) byQrCode.set(gear.qrCode, []);
    byQrCode.get(gear.qrCode).push(gear);
  }

  const groups = [];
  for (const [qrCode, members] of byQrCode) {
    if (members.length <= 1) continue;
    // Newest createdAt wins; everything else in the group is the "older duplicate" to remove.
    const sorted = [...members].sort((a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a));
    groups.push({ qrCode, keep: sorted[0], remove: sorted.slice(1) });
  }
  return groups;
}

function showDuplicates() {
  pendingDuplicateGroups = findDuplicateGroups(allGears);
  const panel = document.getElementById("duplicates-panel");
  const list = document.getElementById("duplicates-list");
  const confirmBtn = document.getElementById("confirm-duplicates-btn");

  if (pendingDuplicateGroups.length === 0) {
    list.innerHTML = `<p class="muted-text">No duplicate QR codes found.</p>`;
    confirmBtn.style.display = "none";
  } else {
    confirmBtn.style.display = "";
    list.innerHTML = pendingDuplicateGroups
      .map((group) => {
        const rows = [
          `<div class="dup-row"><span class="dup-tag dup-tag-keep">Keep</span> ${escapeHtml(group.keep.gearId)}</div>`,
          ...group.remove.map(
            (g) => `<div class="dup-row"><span class="dup-tag dup-tag-remove">Remove</span> ${escapeHtml(g.gearId)}</div>`
          )
        ].join("");
        return `
          <div class="dup-group">
            <div class="dup-group-title">QR code <span>${escapeHtml(group.qrCode)}</span> — ${group.remove.length + 1} gear records</div>
            ${rows}
          </div>
        `;
      })
      .join("");
  }

  panel.style.display = "";
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideDuplicatesPanel() {
  document.getElementById("duplicates-panel").style.display = "none";
  pendingDuplicateGroups = [];
}

async function removeDuplicates() {
  const totalToRemove = pendingDuplicateGroups.reduce((sum, g) => sum + g.remove.length, 0);
  if (totalToRemove === 0) return;

  const confirmed = confirm(
    `This will permanently delete ${totalToRemove} older duplicate gear record(s) from the database. This cannot be undone. Continue?`
  );
  if (!confirmed) return;

  const confirmBtn = document.getElementById("confirm-duplicates-btn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Removing...";

  try {
    const batch = writeBatch(db);
    for (const group of pendingDuplicateGroups) {
      for (const gear of group.remove) {
        batch.delete(doc(db, GEAR_COLLECTION, gear.gearId));
      }
    }
    await batch.commit();
    hideDuplicatesPanel();
    await loadGears();
  } catch (err) {
    alert("Failed to remove duplicates: " + err.message);
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Remove older duplicates";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function unassignAll() {
  const assignedGears = allGears.filter((g) => g.assignedTo && String(g.assignedTo).trim() !== "" && String(g.assignedTo) !== "—");
  if (assignedGears.length === 0) {
    alert("No gears are currently assigned to workers.");
    return;
  }

  
  const confirmed = confirm(
    `This will unassign ${assignedGears.length} gear(s) from workers, set their status to "Available", and remove them from attendance records. Continue?`
  );
  if (!confirmed) return;
  
  const btn = document.getElementById("unassign-all-btn");
  btn.disabled = true;
  btn.textContent = "Unassigning...";
  
  try {
    const batch = writeBatch(db);
    for (const gear of assignedGears) {
      batch.update(doc(db, GEAR_COLLECTION, gear.gearId), {
        assignedTo: "",
        status: "Available"
      });
      
      // Query attendance docs that have this gearId in their 'gears' array
      const attQuery = query(collection(db, "attendance"), where("gears", "array-contains", gear.gearId));
      const attSnapshot = await getDocs(attQuery);
      for (const attDoc of attSnapshot.docs) {
        batch.update(attDoc.ref, {
          gears: arrayRemove(gear.gearId)
        });
      }
    }
    await batch.commit();
    await loadGears();
  } catch (err) {
    alert("Failed to unassign gears: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Unassign All";
  }
}
