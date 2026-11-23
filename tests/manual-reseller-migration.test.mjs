import test from "node:test";
import assert from "node:assert/strict";
import { migrate } from "../scripts/migration-core.mjs";

test("migration makes existing reseller purchase reference nullable and adds private invitation table", async () => {
  const tables = new Map();
  const commands = [];
  let existingPurchaseNullable = false;
  const conn = {
    async query(sql) {
      commands.push(sql);
      if (sql.includes("GET_LOCK")) return [[{acquired:1}]];
      if (sql.startsWith("CREATE TABLE")) {
        const name = /EXISTS `([^`]+)`/.exec(sql)[1];
        if (!tables.has(name)) tables.set(name, new Set([...sql.matchAll(/(?:^|[\n,])\s*`?([a-z_]+)`?\s+(?:varchar\(\d+\)|int|bigint|text)(?=[\s,])/g)].map(m => m[1])));
      }
      if (sql.startsWith("ALTER TABLE") && sql.includes("ADD COLUMN")) {
        const [,name,col] = /TABLE `([^`]+)` ADD COLUMN `([^`]+)`/.exec(sql);
        tables.get(name).add(col);
      }
      if (sql.includes("MODIFY COLUMN `purchase_id`")) existingPurchaseNullable = true;
      return [[]];
    },
    async execute(sql, [table]) {
      if (sql.includes("IS_NULLABLE") && table === "reseller_profiles")
        return [[{IS_NULLABLE: existingPurchaseNullable ? "YES" : "NO"}]];
      return [[...(tables.get(table) || [])].map(COLUMN_NAME => ({COLUMN_NAME}))];
    },
  };
  await migrate(conn);
  assert.equal(existingPurchaseNullable, true);
  assert.equal(tables.has("reseller_invitations"), true);
  await migrate(conn);
  assert.equal(commands.filter(c => c.includes("MODIFY COLUMN `purchase_id`")).length, 1, "migration must be repeatable");
});
