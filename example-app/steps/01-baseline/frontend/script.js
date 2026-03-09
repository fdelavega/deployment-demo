const map = L.map("map").setView([40.4168, -3.7038], 11);
const statusEl = document.getElementById("status");
const typeInput = document.getElementById("typeInput");
const loadBtn = document.getElementById("loadBtn");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markers = L.layerGroup().addTo(map);
loadBtn.addEventListener("click", loadEntities);
loadEntities();

async function loadEntities() {
  const type = typeInput.value.trim() || "AirQualityObserved";
  setStatus(`Loading ${type}...`);

  try {
    const response = await fetch(`/api/entities?type=${encodeURIComponent(type)}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(`Request failed (${response.status}).`);
      return;
    }

    markers.clearLayers();
    const bounds = [];
    for (const item of payload.items || []) {
      L.marker([item.lat, item.lon])
        .bindPopup(`<strong>${escapeHtml(item.label)}</strong><br>${escapeHtml(item.id)}`)
        .addTo(markers);
      bounds.push([item.lat, item.lon]);
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [32, 32] });
    setStatus(`Loaded ${payload.count} entities.`);
  } catch {
    setStatus("Network error while loading entities.");
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
