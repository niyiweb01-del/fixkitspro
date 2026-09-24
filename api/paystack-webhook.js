/**
 * Paystack webhook (Edge) — raw body required for HMAC verification.
 * Dashboard URL: https://YOUR_DOMAIN/api/paystack-webhook
 */
export const config = {
  runtime: "edge",
};

function json(status, body) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-paystack-signature",
  };
  if (status === 204) {
    return new Response(null, { status, headers });
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function extractProductIds(metadata) {
  if (!metadata || typeof metadata !== "object") return [];
  if (typeof metadata.product_ids === "string" && metadata.product_ids.trim()) {
    return metadata.product_ids.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (metadata.product_id) return [String(metadata.product_id)];
  return [];
}

async function hmacSha512Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return json(204, {});
  }
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return json(503, { ok: false, error: "PAYSTACK_SECRET_KEY missing" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) {
    return json(401, { ok: false, error: "Missing signature" });
  }

  const hash = await hmacSha512Hex(secret, rawBody);
  if (hash !== signature) {
    return json(401, { ok: false, error: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  if (payload.event === "charge.success") {
    const data = payload.data || {};
    const productIds = extractProductIds(data.metadata);
    console.log(
      JSON.stringify({
        type: "charge.success",
        reference: data.reference,
        email: data.customer && data.customer.email,
        buyerName: data.metadata && data.metadata.buyer_name,
        productIds,
        amount: data.amount,
        currency: data.currency,
      })
    );
  }

  return json(200, { ok: true });
}
