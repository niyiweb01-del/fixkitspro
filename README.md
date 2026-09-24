# FIX KIT

Production digital storefront for one-time e-commerce tooling kits — **Paystack** payments, multi-item cart, and secure downloads on **Vercel**.

## Features

- Product catalog + detail pages
- **Cart** — add multiple products, review on `cart.html`
- **Checkout** — requires buyer **name** + **email**, then Paystack hosted payment
- Server-side payment initialize (`/api/checkout`) — amount is never trusted from the browser
- Verification + multi-file downloads (`/api/verify-payment`, `/api/download`)
- Download tokens bound to payment reference + product + buyer email
- Contact / newsletter via `/api/contact`
- Privacy + Terms pages

## Purchase flow

1. Add products to cart (or **Buy now** → cart + checkout).
2. On `checkout.html`, enter full name and email.
3. Server creates a Paystack transaction with the catalog total.
4. Customer pays on Paystack; returns to `success.html?reference=…`.
5. Success page verifies payment and shows a download button per instant product.
6. Manual products (e.g. verified list) show fulfillment messaging.

## Deploy (GitHub → Vercel)

1. Push the `fixkit` folder as its own GitHub repo.
2. Vercel → Import → Framework **Other**.
3. Set env vars from [`.env.example`](.env.example) — at minimum:
   - `PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `PAYSTACK_CURRENCY=NGN`
   - `SITE_URL=https://your-domain.com`
   - `DOWNLOAD_SECRET` (recommended)
4. Deploy. Public key is served by `/api/config`.
5. Paystack webhook: `https://YOUR_DOMAIN/api/paystack-webhook`

### Local

```bash
npm install
npx vercel dev
```

## Security notes

- Order totals are calculated from `lib/catalog.js` on the server (USD).
- Paystack charge amounts are locked with live FX at initialize time.
- Downloads require a valid HMAC token and matching Paystack customer email.
- `private/downloads`, `kit-source`, and `lib` are not publicly exposed.
- Security headers set in `vercel.json`.

## Kit files

```bash
npm run build:kits
npm run check:catalog
```

Keep `js/products-data.js` and `lib/catalog.js` prices/ids in sync.

## Currency & live FX

- Catalog prices are **USD** (`$`) on the storefront.
- Paystack charges in `PAYSTACK_CURRENCY` (default **NGN**).
- At checkout the server fetches a live **USD → charge currency** rate, locks the converted amount in Paystack metadata, and verifies that exact amount after payment (FX is not re-fetched on verify).
- Checkout shows a live estimate via `/api/quote` before payment.

## Deploy on Netlify (alternative to Vercel)

`netlify.toml` + `netlify/functions/api.js` run the same `/api/*` handlers on Netlify.
Set env vars in Netlify → Site configuration → Environment variables, then **Deploys → Trigger deploy → Clear cache and deploy site**
(env vars only apply to NEW deploys). Required: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_CURRENCY`,
`SITE_URL` (e.g. `https://fixkits.netlify.app`), `DOWNLOAD_SECRET`. Test: open `/api/config` — it should return JSON with `"ok":true`.
