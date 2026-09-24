/**
 * Netlify adapter (function name: payments — must NOT be "api", that clashes with the /api folder):
 * on Netlify Functions. Requests to /api/<name> are routed here by netlify.toml.
 * (api/paystack-webhook.js is Vercel Edge-only and is not routed; payments are
 *  confirmed by /api/verify-payment on the success page.)
 */
const { Readable } = require("stream");

const handlers = {
  checkout: require("../../api/checkout.js"),
  config: require("../../api/config.js"),
  contact: require("../../api/contact.js"),
  download: require("../../api/download.js"),
  quote: require("../../api/quote.js"),
  "verify-payment": require("../../api/verify-payment.js"),
};

function makeReq(event) {
  const raw = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body)
    : Buffer.alloc(0);
  const headers = {};
  Object.entries(event.headers || {}).forEach(([k, v]) => (headers[k.toLowerCase()] = v));

  let body = raw.toString("utf8");
  if ((headers["content-type"] || "").includes("application/json")) {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  }

  const req = Readable.from(raw.length ? [raw] : []);
  return Object.assign(req, {
    method: event.httpMethod,
    headers,
    query: event.queryStringParameters || {},
    body,
    url: event.rawUrl || event.path,
  });
}

function makeRes() {
  const chunks = [];
  const headers = {};
  let done;
  const finished = new Promise((r) => (done = r));
  const res = {
    statusCode: 200,
    setHeader(k, v) { headers[String(k).toLowerCase()] = v; },
    getHeader(k) { return headers[String(k).toLowerCase()]; },
    removeHeader(k) { delete headers[String(k).toLowerCase()]; },
    writeHead(code, h) { res.statusCode = code; if (h) Object.entries(h).forEach(([k, v]) => res.setHeader(k, v)); return res; },
    write(c) { if (c != null) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); return true; },
    end(c) { res.write(c); done(); },
  };
  return { res, headers, chunks, finished };
}

exports.handler = async (event) => {
  const name = String(event.path || "").split("/").filter(Boolean).pop();
  const fn = handlers[name];
  if (!fn) {
    return { statusCode: 404, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: false, error: "Not found" }) };
  }
  const req = makeReq(event);
  const { res, headers, chunks, finished } = makeRes();
  try {
    await fn(req, res);
    if (!chunks.length && res.statusCode === 200) res.end();
    await Promise.race([finished, new Promise((r) => setTimeout(r, 50))]);
  } catch (e) {
    console.error("api error:", e);
    return { statusCode: 500, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: false, error: "Server error" }) };
  }
  const buf = Buffer.concat(chunks);
  const type = String(headers["content-type"] || "");
  const isText = /json|text|xml|javascript/i.test(type) || !buf.length;
  return {
    statusCode: res.statusCode,
    headers,
    body: isText ? buf.toString("utf8") : buf.toString("base64"),
    isBase64Encoded: !isText,
  };
};
