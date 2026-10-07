// src/update-errors.ts
var messages = {
  "INVALID_VERSION": [
    "\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u63D2\u4EF6\u7248\u672C\u3002",
    "Could not read the current plugin version."
  ],
  "AUTO_UPDATE_UNAVAILABLE": [
    "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u624B\u5DE5\u66F4\u65B0\u547D\u4EE4\u3002",
    "Automatic updates are unavailable. Use the manual update command."
  ],
  "UPDATE_TIMEOUT": [
    "\u66F4\u65B0\u8D85\u65F6\uFF0C\u5DF2\u8BF7\u6C42\u53D6\u6D88\uFF1B\u8FDB\u7A0B\u7ED3\u675F\u524D\u4E0D\u80FD\u518D\u6B21\u5B89\u88C5\u3002",
    "The update timed out and cancellation was requested. Wait for the process to exit before retrying."
  ],
  "UNTRUSTED_REQUEST": [
    "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u66F4\u65B0\u8BF7\u6C42\u3002",
    "The update request was rejected because it is not from the same local origin."
  ],
  "UPDATE_IN_PROGRESS": [
    "\u5F53\u524D\u63D2\u4EF6\u6B63\u5728\u66F4\u65B0\uFF0C\u8BF7\u7A0D\u5019\u3002",
    "The plugin is being updated. Please wait."
  ],
  "NOT_PUBLISHED": [
    "\u63D2\u4EF6\u5C1A\u672A\u53D1\u5E03\u5230 npm\u3002",
    "The plugin has not been published to npm yet."
  ],
  "REGISTRY_UNAVAILABLE": [
    "\u6682\u65F6\u65E0\u6CD5\u83B7\u53D6\u6700\u65B0\u7248\u672C\u3002",
    "Could not retrieve the latest version. Please try again later."
  ],
  "UPDATE_FAILED": [
    "\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u670D\u52A1\u7AEF\u65E5\u5FD7\u3002",
    "The update failed. Check the server logs."
  ]
};
function updateErrorMessage(code, language) {
  const key = typeof code === "string" && Object.hasOwn(messages, code) ? code : "UPDATE_FAILED";
  return messages[key][/^zh(?:-|$)/i.test(language) ? 0 : 1];
}
var UpdateFailure = class extends Error {
  constructor(code, detail) {
    super(detail ?? updateErrorMessage(code, "zh"));
    this.code = code;
  }
};
function updateErrorPayload(code) {
  return { code, error: updateErrorMessage(code, "zh") };
}

// src/plugin-updater.ts
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
var PLUGIN_UPDATE_HEADER = "x-michengai-plugin-update";
function header(request, name2) {
  const value = request.headers?.[name2];
  return Array.isArray(value) ? value[0] : value;
}
function isLoopbackAddress(value) {
  const address = value?.toLowerCase().replace(/^\[|\]$/g, "");
  return address === "localhost" || address === "localhost." || address === "::1" || address?.startsWith("127.") === true || address?.startsWith("::ffff:127.") === true;
}
function isTrustedUpdateRequest(request) {
  if (header(request, PLUGIN_UPDATE_HEADER) !== "1") return false;
  if (!isLoopbackAddress(request.socket?.remoteAddress)) return false;
  const site = header(request, "sec-fetch-site");
  if (site !== void 0 && site !== "same-origin") return false;
  const host = header(request, "host");
  if (host === void 0 || host === "") return false;
  const origin = header(request, "origin");
  if (origin === void 0 || origin === "") {
    try {
      return isLoopbackAddress(new URL(`http://${host}`).hostname);
    } catch {
      return false;
    }
  }
  try {
    const url = new URL(origin);
    return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackAddress(url.hostname) && url.host === host;
  } catch {
    return false;
  }
}
function validProfileName(value) {
  return typeof value === "string" && value !== "" && value !== "." && value !== ".." && !value.includes("/") && !value.includes("\\") && !/[\0-\x1f\x7f]/.test(value);
}
function profileNameFromArgv(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--profile") return argv[index + 1];
    if (argv[index]?.startsWith("--profile="))
      return argv[index].slice("--profile=".length);
  }
  return argv[2] === "web" ? "web" : void 0;
}
function isDshCliEntry(entry, manifest, packageRoot2) {
  if (typeof manifest !== "object" || manifest === null) return false;
  const value = manifest;
  if (value.name !== "@deepseek-ai/dsh") return false;
  const bin = typeof value.bin === "string" ? value.bin : typeof value.bin === "object" && value.bin !== null ? value.bin.dsh : void 0;
  return typeof bin === "string" && bin !== "" && !isAbsolute(bin) && resolve(packageRoot2, bin) === resolve(entry);
}
function cliEntry(argv = process.argv, cwd = process.cwd(), exists = existsSync) {
  const value = argv[1];
  if (value === void 0 || value === "") return void 0;
  const entry = value.startsWith("file:") ? fileURLToPath(value) : resolve(cwd, value);
  if (!exists(entry)) return void 0;
  for (let directory = dirname(entry); ; ) {
    const manifestPath = resolve(directory, "package.json");
    if (exists(manifestPath)) {
      try {
        if (isDshCliEntry(
          entry,
          JSON.parse(readFileSync(manifestPath, "utf8")),
          directory
        ))
          return entry;
      } catch {
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return void 0;
    directory = parent;
  }
}
function optionalService(ctx, name2) {
  try {
    return typeof ctx.get === "function" ? ctx.get(name2) : void 0;
  } catch {
    return void 0;
  }
}
function isOfficialDesktopHostEntry(entry) {
  return entry !== void 0 && entry !== "" && entry.replaceAll("\\", "/").includes("/dsh-desktop-host/");
}
function stringEnvironment(value) {
  if (value === null || typeof value !== "object") return void 0;
  const env = {};
  for (const [key, item] of Object.entries(value))
    if (typeof item === "string") env[key] = item;
  return Object.keys(env).length === 0 ? void 0 : env;
}
function packageManagerFrom(value) {
  if (value === null || typeof value !== "object") return void 0;
  const item = value;
  if (typeof item.command !== "string" || item.command === "") return void 0;
  if (!Array.isArray(item.args) || !item.args.every((arg) => typeof arg === "string"))
    return void 0;
  const env = stringEnvironment(item.env);
  return {
    command: item.command,
    args: item.args,
    ...env === void 0 ? {} : { env }
  };
}
function packageManagerFromArgv(argv, exists, execPath, pathEnv) {
  if (!isOfficialDesktopHostEntry(argv[1])) return void 0;
  const pnpm = argv[5];
  if (typeof pnpm !== "string" || !isAbsolute(pnpm) || !exists(pnpm))
    return void 0;
  const bin = argv[6];
  const path = typeof bin === "string" && bin !== "" ? `${bin}${delimiter}${pathEnv ?? ""}` : pathEnv;
  return {
    command: execPath,
    args: ["--expose-internals", pnpm],
    env: {
      ELECTRON_RUN_AS_NODE: "1",
      ...typeof path === "string" && path !== "" ? { PATH: path } : {}
    }
  };
}
function pluginManagerFrom(value) {
  if (value === null || typeof value !== "object" || typeof value.installBundle !== "function")
    return void 0;
  return value;
}
function resolveUpdateRuntime(ctx, options = {}) {
  const argv = options.argv ?? process.argv;
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const home = options.homeDir ?? homedir();
  const exists = options.exists ?? existsSync;
  const execPath = options.execPath ?? process.execPath;
  const launched = optionalService(ctx, "profileContext");
  const official = isOfficialDesktopHostEntry(argv[1]) || launched?.name === "desktop";
  const launchedDir = typeof launched?.dir === "string" && isAbsolute(launched.dir) ? resolve(launched.dir) : void 0;
  const projectDir = official && typeof argv[3] === "string" && isAbsolute(argv[3]) ? resolve(argv[3]) : void 0;
  const cwdProfile = official && exists(resolve(cwd, "package.json")) ? resolve(cwd) : void 0;
  const profileDir = launchedDir ?? projectDir ?? cwdProfile ?? resolve(env.DSH_PROFILE_DIR ?? resolve(home, ".dsh", "profiles", "web"));
  const selected = profileNameFromArgv(argv);
  const profileName = validProfileName(launched?.name) ? launched.name : official ? "desktop" : validProfileName(selected) ? selected : validProfileName(basename(profileDir)) ? basename(profileDir) : "web";
  const packageManager = official ? packageManagerFrom(launched?.packageManager) ?? packageManagerFromArgv(argv, exists, execPath, env.PATH) : void 0;
  const pluginManager = official && packageManager === void 0 ? pluginManagerFrom(optionalService(ctx, "pluginManager")) : void 0;
  const entry = official ? void 0 : cliEntry(argv, cwd, exists);
  return {
    profileName,
    profileDir,
    officialDesktop: official,
    canAutoUpdate: packageManager !== void 0 || pluginManager !== void 0 || entry !== void 0,
    ...packageManager === void 0 ? {} : { packageManager },
    ...pluginManager === void 0 ? {} : { pluginManager },
    ...entry === void 0 ? {} : { cliEntry: entry }
  };
}
function runtime(ctx) {
  return resolveUpdateRuntime(ctx);
}
function parseSemver(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
    value
  );
  if (match === null) return void 0;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]?.split(".") ?? []
  };
}
function isNewerVersion(currentValue, candidateValue) {
  const current = parseSemver(currentValue);
  const candidate = parseSemver(candidateValue);
  if (current === void 0 || candidate === void 0) return false;
  for (let index = 0; index < 3; index += 1) {
    if (candidate.core[index] !== current.core[index])
      return candidate.core[index] > current.core[index];
  }
  return comparePrerelease(candidate.prerelease, current.prerelease) > 0;
}
function comparePrerelease(left, right) {
  if (left.length === 0 || right.length === 0)
    return left.length === right.length ? 0 : left.length === 0 ? 1 : -1;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === void 0 || b === void 0)
      return a === b ? 0 : a === void 0 ? -1 : 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) {
      const aNumber = BigInt(a);
      const bNumber = BigInt(b);
      if (aNumber !== bNumber) return aNumber > bNumber ? 1 : -1;
      continue;
    }
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a > b ? 1 : -1;
  }
  return 0;
}
var latestCache;
async function latestVersion(packageName) {
  if (latestCache?.packageName === packageName && Date.now() < latestCache.expiresAt)
    return latestCache.version;
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
      { signal: AbortSignal.timeout(8e3) }
    );
    if (response.status === 404) return null;
    if (!response.ok) return void 0;
    const value = await response.json();
    if (typeof value.version !== "string" || !parseSemver(value.version))
      return void 0;
    latestCache = {
      packageName,
      version: value.version,
      expiresAt: Date.now() + 5 * 6e4
    };
    return value.version;
  } catch {
    return void 0;
  }
}
async function currentVersion(manifestUrl) {
  const value = JSON.parse(await readFile(manifestUrl, "utf8"));
  if (typeof value.version !== "string" || !parseSemver(value.version))
    throw new UpdateFailure("INVALID_VERSION");
  return value.version;
}
async function status(options, target) {
  const current = await currentVersion(options.manifestUrl);
  const latest = await latestVersion(options.packageName);
  return {
    packageName: options.packageName,
    currentVersion: current,
    ...latest == null ? {} : { latestVersion: latest },
    notPublished: latest === null,
    latestCheckFailed: latest === void 0,
    updateAvailable: latest != null && isNewerVersion(current, latest),
    profileName: target.profileName,
    canAutoUpdate: target.canAutoUpdate
  };
}
async function install(target, packageSpec, track) {
  if (target.packageManager !== void 0) {
    const manager = target.packageManager;
    const child2 = spawn(
      manager.command,
      [
        ...manager.args,
        "add",
        "--config.minimumReleaseAge=0",
        packageSpec,
        "--registry=https://registry.npmjs.org/"
      ],
      {
        cwd: target.profileDir,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, ...manager.env, NO_COLOR: "1" }
      }
    );
    let detail2 = "";
    child2.stdout.on("data", (chunk) => {
      detail2 = (detail2 + String(chunk)).slice(-4e3);
    });
    child2.stderr.on("data", (chunk) => {
      detail2 = (detail2 + String(chunk)).slice(-4e3);
    });
    const done2 = new Promise((resolve3, reject) => {
      child2.once("error", reject);
      child2.once(
        "close",
        (code) => code === 0 ? resolve3() : reject(
          new UpdateFailure(
            "UPDATE_FAILED",
            detail2.trim() || `\u66F4\u65B0\u8FDB\u7A0B\u9000\u51FA\u7801 ${code}`
          )
        )
      );
    });
    track(done2);
    let timer2;
    try {
      await Promise.race([
        done2,
        new Promise((_, reject) => {
          timer2 = setTimeout(() => {
            child2.kill();
            reject(new UpdateFailure("UPDATE_TIMEOUT"));
          }, 10 * 6e4);
        })
      ]);
    } finally {
      clearTimeout(timer2);
    }
    return;
  }
  if (!target.cliEntry) throw new UpdateFailure("AUTO_UPDATE_UNAVAILABLE");
  const child = spawn(
    process.execPath,
    [
      target.cliEntry,
      "plugin",
      "--profile",
      target.profileName,
      "add",
      "--config.minimumReleaseAge=0",
      packageSpec,
      "--registry=https://registry.npmjs.org/"
    ],
    {
      cwd: target.profileDir,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" }
    }
  );
  let detail = "";
  child.stdout.on("data", (chunk) => {
    detail = (detail + String(chunk)).slice(-4e3);
  });
  child.stderr.on("data", (chunk) => {
    detail = (detail + String(chunk)).slice(-4e3);
  });
  const done = new Promise((resolve3, reject) => {
    child.once("error", reject);
    child.once(
      "close",
      (code) => code === 0 ? resolve3() : reject(
        new UpdateFailure(
          "UPDATE_FAILED",
          detail.trim() || `\u66F4\u65B0\u8FDB\u7A0B\u9000\u51FA\u7801 ${code}`
        )
      )
    );
  });
  track(done);
  let timer;
  try {
    await Promise.race([
      done,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          child.kill();
          reject(new UpdateFailure("UPDATE_TIMEOUT"));
        }, 10 * 6e4);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function json(response, statusCode, value) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(value));
}
function registerPluginUpdater(ctx, options) {
  const host = ctx;
  let installing = false;
  return host.webServer.register({
    kind: "exact",
    path: options.endpoint,
    handler: async (request, response) => {
      try {
        const target = runtime(ctx);
        if (request.method === "GET" || request.method === "HEAD") {
          const payload = await status(options, target);
          response.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
          });
          response.end(
            request.method === "HEAD" ? void 0 : JSON.stringify(payload)
          );
          return;
        }
        if (request.method !== "POST") {
          response.writeHead(405, { allow: "GET, HEAD, POST" });
          response.end();
          return;
        }
        if (!isTrustedUpdateRequest(request)) {
          json(response, 403, updateErrorPayload("UNTRUSTED_REQUEST"));
          return;
        }
        if (installing) {
          json(response, 409, updateErrorPayload("UPDATE_IN_PROGRESS"));
          return;
        }
        installing = true;
        let pendingInstall;
        try {
          const before = await status(options, target);
          if (before.notPublished) {
            json(response, 409, {
              ...before,
              ...updateErrorPayload("NOT_PUBLISHED")
            });
            return;
          }
          if (before.latestVersion === void 0) {
            json(response, 503, updateErrorPayload("REGISTRY_UNAVAILABLE"));
            return;
          }
          if (!before.updateAvailable) {
            json(response, 200, before);
            return;
          }
          await install(
            target,
            `${options.packageName}@${before.latestVersion}`,
            (done) => {
              pendingInstall = done;
            }
          );
          json(response, 200, {
            ...before,
            updatedVersion: before.latestVersion,
            restartRequired: true,
            autoReload: false,
            ...target.officialDesktop ? { restartDesktop: true } : {}
          });
        } finally {
          if (pendingInstall)
            void pendingInstall.then(
              () => {
                installing = false;
              },
              () => {
                installing = false;
              }
            );
          else installing = false;
        }
      } catch (error) {
        ctx.logger.warn(`plugin updater failed: ${String(error)}`);
        json(
          response,
          503,
          updateErrorPayload(
            error instanceof UpdateFailure ? error.code : "UPDATE_FAILED"
          )
        );
      }
    }
  });
}

// src/index.ts
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { mkdir as mkdir2 } from "node:fs/promises";
import { join as join2 } from "node:path";
import { spawn as spawn2, execFile } from "node:child_process";

// src/model.ts
var BASE = "/dsh-codex-pet";
var BUILTINS = [
  ["codex", "Codex", "The original Codex companion."],
  ["dewey", "Dewey", "A calm companion for focused workspace days."],
  ["fireball", "Fireball", "Hot path energy for fast iteration."],
  ["hoots", "Hoots", "A sharp-eyed owl for polished work in a blink."],
  ["rocky", "Rocky", "A steady rock when the diff gets large."],
  ["seedy", "Seedy", "Small green shoots for new ideas."],
  ["stacky", "Stacky", "A balanced stack for deep work."],
  ["bsod", "BSOD", "A tiny blue-screen gremlin."],
  ["null-signal", "Null Signal", "Quiet signal from the void."]
];
var DEFAULT_CONFIG = {
  selected: "codex",
  visible: true,
  size: 120,
  position: null
};
function normalizeConfig(value, previous = DEFAULT_CONFIG) {
  if (!value || typeof value !== "object") throw new Error("\u914D\u7F6E\u5FC5\u987B\u662F\u5BF9\u8C61");
  const data = value;
  if (data.selected !== void 0 && (typeof data.selected !== "string" || !/^(builtin|custom):[\w-]+$|^[\w-]+$/.test(data.selected)))
    throw new Error("\u5BA0\u7269\u6807\u8BC6\u65E0\u6548");
  if (data.visible !== void 0 && typeof data.visible !== "boolean")
    throw new Error("\u663E\u793A\u72B6\u6001\u65E0\u6548");
  if (data.size !== void 0 && (!Number.isFinite(data.size) || data.size < 64 || data.size > 224))
    throw new Error("\u5BA0\u7269\u5927\u5C0F\u987B\u4E3A 64\u2013224");
  if (data.position !== void 0 && data.position !== null && (!Number.isFinite(data.position.x) || !Number.isFinite(data.position.y) || data.position.x < 0 || data.position.x > 1 || data.position.y < 0 || data.position.y > 1))
    throw new Error("\u4F4D\u7F6E\u65E0\u6548");
  return {
    selected: data.selected ?? previous.selected,
    visible: data.visible ?? previous.visible,
    size: data.size ?? previous.size,
    position: data.position === void 0 ? previous.position : data.position
  };
}

// src/library.ts
import { readFile as readFile2, readdir, realpath, stat, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname2, join, resolve as resolve2, relative, isAbsolute as isAbsolute2 } from "node:path";
import { homedir as homedir2 } from "node:os";
import { randomUUID } from "node:crypto";
function imageVersion(bytes) {
  let width = 0, height = 0;
  if (bytes.length >= 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const kind = bytes.toString("ascii", 12, 16);
    if (kind === "VP8X") {
      width = 1 + bytes.readUIntLE(24, 3);
      height = 1 + bytes.readUIntLE(27, 3);
    } else if (kind === "VP8L" && bytes[20] === 47) {
      const bits = bytes.readUInt32LE(21);
      width = (bits & 16383) + 1;
      height = (bits >>> 14 & 16383) + 1;
    } else if (kind === "VP8 ") {
      width = bytes.readUInt16LE(26) & 16383;
      height = bytes.readUInt16LE(28) & 16383;
    }
  } else if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    width = bytes.readUInt32BE(16);
    height = bytes.readUInt32BE(20);
  }
  if (width !== 1536 || ![1872, 2288].includes(height)) throw new Error(`\u56FE\u96C6\u5C3A\u5BF8 ${width}\xD7${height} \u4E0D\u7B26\u5408 Codex 8 \u5217\u534F\u8BAE`);
  return height === 2288 ? 2 : 1;
}
async function confined(root, file) {
  const base = await realpath(root), target = await realpath(resolve2(root, file));
  const rel = relative(base, target);
  if (rel.startsWith("..") || isAbsolute2(rel)) throw new Error("\u6587\u4EF6\u8D85\u51FA\u5BA0\u7269\u76EE\u5F55");
  return target;
}
async function smallRead(path, limit) {
  const info = await stat(path);
  if (!info.isFile() || info.size > limit) throw new Error("\u6587\u4EF6\u8FC7\u5927\u6216\u4E0D\u662F\u666E\u901A\u6587\u4EF6");
  return readFile2(path);
}
var PetLibrary = class {
  constructor(assetRoot, dataRoot = join(process.env.DSH_HOME ?? join(homedir2(), ".dsh"), "codex-pet"), skillRoot = resolve2(assetRoot, "..", "..", "skills")) {
    this.assetRoot = assetRoot;
    this.dataRoot = dataRoot;
    this.skillRoot = skillRoot;
    this.customPath = join(dataRoot, "pets");
    this.skillPath = join(skillRoot, "hatch-pet", "SKILL.md");
    this.statePath = join(dataRoot, "config.json");
  }
  customPath;
  skillPath;
  statePath;
  config = DEFAULT_CONFIG;
  pets = [];
  warnings = [];
  configWarnings = [];
  files = /* @__PURE__ */ new Map();
  queue = Promise.resolve();
  async init() {
    try {
      this.config = normalizeConfig(JSON.parse(await readFile2(this.statePath, "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") this.configWarnings.push("\u914D\u7F6E\u8BFB\u53D6\u5931\u8D25\uFF0C\u6682\u7528\u9ED8\u8BA4\u503C\uFF1B\u539F\u6587\u4EF6\u672A\u6539\u52A8\u3002");
    }
    await mkdir(this.customPath, { recursive: true });
    await this.refresh();
  }
  async refresh() {
    const pets = [];
    const files = /* @__PURE__ */ new Map();
    const warnings = [];
    const add = async (id, name2, description, root, asset, source) => {
      const file = await confined(root, asset);
      const version = imageVersion(await smallRead(file, 32 * 1024 * 1024));
      pets.push({ id, name: name2, description, version, source, url: `${BASE}/asset/${encodeURIComponent(id)}` });
      files.set(id, { root, relative: asset });
    };
    for (const [id, name2, description] of BUILTINS) {
      try {
        await add(id, name2, description, this.assetRoot, `${id}/spritesheet.webp`, "builtin");
      } catch {
        warnings.push(`\u5185\u7F6E\u5BA0\u7269 ${name2} \u7684\u539F\u59CB\u56FE\u96C6\u7F3A\u5931\u6216\u4E0D\u517C\u5BB9\u3002`);
      }
    }
    let folders = [];
    try {
      folders = await readdir(this.customPath);
    } catch (error) {
      if (error.code !== "ENOENT") warnings.push("\u65E0\u6CD5\u8BFB\u53D6\u81EA\u5B9A\u4E49\u5BA0\u7269\u76EE\u5F55\u3002");
    }
    for (const folder of folders.sort()) {
      if (!/^[\w-]+$/.test(folder)) continue;
      try {
        const root = await confined(this.customPath, folder);
        const manifest = JSON.parse((await smallRead(await confined(root, "pet.json"), 64 * 1024)).toString("utf8"));
        if (typeof manifest.spritesheetPath !== "string") throw new Error("\u7F3A\u5C11\u56FE\u96C6\u8DEF\u5F84");
        await add(`custom:${folder}`, String(manifest.displayName ?? folder).slice(0, 100), String(manifest.description ?? "").slice(0, 300), root, manifest.spritesheetPath, "custom");
      } catch {
        warnings.push(`\u81EA\u5B9A\u4E49\u5BA0\u7269 ${folder} \u672A\u901A\u8FC7\u683C\u5F0F\u6821\u9A8C\u3002`);
      }
    }
    this.pets = pets;
    this.files = files;
    this.warnings = [...this.configWarnings, ...warnings];
  }
  async asset(id) {
    const entry = this.files.get(id);
    if (!entry) throw new Error("\u5BA0\u7269\u4E0D\u5B58\u5728");
    return smallRead(await confined(entry.root, entry.relative), 32 * 1024 * 1024);
  }
  async update(value) {
    const operation = this.queue.then(async () => {
      const config = normalizeConfig(value, this.config);
      if (!this.pets.some((pet) => pet.id === config.selected)) throw new Error("\u8BF7\u9009\u62E9\u5DF2\u52A0\u8F7D\u7684\u5BA0\u7269");
      await mkdir(dirname2(this.statePath), { recursive: true });
      const temp = `${this.statePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temp, JSON.stringify(config, null, 2), { encoding: "utf8", flag: "wx" });
        await rename(temp, this.statePath);
      } finally {
        await unlink(temp).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      this.config = config;
      return config;
    });
    this.queue = operation.catch(() => void 0);
    return operation;
  }
  snapshot() {
    return { pets: this.pets, config: this.config, customPath: this.customPath, warnings: this.warnings, skillAvailable: existsSync2(this.skillPath), skillPath: this.skillPath };
  }
};

// src/index.ts
var name = "michengai-codex-pet";
var inject = ["webServer"];
var packageRoot = fileURLToPath2(new URL("../", import.meta.url));
function json2(res, status2, data) {
  res.writeHead(status2, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(data));
}
function trustedWrite(req) {
  if (req.headers["x-dsh-pet"] !== "1" || !req.headers["content-type"]?.startsWith("application/json"))
    return false;
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host)
        return false;
    } catch {
      return false;
    }
  }
  return true;
}
async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new Error("\u8BF7\u6C42\u8FC7\u5927");
    chunks.push(Buffer.from(chunk));
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("\u8BF7\u6C42\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
  return value;
}
async function createHost(options = {}, host) {
  const root = options.root ?? packageRoot;
  const library = new PetLibrary(
    join2(root, "assets", "codex"),
    options.dataRoot,
    options.skillRoot
  );
  await library.init();
  let updateHandler;
  registerPluginUpdater(
    {
      logger: {
        warn: (message) => console.warn("[dsh-codex-pet]", message)
      },
      webServer: {
        register(route) {
          updateHandler = route.handler;
          return () => {
            updateHandler = void 0;
          };
        }
      },
      get: (name2) => host?.get?.(name2)
    },
    {
      endpoint: `${BASE}/api/update`,
      packageName: "@michengai/dsh-codex-pet",
      manifestUrl: new URL("../package.json", import.meta.url)
    }
  );
  const snapshot = () => ({
    ...library.snapshot(),
    creationAvailable: false,
    creation: null
  });
  const handler = async (req, res) => {
    try {
      const authority = new URL(`http://${req.headers.host ?? ""}`);
      if (!["localhost", "127.0.0.1", "[::1]"].includes(
        authority.hostname
      )) {
        json2(res, 403, { error: "\u4E0D\u53D7\u4FE1\u4EFB\u7684 Host" });
        return;
      }
      const path = new URL(req.url ?? "/", authority).pathname;
      if (path === `${BASE}/api/update` && updateHandler) {
        await updateHandler(req, res);
        return;
      }
      if (req.method === "GET" && path === `${BASE}/api/state`) {
        json2(res, 200, snapshot());
        return;
      }
      if (req.method === "GET" && path.startsWith(`${BASE}/asset/`)) {
        const bytes = await library.asset(
          decodeURIComponent(path.slice(`${BASE}/asset/`.length))
        );
        const png = bytes[0] === 137;
        res.writeHead(200, {
          "content-type": png ? "image/png" : "image/webp",
          "cache-control": "no-cache",
          "x-content-type-options": "nosniff"
        });
        res.end(bytes);
        return;
      }
      if (!path.startsWith(`${BASE}/api/`)) {
        json2(res, 404, { error: "\u672A\u627E\u5230\u8D44\u6E90" });
        return;
      }
      if (req.method !== "POST") {
        json2(res, 405, { error: "\u65B9\u6CD5\u4E0D\u652F\u6301" });
        return;
      }
      if (!trustedWrite(req)) {
        json2(res, 403, { error: "\u8BF7\u6C42\u6765\u6E90\u6821\u9A8C\u5931\u8D25" });
        return;
      }
      const value = await body(req);
      if (path === `${BASE}/api/config`) await library.update(value);
      else if (path === `${BASE}/api/refresh`) await library.refresh();
      else if (path === `${BASE}/api/create`) {
        throw new Error("\u8BF7\u4ECE DSH \u5BA0\u7269\u8BBE\u7F6E\u53D1\u8D77\u521B\u5EFA\u4F1A\u8BDD");
      } else if (path === `${BASE}/api/open-folder`) {
        if (req.socket.remoteAddress && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          req.socket.remoteAddress
        ))
          throw new Error("\u53EA\u80FD\u5728\u8FD0\u884C DSH \u7684\u672C\u673A\u6253\u5F00\u6587\u4EF6\u5939");
        await mkdir2(library.customPath, { recursive: true });
        if (process.platform === "win32") {
          const powershell = join2(
            process.env.SystemRoot ?? "C:\\Windows",
            "System32",
            "WindowsPowerShell",
            "v1.0",
            "powershell.exe"
          );
          const script = `$ErrorActionPreference = "Stop"; Start-Process -FilePath explorer.exe -ArgumentList ('"' + $env:DSH_PET_OPEN_DIRECTORY + '"') -WindowStyle Normal`;
          await new Promise((resolve3, reject) => {
            execFile(
              powershell,
              [
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script
              ],
              {
                windowsHide: true,
                timeout: 1e4,
                env: {
                  ...process.env,
                  DSH_PET_OPEN_DIRECTORY: library.customPath
                }
              },
              (error) => error ? reject(
                new Error(
                  `\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1A${error.message}`
                )
              ) : resolve3()
            );
          });
        } else {
          const command = process.platform === "darwin" ? "open" : "xdg-open";
          await new Promise((resolve3, reject) => {
            const child = spawn2(command, [library.customPath], {
              shell: false,
              stdio: "ignore"
            });
            child.once("error", reject);
            child.once("spawn", () => {
              child.unref();
              resolve3();
            });
          });
        }
      } else {
        json2(res, 404, { error: "\u672A\u77E5\u64CD\u4F5C" });
        return;
      }
      json2(res, 200, snapshot());
    } catch (error) {
      if (res.headersSent) res.end();
      else
        json2(res, 400, {
          error: error instanceof Error ? error.message : "\u64CD\u4F5C\u5931\u8D25"
        });
    }
  };
  return { handler, library, dispose: () => {
  } };
}
function apply(ctx) {
  ctx.effect(() => {
    let disposed = false, remove, host;
    void createHost({}, ctx).then((value) => {
      host = value;
      if (disposed) {
        host.dispose();
        return;
      }
      remove = ctx.get("webServer").register({
        kind: "prefix",
        path: BASE,
        handler: (req, res) => {
          void value.handler(req, res);
        }
      });
    }).catch(
      (error) => console.error("[dsh-codex-pet] \u521D\u59CB\u5316\u5931\u8D25", error)
    );
    return () => {
      disposed = true;
      remove?.();
      host?.dispose();
    };
  });
}
export {
  apply,
  createHost,
  inject,
  json2 as json,
  name,
  trustedWrite
};
