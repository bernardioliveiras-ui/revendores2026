<?php
/**
 * LORD NUTRI — instalação MANUAL e ADITIVA da auditoria NÃO FINANCEIRA.
 *
 * Somente para o banco de homologação confirmado pelo responsável.
 * A tabela permanece no banco, diferente das fixtures descartáveis.
 * Não cria cobrança, não consulta Asaas e não modifica tabelas existentes.
 *
 * Na sessão SSH Bash (senha protegida; nenhum segredo em argumentos):
 *   IFS= read -r -s -p 'Senha MySQL (oculta): ' LN_HML_PASS; printf '\n'
 *   printf 'AUTORIZO_AUDITORIA_PERSISTENTE\n%s\n' "$LN_HML_PASS" | php homologacao-criar-auditoria.php --senha-stdin; unset LN_HML_PASS
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

const HOMOLOG_DB = 'u922332919_revmix10';
const HOMOLOG_USER = 'u922332919_revmix10';
const HOMOLOG_HOST = '127.0.0.1';
const HOMOLOG_PORT = 3306;

/** @return array<string, mixed> */
function auditQueryRow(mysqli $db, string $sql): array
{
    $result = $db->query($sql);
    if (!$result instanceof mysqli_result) {
        throw new RuntimeException('Consulta não retornou dados de validação.');
    }

    try {
        return $result->fetch_assoc() ?: [];
    } finally {
        $result->free();
    }
}

$db = null;
$created = false;
$ok = false;
$errorMessage = null;

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    fwrite(STDOUT, "LORD NUTRI — Criação manual de tabela NÃO FINANCEIRA de auditoria Asaas\n");
    fwrite(STDOUT, 'Banco obrigatório: ' . HOMOLOG_DB . "\n");
    fwrite(STDOUT, "A tabela será PERSISTENTE; não será excluída automaticamente.\n");

    $confirmation = fgets(STDIN);
    if (trim((string) $confirmation) !== 'AUTORIZO_AUDITORIA_PERSISTENTE') {
        throw new RuntimeException('Confirmação específica ausente; nenhuma tabela criada.');
    }

    $passwordLine = fgets(STDIN);
    if ($passwordLine === false || rtrim($passwordLine, "\r\n") === '') {
        throw new RuntimeException('Senha não recebida pelo pipe protegido.');
    }
    $password = rtrim($passwordLine, "\r\n");
    unset($passwordLine);

    $db = mysqli_init();
    $db->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $db->real_connect(HOMOLOG_HOST, HOMOLOG_USER, $password, HOMOLOG_DB, HOMOLOG_PORT);
    unset($password);

    $identity = auditQueryRow($db, 'SELECT DATABASE() AS banco, CURRENT_USER() AS usuario, VERSION() AS versao');
    if (($identity['banco'] ?? null) !== HOMOLOG_DB || !str_starts_with((string) ($identity['usuario'] ?? ''), HOMOLOG_USER . '@')) {
        throw new RuntimeException('Banco ou usuário diferente do ambiente autorizado; nenhuma tabela criada.');
    }
    fwrite(STDOUT, "[OK] Banco {$identity['banco']}; MariaDB {$identity['versao']}\n");

    $existing = auditQueryRow($db, "SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asaas_reconciliation_audit'");
    if ((int) ($existing['total'] ?? -1) !== 0) {
        throw new RuntimeException('A tabela asaas_reconciliation_audit já existe; nada foi alterado. Verifique o schema antes de prosseguir.');
    }

    // Schema idêntico à proposta aprovada; NÃO contém valores ou fatos financeiros.
    $db->query(<<<'SQL'
CREATE TABLE asaas_reconciliation_audit (
  record_id CHAR(36) NOT NULL PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  phase ENUM('started','finished') NOT NULL,
  request_id VARCHAR(96) NOT NULL,
  actor_id VARCHAR(80) NULL,
  purchase_id VARCHAR(80) NULL,
  payment_id VARCHAR(120) NULL,
  configured_environment ENUM('sandbox','production') NULL,
  consulted_environment ENUM('sandbox','production') NULL,
  endpoint_action VARCHAR(96) NOT NULL,
  safe_error_code VARCHAR(64) NULL,
  http_status SMALLINT UNSIGNED NULL,
  reason_summary VARCHAR(180) NULL,
  outcome ENUM('started','approved','rejected','provider_error','internal_error') NOT NULL,
  provider_consulted TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at DATETIME(3) NOT NULL,
  UNIQUE INDEX uq_ara_attempt_phase (attempt_id, phase),
  INDEX idx_ara_purchase_time (purchase_id, attempted_at),
  INDEX idx_ara_payment_time (payment_id, attempted_at),
  INDEX idx_ara_request (request_id),
  INDEX idx_ara_outcome_time (outcome, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );
    $created = true;
    fwrite(STDOUT, "[OK] Tabela asaas_reconciliation_audit criada; permanece no banco.\n");

    $metadata = auditQueryRow($db, "SELECT t.ENGINE AS mecanismo, (SELECT COUNT(*) FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = t.TABLE_NAME) AS colunas FROM information_schema.TABLES t WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'asaas_reconciliation_audit'");
    if (strtoupper((string) ($metadata['mecanismo'] ?? '')) !== 'INNODB' || (int) ($metadata['colunas'] ?? 0) !== 16) {
        throw new RuntimeException('Tabela criada, mas a verificação de engine/colunas falhou: revise antes de utilizar.');
    }

    fwrite(STDOUT, "[OK] Estrutura InnoDB verificada: 16 colunas, índices na criação.\n");
    fwrite(STDOUT, "[INFO] Nenhuma linha de auditoria foi inserida; o backend ainda não foi ativado.\n");
    $ok = true;
} catch (mysqli_sql_exception $error) {
    // Não imprimir mensagens do driver que possam conter parâmetros/credenciais.
    $errorMessage = 'Operação MySQL interrompida (código ' . (int) $error->getCode() . ').';
} catch (Throwable $error) {
    $errorMessage = $error->getMessage();
} finally {
    if ($db instanceof mysqli) {
        try {
            $db->close();
        } catch (Throwable $ignored) {
            // Não mascarar erro original de auditoria.
        }
    }
}

if ($ok) {
    fwrite(STDOUT, "RESULTADO: APROVADO - tabela de auditoria não financeira criada e verificada.\n");
    fwrite(STDOUT, "PENDENTE: implementar e testar a gravação persistente no handler BKO.\n");
    exit(0);
}

if ($created) {
    fwrite(STDERR, "[ALERTA] A tabela PODE TER SIDO CRIADA E NÃO DEVE SER EXCLUÍDA AUTOMATICAMENTE.\n");
}
fwrite(STDERR, 'RESULTADO: NÃO APROVADO - ' . ($errorMessage ?? 'Erro não classificado.') . "\n");
exit(1);
