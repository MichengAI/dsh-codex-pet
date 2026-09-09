import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  registerPluginUpdater,
  isNewerVersion,
  type HostRequest,
  type HostResponse,
} from "../src/plugin-updater.ts";

async function fixture(
  run: (
    request: (
      method: string,
      trusted?: boolean,
    ) => Promise<{ status: number; value: any }>,
    root: string,
  ) => Promise<void>,
) {
  const root = await mkdtemp(join(tmpdir(), "pet-cli-test-"));
  const originalFetch = globalThis.fetch,
    originalArgv = process.argv,
    originalProfile = process.env.DSH_PROFILE_DIR;
  await mkdir(join(root, "web"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh", bin: { dsh: "cli.cjs" } }),
  );
  await writeFile(join(root, "mode.json"), "0");
  await writeFile(
    join(root, "cli.cjs"),
    `const fs=require('node:fs');const path=require('node:path');fs.writeFileSync(path.join(__dirname,'args.json'),JSON.stringify(process.argv.slice(2)));setTimeout(()=>process.exit(JSON.parse(fs.readFileSync(path.join(__dirname,'mode.json'),'utf8'))),100);`,
  );
  process.argv = [process.execPath, join(root, "cli.cjs"), "web"];
  process.env.DSH_PROFILE_DIR = join(root, "web");
  let handler!: (request: HostRequest, response: HostResponse) => Promise<void>;
  registerPluginUpdater(
    {
      logger: { warn() {} },
      webServer: {
        register(route) {
          handler = route.handler;
          return () => {};
        },
      },
    },
    {
      endpoint: "/update",
      packageName: "@michengai/pet-cli-test",
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
    await run(request, root);
  } finally {
    globalThis.fetch = originalFetch;
    process.argv = originalArgv;
    if (originalProfile === undefined) delete process.env.DSH_PROFILE_DIR;
    else process.env.DSH_PROFILE_DIR = originalProfile;
    await rm(root, { recursive: true, force: true });
  }
}

test("更新通过已验证的 DSH CLI 固定版本安装，拒绝跨站与并发，失败后可重试", async () => {
  await fixture(async (request, root) => {
    globalThis.fetch = async () => new Response("{}", { status: 404 });
    assert.equal((await request("GET")).value.notPublished, true);
    assert.equal((await request("POST")).value.code, "NOT_PUBLISHED");
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    assert.equal((await request("POST")).value.code, "REGISTRY_UNAVAILABLE");
    assert.equal((await request("POST", false)).status, 403);
    globalThis.fetch = async () => Response.json({ version: "999.0.0" });
    const status = await request("GET");
    assert.equal(status.value.canAutoUpdate, true);
    assert.equal(status.value.profileName, "web");
    const installing = request("POST");
    assert.equal((await request("POST")).status, 409);
    assert.equal((await installing).status, 200);
    assert.deepEqual(
      JSON.parse(await readFile(join(root, "args.json"), "utf8")),
      [
        "plugin",
        "--profile",
        "web",
        "add",
        "--config.minimumReleaseAge=0",
        "@michengai/pet-cli-test@999.0.0",
        "--registry=https://registry.npmjs.org/",
      ],
    );
    await writeFile(join(root, "mode.json"), "1");
    assert.equal((await request("POST")).value.code, "UPDATE_FAILED");
    await writeFile(join(root, "mode.json"), "0");
    assert.equal((await request("POST")).status, 200);
    process.argv = [process.execPath, "unrelated-entry.cjs"];
    assert.equal((await request("GET")).value.canAutoUpdate, false);
    assert.equal((await request("POST")).value.code, "AUTO_UPDATE_UNAVAILABLE");
  });
});

test("版本比较不降级，支持预发布并拒绝无效版本", () => {
  assert.equal(isNewerVersion("1.0.0", "0.9.0"), false);
  assert.equal(isNewerVersion("1.0.0-rc.2", "1.0.0-rc.10"), true);
  assert.equal(isNewerVersion("1.0.0-rc.10", "1.0.0"), true);
  assert.equal(isNewerVersion("1.0.0", "invalid"), false);
});
