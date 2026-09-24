// ---------- Render product grid ----------
const productGrid = document.getElementById("productGrid");

function renderProductCard(p) {
  var inCart = window.FixkitCart && window.FixkitCart.has(p.id);
  return `
    <li class="product-card">
      <a class="product-card-link" href="product.html?id=${p.id}">
        <div class="product-thumb">
          ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
          ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" width="1200" height="900">` : p.icon}
        </div>
        <div class="product-card-body">
          <span class="cat-tag">${p.categoryLabel}</span>
          <div class="product-card-top"><h3>${p.name}</h3></div>
          <p class="product-desc">${p.tagline}</p>
        </div>
      </a>
      <div class="product-card-footer">
        <span class="price">${formatPrice(p.price)}</span>
        <div class="product-card-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-add="${p.id}">${inCart ? "In cart" : "Add to cart"}</button>
          <button type="button" class="btn btn-buy" data-buy="${p.id}">Buy now</button>
        </div>
      </div>
    </li>
  `;
}

function renderProducts(filter) {
  if (!productGrid) return;
  const limit = parseInt(productGrid.dataset.limit, 10);
  let items = filter === "all" || !filter ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  if (!Number.isNaN(limit)) {
    var featured = ["technical-audit", "speed-kit", "cro-toolkit", "autopilot-ecom", "growth-theme", "verified-list"];
    items = featured.map(getProductById).filter(Boolean).slice(0, limit);
  }
  productGrid.innerHTML = items.map(renderProductCard).join("");
}

function currentFilter() {
  const active = document.querySelector(".filter-chip.is-active");
  return active ? active.dataset.filter : "all";
}

renderProducts("all");

const ready = window.FIXKIT_CONFIG_READY;
if (ready && typeof ready.then === "function") {
  ready.then(() => renderProducts(currentFilter())).catch(() => {});
}

document.addEventListener("fixkit:cartchange", () => renderProducts(currentFilter()));

const filterBar = document.querySelector(".filter-bar");
if (filterBar) {
  filterBar.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    filterBar.querySelectorAll(".filter-chip").forEach(c => {
      c.classList.remove("is-active");
      c.setAttribute("aria-selected", "false");
    });
    chip.classList.add("is-active");
    chip.setAttribute("aria-selected", "true");
    renderProducts(chip.dataset.filter);
  });
}

if (productGrid) {
  productGrid.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      e.preventDefault();
      const product = getProductById(addBtn.dataset.add);
      if (product) addToCart(product);
      return;
    }
    const buyBtn = e.target.closest("[data-buy]");
    if (buyBtn) {
      e.preventDefault();
      const product = getProductById(buyBtn.dataset.buy);
      if (product) startCheckout(product);
    }
  });
}
