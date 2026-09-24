(function () {
  const root = document.getElementById("successRoot");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const reference =
    params.get("reference") ||
    params.get("trxref") ||
    sessionStorage.getItem("fixkit_last_reference");

  function apiBase() {
    const cfg = window.FIXKIT_CONFIG || {};
    return (cfg.apiBase || "").replace(/\/$/, "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setState(html) {
    root.innerHTML = html;
  }

  function renderLoading() {
    setState(`
      <div class="success-card success-loading">
        <div class="success-spinner" aria-hidden="true"></div>
        <h1>Confirming your payment…</h1>
        <p>Hang tight while we verify the transaction with Paystack.</p>
      </div>
    `);
  }

  function renderError(message) {
    setState(`
      <div class="success-card success-error">
        <h1>We couldn't confirm that payment</h1>
        <p>${escapeHtml(message)}</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="products.html">Back to products</a>
          <a class="btn btn-ghost" href="index.html#contact">Contact support</a>
        </div>
      </div>
    `);
  }

  function renderMissingRef() {
    setState(`
      <div class="success-card success-error">
        <h1>No payment reference found</h1>
        <p>Open this page from a completed checkout, or browse the catalog to buy a product.</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="products.html">Browse products</a>
          <a class="btn btn-ghost" href="cart.html">View cart</a>
        </div>
      </div>
    `);
  }

  function formatMoney(amountSubunits, currency, symbolHint) {
    const major = (Number(amountSubunits) || 0) / 100;
    const code = String(currency || "").toUpperCase();
    let symbol = symbolHint || "";
    if (!symbol) {
      if (code === "USD") symbol = "$";
      else if (code === "NGN") symbol = "₦";
      else symbol = code ? code + " " : "";
    }
    return (
      escapeHtml(symbol) +
      major.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function safeDownloadHref(url) {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("/api/download?")) return url;
    try {
      const u = new URL(url, window.location.origin);
      if (u.origin === window.location.origin && u.pathname === "/api/download") {
        return u.pathname + u.search;
      }
    } catch (_) {}
    return null;
  }

  function renderSuccess(data) {
    if (
      sessionStorage.getItem("fixkit_pending_clear_cart") === "1" &&
      window.FixkitCart
    ) {
      window.FixkitCart.clear();
      sessionStorage.removeItem("fixkit_pending_clear_cart");
    }
    sessionStorage.removeItem("fixkit_last_reference");

    const products = Array.isArray(data.products)
      ? data.products
      : data.product
        ? [data.product]
        : [];

    const downloadRows = products
      .map((p) => {
        const href = p.download ? safeDownloadHref(p.download.url) : null;
        if (href) {
          return `
            <li class="success-download-item">
              <div>
                <strong>${escapeHtml(p.name)}</strong>
                <span class="cat-tag">Instant download</span>
              </div>
              <a class="btn btn-primary btn-sm" href="${escapeHtml(href)}">Download</a>
            </li>`;
        }
        if (p.fulfillment === "manual") {
          return `
            <li class="success-download-item">
              <div>
                <strong>${escapeHtml(p.name)}</strong>
                <p class="success-manual-note">${escapeHtml(
                  p.note ||
                    "Manual delivery — we'll email this to you within 48 hours."
                )}</p>
              </div>
            </li>`;
        }
        return `
          <li class="success-download-item">
            <div><strong>${escapeHtml(p.name)}</strong></div>
          </li>`;
      })
      .join("");

    const title =
      products.length > 1
        ? `${products.length} products purchased`
        : products[0]
          ? products[0].name
          : "Your purchase";

    const emailBit = data.email
      ? ` — receipt and downloads are tied to <strong>${escapeHtml(data.email)}</strong>`
      : "";

    const nameBit = data.buyerName
      ? `Thanks, ${escapeHtml(data.buyerName)}`
      : "Thanks";

    const catalogUsd =
      data.catalog && data.catalog.amountMajor != null
        ? formatPrice(data.catalog.amountMajor)
        : null;
    const charged = formatMoney(
      data.amount,
      data.currency,
      data.charge && data.charge.symbol
    );

    setState(`
      <div class="success-card success-ok">
        <p class="success-kicker">Payment successful</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="success-lede">${nameBit}${emailBit}. Reference <code>${escapeHtml(
          data.reference
        )}</code>.</p>
        <dl class="success-meta">
          <div><dt>Catalog (USD)</dt><dd>${catalogUsd || "—"}</dd></div>
          <div><dt>Charged</dt><dd>${charged}</dd></div>
          <div><dt>Items</dt><dd>${products.length}</dd></div>
          <div><dt>Reference</dt><dd><code>${escapeHtml(data.reference)}</code></dd></div>
        </dl>
        <div class="success-download">
          <h2>Your products</h2>
          <ul class="success-download-list">${downloadRows}</ul>
          <p class="cart-summary-note">Save this page or your email. Downloads require the same payment email.</p>
        </div>
        <div class="success-actions">
          <a class="btn btn-ghost" href="products.html">Browse more products</a>
          <a class="btn btn-text" href="index.html#contact">Need help?</a>
        </div>
      </div>
    `);
  }

  async function verify() {
    if (!reference) {
      renderMissingRef();
      return;
    }

    if (window.FIXKIT_CONFIG_READY) {
      try {
        await window.FIXKIT_CONFIG_READY;
      } catch (_) {}
    }

    renderLoading();

    try {
      const url = `${apiBase()}/api/verify-payment?reference=${encodeURIComponent(
        reference
      )}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        renderError(
          data.error ||
            "Verification failed. If you were charged, contact support with your reference."
        );
        return;
      }

      renderSuccess(data);
    } catch (err) {
      renderError(
        "Could not reach the payment verification service. Deploy to Vercel (or run `npx vercel dev` locally) so /api routes are available."
      );
    }
  }

  verify();
})();
