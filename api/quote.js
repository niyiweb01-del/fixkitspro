const {
  buildOrderFromProductIds,
  PAYMENT_CURRENCY,
  paymentCurrencySymbol,
} = require("../lib/catalog");
const { convertUsdMajorToCharge } = require("../lib/fx");
const { sendJson, setCors } = require("../lib/paystack");

/**
 * GET /api/quote?items=id1,id2
 * Returns USD cart total + live converted Paystack charge estimate.
 */
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
    const raw = String((req.query && req.query.items) || "").trim();
    const items = raw
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    if (!items.length) {
      return sendJson(res, 400, { ok: false, error: "No items provided" }, req);
    }

    let order;
    try {
      order = buildOrderFromProductIds(items);
    } catch (err) {
      if (err.code === "CART") {
        return sendJson(res, 400, { ok: false, error: err.message }, req);
      }
      throw err;
    }

    const chargeCurrency = (
      process.env.PAYSTACK_CURRENCY || PAYMENT_CURRENCY || "NGN"
    ).toUpperCase();

    const fx = await convertUsdMajorToCharge(order.usdMajor, chargeCurrency);

    return sendJson(
      res,
      200,
      {
        ok: true,
        catalog: {
          currency: "USD",
          symbol: "$",
          amountCents: fx.usdCents,
          amountMajor: fx.usdCents / 100,
        },
        charge: {
          currency: fx.to,
          symbol: paymentCurrencySymbol(fx.to),
          amountSubunits: fx.chargeSubunits,
          amountMajor: fx.chargeSubunits / 100,
        },
        fx: {
          rate: fx.rate,
          source: fx.source,
          fetchedAt: fx.fetchedAt,
          note:
            fx.to === "USD"
              ? "Charged in USD"
              : `Live rate: 1 USD = ${fx.rate} ${fx.to}`,
        },
        items: order.items.map((i) => ({
          id: i.id,
          name: i.name,
          priceUsd: i.price,
        })),
      },
      req
    );
  } catch (err) {
    if (err.code === "FX") {
      return sendJson(res, 503, { ok: false, error: err.message }, req);
    }
    console.error("quote error:", err);
    return sendJson(
      res,
      502,
      { ok: false, error: err.message || "Could not fetch quote" },
      req
    );
  }
};
