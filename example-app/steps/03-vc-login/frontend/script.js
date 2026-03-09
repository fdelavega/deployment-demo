const map = L.map("map").setView([40.4168, -3.7038], 11);
const statusEl = document.getElementById("status");
const tokenInfoEl = document.getElementById("tokenInfo");
const typeInput = document.getElementById("typeInput");
const loadBtn = document.getElementById("loadBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markers = L.layerGroup().addTo(map);

loadBtn.addEventListener("click", () => loadEntities());
loginBtn.addEventListener("click", () => startLogin());
logoutBtn.addEventListener("click", () => logout());

init();

async function init() {
  await refreshAuthStatus();
  await loadEntities();
}

async function refreshAuthStatus() {
  try {
    const response = await fetch("/api/auth/me");
    const payload = await response.json();
    if (payload.authenticated) {
      setStatus(`Authenticated (step 03).`);
      renderTokenInfo(payload);
    } else {
      setStatus(`Anonymous (step 03).`);
      renderTokenInfo(null);
    }
  } catch {
    setStatus("Unable to check authentication status.");
    renderTokenInfo(null);
  }
}

async function loadEntities() {
  const type = typeInput.value.trim() || "AirQualityObserved";
  setStatus(`Loading ${type}...`);

  try {
    const response = await fetch(`/api/entities?type=${encodeURIComponent(type)}`);
    const payload = await response.json();

    if (!response.ok) {
      setStatus(`Request failed (${response.status}): ${payload.message || payload.error}`);
      return;
    }

    renderMarkers(payload.items || []);
    setStatus(`Loaded ${payload.count} entities.`);
  } catch {
    setStatus("Network error while loading entities.");
  }
}

function renderMarkers(items) {
  markers.clearLayers();
  if (!items.length) return;

  const bounds = [];
  for (const item of items) {
    const marker = L.marker([item.lat, item.lon]).bindPopup(
      `<strong>${escapeHtml(item.label)}</strong><br>${escapeHtml(item.id)}`
    );
    marker.addTo(markers);
    bounds.push([item.lat, item.lon]);
  }
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [32, 32] });
  }
}

async function startLogin() {
  window.location.assign("/api/auth/start");
}

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshAuthStatus();
    setStatus("Logged out.");
  } catch {
    setStatus("Logout failed.");
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderTokenInfo(authPayload) {
  if (!authPayload || !authPayload.authenticated) {
    tokenInfoEl.innerHTML = "Token: not available (user not logged in).";
    return;
  }

  const claims = authPayload.claims || {};
  const expText = claims.exp
    ? `${claims.exp} (${new Date(claims.exp * 1000).toISOString()})`
    : "n/a";

  tokenInfoEl.innerHTML = [
    "<strong>Login evidence</strong>",
    `Token: <code>${escapeHtml(authPayload.tokenPreview || "n/a")}</code>`,
    `sub: <code>${escapeHtml(claims.sub || "n/a")}</code>`,
    `scope: <code>${escapeHtml(claims.scope || "n/a")}</code>`,
    `exp: <code>${escapeHtml(expText)}</code>`
  ].join("<br>");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
