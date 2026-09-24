const {
  extractProductIds,
  buildOrderFromProductIds,
  normalizeEmail,
  paymentCurrencySymbol,
} = require("../lib/catalog");
const {
  createDownloadToken,
  sendJson,
  setCors,
  verifyPaystackTransaction,
} = require("../lib/paystack");

/**
 * GET/POST /api/verify-payment?reference=
 * Verifies Paystack charge against the FX-locked amount stored at initialize time.
 */
module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" }, req);
  }

  try {
    const params =
      req.method === "GET"
        ? req.query || {}
        : typeof req.body === "object" && req.body
          ? req.body
          : JSON.parse(req.body || "{}");

    const reference = String(params.reference || "").trim();
    if (!reference) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Missing payment reference" },
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

    const tx = await verifyPaystackTransaction(reference);

    if (tx.status !== "success") {
      return sendJson(
        res,
        402,
        {
          ok: false,
          error: "Payment not successful",
          status: tx.status,
        },
        req
      );
    }

    const meta = tx.metadata || {};
    const productIds = extractProductIds(meta);
    if (!productIds.length) {
      return sendJson(
        res,
        400,
        { ok: false, error: "No products found on this payment" },
        req
      );
    }

    let order;
    try {
      order = buildOrderFromProductIds(productIds);
    } catch (err) {
      return sendJson(
        res,
        400,
        { ok: false, error: err.message || "Invalid cart on payment" },
        req
      );
    }

    const metaUsdCents = Number(meta.usd_cents);
    const metaChargeAmount = Number(meta.charge_amount);
    const metaChargeCurrency = String(meta.charge_currency || "").toUpperCase();
    const paidAmount = Number(tx.amount);
    const paidCurrency = String(tx.currency || "").toUpperCase();

    // Prefer verifying the locked charge from initialize metadata (FX-safe).
    // Fallback for any legacy single-currency orders without FX metadata.
    if (
      Number.isFinite(metaChargeAmount) &&
      metaChargeAmount > 0 &&
      metaChargeCurrency
    ) {
      if (paidAmount !== metaChargeAmount) {
        return sendJson(
          res,
          400,
          {
            ok: false,
            error: "Paid amount does not match the locked checkout total",
            expected: metaChargeAmount,
            received: paidAmount,
          },
          req
        );
      }
      if (paidCurrency !== metaChargeCurrency) {
        return sendJson(
          res,
          400,
          {
            ok: false,
            error: "Paid currency does not match checkout currency",
            expected: metaChargeCurrency,
            received: paidCurrency,
          },
          req
        );
      }

      // Catalog USD total at pay time should match (detect tampered product set / price drift)
      if (Number.isFinite(metaUsdCents) && metaUsdCents > 0) {
        if (metaUsdCents !== order.usdCents) {
          return sendJson(
            res,
            400,
            {
              ok: false,
              error:
                "Order contents no longer match this payment. Contact support with your reference.",
              expectedUsdCents: metaUsdCents,
              catalogUsdCents: order.usdCents,
            },
            req
          );
        }
      }
    } else {
      // Legacy path: catalog was charged in payment currency 1:1 (pre-FX). Reject if currency is NGN
      // while catalog is USD to avoid undercharging — require FX metadata going forward.
      return sendJson(
        res,
        400,
        {
          ok: false,
          error:
            "This payment is missing FX checkout metadata. Contact support with your reference.",
        },
        req
      );
    }

    const email = normalizeEmail(
      tx.customer?.email || meta.buyer_email || ""
    );
    const buyerName = meta.buyer_name || tx.customer?.first_name || null;

    const products = order.items.map((item) => {
      const entry = {
        id: item.id,
        name: item.name,
        price: item.price,
        fulfillment: item.fulfillment,
        note: item.note,
        download: null,
      };

      if (item.fulfillment === "instant" && item.downloadFile && email) {
        const token = createDownloadToken(reference, item.id, email);
        const qs = new URLSearchParams({
          reference,
          product: item.id,
          email,
          token,
        });
        entry.download = {
          url: `/api/download?${qs.toString()}`,
          filename: item.downloadFile,
        };
      }

      return entry;
    });

    const instant = products.filter((p) => p.download);
    const manual = products.filter((p) => p.fulfillment === "manual");

    return sendJson(
      res,
      200,
      {
        ok: true,
        reference: tx.reference,
        email: email || null,
        buyerName,
        paidAt: tx.paid_at || tx.paidAt || null,
        amount: paidAmount,
        currency: paidCurrency,
        catalog: {
          currency: "USD",
          amountCents: order.usdCents,
          amountMajor: order.usdMajor,
        },
        charge: {
          currency: paidCurrency,
          symbol: paymentCurrencySymbol(paidCurrency),
          amountSubunits: paidAmount,
          amountMajor: paidAmount / 100,
        },
        fx: {
          rate: meta.fx_rate ? Number(meta.fx_rate) : null,
          source: meta.fx_source || null,
        },
        products,
        product: products.length === 1 ? products[0] : null,
        download: products.length === 1 ? products[0].download : null,
        summary: {
          itemCount: products.length,
          instantCount: instant.length,
          manualCount: manual.length,
        },
      },
      req
    );
  } catch (err) {
    if (err.code === "CONFIG") {
      return sendJson(
        res,
        503,
        {
          ok: false,
          error:
            "Payments are not fully configured. Set PAYSTACK_SECRET_KEY in Vercel project environment variables.",
        },
        req
      );
    }
    console.error("verify-payment error:", err);
    return sendJson(
      res,
      502,
      { ok: false, error: err.message || "Could not verify payment" },
      req
    );
  }
};
