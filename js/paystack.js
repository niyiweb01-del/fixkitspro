// ---------- Paystack checkout (server-initialized, cart-aware) ----------

function getPaystackConfig() {
  var cfg = window.FIXKIT_CONFIG || {};
  return {
    publicKey: cfg.paystackPublicKey || "",
    currency: cfg.currency || "NGN",
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidBuyerName(name) {
  var n = String(name || "").trim();
  // Avoid \\p{L} unicode property escapes — they break older browsers / some engines.
  return n.length >= 2 && n.length <= 80 && /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]*$/.test(n);
}

function apiBase() {
  var cfg = window.FIXKIT_CONFIG || {};
  return (cfg.apiBase || "").replace(/\/$/, "");
}

function getCartApi() {
  return window.FixkitCart || null;
}

/**
 * Starts payment for a list of product ids via server-side Paystack initialize.
 */
async function startCartCheckout(opts) {
  opts = opts || {};

  if (window.FIXKIT_CONFIG_READY) {
    try {
      await window.FIXKIT_CONFIG_READY;
    } catch (e) {
      /* defaults */
    }
  }

  var name = String(opts.name || "").trim();
  var email = String(opts.email || "").trim().toLowerCase();
  var items = Array.isArray(opts.items) ? opts.items : [];

  if (!isValidBuyerName(name)) {
    var msgName = "Enter your full name (2–80 characters).";
    if (typeof opts.onError === "function") opts.onError(msgName);
    else alert(msgName);
    return;
  }

  if (!isValidEmail(email)) {
    var msgEmail = "Enter a valid email for your receipt and downloads.";
    if (typeof opts.onError === "function") opts.onError(msgEmail);
    else alert(msgEmail);
    return;
  }

  if (!items.length) {
    var msgCart = "Your cart is empty.";
    if (typeof opts.onError === "function") opts.onError(msgCart);
    else alert(msgCart);
    return;
  }

  // Payment uses server-side Paystack initialize (SECRET key).
  // Public key is optional for this hosted-checkout flow.

  var btn = opts.button;
  var originalLabel = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Starting secure checkout…";
  }

  try {
    try {
      sessionStorage.setItem("fixkit_buyer_name", name);
      sessionStorage.setItem("fixkit_email", email);
    } catch (e) {
      /* private mode */
    }

    var res = await fetch(apiBase() + "/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, items: items }),
    });
    var data = await res.json().catch(function () {
      return {};
    });

    if (!res.ok || !data.ok || !data.authorization_url) {
      throw new Error(data.error || "Could not start payment");
    }

    try {
      sessionStorage.setItem("fixkit_last_reference", data.reference);
      sessionStorage.setItem("fixkit_pending_clear_cart", "1");
    } catch (e) {
      /* ignore */
    }

    window.location.href = data.authorization_url;
  } catch (err) {
    var msg = (err && err.message) || "Checkout failed. Please try again.";
    if (typeof opts.onError === "function") opts.onError(msg);
    else alert(msg);
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }
}

/** Buy now → add to cart and open checkout */
function startCheckout(product) {
  if (!product || !product.id) return;
  var cart = getCartApi();
  if (cart) cart.add(product.id);
  window.location.href = "checkout.html";
}

/** Add product to cart + toast */
function addToCart(product, opts) {
  var cart = getCartApi();
  if (!cart) {
    alert("Cart failed to load. Please refresh the page.");
    return;
  }
  cart.addProduct(product, opts);
}
