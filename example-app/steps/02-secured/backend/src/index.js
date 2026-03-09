import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_API_URL = process.env.DATA_API_URL || "http://mp-data-service.127.0.0.1.nip.io:8080";
const DATA_API_TOKEN = process.env.DATA_API_TOKEN || "";

const app = express();
app.use(express.static(path.join(projectRoot, "frontend")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, step: "02-secured", source: DATA_API_URL, hasToken: Boolean(DATA_API_TOKEN) });
});

app.get("/api/entities", async (req, res) => {
  if (!DATA_API_TOKEN) {
    return res.status(401).json({
      error: "missing_access_token",
      message: "Set DATA_API_TOKEN in .env using the token from tutorial step 2."
    });
  }

  try {
    const type = req.query.type || "AirQualityObserved";
    const limit = req.query.limit || "50";

    const url = new URL("/ngsi-ld/v1/entities", DATA_API_URL);
    url.searchParams.set("type", type);
    url.searchParams.set("limit", String(limit));

    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${DATA_API_TOKEN}`,
        Link: '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
      }
    });

    const payload = await upstream.json().catch(() => []);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "upstream_error", details: payload });
    }

    const items = (Array.isArray(payload) ? payload : [])
      .map(normalizeEntity)
      .filter(Boolean);

    return res.json({ count: items.length, items });
  } catch (error) {
    return res.status(500).json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`step-02 backend running on http://localhost:${PORT}`);
});

function normalizeEntity(entity) {
  const coords = extractCoordinates(entity);
  if (!coords || !entity?.id) return null;
  return {
    id: entity.id,
    label: entity?.name?.value || entity?.stationName?.value || entity.id,
    lat: coords.lat,
    lon: coords.lon,
    type: entity?.type || "Unknown"
  };
}

function extractCoordinates(entity) {
  const value = entity?.location?.value;
  if (value?.type === "Point" && Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
    return { lon: Number(value.coordinates[0]), lat: Number(value.coordinates[1]) };
  }
  return null;
}
