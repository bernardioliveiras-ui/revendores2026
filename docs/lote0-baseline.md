# LORD NUTRI — Lote 0: baseline e matriz de regressões

Data de referência: 2026-11-20. Ambiente: clone Git isolado, **sem conexão com banco de produção**.

## Controle de versão

- Repositório: `bernardioliveiras-ui/revendores2026`.
- Branch exclusiva de trabalho: `codex/lord-nutri-lote0-20261120`.
- Commit de origem da `main`: `bc1beeda2d34bcc0380343a9982228de14926034`.
- Na coleta deste baseline, a `main` não foi alterada e ainda não havia commit ou push do Lote 0. A autorização posterior prevê commit e PR **somente da branch de trabalho**, sem merge/deploy.
- Node.js: `v22.23.5` (`package.json` exige `22.x`).
- Pacote: `mix10-pro-revendedores@1.8.1`; dependências instaladas via `npm ci`.
- Dependências principais verificadas: Next `16.2.6`, React/React DOM `19.2.6`, TypeScript `5.9.3`, Drizzle ORM `0.45.2`, mysql2 `3.24.4`.

## Baseline anterior a qualquer alteração no Lote 0

| Comando | Resultado | Observação |
|---|---|---|
| `npm test` (Node 22) | 277 aprovados, **10 falhas**, 287 testes | Falhas preexistentes na revisão base, detalhadas abaixo. |
| `./node_modules/.bin/tsc --noEmit` (Node 22) | **Aprovado** | Código de saída 0. |
| `npm run lint` (Node 22) | **349 erros, 222 avisos** | 571 ocorrências em código legado; não corrigir globalmente neste lote. |
| `npm run build` (Node 22) | **Aprovado** | Next webpack; compilou, gerou 60 páginas estáticas, saída 0. |

Não foram configurados tokens Asaas, banco, WhatsApp ou e-mail reais; os testes usam doubles de memória e requests sintéticos. Nenhuma migration ou operação de pagamento foi executada.

## Matriz das dez falhas — antes das correções

Categorias: `preexisting` = divergência já presente em comportamento/fixture; `obsolete` = teste/harness exige estrutura interna antiga em vez de exercitar contrato atual; `environment` = dependência/configuração externa não disponível; `new` = regressão introduzida neste lote.

| # | Teste (nome completo) | Arquivo | Categoria | Evidência observada | Impacto | Proposta de correção, **fora do Lote 0 salvo cobertura diretamente pertinente** |
|---|---|---|---|---|---|---|
| 1 | reseller replenishment creates an Asaas payment and paid webhook provisions stock | `tests/final-consolidation.test.mjs` | obsolete | Procura `PAYMENT_CONFIRMED` e `provisionPaidPurchase` no wrapper `app/api/billing/webhook/route.ts`, que delega a `lib/billing-webhook.ts`. | Falso negativo; fluxo de reposição não validado por esse teste estático. | Criar/usar teste executável de webhook→estoque e manter asserções de efeito e idempotência. |
| 2 | colunas persistentes e cobrança via webhook idempotente estão no projeto | `tests/influencer-cashback-v24.test.mjs` | obsolete | Procura expressões de cálculo e status no mesmo wrapper em vez do serviço `lib/billing-webhook.ts`. | Não prova idempotência; erro falso por mudança de organização. | Validar webhook duplicado contra o serviço real, inclusive snapshots históricos; não ajustar cashback neste lote. |
| 3 | sem edições o HTML da LP é idêntico ao ZIP 1.8.0, incluindo formulário e simulador | `tests/landing-static-runtime.test.mjs` | preexisting | Fixture HTML `landing-1.8.0-original.html` não corresponde ao HTML atual do pacote 1.8.1. | Alarme de divergência de layout/cópia; não envolve pagamento. | Revisar alterações aprovadas na LP e atualizar snapshot somente após validação de produto. |
| 4 | a landing preserva o briefing e não aceita o antigo HTML do Studio | `tests/landing-static-runtime.test.mjs` | preexisting | Fixture e asserção exigem processo Anvisa `2535115572620267`; LP contém `25351.205227/2026-38`. | Potencial divergência regulatória/comercial; alterar sem verificação seria arriscado. | Validar identificação oficialmente e com proprietário; depois reconciliar fixture/briefing. |
| 5 | estorno de uma parcela posterior cancela o pedido do mesmo parcelamento | `tests/launch-regressions.test.mjs` | obsolete | Loader tenta importar wrapper sem mock de `@/lib/billing-webhook` (`Unmocked dependency`). | Cenário de estorno não é realmente executado por esse teste. | Carregar serviço real e mockar apenas dependências externas; manter afirmações financeiras. |
| 6 | parcela posterior confirmada libera o mesmo pedido apenas pelo serviço idempotente | `tests/launch-regressions.test.mjs` | obsolete | Mesmo erro do loader após extração do serviço de billing. | Falha de cobertura de parcelamento e acesso. | Corrigir harness de teste e testar fluxo de parcela real sem redefinir regra. |
| 7 | referência externa não permite confirmar um parcelamento diferente | `tests/launch-regressions.test.mjs` | obsolete | `Unmocked dependency @/lib/billing-webhook`. | O teste não alcança a checagem de fraude por referência. | Executar handler compartilhado e exigir vínculo consistente. |
| 8 | estorno antes de expedir retira o estoque virtual uma única vez | `tests/launch-regressions.test.mjs` | obsolete | `Unmocked dependency @/lib/billing-webhook`. | Cobertura de compensação de estoque inoperante neste arquivo. | Exercitar estorno duplicado contra serviço atual; observar movimento único. |
| 9 | estorno após expedição preserva estoque físico para conciliação pelo BKO | `tests/launch-regressions.test.mjs` | obsolete | `Unmocked dependency @/lib/billing-webhook`. | Cobertura de exceção logística inoperante neste arquivo. | Exercitar serviço atual sem reescrever lógica de estoque. |
| 10 | webhook provisiona compra inicial e coloca pedido em separação uma única vez | `tests/provisioning-contract.test.mjs` | obsolete | Exige literal `provisionPaidPurchase` no wrapper; execução está no serviço delegado. | Falso negativo na proteção da idempotência. | Trocar detecção de texto por cenário runtime de dois eventos. |

**Classificação inicial:** 8 `obsolete`, 2 `preexisting`, 0 `new`, 0 `environment`. Não tratar as falhas como aprovações; os cenários de estorno, parcelamento e estoque continuam necessários.

## Escopo autorizado

1. Login: impedir promoção antes de verificar senha, respeitando bloqueio e regras de sessão.
2. BKO: confirmar pagamento somente por consulta oficial Asaas, com ID, status, valor, customer, external reference, ambiente e vínculo do pedido; manter rotas e idempotência.
3. Não editar regras financeiras, termos, cashback, migrations, dados históricos nem serviços de estorno além do indispensável às proteções acima.
4. Na etapa original, não fazer commit, push, PR, deploy, chamadas externas com credenciais reais ou alteração da `main`. **Decisão posterior:** commit e PR para revisão foram autorizados somente na branch `codex/lord-nutri-lote0-20261120`; ainda proibidos merge, deploy, credenciais reais ou mudanças financeiras.

## Riscos já identificados

- `app/api/auth/login/route.ts`: a promoção de `users.role` era gravada antes de `verifyPassword`.
- `lib/auth.ts`: `getSessionUser` elevava revendedor da lista `ADMIN_EMAILS` para admin, mesmo sem promoção armazenada.
- `app/api/admin/orders/route.ts`: `PATCH` marcava `paid` e provisionava acesso/estoque sem consultar Asaas.
- `app/api/admin/orders/sync/route.ts`: comparação de referência externa era condicional e não comprovava montante em parcelamentos.
- Sem coluna explícita de ambiente Asaas por pedido, a checagem ambiente→pedido depende de consulta na conta configurada e vínculo externo; migração para gravar ambiente fica fora deste lote.

## Rollback previsto

Sem migrations nem writes em dados reais. Antes do merge, a opção mais segura é **fechar o PR sem merge e preservar a branch** para correção/revisão; a `main` fica no commit-base. Caso a branch seja revisada ou revertida, usar `git revert <sha-do-commit-lote0>` **somente na branch de trabalho**, com novo push após revisão, sem apagar os documentos de homologação pendentes que permaneceram fora do commit. Não fazer `git reset --hard`, force-push nem executar rollback SQL de produção. Não há rollback de dados, migrações ou pagamentos porque nenhum deles foi alterado.

## Execução do Lote 0 — resultado depois das alterações

| Verificação | Antes, commit base | Depois, branch local não commitada | Delta |
|---|---|---|---|
| Testes | 277/287 aprovados, 10 falhos | **304/314 aprovados, 10 falhos** | +27 cenários, **0 falhas novas** |
| TypeScript | aprovado | **aprovado** | 0 erro novo |
| Lint | 349 erros, 222 avisos | **349 erros, 222 avisos** | 0 alteração de contagem |
| Build | aprovado | **aprovado** | Next.js 16.2.6, webpack, 60 páginas estáticas |
| Git diff | limpo | alterações locais para revisão | Sem commit, push, PR ou deploy |

**Red/green observado:**

- Autenticação: 3 falhas reais em `ADMIN_EMAILS`/lockout/sessão na fase RED; depois `20/20` aprovados.
- BKO: pedido `PENDING` causou provisionamento indevido na fase RED; depois `19/19` aprovados. Uma nova prova para divergência de **um centavo** falhou em RED e passou após exigir igualdade exata de centavos.
- Acesso: compra local `paid` mas sem `asaasVerifiedAt` liberava acesso em RED (`200` em vez de `409`); após o guard retornou `409` e os testes ficaram verdes.
- Testes específicos combinados: `63/63` aprovados.
- Primeira suíte completa após o patch: `303/314`, 11 falhas; falha adicional no teste legado de visualização de credenciais porque a fixture não tinha `asaasVerifiedAt`. Foi corrigida **somente a fixture da compra verificada**. Segunda suíte completa: `304/314`, **exatamente os mesmos 10 nomes anteriores**.
- Uma execução paralela de `tsc` com `next build` encontrou arquivos `.next/types` temporariamente removidos pelo build (`TS6053`), **conflito de execução das ferramentas**. Reexecução após o build: 0 erros. Não é erro de produto.

### Comportamento corrigido

1. Promover `reseller` listado em `ADMIN_EMAILS` apenas após senha correta e lockout liberado; sessão só confia no papel persistido.
2. `PATCH /api/admin/orders` mantém o método e payload `purchaseId`/`orderId` + `status:'paid'`, porém delega à conciliação existente (`POST /api/admin/orders/sync`); não altera `paymentStatus` diretamente.
3. Conciliação valida ID de cobrança, status confirmado/recebido e não excluído, titular Asaas, `externalReference` obrigatório, centavos exatos, `installment` e valor unitário do parcelamento, ambiente quando identificável pela URL salva e conta Asaas configurada.
4. Falhas, divergências e status pendentes retornam erro sem conceder acesso nem estoque. UI BKO comunica **consulta Asaas** em vez de aprovação manual.
5. `POST /api/admin/access` exige `paymentStatus='paid'` **e** `asaasVerifiedAt` antes de liberar, consultar senha provisória ou resetar senha; a transação de reset revalida os dois campos.
6. Nenhum código de cálculo de cashback, estorno ou repasse foi alterado; o processamento idempotente continua em `lib/billing-webhook.ts`.

### Arquivos locais do Lote 0

- Produção: `app/api/auth/login/route.ts`, `lib/auth.ts`, `app/api/admin/orders/route.ts`, `app/api/admin/orders/sync/route.ts`, `app/api/admin/access/route.ts`, `lib/purchase-fields.ts`, `app/painel/portal-client.tsx`.
- Testes: `tests/auth-runtime.test.mjs`, `tests/session-runtime.test.mjs`, `tests/lote0-payment-gate.test.mjs` (novo), `tests/payment-sync-runtime.test.mjs`, `tests/backoffice-runtime.test.mjs`, `tests/portal-unauthorized-runtime.test.mjs`, `tests/manual-welcome-v26.test.mjs`.
- Documento: `docs/lote0-baseline.md` (novo).
- **Migrations criadas/alteradas:** zero. **Variáveis novas:** zero. **Endpoints novos:** zero. Alterados contratos de `PATCH /api/admin/orders` e `POST /api/admin/orders/sync`; `POST /api/admin/access` ganhou guarda.

### Limitações e riscos ainda abertos

1. **Não há teste real Asaas sandbox + MySQL homologação.** Os testes Lote 0 usam Asaas sintético e banco em memória; é obrigatório homologar com chave e dados estritamente de sandbox antes de qualquer deploy.
2. **Asaas pode mudar de status antes de chegar um webhook de estorno:** a liberação manual verifica `asaasVerifiedAt` e estado local, mas não refaz a consulta Asaas em `POST /api/admin/access`. Portanto, dependência residual da entrega pontual dos eventos de estorno deve ser validada no sandbox; em operação, bloquear pedidos suspeitos até a conciliação.
3. **Ambiente não está gravado por pedido:** a verificação usa conta configurada e host Asaas do link salvo quando identificável. Se URL estiver ausente/legada, só o payment ID + customer + referência/valor são vinculados à conta; tabela histórica não foi migrada neste lote.
4. **Parcelamentos:** valida-se parcela consultada contra `installmentValueCents` e grupo armazenado. Não consulta separadamente o sumário do plano para provar a contagem de parcelas atual no Asaas; requer teste de homologação com parcela real.
5. **Compatibilidade:** o `PATCH` legado segue válido, mas o retorno de sucesso já não inclui credenciais provisórias: elas devem ser obtidas pelo endpoint autorizado `/api/admin/access`. `welcomePending/released` antigos não são prometidos pela nova conciliação. Confirmar consumidores externos antes do deploy.
6. Os **10 testes preexistentes** permanecem falhos. O Lote 0 não fez correções cosméticas nas fixtures do ANVISA nem nos cenários de estorno/parcelamento obsoletos.

### Comandos executados

Todos os comandos npm/Node abaixo foram executados com `npx --yes --package=node@22 -c '<comando>'` para usar Node.js 22.23.5:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
npm ls next react react-dom typescript drizzle-orm mysql2 --depth=0
npm test
node --experimental-strip-types --test tests/auth-runtime.test.mjs tests/session-runtime.test.mjs
node --experimental-strip-types --test tests/lote0-payment-gate.test.mjs
node --experimental-strip-types --test tests/backoffice-runtime.test.mjs tests/payment-sync-runtime.test.mjs tests/portal-unauthorized-runtime.test.mjs
node --experimental-strip-types --test tests/lote0-payment-gate.test.mjs tests/auth-runtime.test.mjs tests/session-runtime.test.mjs tests/backoffice-runtime.test.mjs tests/payment-sync-runtime.test.mjs tests/portal-unauthorized-runtime.test.mjs
./node_modules/.bin/tsc --noEmit
npm run lint
npm run build
git diff --check
git diff --stat
```

**Revisão final:** auto-revisão do patch e das fontes de integração, sem subagente; uma revisão independente de código e um smoke em homologação continuam recomendados. O resultado do Lote 0 **não autoriza** Lote 1 nem qualquer mudança de política financeira.

## Validação suplementar de homologação com mocks — após o baseline

- A suíte `tests/lote0-homologation-mock.test.mjs` acrescenta **13 testes de regressão** para `CONFIRMED`, `RECEIVED`, `PENDING`, `CANCELLED`, estorno, parcela/grupo, divergência de valor, referência e ambiente, concorrência simulada, bloqueio sem `asaasVerifiedAt`, dois IDs de webhook e indisponibilidade do Asaas.
- Suíte completa com esses testes: **317 de 327 aprovados e as mesmas dez falhas legadas**; novos cenários: **13/13 aprovados**. TypeScript e build aprovados; lint ainda 349 erros/222 avisos; `git diff --check` aprovado.
- Essa suite usa `memoryDb` e transporte Asaas simulado; **não comprova concorrência InnoDB com duas conexões**, integração Asaas sandbox real, auditoria persistente ou ambiente efetivo registrado por tentativa.
- **Não houve migration financeira, cashback de R$ 20/caixa, atualização de termos, dados financeiros, cobrança, repasse ou mensagem real.** O PR é exclusivamente para revisão das correções de segurança Lote 0, com homologação MySQL pendente.
