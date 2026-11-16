import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const input = args.find((a) => !a.startsWith("--"));

const sh = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const run = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit" });
const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const pkgPath = join(root, "package.json");
const current = JSON.parse(readFileSync(pkgPath, "utf8")).version;

function nextVersion(spec) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (spec === "patch") return `${major}.${minor}.${patch + 1}`;
  if (spec === "minor") return `${major}.${minor + 1}.0`;
  if (spec === "major") return `${major + 1}.0.0`;
  if (/^\d+\.\d+\.\d+$/.test(spec ?? "")) return spec;
  fail("Usage: npm run release -- <patch | minor | major | x.y.z> [--dry-run]");
}

const version = nextVersion(input);
const tag = `v${version}`;
console.log(`Tally ${current} → ${version}${dryRun ? " (dry run)" : ""}`);

if (!dryRun) {
  if (sh("git branch --show-current") !== "main") fail("Switch to the main branch first.");
  if (sh("git status --porcelain")) fail("Commit or discard your changes first.");
  if (sh(`git tag --list ${tag}`)) fail(`Tag ${tag} already exists.`);
}

function edit(rel, transform) {
  const path = join(root, rel);
  const before = readFileSync(path, "utf8");
  const after = transform(before);
  if (after === before) fail(`Version not found in ${rel}.`);
  if (!dryRun) writeFileSync(path, after);
  console.log(`  ${rel}`);
}

const setJsonVersion = (text) => text.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`);

edit("package.json", setJsonVersion);
edit("package-lock.json", (text) => {
  const lock = JSON.parse(text);
  lock.version = version;
  lock.packages[""].version = version;
  return JSON.stringify(lock, null, 2) + "\n";
});
edit("src-tauri/tauri.conf.json", setJsonVersion);
edit("src-tauri/Cargo.toml", (text) => text.replace(/^version = "[^"]+"/m, `version = "${version}"`));
edit("src-tauri/Cargo.lock", (text) =>
  text.replace(/(name = "subscription-monitor"\nversion = ")[^"]+(")/, `$1${version}$2`),
);

const landing = join(root, "..", "subscription-landing", "react-app", "src", "release.js");
const landingRel = "../subscription-landing/react-app/src/release.js";
if (existsSync(landing)) {
  const text = readFileSync(landing, "utf8");
  const updated = text.replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${version}'`);
  if (!dryRun) writeFileSync(landing, updated);
  console.log(`  ${landingRel} (website download links)`);
}

if (dryRun) {
  console.log("\nDry run: nothing was written, committed or pushed.");
  process.exit(0);
}

console.log("\nChecking types and tests…");
run("npm run typecheck");
run("npm test");

run(`git commit -am "Release ${tag}"`);
run(`git tag ${tag}`);
run(`git push origin main ${tag}`);

console.log(`
✓ ${tag} is pushed. GitHub Actions is building macOS, Windows and Linux:
  https://github.com/ssaddist/sub-tracker/actions

When the builds finish, publish the draft:
  https://github.com/ssaddist/sub-tracker/releases
${existsSync(landing) ? `
The website now links to ${tag}. Push it after publishing the release:
  cd ../subscription-landing && git commit -am "Download links for ${tag}" && git push
` : ""}`);
