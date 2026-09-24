const fs = require("fs");
const path = require("path");
const {
  getProduct,
  extractProductIds,
  normalizeEmail,
} = require("../lib/catalog");
const {
  verifyDownloadToken,
  sendJson,
  setCors,
  verifyPaystackTransaction,
} = require("../lib/paystack");

function resolveDownloadPath(filename) {
  const candidates = [
    path.join(process.cwd(), "private", "downloads", filename),
    path.join(__dirname, "..", "private", "downloads", filename),
    path.join(__dirname, "downloads", filename),
  ];
  return candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" }, req);
  }

  try {
    const reference = String(req.query.reference || "").trim();
    const productId = String(req.query.product || "").trim();
    const email = normalizeEmail(req.query.email);
    const token = String(req.query.token || "").trim();

    if (!reference || !productId || !email || !token) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Missing download parameters" },
        req
      );
    }

    if (!/^[A-Za-z0-9_-]{6,80}$/.test(reference)) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Invalid payment reference" },
        req
      );
    }

    if (!verifyDownloadToken(reference, productId, email, token)) {
      return sendJson(
        res,
        403,
        { ok: false, error: "Invalid or expired download token" },
        req
      );
    }

    const product = getProduct(productId);
    if (!product || product.fulfillment !== "instant" || !product.downloadFile) {
      return sendJson(
        res,
        404,
        {
          ok: false,
          error: "This product is not available for instant download",
        },
        req
      );
    }

    const tx = await verifyPaystackTransaction(reference);
    if (tx.status !== "success") {
      return sendJson(
        res,
        402,
        { ok: false, error: "Payment not successful" },
        req
      );
    }

    const paidEmail = normalizeEmail(tx.customer?.email || "");
    if (!paidEmail || paidEmail !== email) {
      return sendJson(
        res,
        403,
        { ok: false, error: "Email does not match this purchase" },
        req
      );
    }

    const paidIds = extractProductIds(tx.metadata);
    if (!paidIds.includes(productId)) {
      return sendJson(
        res,
        403,
        { ok: false, error: "Payment does not include this product" },
        req
      );
    }

    const filePath = resolveDownloadPath(product.downloadFile);
    if (!filePath) {
      console.error("Missing download file:", product.downloadFile);
      return sendJson(
        res,
        404,
        { ok: false, error: "Download file is missing on the server" },
        req
      );
    }

    const buffer = fs.readFileSync(filePath);
    const safeName = String(product.downloadFile).replace(/[^\w.\-]+/g, "_");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}"`
    );
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", String(buffer.length));
    setCors(res, req);
    res.end(buffer);
  } catch (err) {
    if (err.code === "CONFIG") {
      return sendJson(
        res,
        503,
        { ok: false, error: "PAYSTACK_SECRET_KEY is not configured" },
        req
      );
    }
    console.error("download error:", err);
    return sendJson(
      res,
      502,
      { ok: false, error: err.message || "Download failed" },
      req
    );
  }
};
