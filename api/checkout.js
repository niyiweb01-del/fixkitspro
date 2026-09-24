const {
  buildOrderFromProductIds,
  isValidEmail,
  isValidBuyerName,
  normalizeEmail,
  getSiteUrl,
  PAYMENT_CURRENCY,
  paymentCurrencySymbol,
} = require("../lib/catalog");
const { convertUsdMajorToCharge } = require("../lib/fx");
const {
  sendJson,
  setCors,
  initializePaystackTransaction,
  createOrderReference,
} = require("../lib/paystack");

/**
 * POST /api/checkout
 * Body: { name, email, items: string[] }
 * Catalog totals are USD; Paystack is charged in PAYSTACK_CURRENCY at a live FX rate.
 */
module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" }, req);
  }

  try {
    const body =
      typeof req.body === "object" && req.body
        ? req.body
        : JSON.parse(req.body || "{}");

    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!isValidBuyerName(name)) {
      return sendJson(
        res,
        400,
        {
          ok: false,
          error: "Enter your full name (letters only, 2–80 characters).",
        },
        req
      );
    }

    if (!isValidEmail(email)) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Enter a valid email for receipts and downloads." },
        req
      );
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

    let fx;
    try {
      fx = await convertUsdMajorToCharge(order.usdMajor, chargeCurrency);
    } catch (err) {
      if (err.code === "FX") {
        return sendJson(res, 503, { ok: false, error: err.message }, req);
      }
      throw err;
    }

    const reference = createOrderReference();
    const productIds = order.items.map((i) => i.id);
    const siteUrl = getSiteUrl();
    const callbackUrl = `${siteUrl}/success.html`;

    const metadata = {
      buyer_name: name,
      buyer_email: email,
      product_ids: productIds.join(","),
      cart_count: String(productIds.length),
      catalog_currency: "USD",
      usd_cents: String(fx.usdCents),
      charge_amount: String(fx.chargeSubunits),
      charge_currency: fx.to,
      fx_rate: String(fx.rate),
      fx_source: fx.source,
      fx_fetched_at: fx.fetchedAt,
      custom_fields: [
        { display_name: "Buyer", variable_name: "buyer_name", value: name },
        {
          display_name: "Products",
          variable_name: "product_ids",
          value: productIds.join(","),
        },
        {
          display_name: "USD total",
          variable_name: "usd_total",
          value: `$${(fx.usdCents / 100).toFixed(2)}`,
        },
        {
          display_name: "FX rate",
          variable_name: "fx_rate",
          value: `1 USD = ${fx.rate} ${fx.to}`,
        },
      ],
    };

    const init = await initializePaystackTransaction({
      email,
      amount: fx.chargeSubunits,
      currency: fx.to,
      reference,
      callback_url: callbackUrl,
      metadata,
    });

    return sendJson(
      res,
      200,
      {
        ok: true,
        reference: init.reference || reference,
        access_code: init.access_code,
        authorization_url: init.authorization_url,
        email,
        name,
        catalog: {
          currency: "USD",
          amountCents: fx.usdCents,
          amountMajor: fx.usdCents / 100,
        },
        charge: {
          currency: fx.to,
          amountSubunits: fx.chargeSubunits,
          amountMajor: fx.chargeSubunits / 100,
          symbol: paymentCurrencySymbol(fx.to),
        },
        fx: {
          rate: fx.rate,
          source: fx.source,
          fetchedAt: fx.fetchedAt,
        },
        items: order.items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          fulfillment: i.fulfillment,
        })),
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
            "Paystack is not configured. In Vercel → Settings → Environment Variables, set PAYSTACK_SECRET_KEY to your test key (sk_test_…) or live key (sk_live_…), enable Production, then Redeploy.",
        },
        req
      );
    }
    console.error("checkout error:", err);
    return sendJson(
      res,
      502,
      { ok: false, error: err.message || "Could not start checkout" },
      req
    );
  }
};
