const { sendJson, setCors } = require("../lib/paystack");
const { isValidEmail, isValidBuyerName, normalizeEmail } = require("../lib/catalog");

async function maybeSendEmail({ subject, text, replyTo }) {
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Fixkit <onboarding@resend.dev>";

  if (!resendKey || !to) {
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      reply_to: replyTo || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", body);
    const err = new Error("Failed to send email");
    err.code = "EMAIL";
    throw err;
  }

  return { sent: true };
}

module.exports = async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" }, req);
  }

  try {
    const body =
      typeof req.body === "object" && req.body
        ? req.body
        : JSON.parse(req.body || "{}");

    if (body.botField || body["bot-field"]) {
      return sendJson(res, 200, { ok: true }, req);
    }

    const type = String(body.type || "contact").toLowerCase();
    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const message = String(body.message || "").trim();

    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: "Valid email is required" }, req);
    }

    if (type === "newsletter") {
      console.log(JSON.stringify({ type: "newsletter", email }));
      const mail = await maybeSendEmail({
        subject: `Fixkit newsletter signup: ${email}`,
        text: `New newsletter signup:\n${email}`,
        replyTo: email,
      });
      return sendJson(
        res,
        200,
        { ok: true, message: "You're on the list.", emailed: mail.sent },
        req
      );
    }

    if (!isValidBuyerName(name) && name.length < 2) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Name and message are required" },
        req
      );
    }

    if (!name || !message) {
      return sendJson(
        res,
        400,
        { ok: false, error: "Name and message are required" },
        req
      );
    }

    if (message.length > 5000 || name.length > 80) {
      return sendJson(res, 400, { ok: false, error: "Message is too long" }, req);
    }

    console.log(
      JSON.stringify({
        type: "contact",
        name,
        email,
        message: message.slice(0, 2000),
      })
    );

    const mail = await maybeSendEmail({
      subject: `Fixkit contact from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      replyTo: email,
    });

    return sendJson(
      res,
      200,
      {
        ok: true,
        message: "Message received. We'll get back to you soon.",
        emailed: mail.sent,
      },
      req
    );
  } catch (err) {
    console.error("contact error:", err);
    if (err.code === "EMAIL") {
      return sendJson(
        res,
        502,
        {
          ok: false,
          error: "Could not deliver your message. Try again or email us directly.",
        },
        req
      );
    }
    return sendJson(res, 500, { ok: false, error: "Something went wrong" }, req);
  }
};
