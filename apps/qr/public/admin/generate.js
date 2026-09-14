import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm";
import { db, requireAdminAuth } from "./firebase-init.js";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const GEAR_COLLECTION = "gear";
const TYPE_PREFIX = { helmet: "HLM", vest: "VST" };
const MAX_RANGE = 500;
const DEFAULT_SITE_ID = "SITE-01";

let currentAdminEmail = null;
let lastGenerated = []; // { gearId, qrCode, dataUrl }

requireAdminAuth((user) => {
  currentAdminEmail = user.email ?? null;
});

const form = document.getElementById("generate-form");
const formError = document.getElementById("form-error");
const resultsPanel = document.getElementById("results-panel");
const qrGrid = document.getElementById("qr-grid");
const downloadAllBtn = document.getElementById("download-all-btn");
const deleteAllBtn = document.getElementById("delete-all-btn");
const deleteStatus = document.getElementById("delete-status");

// --- DELETE ALL GEAR RECORDS ---
deleteAllBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "⚠️ WARNING: This will permanently delete ALL gear records (helmets & vests) from Firestore.\n\n" +
    "All assigned QR codes will be removed. Workers will not be able to scan existing gear.\n\n" +
    "Are you sure you want to continue?"
  );
  if (!confirmed) return;

  deleteAllBtn.disabled = true;
  deleteAllBtn.textContent = "Deleting...";
  setDeleteStatus("⏳ Fetching all gear records...", "#fbbf24");

  try {
    const snapshot = await getDocs(collection(db, GEAR_COLLECTION));
    const total = snapshot.docs.length;

    if (total === 0) {
      setDeleteStatus("✅ No gear records found — database is already empty.", "#4ade80");
      return;
    }

    setDeleteStatus(`⏳ Deleting ${total} gear record(s) in batches...`, "#fbbf24");

    // Firestore batch supports max 500 ops; chunk into batches of 450
    const BATCH_SIZE = 450;
    const docs = snapshot.docs;
    let deleted = 0;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += chunk.length;
      setDeleteStatus(`⏳ Deleted ${deleted} / ${total} records...`, "#fbbf24");
    }

    lastGenerated = [];
    qrGrid.innerHTML = "";
    resultsPanel.style.display = "none";
    setDeleteStatus(`✅ Successfully deleted all ${total} gear records. You can now generate fresh QR codes.`, "#4ade80");
  } catch (err) {
    setDeleteStatus("❌ Delete failed: " + err.message, "#f87171");
  } finally {
    deleteAllBtn.disabled = false;
    deleteAllBtn.textContent = "🗑 Delete All Gear";
  }
});

function setDeleteStatus(msg, color) {
  deleteStatus.textContent = msg;
  deleteStatus.style.color = color;
  deleteStatus.style.display = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  qrGrid.innerHTML = "";
  resultsPanel.style.display = "none";
  lastGenerated = [];

  const type = document.getElementById("gear-type").value;
  const siteId = DEFAULT_SITE_ID;
  const start = parseInt(document.getElementById("start-id").value, 10);
  const end = parseInt(document.getElementById("end-id").value, 10);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return showError("Enter a valid ID range.");
  if (start > end) return showError("Start ID must be less than or equal to End ID.");
  if (end - start + 1 > MAX_RANGE) return showError(`Range too large — generate at most ${MAX_RANGE} gear IDs at a time.`);

  const prefix = TYPE_PREFIX[type];
  const typeTag = type.toUpperCase();
  const ids = [];
  for (let i = start; i <= end; i++) {
    ids.push({ gearId: `${prefix}-${i}`, qrCode: `QR_${typeTag}_${i}` });
  }

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Generating...";

  try {
    // Warn (don't silently clobber) if any of these gear IDs already exist —
    // regenerating resets their status/assignment in the shared database.
    const existingSnapshot = await getDocs(
      query(collection(db, GEAR_COLLECTION), where("type", "==", type))
    );
    const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));
    const collisions = ids.filter((g) => existingIds.has(g.gearId));

    if (collisions.length > 0) {
      const proceed = confirm(
        `${collisions.length} gear ID(s) in this range already exist (e.g. ${collisions[0].gearId}). ` +
        `Regenerating will reset their status to Available and clear any current worker assignment. Continue?`
      );
      if (!proceed) return;
    }

    const batch = writeBatch(db);
    for (const { gearId, qrCode } of ids) {
      batch.set(doc(db, GEAR_COLLECTION, gearId), {
        gearId,
        qrCode,
        type,
        siteId,
        status: "Available",
        assignedTo: null,
        assignedShift: null,
        isAssigned: false,
        lastAssignedAt: null,
        createdAt: serverTimestamp(),
        createdBy: currentAdminEmail
      });
    }
    await batch.commit();

    for (const { gearId, qrCode } of ids) {
      const qrLib = (typeof QRCode !== "undefined" && QRCode?.toDataURL) ? QRCode : window.QRCode;
      const dataUrl = await qrLib.toDataURL(qrCode, { width: 240, margin: 1 });
      lastGenerated.push({ gearId, qrCode, dataUrl });
      qrGrid.appendChild(renderQrCard(gearId, qrCode, dataUrl));
    }

    resultsPanel.style.display = "";
  } catch (err) {
    showError("Failed to generate QR codes: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate";
  }
});

downloadAllBtn.addEventListener("click", async () => {
  if (lastGenerated.length === 0) return;
  const zip = new JSZip();
  for (const { gearId, dataUrl } of lastGenerated) {
    zip.file(`${gearId}.png`, dataUrl.split(",")[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "gear-qr-codes.zip");
});

function renderQrCard(gearId, qrCode, dataUrl) {
  const card = document.createElement("div");
  card.className = "qr-card";
  card.innerHTML = `
    <img src="${dataUrl}" alt="QR code for ${gearId}" />
    <div class="qr-card-id">${gearId}</div>
    <div class="qr-card-code">${qrCode}</div>
    <button class="btn btn-secondary btn-sm">Download</button>
  `;
  card.querySelector("button").addEventListener("click", () => downloadBlob(dataUrlToBlob(dataUrl), `${gearId}.png`));
  return card;
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

function showError(message) {
  formError.textContent = message;
  formError.style.display = "";
}

function hideError() {
  formError.style.display = "none";
}
