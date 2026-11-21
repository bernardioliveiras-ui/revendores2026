/**
 * Preflight somente de leitura para o MySQL/MariaDB autorizado de HOMOLOGAÇÃO.
 * Não importa migrations, não usa rotas Asaas e não escreve qualquer linha.
 *
 * Uso em ambiente explicitamente de testes:
 *   HOMOLOGATION_TEST_ONLY=yes HOMOLOGATION_DATABASE=<nome exato> node scripts/homologation-preflight.mjs
 * As variáveis DATABASE_* devem vir de um gestor de segredos do ambiente,
 * nunca de um .env real distribuído com o pacote.
 */
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

class HomologationGuardError extends Error {}

export function validatePreflightConfig(env = process.env) {
  if (env.HOMOLOGATION_TEST_ONLY !== "yes") throw new HomologationGuardError("Defina HOMOLOGATION_TEST_ONLY=yes somente após confirmar que o banco contém exclusivamente dados de teste.");
  if (!env.DATABASE_NAME) throw new HomologationGuardError("DATABASE_NAME é obrigatório.");
  if (!env.HOMOLOGATION_DATABASE || env.HOMOLOGATION_DATABASE !== env.DATABASE_NAME) throw new HomologationGuardError("HOMOLOGATION_DATABASE deve ser exatamente igual a DATABASE_NAME.");
  if (env.ASAAS_ENVIRONMENT === "production") throw new HomologationGuardError("ASAAS_ENVIRONMENT=production não é permitido na homologação.");
  if (!env.DATABASE_HOST || !env.DATABASE_USER || !env.DATABASE_PASSWORD) throw new HomologationGuardError("Configure DATABASE_HOST, DATABASE_USER e DATABASE_PASSWORD com acesso exclusivo de testes.");
  const port = Number(env.DATABASE_PORT || "3306");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new HomologationGuardError("DATABASE_PORT inválido.");
  return {
    host: env.DATABASE_HOST,
    port,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    ssl: env.DATABASE_SSL === "true" ? {} : undefined,
    connectTimeout: 5000,
  };
}

const identityQuery = "SELECT DATABASE() AS databaseName, CONNECTION_ID() AS connectionId, VERSION() AS serverVersion";
const tablesQuery = "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users','purchases','asaas_events','reseller_profiles','stock_movements')";
const indexesQuery = "SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users','purchases','asaas_events','reseller_profiles','stock_movements') ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX";

export async function inspectHomologation({ env = process.env, connect = options => mysql.createConnection(options) } = {}) {
  const config = validatePreflightConfig(env);
  let left;
  let right;
  try {
    // createConnection abre sockets distintos; não usar um pool compartilhado.
    left = await connect(config);
    right = await connect(config);
    const [[a], [b]] = await Promise.all([left.query(identityQuery), right.query(identityQuery)]);
    const first = a[0];
    const second = b[0];
    if (first?.databaseName !== config.database || second?.databaseName !== config.database) throw new HomologationGuardError("Banco conectado diverge de HOMOLOGATION_DATABASE; teste bloqueado.");
    if (!first?.connectionId || !second?.connectionId || first.connectionId === second.connectionId) throw new HomologationGuardError("Não foi possível provar duas conexões independentes; teste bloqueado.");

    const [[auto], [isolation], [legacyIsolation], [tables], [indexes]] = await Promise.all([
      left.query("SELECT @@autocommit AS autocommit"),
      left.query("SHOW VARIABLES LIKE 'transaction_isolation'"),
      left.query("SHOW VARIABLES LIKE 'tx_isolation'"),
      left.query(tablesQuery),
      left.query(indexesQuery),
    ]);
    const isolationSetting = isolation[0]?.Value || legacyIsolation[0]?.Value || "indisponível";
    const engineByTable = Object.fromEntries(tables.map(row => [row.TABLE_NAME, row.ENGINE]));
    const uniqueIndexes = indexes.filter(row => row.NON_UNIQUE === 0).map(row => ({ table: row.TABLE_NAME, index: row.INDEX_NAME, column: row.COLUMN_NAME }));
    return {
      status: "preflight_read_only",
      database: config.database,
      connectionIds: [first.connectionId, second.connectionId],
      serverVersion: first.serverVersion,
      autocommit: auto[0]?.autocommit ?? null,
      transactionIsolation: isolationSetting,
      engines: engineByTable,
      uniqueIndexes,
      advisory: "Somente metadados lidos; nenhum cenário concorrente, pagamento ou migration foi executado.",
    };
  } finally {
    await Promise.allSettled([left?.end(), right?.end()].filter(Boolean));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  inspectHomologation().then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch(error => {
    const safe = error instanceof HomologationGuardError ? error.message : "Conexão de homologação indisponível ou consulta de metadados falhou (detalhes internos omitidos).";
    process.stderr.write(`${safe}\n`);
    process.exitCode = 1;
  });
}
