// ---------- Public config ----------
// Defaults used until /api/config loads (or if it fails).
// On Vercel, set PAYSTACK_PUBLIC_KEY in project env — the storefront will pick it up.
window.FIXKIT_CONFIG = window.FIXKIT_CONFIG || {
  paystackPublicKey: "",
  currency: "USD",
  currencySymbol: "$",
  displayCurrency: "USD",
  displayCurrencySymbol: "$",
  paymentCurrency: "NGN",
  paymentCurrencySymbol: "₦",
  apiBase: "",
};

window.FIXKIT_CONFIG_READY = (async function loadFixkitConfig() {
  try {
    const base = (window.FIXKIT_CONFIG.apiBase || "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/config`, { credentials: "same-origin" });
    if (!res.ok) return window.FIXKIT_CONFIG;
    const data = await res.json();
    if (data && data.ok) {
      if (data.paystackPublicKey) {
        window.FIXKIT_CONFIG.paystackPublicKey = data.paystackPublicKey;
      }
      window.FIXKIT_CONFIG.currency = data.currency || data.displayCurrency || "USD";
      window.FIXKIT_CONFIG.currencySymbol =
        data.currencySymbol || data.displayCurrencySymbol || "$";
      window.FIXKIT_CONFIG.displayCurrency = data.displayCurrency || "USD";
      window.FIXKIT_CONFIG.displayCurrencySymbol =
        data.displayCurrencySymbol || "$";
      if (data.paymentCurrency) {
        window.FIXKIT_CONFIG.paymentCurrency = data.paymentCurrency;
      }
      if (data.paymentCurrencySymbol) {
        window.FIXKIT_CONFIG.paymentCurrencySymbol = data.paymentCurrencySymbol;
      }
    }
  } catch (_) {
    // Static preview without API — keep defaults.
  }
  return window.FIXKIT_CONFIG;
})();
