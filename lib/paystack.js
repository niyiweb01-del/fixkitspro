const crypto = require("crypto");
const { normalizeEmail } = require("./catalog");

function getDownloadSecret() {
  const secret =
    process.env.DOWNLOAD_SECRET || process.env.PAYSTACK_SECRET_KEY || "";
  if (!secret) {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production"
    ) {
      return "";
    }
    return "fixkit-dev-download-secret";
  }
  return secret;
}

/**
 * Download token bound to payment reference + product + buyer email.
 */
function createDownloadToken(reference, productId, email) {
  const secret = getDownloadSecret();
  if (!secret) {
    const err = new Error(
      "DOWNLOAD_SECRET / PAYSTACK_SECRET_KEY is not configured"
    );
    err.code = "CONFIG";
    throw err;
  }
  const payload = `${reference}:${productId}:${normalizeEmail(email)}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verifyDownloadToken(reference, productId, email, token) {
  if (!reference || !productId || !email || !token) return false;
  try {
    const expected = createDownloadToken(reference, productId, email);
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(token), "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function allowedOrigin(req) {
  const configured = (process.env.ALLOWED_ORIGIN || process.env.SITE_URL || "")
    .replace(/\/$/, "");
  if (configured) return configured;

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${String(vercel).replace(/^https?:\/\//, "")}`;

  const origin = req && (req.headers.origin || req.headers.Origin);
  if (origin && /localhost|127\.0\.0\.1/.test(String(origin))) {
    return String(origin);
  }

  return "";
}

function setCors(res, req) {
  const origin = allowedOrigin(req);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function sendJson(res, statusCode, body, req) {
  setCors(res, req);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

async function verifyPaystackTransaction(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    const err = new Error("PAYSTACK_SECRET_KEY is not configured");
    err.code = "CONFIG";
    throw err;
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) {
    const err = new Error(data.message || "Verification failed");
    err.code = "VERIFY";
    err.payload = data;
    throw err;
  }

  return data.data;
}

async function initializePaystackTransaction(payload) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    const err = new Error("PAYSTACK_SECRET_KEY is not configured");
    err.code = "CONFIG";
    throw err;
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) {
    const err = new Error(data.message || "Could not initialize payment");
    err.code = "INIT";
    err.payload = data;
    throw err;
  }

  return data.data;
}

function createOrderReference() {
  const rand = crypto.randomBytes(4).toString("hex");
  return `fk_${Date.now()}_${rand}`;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    if (typeof req.body === "string") {
      resolve(req.body);
      return;
    }
    if (Buffer.isBuffer(req.body)) {
      resolve(req.body.toString("utf8"));
      return;
    }
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

module.exports = {
  createDownloadToken,
  verifyDownloadToken,
  setCors,
  sendJson,
  verifyPaystackTransaction,
  initializePaystackTransaction,
  createOrderReference,
  readRawBody,
  getDownloadSecret,
  allowedOrigin,
};
