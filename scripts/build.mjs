import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function getVersion() {
  try {
    return git("describe", "--tags", "--always", "--long");
  } catch {
    return "development";
  }
}

if (git("status", "--porcelain")) {
  throw new Error("Build requires a clean Git working tree.");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

execFileSync("npx", ["tsc", "--project", "tsconfig.json"], {
  cwd: root,
  stdio: "inherit"
});

await cp(join(root, "public"), dist, { recursive: true });

const appPath = join(dist, "app.js");
const app = await readFile(appPath, "utf8");
await writeFile(appPath, app.replaceAll("__APP_VERSION__", getVersion()));

console.log(`Built ${getVersion()} to dist/`);
