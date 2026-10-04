export function isMysqlDuplicateKeyError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; errno?: unknown; cause?: unknown };
  if (value.code === "ER_DUP_ENTRY" || value.errno === 1062) return true;
  if (value.cause && value.cause !== error) return isMysqlDuplicateKeyError(value.cause);
  return false;
}
