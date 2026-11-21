# MariaDB Synthetic Row-Lock Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar um teste CLI de transações concorrentes InnoDB usando exclusivamente uma tabela sintética isolada no banco de homologação autorizado.

**Architecture:** Um único script PHP independente da aplicação usa duas conexões `mysqli` autenticadas por senha transitória recebida em pipe, cria tabela com nome aleatório, testa locks/rollback/PK e remove somente sua própria tabela. Não consulta nem altera dados de negócios; não dispara APIs externas.

**Tech Stack:** PHP 8.2 CLI, `mysqli`, MariaDB 11.8, Node.js `node:test` para guardas estáticas de escopo.

**Spec:** `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md`; aprovação expressa do responsável em 20/11/2026 para criar e remover tabela sintética no banco `u922332919_revmix10` declarado exclusivamente de testes.

## Global Constraints

- Sem produção, sem alteração em tabelas `purchases`, `users`, `reseller_profiles`, `stock_movements`, `asaas_events` ou outras tabelas de negócios.
- Sem cobranças, repasses, webhooks reais, e-mail/WhatsApp, cashback ou migrations financeiras.
- `CREATE TABLE` sem `IF NOT EXISTS`, nome randômico prefixado `lordnutri_hml_tx_`, engine InnoDB; `DROP TABLE` apenas da tabela criada pelo próprio processo.
- Tratar exceções, fazer rollback nas duas sessões e tentar limpar a tabela em `finally`; se falhar, exibir nome exato para remoção manual após verificação.
- Nenhuma senha em arquivos, argumentos, logs ou variáveis de ambiente; usar Bash `read -s` e pipe para o PHP CLI.
- Não declarar concorrência do **handler da aplicação** validada por este teste de banco.

## Review Focus

1. Se o processo falhar no meio, a limpeza deve restringir-se à sua tabela e registrar alerta se falhar.
2. Se o banco ou sessões não corresponderem à instância autorizada, interromper antes de criar a tabela.
3. Se não houver disputa real de row lock, o teste não pode exibir resultado aprovado.
4. O timeout de B deve ser de sessão (não global) e não deve alterar parâmetros da instância.
5. Nenhum detalhe sensível de exceções de conexão pode aparecer no terminal.

## Task 1: Verificador sintético de transações

**Files:**
- Create: `tests/homologacao-transacoes-script.test.mjs`
- Create: `scripts/homologacao-transacoes-mariadb.php`

**Interfaces:** executável CLI `php homologacao-transacoes-mariadb.php --senha-stdin`; entrada via pipe com linhas `AUTORIZO_TABELA` e senha; código de saída 0 somente após todas as validações e limpeza.

- [x] **Step 1:** Criar teste `node:test` que exige CLI-only, identidade exata do banco, confirmação explícita, InnoDB, lock timeout da sessão, rollback, verificação de PK e cleanup próprio.
- [x] **Step 2:** Executar `node --test tests/homologacao-transacoes-script.test.mjs` e observar falha pela ausência do script.
- [x] **Step 3:** Implementar script mínimo com duas conexões e apenas tabela sintética.
- [x] **Step 4:** Executar teste específico (3/3); executar `git diff --check` (aprovado). A sintaxe PHP só pode ser validada pelo responsável via `php -l` no SSH (o executor não tem PHP).
- [ ] **Step 5:** Entregar arquivo e comandos manuais, sem executar SQL no servidor daqui e sem commitar.

## Limite do aceite

Sucesso do script valida locks/constraints/rollback **do MariaDB**, não transações dos endpoints, Asaas, estoque ou acessos reais. Lote 1 continua bloqueado.
