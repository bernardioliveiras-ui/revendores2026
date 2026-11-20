# LORD NUTRI — resultado da preparação de auditoria Asaas / MySQL

**Data:** 20/11/2026. **Conclusão:** **Lote 1 bloqueado; homologação MySQL real e auditoria persistente não concluídas**.

## Entrega nesta sessão

1. Proposta de tabela **não financeira** `asaas_reconciliation_audit`, sem DDL executado: `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`.
2. Plano TDD para implementação posterior, sujeito à aprovação do schema: `docs/superpowers/plans/2026-11-20-asaas-auditoria-homologacao.md`.
3. Protocolo de matriz com **duas conexões MySQL distintas**, locks, rollback, estorno, parcelas, IDs distintos de webhook e contagens SQL: `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md`.

**Arquivos de aplicação, testes existentes, `db/schema.ts` e migrations alterados nesta sessão:** nenhum. **Auditoria persistente em execução:** não; aguardando autorização e banco. Esta entrega é uma especificação, opção explicitamente prevista na solicitação.

## Resultado das verificações

| Verificação | Comando efetivo | Resultado |
|---|---|---|
| Suíte | `npx --yes --package=node@22 -c 'npm test'` | **327 testes; 317 pass; 10 fail**, exatamente as falhas legadas reportadas antes; nenhum teste novo falhou |
| Matriz mock | `npx --yes --package=node@22 -c 'node --experimental-strip-types --test tests/lote0-homologation-mock.test.mjs'` | **13 pass / 0 fail**; usa `memoryDb`, não MySQL |
| TypeScript | `npx --yes --package=node@22 -c './node_modules/.bin/tsc --noEmit'` | **aprovado**, exit 0 |
| Lint | `npx --yes --package=node@22 -c 'npm run lint'` | **349 erros, 222 avisos**, baseline preexistente; exit 1, não corrigido |
| Build | `npx --yes --package=node@22 -c 'npm run build'` | **aprovado**, Next.js 16.2.6, exit 0 |
| MySQL/MariaDB | `command -v mysql`, `mysqld`, `mariadbd`, `docker`, `podman`; `.env` inexistente | **indisponível**; nenhum comando SQL, nenhuma conexão real |
| Concorrência MySQL | duas conexões reais | **NÃO EXECUTADA** — infraestrutura ausente |
| Auditoria persistida | `INSERT/SELECT` em `asaas_reconciliation_audit` | **NÃO EXECUTADA** — tabela é somente proposta |
| Verificação de diff | `git diff --check` | **aprovado**, exit 0; nenhum whitespace error |

### As 10 falhas legadas, preservadas

- Reposição do revendedor que cria cobrança Asaas e provisiona estoque.
- Contrato legado de colunas persistentes e cobrança via webhook idempotente.
- Dois testes de identidade/conteúdo de landing page.
- Três testes de parcelas (estorno posterior, confirmação de parcela posterior e vínculo por referência).
- Dois testes de estorno e estoque antes/depois da expedição.
- Provisionamento da compra inicial via webhook.

As falhas são **riscos anteriores à proposta**, não foram alteradas nem declaradas resolvidas. Seus nomes detalhados e a matriz anterior estão em `docs/lote0-baseline.md` e `docs/lote0-homologacao-parcial-2026-11-20.md`.

## Schema e exemplos redigidos

O schema proposto possui `record_id`, `attempt_id`, `phase`, `request_id`, `actor_id`, `purchase_id`, `payment_id`, `configured_environment`, `consulted_environment`, `endpoint_action`, `safe_error_code`, `http_status`, `reason_summary`, `outcome`, `provider_consulted` e `attempted_at`, com índices por tentativa, pedido, pagamento e resultado. A proposta SQL completa e dois exemplos JSON sintéticos estão no documento de desenho.

O modelo prevê um `started` antes de mutações e um `finished` antes da resposta. Se a segunda gravação falhar, o início ainda precisa ser visível para alerta; **a garantia de atomicidade entre auditoria final e o webhook atual não foi demonstrada**. Não armazenar token, CPF, raw payload, mensagem técnica do Asaas, chave ou stack.

## Riscos e portões restantes

1. MySQL separado de homologação, com autorização expressa e dataset sintético.
2. Aprovação específica da **migration não financeira** para `asaas_reconciliation_audit`; nenhuma migration foi aplicada ou adicionada à pasta de execução.
3. Implementação TDD de escrita persistente e captura do ambiente efetivamente usado pelo transporte Asaas; erro 502 seguro deve ser auditado antes da resposta.
4. Execução dos 12 cenários + indisponibilidade com duas conexões MySQL reais, incluindo locks e asserções SQL de idempotência.
5. Nenhuma nova falha de teste/build ou alteração de fluxo financeiro; reavaliar riscos das dez falhas legadas sem reescrevê-las por conveniência.

**Estado Git verificado:** `HEAD` e `main` ambos em `bc1beeda2d34bcc0380343a9982228de14926034`, branch `codex/lord-nutri-lote0-20261120`. As alterações de código e testes do Lote 0 anterior permanecem locais e não foram modificadas neste passo; somente quatro documentos novos foram criados.

**Decisão objetiva:** **NÃO LIBERAR LOTE 1**; nenhum cashback de R$ 20/caixa ativado. Nenhum commit/PR/deploy, cobrança, repasse ou mensagem real efetuado nesta sessão.
