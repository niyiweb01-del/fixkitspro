// Contact + newsletter forms → /api/contact (Vercel)
(function () {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  async function submitForm(form, payload, submitBtn) {
    const original = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Request failed");
      }
      form.reset();
      alert(data.message || "Thanks — we got it.");
    } catch (err) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    }
  }

  document.querySelectorAll("form[data-fixkit-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = form.getAttribute("data-fixkit-form") || "contact";
      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      const botField = String(fd.get("bot-field") || "");

      if (botField) return;

      if (!isValidEmail(email)) {
        alert("Please enter a valid email.");
        return;
      }

      const payload = {
        type,
        email,
        name: String(fd.get("name") || "").trim(),
        message: String(fd.get("message") || "").trim(),
        botField,
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      submitForm(form, payload, submitBtn);
    });
  });
})();
