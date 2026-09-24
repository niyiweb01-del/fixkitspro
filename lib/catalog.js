/**
 * Server-side product catalog.
 * All `price` values are USD (major units). Keep in sync with js/products-data.js
 */

const PRODUCTS = {
  "technical-audit": {
    id: "technical-audit",
    name: "Technical SEO Audit",
    price: 148.75,
    fulfillment: "instant",
    downloadFile: "technical-audit.zip",
  },
  "speed-kit": {
    id: "speed-kit",
    name: "Core Web Vitals Speed Kit",
    price: 128.4,
    fulfillment: "instant",
    downloadFile: "speed-kit.zip",
  },
  "cro-toolkit": {
    id: "cro-toolkit",
    name: "Conversion Rate Toolkit",
    price: 347.2,
    fulfillment: "instant",
    downloadFile: "cro-toolkit.zip",
  },
  "outreach-system": {
    id: "outreach-system",
    name: "Backlink Outreach System",
    price: 196.85,
    fulfillment: "instant",
    downloadFile: "outreach-system.zip",
  },
  "sitemap-manager": {
    id: "sitemap-manager",
    name: "Sitemap & Indexing Manager",
    price: 76.9,
    fulfillment: "instant",
    downloadFile: "sitemap-manager.zip",
  },
  "growth-theme": {
    id: "growth-theme",
    name: "Storefront Growth Theme",
    price: 246.3,
    fulfillment: "instant",
    downloadFile: "growth-theme.zip",
  },
  "email-capture": {
    id: "email-capture",
    name: "Email Capture & Automation Kit",
    price: 158.15,
    fulfillment: "instant",
    downloadFile: "email-capture.zip",
  },
  "trust-suite": {
    id: "trust-suite",
    name: "Trust & Security Badge Suite",
    price: 88.45,
    fulfillment: "instant",
    downloadFile: "trust-suite.zip",
  },
  "verified-list": {
    id: "verified-list",
    name: "Verified B2B Email List (1,000)",
    price: 102.5,
    fulfillment: "manual",
    downloadFile: null,
    note: "Delivered as a CSV within 48 hours to your purchase email.",
  },
  "site-health-snapshot": {
    id: "site-health-snapshot",
    name: "Store Health Snapshot",
    price: 27.4,
    fulfillment: "instant",
    downloadFile: "site-health-snapshot.zip",
  },
  "sge-verification": {
    id: "sge-verification",
    name: "SGE File Verification",
    price: 91.25,
    fulfillment: "instant",
    downloadFile: "sge-verification.zip",
  },
  "html-tag-verification": {
    id: "html-tag-verification",
    name: "HTML Tag Verification",
    price: 79.87,
    fulfillment: "instant",
    downloadFile: "html-tag-verification.zip",
  },
  "autopilot-ecom": {
    id: "autopilot-ecom",
    name: "AutoPilot Ecom",
    price: 512.6,
    fulfillment: "instant",
    downloadFile: "autopilot-ecom.zip",
  },
};

/** Catalog / display currency (always USD). */
const CATALOG_CURRENCY = "USD";

/** Currency sent to Paystack (converted from USD via live FX when different). */
const PAYMENT_CURRENCY = (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase();

const MAX_CART_ITEMS = 20;

function getProduct(id) {
  if (!id) return null;
  return PRODUCTS[String(id)] || null;
}

/** USD cents for a catalog product */
function usdCentsForProduct(product) {
  return Math.round(Number(product.price) * 100);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function isValidBuyerName(name) {
  const n = String(name || "").trim();
  return n.length >= 2 && n.length <= 80 && /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]*$/.test(n);
}

function extractProductIds(metadata) {
  if (!metadata || typeof metadata !== "object") return [];

  if (Array.isArray(metadata.product_ids)) {
    return [...new Set(metadata.product_ids.map(String).filter(Boolean))];
  }

  if (typeof metadata.product_ids === "string" && metadata.product_ids.trim()) {
    return [
      ...new Set(
        metadata.product_ids
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ];
  }

  if (metadata.product_id) {
    return [String(metadata.product_id)];
  }

  const fields = metadata.custom_fields;
  if (Array.isArray(fields)) {
    const idsField = fields.find(
      (f) => f && (f.variable_name === "product_ids" || f.variable_name === "product_id")
    );
    if (idsField && idsField.value) {
      return [
        ...new Set(
          String(idsField.value)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        ),
      ];
    }
  }

  return [];
}

function extractProductId(metadata) {
  const ids = extractProductIds(metadata);
  return ids[0] || null;
}

/**
 * Build a validated USD order from product ids (server catalog prices only).
 */
function buildOrderFromProductIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    const err = new Error("Cart is empty");
    err.code = "CART";
    throw err;
  }

  const unique = [...new Set(productIds.map(String))];
  if (unique.length > MAX_CART_ITEMS) {
    const err = new Error(`Cart cannot exceed ${MAX_CART_ITEMS} products`);
    err.code = "CART";
    throw err;
  }

  const items = [];
  let usdCents = 0;

  for (const id of unique) {
    const product = getProduct(id);
    if (!product) {
      const err = new Error(`Unknown product: ${id}`);
      err.code = "CART";
      throw err;
    }
    const lineCents = usdCentsForProduct(product);
    usdCents += lineCents;
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      usdCents: lineCents,
      fulfillment: product.fulfillment,
      downloadFile: product.downloadFile,
      note: product.note || null,
    });
  }

  if (usdCents < 100) {
    const err = new Error("Order total is too small");
    err.code = "CART";
    throw err;
  }

  return {
    items,
    usdCents,
    usdMajor: usdCents / 100,
    catalogCurrency: CATALOG_CURRENCY,
  };
}

function getSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

function paymentCurrencySymbol(code) {
  const c = String(code || "").toUpperCase();
  if (c === "USD") return "$";
  if (c === "NGN") return "₦";
  if (c === "GHS") return "GH₵";
  if (c === "ZAR") return "R";
  if (c === "KES") return "KSh";
  return c + " ";
}

/** @deprecated alias — catalog prices are USD cents */
function amountInSubunits(product) {
  return usdCentsForProduct(product);
}

module.exports = {
  PRODUCTS,
  CATALOG_CURRENCY,
  PAYMENT_CURRENCY,
  /** @deprecated use PAYMENT_CURRENCY */
  CURRENCY: PAYMENT_CURRENCY,
  MAX_CART_ITEMS,
  getProduct,
  usdCentsForProduct,
  amountInSubunits,
  normalizeEmail,
  isValidEmail,
  isValidBuyerName,
  extractProductIds,
  extractProductId,
  buildOrderFromProductIds,
  getSiteUrl,
  paymentCurrencySymbol,
};
