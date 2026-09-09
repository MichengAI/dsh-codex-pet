import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  registerPluginUpdater,
  type HostRequest,
  type HostResponse,
  isNewerVersion,
} from "../src/plugin-updater.ts";

test("更新入口区分未发布和网络错误，安装固定npm版本且拒绝跨站和并发", async () => {
  const originalFetch = globalThis.fetch;
  let handler!: (req: HostRequest, res: HostResponse) => Promise<void>;
  const calls: unknown[] = [];
  let release!: () => void;
  let exitCode = 0;
  registerPluginUpdater(
    {
      logger: { warn() {} },
      webServer: {
        register(route) {
          handler = route.handler;
          return () => {};
        },
      },
      get(name) {
        if (name === "desktopProfiles")
          return {
            current: {
              name: "pet-test",
              dir: resolve("test/update-profile-fixture"),
            },
          };
        if (name === "desktopPnpm")
          return {
            runPlugin(args: string[], dir: string) {
              calls.push({ args, dir });
              return {
                done: new Promise((done) => {
                  release = () => done({ exitCode, signal: null });
                }),
                cancel() {},
              };
            },
          };
      },
    },
    {
      endpoint: "/update",
      packageName: "@michengai/dsh-codex-pet",
      manifestUrl: new URL("../package.json", import.meta.url),
    },
  );
  const request = async (method: string, trusted = true) => {
    let status = 0,
      body = "";
    await handler(
      {
        method,
        socket: { remoteAddress: "127.0.0.1" },
        headers: {
          host: "127.0.0.1:1234",
          origin: trusted ? "http://127.0.0.1:1234" : "https://evil.test",
          "sec-fetch-site": trusted ? "same-origin" : "cross-site",
          "x-michengai-plugin-update": "1",
        },
      },
      {
        writeHead(code) {
          status = code;
        },
        end(value) {
          body = value ?? "";
        },
      },
    );
    return { status, value: body ? JSON.parse(body) : null };
  };
  try {
    globalThis.fetch = async () => new Response("{}", { status: 404 });
    const absent = await request("GET");
    assert.equal(absent.value.notPublished, true);
    assert.equal((await request("POST")).value.code, "NOT_PUBLISHED");
    assert.equal(absent.value.updateAvailable, false);
    assert.equal((await request("POST")).status, 409);
    assert.equal(calls.length, 0);
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    const offline = await request("GET");
    assert.equal(offline.value.latestCheckFailed, true);
    assert.equal((await request("POST")).value.code, "REGISTRY_UNAVAILABLE");
    assert.equal(offline.value.notPublished, false);
    assert.equal((await request("POST", false)).status, 403);
    globalThis.fetch = async () => Response.json({ version: "999.0.0" });
    const available = await request("GET");
    assert.equal(available.value.profileName, "pet-test");
    assert.equal(available.value.updateAvailable, true);
    const installing = request("POST");
    const duplicate = await request("POST");
    assert.equal(duplicate.status, 409);
    while (!release) await new Promise((done) => setImmediate(done));
    release();
    const result = await installing;
    assert.equal(result.status, 200);
    assert.equal(result.value.updatedVersion, "999.0.0");
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      args: [
        "add",
        "--config.minimumReleaseAge=0",
        "@michengai/dsh-codex-pet@999.0.0",
        "--registry=https://registry.npmjs.org/",
      ],
      dir: resolve("test/update-profile-fixture"),
    });
    exitCode = 1;
    const failed = request("POST");
    while (calls.length < 2) await new Promise((done) => setImmediate(done));
    release();
    assert.equal((await failed).status, 503);
    exitCode = 0;
    const retry = request("POST");
    while (calls.length < 3) await new Promise((done) => setImmediate(done));
    release();
    assert.equal((await retry).status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("桌面更新超时请求取消，确认进程结束前保持互斥，结束后允许重试", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const originalFetch = globalThis.fetch;
  let handler!: (req: HostRequest, res: HostResponse) => Promise<void>;
  let lastBody = "";
  let finish!: () => void;
  let started = 0,
    cancelled = 0;
  registerPluginUpdater(
    {
      logger: { warn() {} },
      webServer: {
        register(route) {
          handler = route.handler;
          return () => {};
        },
      },
      get(name) {
        if (name === "desktopProfiles")
          return { current: { name: "test", dir: resolve(".") } };
        if (name === "desktopPnpm")
          return {
            runPlugin() {
              started++;
              return {
                done: new Promise((done) => {
                  finish = () => done({ exitCode: 0, signal: null });
                }),
                cancel() {
                  cancelled++;
                },
              };
            },
          };
      },
    },
    {
      endpoint: "/update",
      packageName: "@michengai/pet-timeout-test",
      manifestUrl: new URL("../package.json", import.meta.url),
    },
  );
  const request = async () => {
    let status = 0;
    await handler(
      {
        method: "POST",
        socket: { remoteAddress: "127.0.0.1" },
        headers: {
          host: "127.0.0.1:1234",
          origin: "http://127.0.0.1:1234",
          "x-michengai-plugin-update": "1",
        },
      },
      {
        writeHead(code) {
          status = code;
        },
        end(value) {
          lastBody = value ?? "";
        },
      },
    );
    return status;
  };
  try {
    globalThis.fetch = async () => Response.json({ version: "999.0.0" });
    const first = request();
    while (!started) await new Promise((done) => setImmediate(done));
    context.mock.timers.tick(600_000);
    assert.equal(await first, 503);
    assert.equal(JSON.parse(lastBody).code, "UPDATE_TIMEOUT");
    assert.equal(cancelled, 1);
    assert.equal(await request(), 409);
    assert.equal(started, 1);
    finish();
    await new Promise((done) => setImmediate(done));
    const retry = request();
    while (started < 2) await new Promise((done) => setImmediate(done));
    finish();
    assert.equal(await retry, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("版本比较不降级，支持预发布并拒绝无效版本", () => {
  assert.equal(isNewerVersion("1.0.0", "0.9.0"), false);
  assert.equal(isNewerVersion("1.0.0-rc.2", "1.0.0-rc.10"), true);
  assert.equal(isNewerVersion("1.0.0-rc.10", "1.0.0"), true);
  assert.equal(isNewerVersion("1.0.0", "not-a-version"), false);
});

test("Web 缺少 Desktop 服务时仍返回状态和 profile，禁用自动更新", async () => {
  const originalFetch = globalThis.fetch;
  const previousProfile = process.env.DSH_PROFILE_DIR;
  const lookups: string[] = [];
  let handler!: (req: HostRequest, res: HostResponse) => Promise<void>;
  registerPluginUpdater(
    {
      logger: { warn() {} },
      get(name) {
        lookups.push(name);
        return undefined;
      },
      webServer: {
        register(route) {
          handler = route.handler;
          return () => {};
        },
      },
    },
    {
      endpoint: "/update",
      packageName: "@michengai/pet-web-fallback-test",
      manifestUrl: new URL("../package.json", import.meta.url),
    },
  );
  try {
    process.env.DSH_PROFILE_DIR = resolve("test/web");
    globalThis.fetch = async () => Response.json({ version: "999.0.0" });
    let status = 0,
      body = "";
    await handler(
      { method: "GET" },
      {
        writeHead(code) {
          status = code;
        },
        end(value) {
          body = value ?? "";
        },
      },
    );
    const value = JSON.parse(body);
    assert.equal(status, 200);
    assert.equal(value.profileName, "web");
    assert.equal(value.latestVersion, "999.0.0");
    assert.equal(value.updateAvailable, true);
    assert.equal(value.canAutoUpdate, false);
    assert.deepEqual(lookups, ["desktopProfiles", "desktopPnpm"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousProfile === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = previousProfile;
  }
});
