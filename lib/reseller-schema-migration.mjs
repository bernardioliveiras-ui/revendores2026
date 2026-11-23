/** Existing schemas may have a foreign key on this column; preserve it. */
export async function ensureNullableResellerPurchaseId(connection) {
  const [columns] = await connection.execute(
    "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'purchase_id'",
    ["reseller_profiles"],
  );
  if (columns[0]?.IS_NULLABLE !== "NO") return;
  const [constraints] = await connection.execute(
    "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'purchase_id' AND REFERENCED_TABLE_NAME = 'purchases'",
    ["reseller_profiles"],
  );
  const name = constraints[0]?.CONSTRAINT_NAME;
  if (typeof name === "string" && /^[A-Za-z0-9_]+$/.test(name)) {
    await connection.query(`ALTER TABLE \`reseller_profiles\` DROP FOREIGN KEY \`${name}\`, MODIFY COLUMN \`purchase_id\` varchar(80) NULL, ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`purchase_id\`) REFERENCES \`purchases\` (\`id\`) ON DELETE CASCADE`);
  } else {
    await connection.query("ALTER TABLE `reseller_profiles` MODIFY COLUMN `purchase_id` varchar(80) NULL");
  }
}
