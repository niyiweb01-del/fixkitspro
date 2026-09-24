// ---------- Category labels ----------
const CATEGORIES = [
  { id: "all", label: "All products" },
  { id: "audits", label: "Audits & fixes" },
  { id: "speed", label: "Speed" },
  { id: "growth", label: "Growth" },
  { id: "outreach", label: "Outreach & lists" }
];

// ---------- Product catalog ----------
// price is in USD (major units). Must match lib/catalog.js.
const PRODUCTS = [
  {
    id: "technical-audit",
    name: "Technical SEO Audit",
    icon: "🔍",
    image: "images/products/technical-audit.png",
    tagline: "Full-site crawl that flags broken links, indexing gaps, and structural issues, ranked by impact.",
    description: "We crawl every page of your store the way search engines and shoppers actually see it, then hand you a ranked fix list instead of a vague score. You'll know exactly which broken links, missing redirects, and indexing gaps are costing you traffic — and in what order to fix them. Most stores accumulate hundreds of small technical issues over time: orphaned pages, duplicate title tags, thin category pages, broken canonical tags, and redirect chains that quietly leak link equity. Instead of a 40-page PDF nobody reads, you get a prioritized action list sorted by estimated traffic impact and time-to-fix, so your first hour of work targets the highest-return issues. The audit covers crawlability, indexability, on-page structure, internal linking, structured data, and mobile rendering. Once you've worked through the list, we re-crawl the site and send a before/after comparison so you can see the issue count drop and confirm nothing new broke in the process. Delivered as a ZIP containing the full crawl export (CSV), the prioritized fix list (PDF and spreadsheet), and a short walkthrough video explaining how to read the report.",
    features: [
      "Full crawl of up to 500 pages",
      "Broken link and redirect report",
      "Indexing and sitemap gap analysis",
      "Ranked fix list with effort estimates",
      "Re-crawl after fixes to confirm results"
    ],
    category: "audits",
    categoryLabel: "Audits & fixes",
    price: 148.75,
    badge: "Bestseller",
    fulfillment: "instant"
  },
  {
    id: "speed-kit",
    name: "Core Web Vitals Speed Kit",
    icon: "⚡",
    image: "images/products/speed-kit.png",
    tagline: "Image, script, and caching fixes tuned for storefront and checkout load time.",
    description: "A drop-in set of scripts and configs that target the pages that matter most to revenue — your homepage, collection pages, and checkout. Built to cut LCP and CLS on image-heavy storefronts without a theme rebuild. The kit ships as ready-to-install snippets: a lazy-loading and responsive-image config, a script-deferral list for common third-party tags (analytics, chat widgets, review apps), and a caching profile tuned for storefront traffic patterns. Rather than a generic performance checklist, every recommendation is scoped to the pages your visitors actually convert on, so effort goes where it moves revenue instead of chasing a perfect Lighthouse score on pages nobody lands on. You'll get a written before/after Core Web Vitals report (LCP, CLS, INP) captured on real device profiles, plus platform-specific install notes for Shopify, WooCommerce, and BigCommerce. No ongoing subscription or monitoring dashboard — it's a one-time setup you keep and re-run whenever you add a new app or theme update.",
    features: [
      "Lazy-load and image compression config",
      "Script deferral and third-party audit",
      "Checkout-first performance tuning",
      "Before / after Core Web Vitals report",
      "Works with Shopify, WooCommerce, and BigCommerce"
    ],
    category: "speed",
    categoryLabel: "Speed",
    price: 128.4,
    badge: "Popular",
    fulfillment: "instant"
  },
  {
    id: "cro-toolkit",
    name: "Conversion Rate Toolkit",
    icon: "📈",
    image: "images/products/cro-toolkit.png",
    tagline: "Cart-recovery flows, trust signals, and A/B test scaffolding for your existing checkout.",
    description: "Plug cart-recovery, trust signals, and simple experiment scaffolding into the checkout you already have — no platform migration required. Designed for stores that want to move conversion rate without rebuilding funnels from scratch. The toolkit includes a ready-to-configure abandoned cart recovery flow (three-touch email sequence plus optional SMS trigger points), a placement guide for trust signals that shows exactly where badges, guarantees, and reviews earn the most trust per pixel of checkout real estate, and a lightweight A/B test scaffold you can drop into your existing checkout template to test headline, button, and layout variants without a full experimentation platform. A conversion benchmark report is included so you can see how your current funnel compares to category norms before you start changing anything. Ninety days of email support are included for questions on setup, interpreting test results, or adapting the flows to your specific cart platform.",
    features: [
      "Abandoned cart recovery flow",
      "Trust signal placement guide",
      "A/B test scaffolding for your checkout",
      "Conversion benchmark report",
      "90 days of email support"
    ],
    category: "growth",
    categoryLabel: "Growth",
    price: 347.2,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "outreach-system",
    name: "Backlink Outreach System",
    icon: "🔗",
    image: "images/products/outreach-system.png",
    tagline: "Prospect list templates, outreach sequences, and tracking sheet for manual link building.",
    description: "Everything a small team needs to run its own backlink outreach without hiring an agency: prospect list templates, tested outreach sequences, and a tracking sheet that keeps replies from falling through the cracks. The system covers the full loop from prospecting to follow-up: templates for building a niche-specific prospect list, five outreach email sequences tested across different pitch angles (resource mentions, broken-link replacement, guest post, data citation, and partnership asks), and a reply-tracking spreadsheet with status columns so nothing slips through when you're running dozens of conversations at once. A follow-up cadence playbook tells you when and how many times to re-touch a non-responder without coming across as spammy, and a compliance checklist keeps your outreach aligned with anti-spam best practices and major email providers' sending guidelines. Built for teams doing manual, relationship-based link building rather than bulk automated blasts.",
    features: [
      "Prospect list templates by niche",
      "5 tested outreach email sequences",
      "Reply tracking spreadsheet",
      "Follow-up cadence playbook",
      "Outreach compliance checklist"
    ],
    category: "outreach",
    categoryLabel: "Outreach & lists",
    price: 196.85,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "sitemap-manager",
    name: "Sitemap & Indexing Manager",
    icon: "🗺️",
    image: "images/products/sitemap-manager.png",
    tagline: "Auto-generates and resubmits your sitemap whenever products or pages change.",
    description: "Set it up once and stop thinking about sitemaps. It watches your catalog for changes, regenerates your sitemap automatically, and resubmits it to search engines so new products get indexed faster. Stores that add, retire, or reorganize products frequently often end up with stale sitemaps that either miss new pages or still list ones that are gone — both of which slow down indexing and waste crawl budget. This tool hooks into your catalog's change events, rebuilds the XML sitemap the moment something changes, and pings search engines automatically instead of waiting for their next scheduled crawl. You'll get indexing status alerts when pages fail to get picked up so you can investigate before it becomes a traffic problem. It's designed to sit alongside whatever SEO plugin or app you already use rather than replace it, and it's a one-time setup with no recurring subscription or dashboard login required.",
    features: [
      "Automatic sitemap regeneration",
      "Auto resubmission on change",
      "Indexing status alerts",
      "Works alongside existing SEO plugins",
      "One-time setup, no subscription"
    ],
    category: "audits",
    categoryLabel: "Audits & fixes",
    price: 76.9,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "growth-theme",
    name: "Storefront Growth Theme",
    icon: "🎨",
    image: "images/products/growth-theme.png",
    tagline: "A performance-first theme built around Core Web Vitals, with conversion patterns pre-wired.",
    description: "A full storefront theme designed from the ground up for speed and conversion, not just looks. Core Web Vitals targets are baked into the layout, and common conversion patterns — sticky add-to-cart, trust badges, urgency messaging — are already wired in. Most themes are built for visual polish first and speed second, which means every image gallery, carousel, and font gets added on top of an already-heavy base. This theme flips that order: the layout, image handling, and script loading were built around passing Core Web Vitals thresholds on a typical product catalog, and conversion elements were added afterward without breaking that budget. The result is a theme that looks like a modern storefront but loads like a stripped-down one. It's fully mobile-first and responsive, ships with sticky add-to-cart, trust badges, and urgency messaging pre-wired into the product template, and includes free install support so you're not left debugging a theme migration on your own.",
    features: [
      "Performance-first theme build",
      "Pre-wired conversion patterns",
      "Mobile-first responsive layout",
      "Core Web Vitals targets met out of the box",
      "Free install support"
    ],
    category: "speed",
    categoryLabel: "Speed",
    price: 246.3,
    badge: "New",
    fulfillment: "instant"
  },
  {
    id: "email-capture",
    name: "Email Capture & Automation Kit",
    icon: "✉️",
    image: "images/products/email-capture.png",
    tagline: "On-site capture forms wired to abandoned-cart and win-back email sequences.",
    description: "Capture more emails on-site and put them to work immediately. This kit wires your forms straight into abandoned-cart and win-back sequences so new subscribers start hearing from you the same day. Most stores lose the moment a visitor was willing to hand over their email because the form sits disconnected from anything that actually follows up. This kit closes that gap: on-site capture form templates (exit-intent, footer, and post-purchase variants) feed directly into an abandoned-cart sequence for shoppers who leave items behind and a separate win-back sequence for customers who've gone quiet. Both sequences are pre-written and timed, so you're editing copy rather than starting from a blank page. It's built to connect with the email platforms most stores already run, and a setup guide walks through the integration step-by-step so you can have capture-to-send working the same afternoon you install it.",
    features: [
      "On-site capture form templates",
      "Abandoned cart email sequence",
      "Win-back sequence for lapsed customers",
      "Works with major email platforms",
      "Setup guide included"
    ],
    category: "growth",
    categoryLabel: "Growth",
    price: 158.15,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "trust-suite",
    name: "Trust & Security Badge Suite",
    icon: "🛡️",
    image: "images/products/trust-suite.png",
    tagline: "Checkout trust badges and SSL status indicators that render without slowing the page.",
    description: "Trust badges and SSL indicators that are built to be lightweight — they render instantly instead of dragging down your checkout page speed like most third-party badge widgets. Trust signals reliably lift checkout conversion, but the widgets that deliver them are often the worst offenders for third-party script bloat, pulling in tracking pixels and external fonts you never asked for. This suite is built the opposite way: badges and SSL status indicators are shipped as static, self-hosted assets with zero third-party script weight, so they add trust without adding load time. Placement is fully customizable, so you can position badges near the buy button, in the footer, or throughout the checkout flow based on what your own testing shows works best, and the set is built to drop into any checkout regardless of platform.",
    features: [
      "Lightweight trust badge set",
      "SSL status indicator",
      "Zero third-party script weight",
      "Customizable placement",
      "Works on any checkout"
    ],
    category: "growth",
    categoryLabel: "Growth",
    price: 88.45,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "verified-list",
    name: "Verified B2B Email List (1,000)",
    icon: "📇",
    image: "images/products/verified-list.png",
    tagline: "Hand-checked contacts in your target industry, delivered as a clean CSV.",
    description: "A hand-checked list of 1,000 B2B contacts in your target industry, delivered as a clean CSV ready to import. Every contact is manually verified before delivery, so you're not paying for bounces. Unlike scraped lists sold in bulk, every contact on this list is checked by hand for a valid, currently-active email address before it ships, and lists are built around the industry and role targeting you specify rather than pulled from a generic database. The CSV arrives ready to import into whatever CRM or email platform you use, with columns for name, role, company, industry, and verified email. Delivery lands within 48 hours of order, built to a target of under 5% bounces.",
    features: [
      "1,000 hand-verified contacts",
      "Delivered as clean CSV",
      "Industry and role targeting",
      "Under 5% bounce rate target",
      "Delivered within 48 hours"
    ],
    category: "outreach",
    categoryLabel: "Outreach & lists",
    price: 102.5,
    badge: "Hot",
    fulfillment: "manual"
  },
  {
    id: "site-health-snapshot",
    name: "Store Health Snapshot",
    image: "images/products/site-health-snapshot.png",
    icon: "🩺",
    tagline: "A fast, low-cost check of your store's biggest SEO and speed red flags.",
    description: "A quick look at what a full audit finds: we scan your storefront for the handful of issues that hurt traffic and sales the most — broken pages, missing meta tags, slow-loading images, and indexing blockers — and send back a one-page snapshot ranking what to fix first. It's not the full audit, but it's enough to show you whether something is actually wrong and worth digging into further.",
    features: [
      "One-page issue snapshot",
      "Checks top SEO and speed red flags",
      "Delivered in minutes",
      "Easy first step before a full audit",
      "No subscription, no upsell calls"
    ],
    category: "audits",
    categoryLabel: "Audits & fixes",
    price: 27.4,
    badge: "Quick check",
    fulfillment: "instant"
  },
  {
    id: "sge-verification",
    name: "SGE File Verification",
    image: "images/products/sge-verification.png",
    icon: "🧭",
    tagline: "Checks whether your store's content and markup are structured for AI-generated search results.",
    description: "Google's Search Generative Experience pulls answers straight from structured, well-sourced pages — and stores that aren't formatted for it simply don't get pulled in, no matter how good the copy is. This check reviews your schema markup, content structure, and source signals against what AI Overviews and generative search actually look for, then flags the gaps that are most likely keeping your pages out of those results. You'll get a plain-language report covering structured data coverage, heading and answer-block structure, author and source signals, and content freshness, plus a prioritized list of fixes ranked by how much they're likely to help. Delivered as a PDF report with a companion checklist you can hand straight to a developer.",
    features: [
      "Structured data (schema) coverage check",
      "Content and answer-block structure review",
      "Source and authorship signal audit",
      "Prioritized fix list for AI search visibility",
      "Plain-language PDF report"
    ],
    category: "audits",
    categoryLabel: "Audits & fixes",
    price: 91.25,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "html-tag-verification",
    name: "HTML Tag Verification",
    image: "images/products/html-tag-verification.png",
    icon: "🏷️",
    tagline: "Checks every page's meta, canonical, Open Graph, and structured-data tags for errors.",
    description: "Wrong or missing tags are one of the most common — and most invisible — reasons pages underperform: a duplicated title tag, a canonical pointing at the wrong URL, or a broken Open Graph image can quietly cost you clicks and shares without ever throwing an error your team notices. This tool crawls every page and checks title tags, meta descriptions, canonical tags, Open Graph and Twitter card tags, hreflang, and structured data for missing, duplicate, or malformed values. You'll get a page-by-page report listing every tag issue found, sorted by severity, along with the corrected tag you can paste straight in. No guesswork, no manually opening view-source on hundreds of pages.",
    features: [
      "Full-site tag crawl (title, meta, canonical)",
      "Open Graph and Twitter card validation",
      "Duplicate and missing tag detection",
      "Corrected tag suggestions per page",
      "Page-by-page severity report"
    ],
    category: "audits",
    categoryLabel: "Audits & fixes",
    price: 79.87,
    badge: null,
    fulfillment: "instant"
  },
  {
    id: "autopilot-ecom",
    name: "AutoPilot Ecom",
    image: "images/products/autopilot-ecom.png",
    icon: "🚀",
    tagline: "An always-on system that finds the right audience for your store and sells to them automatically.",
    description: "AutoPilot Ecom is a done-for-you automation engine built to handle the two hardest parts of running a store on your own: finding people who actually want what you sell, and turning that attention into sales without you manually running campaigns every day. Once it's set up, it continuously analyzes your product catalog, past customers, and traffic data to build and refine audience targeting profiles — the specific interests, behaviors, and lookalike segments most likely to convert for your niche — and keeps adjusting them as results come in, instead of relying on a targeting guess you set once and forget. From there, it handles the selling side end-to-end: audience-matched ad creative and copy variants, automated bid and budget pacing across your ad platforms, on-site personalization that adapts offers and product recommendations to each visitor segment, and abandoned-visit retargeting sequences that bring window-shoppers back with the right message instead of a generic discount blast. Everything routes through a single dashboard showing which audiences and offers are actually driving revenue, so you can see what's working without digging through five different ad accounts. It's built for store owners who want the targeting-and-selling loop running in the background while they focus on the business, not for teams that want to hand-tune every campaign themselves. Setup includes a guided onboarding call to connect your ad accounts, catalog, and analytics, plus 90 days of email support while the system learns your audience.",
    features: [
      "Automated audience discovery and targeting",
      "Self-optimizing ad creative and budget pacing",
      "On-site personalization by visitor segment",
      "Abandoned-visit retargeting sequences",
      "Guided setup + 90 days of support"
    ],
    category: "growth",
    categoryLabel: "Growth",
    price: 512.6,
    badge: "Premium",
    fulfillment: "instant"
  }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

function formatPrice(amount) {
  const cfg = window.FIXKIT_CONFIG || {};
  const symbol = cfg.displayCurrencySymbol || cfg.currencySymbol || "$";
  const n = Number(amount);
  if (Number.isNaN(n)) return symbol + "—";
  return (
    symbol +
    n.toLocaleString("en-US", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}
