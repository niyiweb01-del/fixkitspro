/**
 * Rebuild product ZIPs from kit-source/<id>/ into private/downloads/.
 * Run: npm run build:kits
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "kit-source");
const outDir = path.join(root, "private", "downloads");

if (!fs.existsSync(srcRoot)) {
  console.error("Missing kit-source/ directory");
  process.exit(1);
}

const ids = fs
  .readdirSync(srcRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

fs.mkdirSync(outDir, { recursive: true });

for (const id of ids) {
  const src = path.join(srcRoot, id);
  const zip = path.join(outDir, `${id}.zip`);
  if (fs.existsSync(zip)) fs.unlinkSync(zip);

  if (process.platform === "win32") {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${src}\\*' -DestinationPath '${zip}' -Force"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`cd "${src}" && zip -r "${zip}" .`, { stdio: "inherit" });
  }
  console.log("Wrote", zip);
}
