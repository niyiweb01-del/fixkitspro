(function () {
  var root = document.getElementById("cartRoot");
  if (!root) return;

  var cart = window.FixkitCart;
  if (!cart) {
    root.innerHTML =
      '<div class="cart-empty"><h1>Cart unavailable</h1><p>Please refresh the page. If this keeps happening, clear your browser cache.</p></div>';
    return;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    var items = cart.lineItems();

    if (!items.length) {
      root.innerHTML =
        '<div class="cart-empty">' +
        "<h1>Your cart is empty</h1>" +
        "<p>Browse the catalog and add the kits you need — you can check out multiple products in one payment.</p>" +
        '<a class="btn btn-primary" href="products.html">Browse products</a>' +
        "</div>";
      return;
    }

    var rows = items
      .map(function (p) {
        return (
          '<li class="cart-line" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="cart-line-main">' +
          '<a class="cart-line-title" href="product.html?id=' +
          escapeHtml(p.id) +
          '">' +
          escapeHtml(p.name) +
          "</a>" +
          '<span class="cat-tag">' +
          escapeHtml(p.categoryLabel) +
          "</span>" +
          "</div>" +
          '<div class="cart-line-side">' +
          '<span class="price">' +
          formatPrice(p.price) +
          "</span>" +
          '<button type="button" class="btn btn-ghost btn-sm" data-remove="' +
          escapeHtml(p.id) +
          '">Remove</button>' +
          "</div>" +
          "</li>"
        );
      })
      .join("");

    root.innerHTML =
      '<div class="cart-layout">' +
      '<div class="cart-list-wrap">' +
      "<h1>Cart (" +
      items.length +
      ")</h1>" +
      '<ul class="cart-list">' +
      rows +
      "</ul>" +
      "</div>" +
      '<aside class="cart-summary">' +
      "<h2>Order summary</h2>" +
      '<div class="cart-summary-row">' +
      "<span>Subtotal</span>" +
      '<strong class="price">' +
      formatPrice(cart.subtotal()) +
      "</strong>" +
      "</div>" +
      '<p class="cart-summary-note">One-time purchases. Instant downloads after payment (manual items delivered by email).</p>' +
      '<a class="btn btn-primary btn-lg cart-checkout-btn" href="checkout.html">Proceed to checkout</a>' +
      '<a class="btn btn-text" href="products.html">Continue shopping</a>' +
      "</aside>" +
      "</div>";
  }

  root.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-remove]") : null;
    if (!btn) return;
    cart.remove(btn.getAttribute("data-remove"));
    render();
  });

  document.addEventListener("fixkit:cartchange", render);

  function boot() {
    if (window.FIXKIT_CONFIG_READY && typeof window.FIXKIT_CONFIG_READY.then === "function") {
      window.FIXKIT_CONFIG_READY.then(render).catch(render);
    } else {
      render();
    }
  }

  boot();
})();
