import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import express from "express";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_API_URL =
  process.env.DATA_API_URL || "http://mp-data-service.127.0.0.1.nip.io:8080";
const OIDC_AUTH_SCOPE = process.env.OIDC_AUTH_SCOPE || "";
const VERIFIER_URL =
  process.env.VERIFIER_URL || "http://provider-verifier.127.0.0.1.nip.io:8080";
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "data-service";
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || "";
const OIDC_AUTHORIZATION_ENDPOINT =
  process.env.OIDC_AUTHORIZATION_ENDPOINT || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";

const app = express();

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    step: "03-vc-login",
    source: DATA_API_URL,
    authenticated: Boolean(_req.session.accessToken)
  });
});

app.get("/api/entities", async (req, res) => {
  const token = req.session.accessToken;
  if (!token) {
    return res.status(401).json({
      error: "missing_access_token",
      message: "Login required. Use /api/auth/start."
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
        Authorization: `Bearer ${token}`,
        Link: '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
      }
    });

    const text = await upstream.text();
    const payload = tryParseJson(text);
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "upstream_error",
        status: upstream.status,
        details: payload || text
      });
    }

    const entities = Array.isArray(payload) ? payload : [];
    const items = entities.map(normalizeEntity).filter(Boolean);
    return res.json({ count: items.length, items });
  } catch (error) {
    return res.status(500).json({
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.get("/api/auth/start", async (req, res) => {
  if (!OIDC_AUTH_SCOPE) {
    return res.status(500).json({
      error: "missing_auth_scope",
      message:
        "OIDC_AUTH_SCOPE is required. Example: OIDC_AUTH_SCOPE=operator"
    });
  }

  try {
    const openIdConfig = await getOpenIdConfiguration();
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback`;

    req.session.authState = state;
    req.session.authNonce = nonce;
    req.session.openIdConfig = openIdConfig;
    req.session.redirectUri = redirectUri;

    const authorizationUrl = buildAuthorizationUrl({
      openIdConfig,
      redirectUri,
      state,
      nonce
    });
    return res.redirect(authorizationUrl);
  } catch (error) {
    return res.status(502).json({
      error: "oidc_discovery_failed",
      message: error instanceof Error ? error.message : "Unknown discovery error"
    });
  }
});

app.get("/api/auth/callback", async (req, res) => {
  const state = req.query.state;
  const expectedState = req.session.authState;
  if (!state || !expectedState || state !== expectedState) {
    return res.status(400).json({
      error: "invalid_state",
      message: "Missing or invalid OAuth state."
    });
  }

  const code = req.query.code;
  if (!code) {
    return res.status(400).json({
      error: "missing_authorization_code",
      message: "No authorization code in callback."
    });
  }

  const openIdConfig = req.session.openIdConfig;
  const redirectUri = req.session.redirectUri;
  if (!openIdConfig?.token_endpoint || !redirectUri) {
    return res.status(400).json({
      error: "missing_oidc_context",
      message: "Missing OIDC context in session. Restart login."
    });
  }

  try {
    const tokenPayload = await exchangeAuthorizationCode({
      code: String(code),
      redirectUri,
      tokenEndpoint: openIdConfig.token_endpoint
    });

    if (!tokenPayload?.access_token) {
      return res.status(502).json({
        error: "token_exchange_failed",
        message: "Token endpoint response does not include access_token.",
        details: tokenPayload
      });
    }

    req.session.accessToken = tokenPayload.access_token;
    req.session.authState = undefined;
    req.session.openIdConfig = undefined;
    req.session.redirectUri = undefined;
    return res.redirect("/?login=ok");
  } catch (error) {
    return res.status(502).json({
      error: "token_exchange_failed",
      message: error instanceof Error ? error.message : "Unknown token error"
    });
  }
});

app.get("/api/auth/me", (req, res) => {
  const accessToken = req.session.accessToken;
  const claims = accessToken ? decodeJwtClaims(accessToken) : null;

  res.json({
    step: "03-vc-login",
    authenticated: Boolean(accessToken),
    tokenPreview: accessToken ? maskToken(accessToken) : null,
    claims: claims
      ? {
          iss: claims.iss || null,
          sub: claims.sub || null,
          scope: claims.scope || null,
          aud: claims.aud || null,
          exp: claims.exp || null,
          iat: claims.iat || null
        }
      : null
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

app.use(express.static(path.join(projectRoot, "frontend")));

app.listen(PORT, () => {
  console.log(`step-03 backend running on http://localhost:${PORT}`);
});

async function getOpenIdConfiguration() {
  const candidates = [
    `${DATA_API_URL}/.well-known/openid-configuration`,
    `${VERIFIER_URL}/services/${OIDC_CLIENT_ID}/.well-known/openid-configuration`
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) continue;
      const config = await response.json();
      if (config?.authorization_endpoint && config?.token_endpoint) {
        return config;
      }
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Unable to discover OIDC endpoints from data service or verifier."
  );
}

function buildAuthorizationUrl({ openIdConfig, redirectUri, state, nonce }) {
  const endpoint =
    OIDC_AUTHORIZATION_ENDPOINT || openIdConfig.authorization_endpoint;
  const url = new URL(endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", OIDC_CLIENT_ID);
  url.searchParams.set("scope", OIDC_AUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("redirect_url", redirectUri);
  return url.toString();
}

async function exchangeAuthorizationCode({ code, redirectUri, tokenEndpoint }) {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", OIDC_CLIENT_ID);
  body.set("redirect_uri", redirectUri);

  if (OIDC_CLIENT_SECRET) {
    body.set("client_secret", OIDC_CLIENT_SECRET);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Token endpoint returned ${response.status}: ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeEntity(entity) {
  const id = entity?.id;
  const name =
    entity?.name?.value ||
    entity?.stationName?.value ||
    entity?.address?.value ||
    id;

  const coords = extractCoordinates(entity);
  if (!id || !coords) return null;

  return {
    id,
    label: String(name),
    lat: coords.lat,
    lon: coords.lon,
    type: entity?.type || "Unknown"
  };
}

function extractCoordinates(entity) {
  const locationValue = entity?.location?.value;
  if (
    locationValue?.type === "Point" &&
    Array.isArray(locationValue.coordinates) &&
    locationValue.coordinates.length >= 2
  ) {
    return {
      lon: Number(locationValue.coordinates[0]),
      lat: Number(locationValue.coordinates[1])
    };
  }

  if (
    entity?.location?.type === "GeoProperty" &&
    entity?.location?.value?.type === "Point" &&
    Array.isArray(entity.location.value.coordinates) &&
    entity.location.value.coordinates.length >= 2
  ) {
    return {
      lon: Number(entity.location.value.coordinates[0]),
      lat: Number(entity.location.value.coordinates[1])
    };
  }

  return null;
}

function decodeJwtClaims(token) {
  const parts = String(token).split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function base64UrlDecode(input) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function maskToken(token) {
  if (token.length <= 24) return token;
  return `${token.slice(0, 16)}...${token.slice(-8)}`;
}
