#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";

const ROOT = dirname(dirname(new URL(import.meta.url).pathname));

function fail(message) { throw new Error(`source-offer verification failed: ${message}`); }
function required(value, name) { if (!value) fail(`missing ${name}`); return value; }
function command(command, args, cwd) { return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function sha256File(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function sha256Text(text) { return createHash("sha256").update(text).digest("hex"); }
function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key?.startsWith("--")) fail("arguments must use --name value pairs");
    args[key.slice(2)] = argv[index + 1];
  }
  return args;
}
function normalizeRemote(value) { return value.replace(/\.git$/, "").replace(/\/$/, ""); }
function git(cwd, ...args) { return command("git", args, cwd); }
function assertEqual(actual, expected, label) { if (actual !== expected) fail(`${label} mismatch`); }
function rejectGitlinks(cwd, label) {
  if (git(cwd, "ls-files", "--stage").split("\n").some((line) => line.startsWith("160000 "))) {
    fail(`${label} contains a submodule`);
  }
}

function walk(root, current = "") {
  const absolute = join(root, current);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const path = current ? `${current}/${entry.name}` : entry.name;
    const stat = lstatSync(join(root, path));
    if (stat.isDirectory()) return walk(root, path);
    if (stat.isFile()) return [{ path, type: "file", mode: stat.mode & 0o777, sha256: sha256File(join(root, path)) }];
    if (stat.isSymbolicLink()) return [{ path, type: "symlink", mode: stat.mode & 0o777, target: readlinkSync(join(root, path)) }];
    fail(`unsupported filesystem entry ${path}`);
  }).sort((a, b) => a.path.localeCompare(b.path));
}

function copyTree(source, destination) {
  for (const entry of walk(source)) {
    const target = join(destination, entry.path);
    mkdirSync(dirname(target), { recursive: true });
    if (entry.type === "file") {
      cpSync(join(source, entry.path), target, { preserveTimestamps: false });
      // cp preserves permission bits, which are part of the build context contract.
    } else {
      symlinkSync(entry.target, target);
    }
  }
}

function verifyAllowedGitEntries(sourceDir, commit, entries) {
  const actual = new Map(git(sourceDir, "ls-tree", "-r", commit).split("\n").filter(Boolean).map((line) => {
    const match = /^(\d+) (\w+) ([0-9a-f]{40})\t(.+)$/.exec(line);
    if (!match) fail(`cannot parse public tree entry ${line}`);
    return [match[4], { mode: match[1], type: match[2], object: match[3] }];
  }));
  for (const entry of entries) {
    const found = actual.get(entry.path);
    if (!found || found.mode !== entry.mode || found.type !== entry.type || found.object !== entry.object) {
      fail(`allowlisted public tree entry mismatch at ${entry.path}`);
    }
  }
}

function verifyTree(expected, actual, allowedAdditionalEntries) {
  const expectedEntries = new Map(walk(expected).map((entry) => [entry.path, entry]));
  const actualEntries = walk(actual);
  const allowed = new Map(allowedAdditionalEntries.map((entry) => [entry.path, entry]));
  for (const entry of actualEntries) {
    const wanted = expectedEntries.get(entry.path);
    if (!wanted) {
      const allowedEntry = allowed.get(entry.path);
      if (!allowedEntry || entry.type !== (allowedEntry.mode === "120000" ? "symlink" : "file")) fail(`unexpected path ${entry.path}`);
      continue;
    }
    if (JSON.stringify(entry) !== JSON.stringify(wanted)) fail(`tree drift at ${entry.path}`);
    expectedEntries.delete(entry.path);
  }
  if (expectedEntries.size) fail(`missing path ${[...expectedEntries.keys()][0]}`);
  return actualEntries;
}

function dockerIgnoreMatcher(root) {
  const ignore = join(root, ".dockerignore");
  if (!existsSync(ignore)) return () => true;
  const patterns = readFileSync(ignore, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  return (path) => {
    if (path === "Dockerfile" || path === ".dockerignore") return true;
    let included = true;
    for (let raw of patterns) {
      const negate = raw.startsWith("!");
      if (negate) raw = raw.slice(1);
      raw = raw.replace(/^\/+|\/+$/g, "");
      const expression = raw.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
      const expressionWithAncestors = raw.includes("/") ? expression : `(?:.*/)?${expression}`;
      if (new RegExp(`^${expressionWithAncestors}(?:/.*)?$`).test(path)) included = negate;
    }
    return included;
  };
}

function buildContextIdentity(root, entries) {
  const includes = dockerIgnoreMatcher(root);
  const included = entries.filter((entry) => includes(entry.path));
  const canonical = included.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
  return { algorithm: "sha256-docker-context-filesystem-manifest-v1", sha256: sha256Text(canonical), entries: included.length };
}

function sourceTreeIdentity(entries) {
  const canonical = entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
  return { algorithm: "sha256-canonical-filesystem-manifest-v1", sha256: sha256Text(canonical), entries: entries.length };
}

function assertArchiveMatches(archive, sourceDir, offer) {
  const extracted = mkdtempSync(join(tmpdir(), "tokencraft-source-offer-archive-"));
  try {
    command("tar", ["-xf", archive, "-C", extracted]);
    const rootPrefix = `${basename(offer.repository)}-${offer.tag}`;
    const topLevel = readdirSync(extracted, { withFileTypes: true });
    if (topLevel.length !== 1 || !topLevel[0].isDirectory() || topLevel[0].name !== rootPrefix) {
      fail("public archive must have exactly the expected single root prefix");
    }
    const expected = JSON.stringify(walk(sourceDir));
    const actual = JSON.stringify(walk(join(extracted, rootPrefix)));
    if (actual !== expected) fail("public archive manifest/content does not match public source tree");
  } finally { rmSync(extracted, { recursive: true, force: true }); }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = required(args["source-dir"], "--source-dir");
  const upstreamDir = required(args["upstream-dir"], "--upstream-dir");
  const lockPath = args.lock ?? join(ROOT, "third_party/new-api/UPSTREAM.lock.json");
  const patchPath = args.patch ?? join(ROOT, "third_party/new-api/patches/0001-persist-tc-request-id.patch");
  const archive = required(args.archive, "--archive");
  const receipt = required(args.receipt, "--receipt");
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const offer = required(lock.publicSourceOffer, "publicSourceOffer lock record");
  const allowedEntries = required(offer.allowedAdditionalEntries, "publicSourceOffer.allowedAdditionalEntries");

  assertEqual(normalizeRemote(git(sourceDir, "remote", "get-url", "origin")), normalizeRemote(offer.repository), "public origin");
  if (!args["fixture-skip-remote-ref"]) {
    const remoteTag = command("git", ["ls-remote", offer.repository, `refs/tags/${offer.tag}`]);
    const [remoteObject, remoteRef] = remoteTag.split(/\s+/);
    assertEqual(remoteRef, `refs/tags/${offer.tag}`, "public remote tag ref");
    assertEqual(remoteObject, offer.tagObject, "public remote tag object");
  }
  assertEqual(git(sourceDir, "cat-file", "-t", offer.tagObject), "tag", "public annotated tag object type");
  assertEqual(git(sourceDir, "rev-parse", `refs/tags/${offer.tag}`), offer.tagObject, "public tag object");
  assertEqual(git(sourceDir, "rev-parse", `${offer.tagObject}^{}`), offer.commit, "public peeled commit");
  assertEqual(git(sourceDir, "rev-parse", "HEAD"), offer.commit, "public checked-out commit");
  assertEqual(git(sourceDir, "rev-parse", `${offer.commit}^`), offer.parent, "public source parent");
  if (git(sourceDir, "status", "--porcelain", "--untracked-files=all")) fail("public source checkout is dirty");
  rejectGitlinks(sourceDir, "public source tree");
  assertEqual(sha256File(archive), offer.archiveSha256, "public archive SHA-256");
  assertArchiveMatches(archive, sourceDir, offer);
  verifyAllowedGitEntries(sourceDir, offer.commit, allowedEntries);

  assertEqual(git(upstreamDir, "rev-parse", "HEAD"), lock.upstream.commit, "upstream commit");
  if (git(upstreamDir, "status", "--porcelain", "--untracked-files=all")) fail("upstream checkout is dirty");
  rejectGitlinks(upstreamDir, "upstream tree");
  assertEqual(sha256File(patchPath), lock.patch.sha256, "canonical patch SHA-256");
  const expected = mkdtempSync(join(tmpdir(), "tokencraft-source-offer-expected-"));
  try {
    copyTree(upstreamDir, expected);
    git(expected, "apply", "--check", patchPath);
    git(expected, "apply", patchPath);
    const entries = verifyTree(expected, sourceDir, allowedEntries);
    const receiptValue = {
      version: 1,
      verification: "public-source-offer",
      upstream: { repository: lock.upstream.repository, tag: lock.upstream.tag, tagObject: lock.upstream.tagObject, commit: lock.upstream.commit },
      canonicalPatch: { sha256: lock.patch.sha256 },
      publicSource: { repository: offer.repository, tag: offer.tag, tagObject: offer.tagObject, commit: offer.commit, parent: offer.parent, archiveSha256: offer.archiveSha256 },
      gitTree: { commit: offer.commit, object: git(sourceDir, "rev-parse", `${offer.commit}^{tree}`) },
      expectedSourceTree: sourceTreeIdentity(walk(expected)),
      buildContext: buildContextIdentity(sourceDir, entries),
      identitiesNotVerifiedHere: ["docker-config-image-id", "oci-manifest-digest"],
    };
    mkdirSync(dirname(receipt), { recursive: true });
    writeFileSync(receipt, `${JSON.stringify(receiptValue, null, 2)}\n`, { mode: 0o600 });
  } finally { rmSync(expected, { recursive: true, force: true }); }
}

try { main(); } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }
