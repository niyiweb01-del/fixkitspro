// ---------- Render single product detail page ----------
const productDetail = document.getElementById("productDetail");

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderNotFound() {
  productDetail.innerHTML = `
    <div class="product-missing">
      <h1>We couldn't find that product</h1>
      <p>It may have been renamed or retired. Take a look at the full catalog instead.</p>
      <a class="btn btn-primary" href="products.html">Browse all products</a>
    </div>
  `;
  document.title = "Product not found — Fixkit";
}

function renderRelated(p) {
  const rel = PRODUCTS.filter(x => x.id !== p.id && x.category === p.category);
  const rest = PRODUCTS.filter(x => x.id !== p.id && x.category !== p.category);
  const items = rel.concat(rest).slice(0, 3);
  const holder = document.getElementById("relatedGrid");
  if (!holder) return;
  holder.innerHTML = items.map(x => `
    <li class="product-card">
      <a class="product-card-link" href="product.html?id=${x.id}">
        <div class="product-thumb">${x.badge ? `<span class="badge">${x.badge}</span>` : ""}${x.image ? `<img src="${x.image}" alt="${x.name}" loading="lazy" width="1200" height="900">` : x.icon}</div>
        <div class="product-card-body">
          <span class="cat-tag">${x.categoryLabel}</span>
          <div class="product-card-top"><h3>${x.name}</h3></div>
          <p class="product-desc">${x.tagline}</p>
        </div>
      </a>
      <div class="product-card-footer"><span class="price">${formatPrice(x.price)}</span><a class="btn btn-ghost btn-sm" href="product.html?id=${x.id}">View details</a></div>
    </li>`).join("");
}

function renderProduct(p) {
  document.title = `${p.name} — FIX KIT`;
  const inCart = window.FixkitCart && window.FixkitCart.has(p.id);
  const CHECK = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5l3.5 3.5 7.5-8"/></svg>`;

  productDetail.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="products.html">Products</a>
      <span aria-hidden="true">/</span>
      <span>${p.name}</span>
    </nav>

    <div class="product-detail-grid">
      <div class="product-detail-media">
        <div class="product-thumb product-thumb-lg">${p.image ? `<img src="${p.image}" alt="${p.name}" width="1200" height="900">` : p.icon}</div>
      </div>

      <div class="product-detail-copy">
        <span class="cat-tag">${p.categoryLabel}</span>
        <h1>${p.name} ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}</h1>
        <p class="product-detail-tagline">${p.tagline}</p>

        <div class="product-buybox">
          <span class="price price-lg">${formatPrice(p.price)}</span>
          <p class="buybox-note">${p.fulfillment === "manual"
            ? "One-time purchase. Delivered by email within 48 hours after payment."
            : "One-time purchase. Instant download after payment confirmation."}</p>
          <div class="buybox-actions">
            <button type="button" class="btn btn-primary btn-lg" id="buyNowBtn">Buy now</button>
            <button type="button" class="btn btn-ghost btn-lg" id="addCartBtn">${inCart ? "In cart" : "Add to cart"}</button>
          </div>
          <ul class="buybox-perks">
            <li>${CHECK}${p.fulfillment === "manual" ? "Delivered in 48 hours" : "Instant download"}</li>
            <li>${CHECK}Lifetime license</li>
            <li>${CHECK}Secure Paystack checkout</li>
            <li>${CHECK}Install support included</li>
          </ul>
        </div>

        <h2>What's included</h2>
        <ul class="feature-list">
          ${p.features.map(f => `<li>${f}</li>`).join("")}
        </ul>

        <h2>Details</h2>
        <p>${p.description}</p>
      </div>
    </div>
  `;

  document.getElementById("buyNowBtn").addEventListener("click", () => startCheckout(p));
  document.getElementById("addCartBtn").addEventListener("click", () => {
    addToCart(p);
    const btn = document.getElementById("addCartBtn");
    if (btn) btn.textContent = "In cart";
  });
  renderRelated(p);
}

const productId = getQueryParam("id");
const product = productId ? getProductById(productId) : null;

async function boot() {
  if (window.FIXKIT_CONFIG_READY) {
    try {
      await window.FIXKIT_CONFIG_READY;
    } catch (_) {}
  }
  if (product) {
    renderProduct(product);
  } else {
    renderNotFound();
  }
}

boot();
