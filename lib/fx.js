/**
 * Live USD → payment-currency exchange rates.
 * Primary: open.er-api.com | Fallback: exchangerate-api.com
 * Optional: EXCHANGE_RATE_API_KEY for https://v6.exchangerate-api.com
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = { at: 0, rates: null, source: null };

function isProduction() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

async function fetchJson(url, headers) {
  const res = await fetch(url, {
    headers: headers || { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`FX HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function loadUsdRates() {
  const now = Date.now();
  if (cache.rates && now - cache.at < CACHE_TTL_MS) {
    return cache;
  }

  const attempts = [];

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey) {
    attempts.push(async () => {
      const data = await fetchJson(
        `https://v6.exchangerate-api.com/v6/${encodeURIComponent(apiKey)}/latest/USD`
      );
      if (data.result !== "success" || !data.conversion_rates) {
        throw new Error(data["error-type"] || "exchangerate-api key source failed");
      }
      return { rates: data.conversion_rates, source: "exchangerate-api.com/v6" };
    });
  }

  attempts.push(async () => {
    const data = await fetchJson("https://open.er-api.com/v6/latest/USD");
    if (data.result !== "success" || !data.rates) {
      throw new Error("open.er-api.com failed");
    }
    return { rates: data.rates, source: "open.er-api.com" };
  });

  attempts.push(async () => {
    const data = await fetchJson("https://api.exchangerate-api.com/v4/latest/USD");
    if (!data.rates) throw new Error("exchangerate-api.com/v4 failed");
    return { rates: data.rates, source: "exchangerate-api.com/v4" };
  });

  let lastError;
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (!result.rates || typeof result.rates.USD !== "number") {
        throw new Error("Invalid FX payload");
      }
      cache = { at: Date.now(), rates: result.rates, source: result.source };
      return cache;
    } catch (err) {
      lastError = err;
      console.error("FX source error:", err.message || err);
    }
  }

  const err = new Error(
    lastError?.message ||
      "Could not fetch a live exchange rate. Please try again in a moment."
  );
  err.code = "FX";
  throw err;
}

/**
 * Convert a USD major-unit amount into Paystack charge subunits for `toCurrency`.
 * Paystack uses 2 decimal places for NGN (kobo) and USD (cents).
 */
async function convertUsdMajorToCharge(usdMajor, toCurrency) {
  const usd = Number(usdMajor);
  if (!Number.isFinite(usd) || usd <= 0) {
    const err = new Error("Invalid USD amount for conversion");
    err.code = "FX";
    throw err;
  }

  const to = String(toCurrency || "NGN").toUpperCase();
  const usdCents = Math.round(usd * 100);

  if (to === "USD") {
    return {
      from: "USD",
      to: "USD",
      usdMajor: usd,
      usdCents,
      rate: 1,
      chargeMajor: usd,
      chargeSubunits: usdCents,
      source: "identity",
      fetchedAt: new Date().toISOString(),
    };
  }

  const { rates, source } = await loadUsdRates();
  const rate = Number(rates[to]);
  if (!Number.isFinite(rate) || rate <= 0) {
    const err = new Error(`Live rate unavailable for USD → ${to}`);
    err.code = "FX";
    throw err;
  }

  const chargeMajor = usd * rate;
  const chargeSubunits = Math.round(chargeMajor * 100);

  // Paystack NGN minimum is typically ₦100.00 (10000 kobo)
  if (to === "NGN" && chargeSubunits < 10000) {
    const err = new Error(
      "Converted amount is below Paystack’s minimum charge. Add another product or contact support."
    );
    err.code = "FX";
    throw err;
  }

  if (chargeSubunits < 100) {
    const err = new Error("Converted payment amount is too small");
    err.code = "FX";
    throw err;
  }

  return {
    from: "USD",
    to,
    usdMajor: usd,
    usdCents,
    rate,
    chargeMajor,
    chargeSubunits,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  loadUsdRates,
  convertUsdMajorToCharge,
  isProduction,
};
