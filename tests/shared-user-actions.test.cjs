const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { scryptSync } = require("node:crypto");
const typescript = require("typescript");

const filename = path.resolve(__dirname, "../app/users/actions.ts");
const source = fs.readFileSync(filename, "utf8");
const compiled = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.CommonJS } }).outputText;

function setup(authorized = true) {
  const writes = [];
  const operations = [];
  const database = {
    from(table) {
      return {
        async insert(payload) { writes.push(payload); return { error: null }; },
        update(payload) { writes.push(payload); return this; },
        eq() { return this; }, select() { return this; },
        delete() { operations.push(`delete:${table}`); return this; },
        async maybeSingle() { return { data: { id: 2 }, error: null }; },
        then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject); },
      };
    }
  };
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = (name) => name === "@/lib/admin-server" ? {
    requireSharedAdmin: async () => {
      if (!authorized) throw new Error("ไม่ได้รับอนุญาต");
      return { database, profile: { id: 1 } };
    }
  } : require(name);
  loaded._compile(compiled, filename);
  return { actions: loaded.exports, writes, operations };
}

const input = { customer_id: "", area: "A", username: "staff", password_text: "password example", display_name: "Staff", company_tag: "BA", email: "", phone: "", employee_id: "", employment_type: "", base_salary: "", is_active: true, image_url: "" };

test("password writes require an authorized admin and explicit migration readiness", async () => {
  delete process.env.PASSWORD_HASH_UPGRADE_ENABLED;
  let { actions, writes } = setup();
  assert.ok((await actions.createSharedUserAction(input)).error);
  assert.equal(writes.length, 0);
  process.env.PASSWORD_HASH_UPGRADE_ENABLED = "true";
  ({ actions, writes } = setup(false));
  assert.ok((await actions.createSharedUserAction(input)).error);
  assert.equal(writes.length, 0);
});

test("created passwords use the shared scrypt format and unchanged edits omit passwords", async () => {
  process.env.PASSWORD_HASH_UPGRADE_ENABLED = "true";
  const { actions, writes } = setup();
  assert.equal((await actions.createSharedUserAction(input)).error, null);
  const [algorithm, version, salt, digest] = writes[0].password_text.split("$");
  assert.equal(algorithm, "scrypt");
  assert.equal(version, "v1");
  assert.equal(scryptSync(input.password_text, salt, 64).toString("hex"), digest);
  assert.equal((await actions.updateSharedUserAction(2, { ...input, password_text: "" })).error, null);
  assert.equal(Object.prototype.hasOwnProperty.call(writes[1], "password_text"), false);
});

test("deletes linked KOE accounts before deleting the user profile", async () => {
  const { actions, operations } = setup();
  assert.equal((await actions.deleteSharedUserAction(2)).error, null);
  assert.deepEqual(operations, ["delete:koe_accounts", "delete:user_profiles"]);
});