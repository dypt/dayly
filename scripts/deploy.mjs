import { cp, readdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const pagesWorktree = resolve(root, "../dayly-gh-pages");

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

const version = git("describe", "--tags", "--always", "--long");
const worktreeRoot = git("-C", pagesWorktree, "rev-parse", "--show-toplevel");
const branch = git("-C", pagesWorktree, "branch", "--show-current");

if (resolve(worktreeRoot) !== pagesWorktree) {
  throw new Error(`Expected ${pagesWorktree} to be a Git worktree.`);
}

if (branch !== "gh-pages") {
  throw new Error(`Expected ${pagesWorktree} to be on gh-pages, found ${branch || "detached HEAD"}.`);
}

await rm(dist, { recursive: true, force: true });
run("npm", ["run", "build"]);

for (const entry of await readdir(pagesWorktree)) {
  if (entry !== ".git") {
    await rm(join(pagesWorktree, entry), { recursive: true, force: true });
  }
}

await cp(dist, pagesWorktree, { recursive: true });
run("git", ["-C", pagesWorktree, "add", "--all"]);
run("git", ["-C", pagesWorktree, "commit", "-m", version]);

console.log(`Committed ${version} to the local gh-pages worktree.`);
