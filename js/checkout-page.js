(function () {
  var root = document.getElementById("checkoutRoot");
  if (!root) return;

  var cart = window.FixkitCart;
  if (!cart) {
    root.innerHTML =
      '<div class="cart-empty"><h1>Checkout unavailable</h1><p>Please refresh the page. If this keeps happening, clear your browser cache.</p><a class="btn btn-primary" href="products.html">Browse products</a></div>';
    return;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderEmpty() {
    root.innerHTML =
      '<div class="cart-empty">' +
      "<h1>Nothing to check out</h1>" +
      "<p>Add at least one product to your cart before paying.</p>" +
      '<a class="btn btn-primary" href="products.html">Browse products</a>' +
      "</div>";
  }

  function render() {
    var items = cart.lineItems();
    if (!items.length) {
      renderEmpty();
      return;
    }

    var lines = items
      .map(function (p) {
        return (
          '<li class="checkout-line">' +
          "<span>" +
          escapeHtml(p.name) +
          "</span>" +
          '<span class="price">' +
          formatPrice(p.price) +
          "</span>" +
          "</li>"
        );
      })
      .join("");

    var savedName = "";
    var savedEmail = "";
    try {
      savedName = sessionStorage.getItem("fixkit_buyer_name") || "";
      savedEmail = sessionStorage.getItem("fixkit_email") || "";
    } catch (e) {}

    root.innerHTML =
      '<div class="checkout-layout">' +
      '<div class="checkout-form-panel">' +
      '<p class="checkout-eyebrow">🔒 Secure checkout</p>' +
      "<h1>Complete your order</h1>" +
      '<p class="checkout-lede">Enter your details below. Prices are shown in USD — Paystack will charge the live equivalent in your local currency.</p>' +
      '<form id="checkoutBuyerForm" class="checkout-buyer-form" novalidate>' +
      '<label for="buyerName">Full name</label>' +
      '<input id="buyerName" name="name" type="text" autocomplete="name" maxlength="80" required value="' +
      escapeHtml(savedName) +
      '" placeholder="Ada Okonkwo">' +
      '<label for="buyerEmail">Email</label>' +
      '<input id="buyerEmail" name="email" type="email" autocomplete="email" required value="' +
      escapeHtml(savedEmail) +
      '" placeholder="you@store.com">' +
      '<p class="field-hint">Your receipt and download access are sent to this address.</p>' +
      '<p class="field-error" id="checkoutError" hidden></p>' +
      '<button type="submit" class="btn btn-primary btn-lg" id="payBtn">Pay ' +
      formatPrice(cart.subtotal()) +
      "</button>" +
      '<a class="btn btn-text" href="cart.html">Back to cart</a>' +
      '<div class="checkout-trust-grid" aria-label="Purchase protections">' +
      '<div class="trust-badge">' +
      '<span class="trust-badge-icon">🔒</span>' +
      '<div><strong>Encrypted checkout</strong><span>256-bit SSL. Card details go straight to Paystack and never touch our servers.</span></div>' +
      "</div>" +
      '<div class="trust-badge">' +
      '<span class="trust-badge-icon">🛡️</span>' +
      '<div><strong>PCI-DSS compliant</strong><span>Payments are processed by Paystack, a PCI-DSS Level 1 certified provider.</span></div>' +
      "</div>" +
      '<div class="trust-badge">' +
      '<span class="trust-badge-icon">⚡</span>' +
      '<div><strong>Instant delivery</strong><span>Your files and receipt land in your inbox the moment payment clears.</span></div>' +
      "</div>" +
      "</div>" +
      "</form>" +
      "</div>" +
      '<aside class="checkout-summary">' +
      "<h2>Your order</h2>" +
      '<ul class="checkout-lines">' +
      lines +
      "</ul>" +
      '<div class="cart-summary-row checkout-total">' +
      "<span>Total</span>" +
      '<strong class="price">' +
      formatPrice(cart.subtotal()) +
      "</strong>" +
      "</div>" +
      '<p class="cart-summary-note">🔒 Secured by Paystack</p>' +
      '<ul class="checkout-pay-methods" aria-label="Accepted payment methods">' +
      '<li class="pay-chip pay-visa">Visa</li><li class="pay-chip pay-mastercard">Mastercard</li><li class="pay-chip pay-verve">Verve</li><li class="pay-chip">Bank transfer</li><li class="pay-chip">USSD</li>' +
      "</ul>" +
      '<p class="checkout-support">Questions before you pay? <a href="mailto:support@fixkit.com">support@fixkit.com</a></p>' +
      '<div class="checkout-legal-note">' +
      '<a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a>' +
      '<span aria-hidden="true"> · </span>' +
      '<a href="terms.html" target="_blank" rel="noopener">Terms of service</a>' +
      "</div>" +
      "</aside>" +
      "</div>";

    var form = document.getElementById("checkoutBuyerForm");
    var errorEl = document.getElementById("checkoutError");
    var payBtn = document.getElementById("payBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      errorEl.textContent = "";

      var name = document.getElementById("buyerName").value.trim();
      var email = document.getElementById("buyerEmail").value.trim();

      if (!isValidBuyerName(name)) {
        errorEl.textContent = "Enter your full name (letters, 2–80 characters).";
        errorEl.hidden = false;
        return;
      }
      if (!isValidEmail(email)) {
        errorEl.textContent = "Enter a valid email address.";
        errorEl.hidden = false;
        return;
      }

      startCartCheckout({
        name: name,
        email: email,
        items: cart.getIds(),
        button: payBtn,
        onError: function (msg) {
          errorEl.textContent = msg;
          errorEl.hidden = false;
        },
      });
    });
  }

  async function boot() {
    if (window.FIXKIT_CONFIG_READY && typeof window.FIXKIT_CONFIG_READY.then === "function") {
      try {
        await window.FIXKIT_CONFIG_READY;
      } catch (e) {}
    }
    render();
  }

  boot();
})();
