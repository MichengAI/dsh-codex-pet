// src/index.ts
import { fileURLToPath } from "node:url";
import { mkdir as mkdir2 } from "node:fs/promises";
import { join as join2 } from "node:path";
import { spawn, execFile } from "node:child_process";

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
import { readFile, readdir, realpath, stat, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve, relative, isAbsolute } from "node:path";
import { homedir } from "node:os";
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
  const base = await realpath(root), target = await realpath(resolve(root, file));
  const rel = relative(base, target);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("\u6587\u4EF6\u8D85\u51FA\u5BA0\u7269\u76EE\u5F55");
  return target;
}
async function smallRead(path, limit) {
  const info = await stat(path);
  if (!info.isFile() || info.size > limit) throw new Error("\u6587\u4EF6\u8FC7\u5927\u6216\u4E0D\u662F\u666E\u901A\u6587\u4EF6");
  return readFile(path);
}
var PetLibrary = class {
  constructor(assetRoot, dataRoot = join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "codex-pet"), skillRoot = resolve(assetRoot, "..", "..", "skills")) {
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
      this.config = normalizeConfig(JSON.parse(await readFile(this.statePath, "utf8")));
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
      await mkdir(dirname(this.statePath), { recursive: true });
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
    return { pets: this.pets, config: this.config, customPath: this.customPath, warnings: this.warnings, skillAvailable: existsSync(this.skillPath), skillPath: this.skillPath };
  }
};

// src/index.ts
var name = "michengai-codex-pet";
var inject = ["webServer"];
var packageRoot = fileURLToPath(new URL("../", import.meta.url));
function json(res, status, data) {
  res.writeHead(status, {
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
        json(res, 403, { error: "\u4E0D\u53D7\u4FE1\u4EFB\u7684 Host" });
        return;
      }
      const path = new URL(req.url ?? "/", authority).pathname;
      if (req.method === "GET" && path === `${BASE}/api/state`) {
        json(res, 200, snapshot());
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
        json(res, 404, { error: "\u672A\u627E\u5230\u8D44\u6E90" });
        return;
      }
      if (req.method !== "POST") {
        json(res, 405, { error: "\u65B9\u6CD5\u4E0D\u652F\u6301" });
        return;
      }
      if (!trustedWrite(req)) {
        json(res, 403, { error: "\u8BF7\u6C42\u6765\u6E90\u6821\u9A8C\u5931\u8D25" });
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
          await new Promise((resolve2, reject) => {
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
              ) : resolve2()
            );
          });
        } else {
          const command = process.platform === "darwin" ? "open" : "xdg-open";
          await new Promise((resolve2, reject) => {
            const child = spawn(command, [library.customPath], {
              shell: false,
              stdio: "ignore"
            });
            child.once("error", reject);
            child.once("spawn", () => {
              child.unref();
              resolve2();
            });
          });
        }
      } else {
        json(res, 404, { error: "\u672A\u77E5\u64CD\u4F5C" });
        return;
      }
      json(res, 200, snapshot());
    } catch (error) {
      if (res.headersSent) res.end();
      else
        json(res, 400, {
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
  json,
  name,
  trustedWrite
};
