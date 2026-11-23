import test from "node:test";
import assert from "node:assert/strict";
import { ensureNullableResellerPurchaseId } from "../lib/reseller-schema-migration.mjs";

test("existing foreign key is recreated atomically when allowing manual profiles",async()=>{
  const commands=[];
  const connection={
    async execute(sql) {
      if(sql.includes("IS_NULLABLE"))return [[{IS_NULLABLE:"NO"}]];
      if(sql.includes("KEY_COLUMN_USAGE"))return [[{CONSTRAINT_NAME:"fk_profiles_purchase"}]];
      throw Error("Unexpected query: "+sql);
    },
    async query(sql){commands.push(sql);return [[]]},
  };
  await ensureNullableResellerPurchaseId(connection);
  assert.equal(commands.length,1);
  assert.match(commands[0],/DROP FOREIGN KEY `fk_profiles_purchase`/);
  assert.match(commands[0],/MODIFY COLUMN `purchase_id` varchar\(80\) NULL/);
  assert.match(commands[0],/ADD CONSTRAINT `fk_profiles_purchase` FOREIGN KEY/);
});

test("already nullable purchase linkage is not modified",async()=>{
  const connection={async execute(){return [[{IS_NULLABLE:"YES"}]]},async query(){throw Error("unexpected ALTER")}};
  await ensureNullableResellerPurchaseId(connection);
});
