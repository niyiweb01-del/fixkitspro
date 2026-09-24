// ---------- Cart (localStorage) ----------
// Must attach to window — top-level `const` is NOT available as window.FixkitCart.
var FIXKIT_CART_KEY = "fixkit_cart_v1";

window.FixkitCart = (function () {
  function read() {
    try {
      var raw = localStorage.getItem(FIXKIT_CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      var seen = {};
      var out = [];
      parsed.forEach(function (id) {
        var sid = String(id || "");
        if (!sid || seen[sid]) return;
        seen[sid] = true;
        out.push(sid);
      });
      return out;
    } catch (e) {
      return [];
    }
  }

  function write(ids) {
    var unique = [];
    var seen = {};
    (ids || []).forEach(function (id) {
      var sid = String(id || "");
      if (!sid || seen[sid]) return;
      seen[sid] = true;
      unique.push(sid);
    });
    try {
      localStorage.setItem(FIXKIT_CART_KEY, JSON.stringify(unique));
    } catch (e) {
      console.error("Fixkit cart could not save:", e);
    }
    try {
      document.dispatchEvent(
        new CustomEvent("fixkit:cartchange", { detail: { ids: unique } })
      );
    } catch (e) {
      /* IE / rare environments */
    }
    updateBadges();
    return unique;
  }

  function getIds() {
    return read();
  }

  function count() {
    return read().length;
  }

  function has(id) {
    return read().indexOf(String(id)) !== -1;
  }

  function add(id) {
    var ids = read();
    var sid = String(id);
    if (ids.indexOf(sid) === -1) ids.push(sid);
    return write(ids);
  }

  function remove(id) {
    var sid = String(id);
    return write(
      read().filter(function (x) {
        return x !== sid;
      })
    );
  }

  function clear() {
    return write([]);
  }

  function setAll(ids) {
    return write(ids);
  }

  function lineItems() {
    if (typeof getProductById !== "function") return [];
    return getIds()
      .map(function (id) {
        return getProductById(id);
      })
      .filter(Boolean);
  }

  function subtotal() {
    return lineItems().reduce(function (sum, p) {
      return sum + Number(p.price || 0);
    }, 0);
  }

  function updateBadges() {
    var n = count();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      if (n > 0) {
        el.hidden = false;
        el.removeAttribute("hidden");
        el.setAttribute("aria-hidden", "false");
      } else {
        el.hidden = true;
        el.setAttribute("hidden", "");
        el.setAttribute("aria-hidden", "true");
      }
    });
    document.querySelectorAll("[data-cart-link]").forEach(function (el) {
      el.setAttribute("aria-label", n ? "Cart, " + n + " items" : "Cart, empty");
    });
  }

  function showToast(message) {
    var toast = document.getElementById("fixkitToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "fixkitToast";
      toast.className = "fixkit-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function addProduct(product, opts) {
    opts = opts || {};
    if (!product || !product.id) return false;
    var existed = has(product.id);
    add(product.id);
    if (typeof opts.onAdded === "function") {
      opts.onAdded({ existed: existed });
    } else {
      showToast(
        existed
          ? '"' + product.name + '" is already in your cart'
          : 'Added "' + product.name + '" to cart'
      );
    }
    return true;
  }

  document.addEventListener("DOMContentLoaded", updateBadges);
  if (document.readyState !== "loading") updateBadges();
  else updateBadges();

  return {
    getIds: getIds,
    count: count,
    has: has,
    add: add,
    remove: remove,
    clear: clear,
    setAll: setAll,
    lineItems: lineItems,
    subtotal: subtotal,
    updateBadges: updateBadges,
    showToast: showToast,
    addProduct: addProduct,
  };
})();

// Back-compat alias for scripts that reference bare FixkitCart
var FixkitCart = window.FixkitCart;
