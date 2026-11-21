<?php
/**
 * LORD NUTRI — verificação de transações MariaDB com DADOS SINTÉTICOS.
 *
 * Uso exclusivamente no banco de homologação confirmado pelo proprietário.
 * Cria uma tabela randômica lordnutri_hml_tx_*, insere linhas fictícias,
 * exercita concorrência InnoDB e tenta remover essa tabela ao final.
 * Não consulta nem altera tabelas de usuários, pedidos, estoque ou pagamentos.
 *
 * No Bash interativo (senha não aparece e não entra no histórico):
 *   IFS= read -r -s -p 'Senha MySQL (oculta): ' LN_HML_PASS; printf '\n'
 *   printf 'AUTORIZO_TABELA\n%s\n' "$LN_HML_PASS" | php homologacao-transacoes-mariadb.php --senha-stdin; unset LN_HML_PASS
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

if (!extension_loaded('mysqli')) {
    fwrite(STDERR, "ERRO: extensão mysqli indisponível.\n");
    exit(1);
}

if (!defined('STDIN') || ($argv[1] ?? null) !== '--senha-stdin' || stream_isatty(STDIN)) {
    fwrite(STDERR, "ERRO: execute com --senha-stdin e pipe protegido do Bash.\n");
    exit(1);
}

// Identificadores do banco de testes aprovados pelo proprietário; sem segredos.
const HOMOLOG_DB = 'u922332919_revmix10';
const HOMOLOG_USER = 'u922332919_revmix10';
const HOMOLOG_HOST = '127.0.0.1';
const HOMOLOG_PORT = 3306;

/** @return array<string, mixed> */
function singleRow(mysqli $db, string $sql): array
{
    $result = $db->query($sql);
    if (!$result instanceof mysqli_result) {
        throw new RuntimeException('Consulta de verificação sem resultado.');
    }

    try {
        return $result->fetch_assoc() ?: [];
    } finally {
        $result->free();
    }
}

function requireTrue(bool $condition, string $failure): void
{
    if (!$condition) {
        throw new RuntimeException($failure);
    }
}

/** Confirma que a operação realmente falhou com o código MySQL esperado. */
function expectSqlError(callable $operation, int $expectedCode, string $failure): void
{
    try {
        $operation();
    } catch (mysqli_sql_exception $error) {
        requireTrue((int) $error->getCode() === $expectedCode, $failure . ' (código inesperado: ' . (int) $error->getCode() . ')');
        return;
    }

    throw new RuntimeException($failure . ' (operação não foi bloqueada)');
}

/** Entrada exclusivamente por pipe; o Bash já recebeu a senha via read -s. */
function secretFromPipe(): string
{
    $line = fgets(STDIN);
    if ($line === false) {
        throw new RuntimeException('Senha não recebida pelo pipe.');
    }

    $secret = rtrim($line, "\r\n");
    requireTrue($secret !== '', 'Senha vazia: execução interrompida.');
    return $secret;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$connectionA = null;
$connectionB = null;
$table = 'lordnutri_hml_tx_' . bin2hex(random_bytes(6));
$tableCreated = false;
$tableRemoved = false;
$testsPassed = false;
$testError = null;

try {
    fwrite(STDOUT, "LORD NUTRI — Homologação REAL de transações InnoDB em tabela sintética\n");
    fwrite(STDOUT, 'Banco obrigatório: ' . HOMOLOG_DB . "\n");
    fwrite(STDOUT, "Não executa chamadas Asaas, webhook, envio de mensagens ou SQL em tabelas do CRM.\n");
    fwrite(STDOUT, "ATENÇÃO: cria e remove uma tabela própria neste banco de testes.\n");

    $confirmation = fgets(STDIN);
    requireTrue(trim((string) $confirmation) === 'AUTORIZO_TABELA', 'Confirmação AUTORIZO_TABELA ausente.');

    $password = secretFromPipe();
    $connectionA = mysqli_init();
    $connectionA->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connectionA->real_connect(HOMOLOG_HOST, HOMOLOG_USER, $password, HOMOLOG_DB, HOMOLOG_PORT);

    $connectionB = mysqli_init();
    $connectionB->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connectionB->real_connect(HOMOLOG_HOST, HOMOLOG_USER, $password, HOMOLOG_DB, HOMOLOG_PORT);
    unset($password);

    $a = singleRow($connectionA, 'SELECT CONNECTION_ID() AS id, DATABASE() AS db, VERSION() AS version');
    $b = singleRow($connectionB, 'SELECT CONNECTION_ID() AS id, DATABASE() AS db');
    requireTrue(($a['db'] ?? '') === HOMOLOG_DB && ($b['db'] ?? '') === HOMOLOG_DB, 'Banco diferente do autorizado: nenhuma tabela foi criada.');
    requireTrue(isset($a['id'], $b['id']) && (int) $a['id'] !== (int) $b['id'], 'As conexões não são independentes.');
    fwrite(STDOUT, "[OK] MariaDB {$a['version']}; sessões A={$a['id']}, B={$b['id']}\n");

    // Limite apenas da conexão B, nunca GLOBAL. Mantém o teste abaixo de 20 s.
    $connectionB->query('SET SESSION innodb_lock_wait_timeout = 2');

    // Publicar o identificador ANTES do CREATE para facilitar limpeza se o
    // processo for interrompido abruptamente entre a criação e o DROP.
    fwrite(STDOUT, "[INFO] Nome reservado para a tabela sintética: {$table}\n");
    // CREATE sem IF NOT EXISTS: nunca assumir posse de uma tabela preexistente.
    $connectionA->query("CREATE TABLE `{$table}` (id INT NOT NULL PRIMARY KEY, contador INT NOT NULL) ENGINE=InnoDB");
    $tableCreated = true;
    fwrite(STDOUT, "[INFO] Tabela sintética criada: {$table}\n");
    $engine = singleRow(
        $connectionA,
        "SELECT ENGINE AS mecanismo FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$table}'"
    );
    requireTrue(strtoupper((string) ($engine['mecanismo'] ?? '')) === 'INNODB', 'Tabela não foi criada com InnoDB.');

    $connectionA->query("INSERT INTO `{$table}` (id, contador) VALUES (1, 0)");

    // A mantém row lock. B tenta alterar a MESMA linha e deve receber 1205.
    $connectionA->begin_transaction();
    $connectionA->query("UPDATE `{$table}` SET contador = contador + 1 WHERE id = 1");
    $connectionB->begin_transaction();
    expectSqlError(
        static fn() => $connectionB->query("UPDATE `{$table}` SET contador = contador + 1 WHERE id = 1"),
        1205,
        'A linha não respeitou o bloqueio InnoDB entre A e B'
    );
    $connectionB->rollback();
    $connectionA->commit();
    requireTrue((int) (singleRow($connectionB, "SELECT contador FROM `{$table}` WHERE id = 1")['contador'] ?? -1) === 1, 'A primeira transação não persistiu exatamente um incremento.');
    fwrite(STDOUT, "[OK] Row lock: B recebeu timeout 1205; A confirmou exatamente um incremento.\n");

    // Um rollback deve desfazer o incremento sem afetar o commit anterior.
    $connectionB->begin_transaction();
    $connectionB->query("UPDATE `{$table}` SET contador = contador + 5 WHERE id = 1");
    $connectionB->rollback();
    requireTrue((int) (singleRow($connectionA, "SELECT contador FROM `{$table}` WHERE id = 1")['contador'] ?? -1) === 1, 'Rollback não preservou o último valor confirmado.');
    fwrite(STDOUT, "[OK] Rollback da sessão B preservou o valor confirmado.\n");

    $connectionB->begin_transaction();
    $connectionB->query("UPDATE `{$table}` SET contador = contador + 1 WHERE id = 1");
    $connectionB->commit();
    requireTrue((int) (singleRow($connectionA, "SELECT contador FROM `{$table}` WHERE id = 1")['contador'] ?? -1) === 2, 'Segundo commit válido não somou exatamente um incremento.');
    fwrite(STDOUT, "[OK] Segundo commit aplicou um incremento, sem perda de atualização.\n");

    // Unicidade: B não consegue inserir uma chave que A ainda não confirmou.
    $connectionA->begin_transaction();
    $connectionA->query("INSERT INTO `{$table}` (id, contador) VALUES (2, 1)");
    $connectionB->begin_transaction();
    expectSqlError(
        static fn() => $connectionB->query("INSERT INTO `{$table}` (id, contador) VALUES (2, 1)"),
        1205,
        'INSERT concorrente não respeitou a unicidade durante a transação A'
    );
    $connectionB->rollback();
    $connectionA->commit();
    expectSqlError(
        static fn() => $connectionB->query("INSERT INTO `{$table}` (id, contador) VALUES (2, 1)"),
        1062,
        'A chave primária não bloqueou fato sintético duplicado após o commit'
    );
    requireTrue((int) (singleRow($connectionA, "SELECT COUNT(*) AS quantidade FROM `{$table}` WHERE id = 2")['quantidade'] ?? -1) === 1, 'Chave duplicada produziu quantidade de fatos diferente de um.');
    fwrite(STDOUT, "[OK] Chave única: B esperou/expirou (1205), depois duplicidade bloqueada (1062).\n");

    $testsPassed = true;
} catch (mysqli_sql_exception $error) {
    // Não imprimir SQL, parâmetros ou credenciais: somente código numérico seguro.
    $testError = 'Consulta/conexão falhou (código MariaDB ' . (int) $error->getCode() . ').';
} catch (Throwable $error) {
    $testError = $error->getMessage();
} finally {
    // Todas as transações residuais são desfeitas antes de DROP TABLE.
    foreach ([$connectionB, $connectionA] as $connection) {
        if ($connection instanceof mysqli) {
            try {
                $connection->rollback();
            } catch (Throwable $ignored) {
                // Desconexão também desfaz transações InnoDB não confirmadas.
            }
        }
    }

    if ($tableCreated && $connectionA instanceof mysqli) {
        try {
            // Somente a tabela randômica que ESTE processo conseguiu criar.
            $connectionA->query("DROP TABLE `{$table}`");
            $tableRemoved = true;
            fwrite(STDOUT, "[OK] Tabela sintética removida: {$table}\n");
        } catch (Throwable $ignored) {
            fwrite(STDERR, "[ALERTA] Não foi possível remover a tabela: {$table}\n");
            fwrite(STDERR, "Solicite revisão manual EXCLUSIVAMENTE dessa tabela de testes.\n");
        }
    }

    foreach ([$connectionB, $connectionA] as $connection) {
        if ($connection instanceof mysqli) {
            try {
                $connection->close();
            } catch (Throwable $ignored) {
                // Fechamento best effort.
            }
        }
    }
}

if ($testsPassed && $tableRemoved) {
    fwrite(STDOUT, "RESULTADO: APROVADO - row locks, transações, rollback e chave única no MariaDB.\n");
    fwrite(STDOUT, "PENDENTE: handlers reais do CRM, auditoria Asaas persistente e matriz financeira com mock.\n");
    exit(0);
}

fwrite(STDERR, 'RESULTADO: NÃO APROVADO - ' . ($testError ?? 'limpeza da tabela sintética não confirmada.') . "\n");
exit(1);
