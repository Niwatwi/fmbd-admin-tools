const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const typescript = require("typescript");

const filename = path.resolve(__dirname, "../lib/admin-server.ts");
const source = fs.readFileSync(filename, "utf8");
const compiled = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.CommonJS } }).outputText;

function loadHelper({ user, profile, authError = null, profileError = null, key = "server-test-key" }) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
  if (key) process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const filters = [];
  const database = { from(table) { assert.equal(table, "user_profiles"); return {
    select() { return this; },
    eq(field, value) { filters.push([field, value]); return this; },
    async maybeSingle() { return { data: profile, error: profileError }; },
  }; } };
  const mocks = {
    "server-only": {},
    "next/headers": { cookies: () => ({ getAll: () => [], set() {} }) },
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: authError }) } }) },
    "@supabase/supabase-js": { createClient: () => database },
  };
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = (name) => Object.prototype.hasOwnProperty.call(mocks, name) ? mocks[name] : require(name);
  loaded._compile(compiled, filename);
  return { requireSharedAdmin: loaded.exports.requireSharedAdmin, filters };
}

test("verified administrator is checked against the active shared profile", async () => {
  const helper = loadHelper({ user: { email: "admin@example.test", email_confirmed_at: "2026-01-01" }, profile: { id: 1, username: "admin", company_tag: "ADMIN", is_active: true } });
  const result = await helper.requireSharedAdmin();
  assert.equal(result.profile.id, 1);
  assert.deepEqual(helper.filters, [["email", "admin@example.test"], ["is_active", true]]);
});

test("unverified, unauthenticated, non-admin, and database-error sessions are denied", async () => {
  const verified = { email: "user@example.test", email_confirmed_at: "2026-01-01" };
  for (const options of [
    { user: null, profile: null },
    { user: { email: "user@example.test" }, profile: null },
    { user: verified, profile: { id: 2, username: "staff", company_tag: "BA", is_active: true } },
    { user: verified, profile: null },
    { user: verified, profile: null, profileError: new Error("database error") },
    { user: verified, profile: null, key: "" },
  ]) await assert.rejects(loadHelper(options).requireSharedAdmin());
});