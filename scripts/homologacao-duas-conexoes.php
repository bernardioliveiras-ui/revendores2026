<?php
/**
 * LORD NUTRI - verificação LEITURA/SOMENTE de duas conexões MariaDB reais.
 *
 * Execução exclusiva via SSH/CLI, fora de public_html:
 *   php homologacao-duas-conexoes.php
 *
 * NÃO executa INSERT, UPDATE, DELETE, CREATE, ALTER, DROP ou transações
 * financeiras. GET_LOCK/RELEASE_LOCK são bloqueios temporários da sessão,
 * sem alterar registros. Não comprova lock de linha, estoque ou idempotência.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

if (!extension_loaded('mysqli')) {
    fwrite(STDERR, "ERRO: extensão mysqli indisponível. Execute: php -m | grep -i mysqli\n");
    exit(1);
}

// A Hostinger pode desabilitar exec() no PHP CLI. Nesse caso, o Bash recebe
// a senha com `read -s` e a entrega por pipe (sem argumentos, disco ou env).
$passwordFromStdin = in_array('--senha-stdin', $argv ?? [], true);

if (!defined('STDIN') || (!$passwordFromStdin && (!stream_isatty(STDIN) || !function_exists('exec')))) {
    fwrite(STDERR, "ERRO: use terminal SSH com entrada protegida, ou --senha-stdin via pipe do Bash.\n");
    exit(1);
}

if ($passwordFromStdin && stream_isatty(STDIN)) {
    fwrite(STDERR, "ERRO: --senha-stdin exige um pipe; nunca digite a senha visivelmente no PHP.\n");
    exit(1);
}

// Identificação pública do banco declaradamente de testes. Nenhuma senha no arquivo.
const HOMOLOG_DB = 'u922332919_revmix10';
const HOMOLOG_USER = 'u922332919_revmix10';
const HOMOLOG_HOST = '127.0.0.1';
const HOMOLOG_PORT = 3306;

/**
 * Digitação sem eco. Se não for possível ocultar a senha, interrompe.
 */
function readSecret(string $prompt): string
{
    $exitCode = 1;
    exec('stty -echo < /dev/tty 2>/dev/null', $unusedOutput, $exitCode);
    if ($exitCode !== 0) {
        throw new RuntimeException('Não foi possível ativar entrada protegida.');
    }

    try {
        fwrite(STDOUT, $prompt);
        $value = fgets(STDIN);
    } finally {
        exec('stty echo < /dev/tty 2>/dev/null');
        fwrite(STDOUT, "\n");
    }

    if ($value === false) {
        throw new RuntimeException('Entrada de senha interrompida.');
    }

    return rtrim($value, "\r\n");
}

/** A senha deve chegar apenas pelo pipe criado pelo `read -s` no Bash. */
function readPipedSecret(): string
{
    $value = fgets(STDIN);
    if ($value === false) {
        throw new RuntimeException('Senha não recebida pelo pipe.');
    }
    $secret = rtrim($value, "\r\n");
    if ($secret === '') {
        throw new RuntimeException('Senha vazia; execução interrompida.');
    }
    return $secret;
}

/** @return array<string, mixed> */
function queryOne(mysqli $db, string $sql): array
{
    $result = $db->query($sql);
    if (!$result instanceof mysqli_result) {
        throw new RuntimeException('Consulta não retornou um resultado.');
    }
    try {
        return $result->fetch_assoc() ?: [];
    } finally {
        $result->free();
    }
}

function assertValue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$connectionA = null;
$connectionB = null;
$lockName = 'lordnutri_hml_' . bin2hex(random_bytes(8));
$safeLockName = null;
$result = 1;

try {
    fwrite(STDOUT, "LORD NUTRI - Homologação MariaDB (somente leitura + lock temporário)\n");
    fwrite(STDOUT, 'Banco previsto: ' . HOMOLOG_DB . "\n");
    fwrite(STDOUT, "Atenção: confirme antes que é EXCLUSIVAMENTE um banco de testes.\n");
    fwrite(STDOUT, "Digite HOMOLOGACAO para continuar: ");
    $confirmation = fgets(STDIN);
    assertValue(trim((string) $confirmation) === 'HOMOLOGACAO', 'Confirmação de ambiente não fornecida.');

    $password = $passwordFromStdin
        ? readPipedSecret()
        : readSecret('Senha MySQL (não aparece na tela): ');

    $connectionA = mysqli_init();
    $connectionA->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connectionA->real_connect(HOMOLOG_HOST, HOMOLOG_USER, $password, HOMOLOG_DB, HOMOLOG_PORT);

    $connectionB = mysqli_init();
    $connectionB->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connectionB->real_connect(HOMOLOG_HOST, HOMOLOG_USER, $password, HOMOLOG_DB, HOMOLOG_PORT);

    unset($password);

    $a = queryOne($connectionA, 'SELECT CONNECTION_ID() AS sessao, DATABASE() AS banco, VERSION() AS versao, @@SESSION.wait_timeout AS timeout_s');
    $b = queryOne($connectionB, 'SELECT CONNECTION_ID() AS sessao, DATABASE() AS banco, @@SESSION.wait_timeout AS timeout_s');

    assertValue(($a['banco'] ?? '') === HOMOLOG_DB && ($b['banco'] ?? '') === HOMOLOG_DB, 'A conexão não aponta para o banco previsto.');
    assertValue(isset($a['sessao'], $b['sessao']) && (int) $a['sessao'] !== (int) $b['sessao'], 'As sessões não são distintas.');

    fwrite(STDOUT, "[OK] MariaDB: {$a['versao']}\n");
    fwrite(STDOUT, "[OK] Sessão A: {$a['sessao']}; sessão B: {$b['sessao']} (distintas)\n");
    fwrite(STDOUT, "[INFO] Timeout A: {$a['timeout_s']}s; B: {$b['timeout_s']}s\n");

    $safeLockName = $connectionA->real_escape_string($lockName);

    $first = queryOne($connectionA, "SELECT GET_LOCK('{$safeLockName}', 0) AS adquirido");
    assertValue((int) ($first['adquirido'] ?? -1) === 1, 'Sessão A não conseguiu adquirir bloqueio temporário.');
    fwrite(STDOUT, "[OK] Sessão A adquiriu o bloqueio temporário.\n");

    $owner = queryOne($connectionB, "SELECT IS_USED_LOCK('{$safeLockName}') AS dono");
    assertValue((int) ($owner['dono'] ?? -1) === (int) $a['sessao'], 'Sessão B não observou A como titular do bloqueio.');
    fwrite(STDOUT, "[OK] Sessão B identificou A como titular do bloqueio.\n");

    $rejected = queryOne($connectionB, "SELECT GET_LOCK('{$safeLockName}', 0) AS adquirido");
    assertValue((int) ($rejected['adquirido'] ?? -1) === 0, 'Sessão B conseguiu adquirir bloqueio ocupado; resultado inesperado.');
    fwrite(STDOUT, "[OK] Sessão B não adquiriu o bloqueio ocupado (sem espera).\n");

    $releasedA = queryOne($connectionA, "SELECT RELEASE_LOCK('{$safeLockName}') AS liberado");
    assertValue((int) ($releasedA['liberado'] ?? -1) === 1, 'Sessão A não conseguiu liberar seu bloqueio.');

    $acquiredB = queryOne($connectionB, "SELECT GET_LOCK('{$safeLockName}', 0) AS adquirido");
    assertValue((int) ($acquiredB['adquirido'] ?? -1) === 1, 'Sessão B não adquiriu bloqueio após liberação por A.');

    $releasedB = queryOne($connectionB, "SELECT RELEASE_LOCK('{$safeLockName}') AS liberado");
    assertValue((int) ($releasedB['liberado'] ?? -1) === 1, 'Sessão B não conseguiu liberar seu bloqueio.');
    fwrite(STDOUT, "[OK] Sessão B adquiriu e liberou o bloqueio após A.\n");

    fwrite(STDOUT, "RESULTADO: APROVADO - duas conexões e bloqueio consultivo real.\n");
    fwrite(STDOUT, "PENDENTE: row locks/transações em dados sintéticos, webhooks e auditoria persistente.\n");
    fwrite(STDOUT, "Nenhum pedido, estoque, cashback ou pagamento foi alterado.\n");
    $result = 0;
} catch (Throwable $error) {
    // Mensagem do teste é controlada; nunca reproduzir exceções de driver contendo dados sensíveis.
    $message = $error instanceof mysqli_sql_exception
        ? 'Falha de conexão/consulta MySQL (código ' . $error->getCode() . ').'
        : $error->getMessage();
    fwrite(STDERR, "RESULTADO: NÃO APROVADO - {$message}\n");
} finally {
    // Caso o teste pare no meio, liberar ambos os locks antes de encerrar.
    if ($safeLockName !== null) {
        foreach ([$connectionA, $connectionB] as $connection) {
            if ($connection instanceof mysqli) {
                try {
                    $connection->query("SELECT RELEASE_LOCK('{$safeLockName}')");
                } catch (Throwable $ignored) {
                    // A desconexão também libera os bloqueios consultivos.
                }
            }
        }
    }
    foreach ([$connectionA, $connectionB] as $connection) {
        if ($connection instanceof mysqli) {
            try {
                $connection->close();
            } catch (Throwable $ignored) {
                // Fechamento best-effort.
            }
        }
    }
}

exit($result);
