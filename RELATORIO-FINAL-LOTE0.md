# LORD NUTRI / MIX10 PRO — relatório final da entrega completa Lote 0

**Data:** 20/11/2026 · **Natureza:** ZIP de código-fonte completo para upload manual posterior, **sem deploy**.

## 1. Rastreabilidade

| Item | Valor |
|---|---|
| Projeto | `mix10-pro-revendedores@1.8.1` |
| Repositório de referência | `bernardioliveiras-ui/revendores2026` |
| Commit base `main` | `bc1beeda2d34bcc0380343a9982228de14926034` |
| Commit local Lote 0 incluído | `f6261cdc71aa23c291ec722dd05a305cf58a276c` |
| Branch local | `codex/lord-nutri-lote0-20261120` |
| Node usado nos testes | `v22.23.5` |
| Framework | Next.js `16.2.6` (webpack), React `19.2.6`, TypeScript `5.9.3` |
| Banco | MySQL (somente configuração/repositório; **nenhuma conexão realizada**) |
| Flag V2 | `INFLUENCER_POLICY_V2_ENABLED=false` **reservada, sem código de ativação** |

## 2. Escopo de alterações Lote 0

**Arquivos do commit de correção (16):**

| Arquivo | Mudança |
|---|---|
| `app/api/auth/login/route.ts` | Promove revendedor de `ADMIN_EMAILS` só após senha válida e lockout liberado |
| `lib/auth.ts` | Sessão respeita role persistido; não eleva por e-mail implicitamente |
| `app/api/admin/orders/route.ts` | PATCH legado encaminha confirmação à validação Asaas, sem `paid` artificial |
| `app/api/admin/orders/sync/route.ts` | Valida payment ID, status, vínculo, valor em centavos, customer, parcela e ambiente identificável |
| `app/api/admin/access/route.ts` | Exige status pago e `asaasVerifiedAt` para acesso e operações sensíveis |
| `lib/purchase-fields.ts` | Projeta timestamp de verificação para as validações de acesso |
| `app/painel/portal-client.tsx` | BKO apresenta consulta Asaas em vez de confirmação manual |
| `tests/auth-runtime.test.mjs` | Regressão de autenticação |
| `tests/session-runtime.test.mjs` | Regressão de sessão e papel |
| `tests/backoffice-runtime.test.mjs` | Regressão do BKO |
| `tests/payment-sync-runtime.test.mjs` | Regressão da conciliação |
| `tests/portal-unauthorized-runtime.test.mjs` | Ownership/erro de acesso |
| `tests/manual-welcome-v26.test.mjs` | Fixture de pagamento verificado |
| `tests/lote0-payment-gate.test.mjs` | Regressão dos gates Asaas e acesso |
| `tests/lote0-homologation-mock.test.mjs` | 13 cenários sintéticos de integração |
| `docs/lote0-baseline.md` | Baseline, matriz e rollback |

**Diferença do commit:** 16 arquivos; **516 inserções, 45 exclusões**. **Nenhuma migration nova ou financeira.**

**Documentos de empacotamento e suporte, fora do commit original:** `.env.example` com `INFLUENCER_POLICY_V2_ENABLED=false` reservado, `HOSTINGER-DEPLOY.md` com aviso de pré-migração, este relatório, `README-ENTREGA.md` e cinco documentos de homologação/auditoria ainda pendentes em `docs`. **Nenhum código de negócio, migration ou teste foi alterado durante o empacotamento.**

## 3. Comandos de validação — execução isolada em 20/11/2026

O runtime padrão deste executor difere do projeto; os comandos `npm` abaixo foram executados com Node **22.23.5** via `npx --yes --package=node@22 -c '<comando>'`.

| Comando lógico exigido | Resultado observado | Exit | Avaliação |
|---|---|---|---|
| `npm test` | **327 testes, 317 aprovados, 10 falhos** | 1 | Mesmos 10 nomes legados; **zero falhas novas** |
| `node --experimental-strip-types --test tests/lote0-homologation-mock.test.mjs` | **13/13 aprovados** | 0 | Simulação, não MySQL real |
| `npm run lint` | **571 ocorrências: 349 erros, 222 avisos** | 1 | Baseline legado; lint **não aprovado** |
| `npx tsc --noEmit` | Nenhum erro TypeScript | 0 | **Aprovado** (invocado como `./node_modules/.bin/tsc --noEmit`) |
| `npm run build` | Next.js 16.2.6, webpack, build e TypeScript concluídos, 60 páginas estáticas geradas | 0 | **Aprovado** |
| `git diff --check` | Nenhum problema reportado | 0 | **Aprovado** |

**Importante:** não declarar a suíte completa nem o lint como verdes. O sucesso do build **não equivale** a aprovação para produção. Testes, build e lint não criaram cobranças, e-mails ou mensagens reais.

## 4. Matriz das dez falhas legadas preservadas

| # | Nome do teste (resumo) | Arquivo | Categoria | Evidência e risco |
|---|---|---|---|---|
| 1 | Reposição Asaas e estoque | `tests/final-consolidation.test.mjs` | `obsolete` | Checa wrapper antigo; não executa fluxo delegado |
| 2 | Colunas e webhook idempotente | `tests/influencer-cashback-v24.test.mjs` | `obsolete` | Procura implementação no wrapper, agora em serviço compartilhado |
| 3 | LP idêntica ao ZIP 1.8.0 | `tests/landing-static-runtime.test.mjs` | `preexisting` | Fixture 1.8.0 diferente da LP 1.8.1 |
| 4 | LP e processo Anvisa | `tests/landing-static-runtime.test.mjs` | `preexisting` | Divergência de número/documento regulatório a validar |
| 5 | Estorno da parcela posterior | `tests/launch-regressions.test.mjs` | `obsolete` | Harness não mocka dependência compartilhada |
| 6 | Confirmação parcela posterior | `tests/launch-regressions.test.mjs` | `obsolete` | Mesmo loader legado |
| 7 | Referência externa parcela | `tests/launch-regressions.test.mjs` | `obsolete` | Mesmo loader legado |
| 8 | Estorno antes da expedição | `tests/launch-regressions.test.mjs` | `obsolete` | Mesmo loader legado |
| 9 | Estorno após a expedição | `tests/launch-regressions.test.mjs` | `obsolete` | Mesmo loader legado |
| 10 | Provisionamento único webhook | `tests/provisioning-contract.test.mjs` | `obsolete` | Teste estático exige função no wrapper antigo |

**Classificação:** oito `obsolete`, dois `preexisting`, **zero `new`**, zero `environment`. Os nomes completos, a evidência detalhada, o impacto e as correções propostas estão em `docs/lote0-baseline.md`.

## 5. Matriz dos 13 cenários mock

| ID | Cenário | Evidência resumida | Resultado |
|---|---|---|---|
| H01 | Asaas `CONFIRMED` | `paid`, 1 usuário e 1 entrada de estoque | PASS |
| H02 | Asaas `RECEIVED` | Confirmação única e status idempotente | PASS |
| H03 | `PENDING` | 409, zero provisionamento | PASS |
| H04 | `CANCELLED` | 409, zero provisionamento | PASS |
| H05 | `REFUNDED` antes/depois | Não paga cobrança estornada; estorno posterior compensa uma vez | PASS |
| H06 | Parcelamento | Valor individual/grupo corretos; divergência bloqueada | PASS |
| H07 | Valor divergente | Diferença de R$0,01 bloqueia | PASS |
| H08 | Referência divergente | 409, sem efeito | PASS |
| H09 | Ambiente incompatível | 409 antes da consulta | PASS |
| H10 | Concorrência simulada | Duas consultas, um acesso/estoque | PASS (mock) |
| H11 | Sem `asaasVerifiedAt` | Acesso BKO bloqueado | PASS |
| H12 | Webhooks IDs diferentes | Um usuário, um estoque, um snapshot financeiro | PASS |
| H13 | Asaas indisponível | 502 seguro, pedido permanece pendente | PASS |

**Limitação explícita:** testes usam `memoryDb` e `getPayment` sintético; não são prova de isolamento/locks MySQL ou API real. Payloads completos e logs redigidos em `docs/lote0-homologacao-parcial-2026-11-20.md`.

## 6. Migrations e ambiente

- `database/schema.sql`, scripts antigos e cinco arquivos em `database/migrations/` foram preservados **sem alteração**.
- `npm start` existente executa `scripts/migrate.mjs` automaticamente; **não executar em produção sem gate e aprovação**. Nenhum DDL, DML ou acesso SQL foi executado durante esta entrega.
- Nenhuma migration de cashback V2 ou auditoria foi aplicada; o schema `asaas_reconciliation_audit` aparece apenas como proposta textual em `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`.
- Nenhuma nova variável de runtime obrigatória. `.env.example` marca `INFLUENCER_POLICY_V2_ENABLED=false` (reservada, sem implementação) e documenta o `EMAIL_FROM` opcional já consumido.

## 7. Pendências e riscos antes de produção

1. Provisionar MySQL/MariaDB **exclusivo de homologação**, com dados sintéticos e duas conexões independentes.
2. Validar transações reais, row locks, índices únicos, idempotência de webhook com IDs distintos, acesso/estoque/cashback únicos, parcelamento e estorno.
3. Aprovar/implementar auditoria **não financeira** de tentativas Asaas, persistindo operador, pedido, cobrança, ambiente efetivo, status e código seguro (inclusive erro 502), sem segredos.
4. Homologar Asaas sandbox controlado, inclusive mudanças de status e conciliação de estornos assíncronos.
5. Revisar as dez falhas legadas e o contrato de resposta do PATCH para consumidores externos.
6. Formalizar aprovação humana separada para qualquer deploy ou política de R$20/caixa. Nenhum gate do Lote 1 foi ultrapassado.

## 8. Controle de escopo e exclusões do ZIP

O pacote deriva de `git archive` **do commit `f6261cd`**, com inclusão documental segura; não foi necessário exportar working tree inteiro. Foram excluídos `node_modules/`, `.next/`, `.git/`, caches, `.env` preenchidos, dumps, segredos e o arquivo histórico `revendores2026-main.rar` de 51MB que poderia conter uma cópia antiga/duplicada. PDFs do manual privado e mídia legítima em `public/` foram preservados.

O pacote é **código-fonte reproduzível**, não um executável pré-compilado. Deverá ser reconstruído com `npm ci` e `npm run build` no destino autorizado.

## 9. Rollback

Antes de implantação futura, guardar a versão base `bc1beeda2d34bcc0380343a9982228de14926034` e as configurações fora do Git. Em caso de falha, reimplantar **todos os arquivos da versão anterior**, manter credenciais e dados, executar instalação/build autorizados e validar novamente os webhooks. Como nenhuma migration nova foi realizada, **não há rollback SQL deste lote**; não fazer `git reset --hard` nem reverter transações financeiras.

## 10. Confirmação de isolamento

**Nesta etapa de empacotamento:** não foi feito push/commit/PR/merge/deploy, não houve acesso a GitHub, Hostinger ou produção, não se conectou ao banco real, não foram enviados e-mails/WhatsApp, não foram criadas cobranças/repasses, e não foram ativados cashback V2 ou termos novos. Os únicos writes foram arquivos de documentação/ZIP no workspace isolado.
