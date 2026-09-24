/**
 * Ensures client catalog (js/products-data.js) matches server catalog (lib/catalog.js).
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { PRODUCTS: serverProducts } = require("../lib/catalog");

const clientPath = path.join(__dirname, "..", "js", "products-data.js");
const code = fs.readFileSync(clientPath, "utf8");
const sandbox = { window: { FIXKIT_CONFIG: {} }, console };
vm.createContext(sandbox);
vm.runInContext(code + "\nthis.PRODUCTS = PRODUCTS;", sandbox);
const clientProducts = sandbox.PRODUCTS;

let failed = false;

function fail(msg) {
  console.error("✗", msg);
  failed = true;
}

const clientIds = new Set(clientProducts.map((p) => p.id));
const serverIds = new Set(Object.keys(serverProducts));

for (const id of serverIds) {
  if (!clientIds.has(id)) fail(`Server product missing on client: ${id}`);
}
for (const id of clientIds) {
  if (!serverIds.has(id)) fail(`Client product missing on server: ${id}`);
}

for (const p of clientProducts) {
  const s = serverProducts[p.id];
  if (!s) continue;
  if (Number(p.price) !== Number(s.price)) {
    fail(`Price mismatch for ${p.id}: client=${p.price} server=${s.price}`);
  }
  if (p.name !== s.name) {
    fail(`Name mismatch for ${p.id}`);
  }
  const clientFulfillment = p.fulfillment || "instant";
  if (clientFulfillment !== s.fulfillment) {
    fail(
      `Fulfillment mismatch for ${p.id}: client=${clientFulfillment} server=${s.fulfillment}`
    );
  }
  if (s.fulfillment === "instant") {
    const zip = path.join(__dirname, "..", "private", "downloads", s.downloadFile);
    if (!fs.existsSync(zip)) {
      fail(`Missing download ZIP for ${p.id}: ${s.downloadFile}`);
    }
  }
}

if (failed) {
  console.error("\nCatalog sync check failed.");
  process.exit(1);
}

console.log(`Catalog OK — ${clientProducts.length} products in sync, download ZIPs present.`);
