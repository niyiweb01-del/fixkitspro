const { PAYMENT_CURRENCY, paymentCurrencySymbol } = require("../lib/catalog");
const { sendJson, setCors } = require("../lib/paystack");

/**
 * Public runtime config for the storefront.
 * Display is always USD; Paystack charge currency comes from env.
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

  const paymentCurrency = (
    process.env.PAYSTACK_CURRENCY ||
    PAYMENT_CURRENCY ||
    "NGN"
  ).toUpperCase();

  return sendJson(
    res,
    200,
    {
      ok: true,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
      // True when server can initialize charges (test or live secret key)
      paymentsConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      // Storefront display (catalog)
      currency: "USD",
      currencySymbol: "$",
      displayCurrency: "USD",
      displayCurrencySymbol: "$",
      // Actual Paystack settlement currency (live FX from USD)
      paymentCurrency,
      paymentCurrencySymbol: paymentCurrencySymbol(paymentCurrency),
    },
    req
  );
};
