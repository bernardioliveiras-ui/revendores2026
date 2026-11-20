# LORD NUTRI — Lote 0: validação de integração controlada (parcial)

**Data:** 20/11/2026 · **Status:** **NÃO LIBERAR LOTE 1** (etapa MySQL de homologação indisponível).  
**Isolamento:** branch local `codex/lord-nutri-lote0-20261120`, base `bc1beeda2d34bcc0380343a9982228de14926034`.  
**Escopo:** somente testes; nenhuma alteração a código de produção, configuração, migração, termos ou cashback.

## 1. Ambientes efetivamente utilizados

| Componente | Ambiente e evidência | Limitação |
|---|---|---|
| Aplicação | Código real de `PATCH /api/admin/orders`, `POST /api/admin/orders/sync`, `handleBillingWebhook`, `provisionPaidPurchase`, `POST /api/admin/access` | Handlers executados por loader TypeScript do projeto, não por HTTP de um servidor Next em execução. |
| Asaas | **Mock sintético controlado**, sem conexão com `api-sandbox.asaas.com` ou produção | Exercita status/valor/referência por payload fake. Não autentica contra conta sandbox real. |
| MySQL | **NÃO DISPONÍVEL / NÃO EXECUTADO** | `mysqld`, `mariadbd`, `mysql`, `docker` e `podman` ausentes; não há `.env` de homologação. Foi usado apenas `memoryDb` dos testes, com fila transacional simulada. |
| Mensageria | Não acionada | `next/server.after` e mensuração são doubles inertes; nenhum webhook real, e-mail ou WhatsApp foi enviado. |
| Pagamentos | Não acionados | `getPayment` é mock, não há `createPayment`, repasse nem chave real. |

Não confundir os testes abaixo com comprovação de isolamento de transações, constraints ou SQL de um banco MySQL. As propriedades de lock real, deadlock, unique index, rollback SQL e efeitos concorrentes com duas conexões **continuam sem validação**.

## 2. Payloads de teste — dados 100% sintéticos

Pedido local de referência (campos selecionados):

```json
{
  "id": "synthetic-order-01",
  "orderNumber": "MOCK-0001",
  "email": "comprador@example.test",
  "kit": "kit20",
  "boxes": 20,
  "totalCents": 10990,
  "paymentStatus": "payment_pending",
  "asaasPaymentId": "pay_mock_01",
  "asaasCustomerId": "cus_mock_01",
  "asaasInstallmentId": null,
  "asaasInvoiceUrl": "https://sandbox.asaas.com/i/pay_mock_01"
}
```

Cobrança Asaas simulada — `getPayment('pay_mock_01')`:

```json
{
  "id": "pay_mock_01",
  "customer": "cus_mock_01",
  "externalReference": "synthetic-order-01",
  "value": 109.90,
  "status": "CONFIRMED",
  "deleted": false
}
```

Requisição BKO simulada:

```json
{"method":"PATCH","path":"/api/admin/orders","body":{"purchaseId":"synthetic-order-01","status":"paid"}}
```

Webhook sintético (a autenticação usa somente token fake injetado no teste):

```json
{
  "id": "synthetic-event-01",
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_mock_01",
    "customer": "cus_mock_01",
    "externalReference": "synthetic-order-01",
    "value": 109.90,
    "status": "CONFIRMED"
  }
}
```

Variações testadas:

- **RECEIVED:** `status='RECEIVED'`; **pendente:** `status='PENDING'`; **cancelada:** `status='CANCELLED'`.
- **Estorno:** evento `PAYMENT_REFUNDED`, `payment.status='REFUNDED'`, IDs `refund-synthetic-01` e `refund-synthetic-02`.
- **Parcelada:** `installment='installment-mock-01'`, `value=54.95`, pedido `asaasInstallmentId='installment-mock-01'`, `installments=2`, `installmentValueCents=5495`.
- **Valor divergente:** `value=109.89`; **origem divergente:** `externalReference='different-order'`.
- **Ambiente incompatível:** configuração fake `environment='production'` versus URL salva de sandbox.
- **Concorrência:** duas requisições `PATCH` paralelas; **repetição:** dois webhooks de `PAYMENT_CONFIRMED` com IDs distintos.
- **Sem verificação:** compra local `paid` com `asaasVerifiedAt=null`; **indisponibilidade:** `getPayment` lança `AsaasRequestError('MOCK_TIMEOUT')`.

## 3. Resultado esperado versus resultado obtido

Todos os 12 cenários solicitados, mais um cenário adicional de indisponibilidade, foram executados **apenas contra o mock** em `tests/lote0-homologation-mock.test.mjs`.

| ID | Cenário | Resultado esperado | Resultado obtido no mock | Estado |
|---|---|---|---|---|
| H01 | CONFIRMED | `200`, `paid`, 1 usuário, 1 entrada de estoque | `200`, `paid`, 1 usuário, 1 entrada, `asaasVerifiedAt` registrado | PASS mock |
| H02 | RECEIVED | Mesmo efeito único, com evento `PAYMENT_RECEIVED` | `200`, evento correto, 1 usuário e 1 entrada | PASS mock |
| H03 | PENDING | Não virar `paid`, sem acesso/estoque | `409`, permaneceu `payment_pending`, 0 usuários, 0 entradas | PASS mock |
| H04 | CANCELLED | Não virar `paid`, sem acesso/estoque | `409`, permaneceu `payment_pending`, sem provisionamento | PASS mock |
| H05 | Estornado antes/depois | Negar confirmação de cobrança já estornada; após confirmação, cancelar e compensar apenas uma vez | `REFUNDED` prévio: `409`, sem conta/estoque; estorno posterior: `paid → cancelled`, `asaasVerifiedAt=null`, 1 movimento reversor apesar de 2 eventos de refund | PASS mock |
| H06 | Parcelada | Vincular cobrança individual ao mesmo grupo e valor | Grupo/valor corretos `200`; grupo diferente `409` | PASS mock |
| H07 | Valor divergente | Diferença de R$ 0,01 bloqueia | `409`, sem usuário/estoque | PASS mock |
| H08 | externalReference divergente | Bloquear outra origem | `409`, sem usuário/estoque | PASS mock |
| H09 | Ambiente incompatível | Bloquear antes da consulta externa | `409`, zero chamadas ao mock `getPayment` | PASS mock |
| H10 | Confirmação concorrente | 1 conta e 1 estoque | Duas respostas `200`; 1 conta, 1 estoque, 1 `asaas_event` | PASS mock |
| H11 | Acesso sem `asaasVerifiedAt` | Negar mesmo se status local `paid` | `409`, 0 contas/entradas criadas | PASS mock |
| H12 | Webhooks com IDs distintos | Um fato financeiro, sem acesso/estoque duplicado | 1 conta, 1 estoque e 1 cálculo do cashback histórico; **2 eventos de transporte preservados** para auditoria | PASS mock |
| H13 | Asaas indisponível | Erro seguro, não confirmar | `502`; permaneceu pendente; resposta não contém erro interno/token fake | PASS mock |

**Importante sobre H12:** `asaas_events` guarda dois registros distintos de transporte por IDs distintos; isso **não** significa duas vendas ou dois créditos. O snapshot `indicatorCashbackCents` da compra foi calculado uma vez no mock, com o valor legado sintético de 1.500 centavos. **Nenhuma política de cashback foi alterada ou ativada.**

**Limite do H13:** a resposta HTTP foi verificada como segura, **mas o teste não comprova trilha de auditoria para a falha externa**. Essa lacuna foi identificada na inspeção de código abaixo.

## 4. Logs redigidos e evidências

Saída TAP efetiva, condensada e sem segredos:

```text
ok 1  - H01 CONFIRMED
ok 2  - H02 RECEIVED
ok 3  - H03 PENDING
ok 4  - H04 CANCELLED
ok 5  - H05 REFUND
ok 6  - H06 INSTALLMENT
ok 7  - H07 VALUE
ok 8  - H08 EXTERNAL REFERENCE
ok 9  - H09 ENVIRONMENT
ok 10 - H10 CONCURRENCY
ok 11 - H11 ACCESS
ok 12 - H12 DISTINCT IDS
ok 13 - H13 OFFLINE
# tests 13
# pass 13
# fail 0
```

Respostas de erro, apresentadas por código e contexto sem campos privados:

```text
PATCH /api/admin/orders 409 — Asaas PENDING (sem mutation)
PATCH /api/admin/orders 409 — cobrança divergente (valor/referência/ambiente)
PATCH /api/admin/orders 502 — fornecedor indisponível (sem mutation)
POST  /api/admin/access 409 — ausência de verificação Asaas
POST  /api/billing/webhook 200 — PAYMENT_REFUNDED (compensação idempotente)
```

Os exemplos de logs são **redigidos/condensados** a partir das asserções do teste, não logs de uma API Asaas real. Não se registrou nem utilizou token verdadeiro.

## 5. Falhas e limites

- **Nenhuma falha nas 13 asserções funcionais do mock:** 13/13. Não equivale à aprovação de todos os critérios de aceite.
- **Lacuna encontrada — auditoria de falha externa:** em `app/api/admin/orders/sync/route.ts`, o ramo `AsaasRequestError` devolve `502` diretamente, antes do `console.error` do próximo ramo. `lib/asaas.ts` também não registra essa tentativa. Não foi identificada uma trilha persistente com operador, pedido, ambiente, data e motivo para essas falhas. **Critério “falhas auditáveis” não comprovado**; requer decisão/correção específica antes de dar esta homologação como concluída.
- **Lacuna encontrada — ambiente consultado:** o código usa `getAsaasConfig().environment` para bloquear URL incompatível, mas não persiste a conta/ambiente efetivamente consultado por tentativa de sincronização. O mock exercitou `sandbox`/`production` como valores sintéticos, **sem provar auditabilidade operacional do ambiente**.
- **Bloqueio obrigatório:** a etapa MySQL de homologação solicitada **não foi executada**, por indisponibilidade de instância e cliente/servidor local; o teste `memoryDb` não comprova isolamento SQL.
- Sem validação real de timeouts, 5xx/429, diferentes contas do Asaas, checkout com pagamento parcelado real, índice único da tabela `asaas_events` ou corrida entre conexões MySQL.
- Sem validação de homologação da rotina que consulta Asaas após ocorrência de estorno ainda não recebida pelo webhook. O guard do BKO depende do status local e `asaasVerifiedAt` para acesso manual.
- Dez falhas preexistentes da suíte completa foram mantidas intactas conforme instrução: não atualizar testes legados para fazer porcentagem subir.
- **Suíte completa após adicionar os testes de homologação mock:** 327 testes, **317 aprovados e os mesmos 10 falhos** (Lote 0: 314 testes, 304 aprovados e 10 falhos). Não foram introduzidas novas falhas. Os 10 resultados `not ok` permanecem nos testes de reposição de revendedor (1), contrato/migração (1), LP (2), parcelas e estornos (5) e provisionamento por webhook (1). Sua investigação/correção permanece fora deste passo.

## 6. Comandos executados e estado do projeto

```bash
git -C implementation/revendores2026 status --short --branch
git -C implementation/revendores2026 rev-parse HEAD
command -v mysqld
command -v mariadbd
command -v docker
command -v mysql
command -v podman
test -f implementation/revendores2026/.env
npx --yes --package=node@22 -c 'node --experimental-strip-types --test tests/lote0-homologation-mock.test.mjs'
npx --yes --package=node@22 -c 'npm test'
git -C implementation/revendores2026 diff --check
git -C implementation/revendores2026 rev-parse main
```

**Arquivos criados nesta validação:** este relatório e `tests/lote0-homologation-mock.test.mjs`. **Arquivos de aplicação alterados nesta validação:** nenhum.  
**Migrations:** nenhuma criada/executada; **schema MySQL real:** não acessado; **dados históricos:** intactos.  
**Notificações:** zero e-mails reais e zero WhatsApps reais. **Cobranças/repasse:** zero.  
**Git:** `main` não alterada, commit base continua `bc1beeda2d34bcc0380343a9982228de14926034`, branch sem commit novo, sem push e sem PR.

## 7. Decisão e próximo portão

**Recomendação objetiva: NÃO LIBERAR O LOTE 1 AINDA.** O mock sustenta o comportamento das rotas, mas falta o componente exigido da homologação.

Para concluir a validação, providenciar **MySQL exclusivo de homologação com backup**, banco vazio ou dataset sintético e credenciais próprias configuradas pelo mecanismo seguro do ambiente (não colar senhas na conversa). Necessário também um endpoint de Asaas sandbox real ou manter mock HTTP controlado e documentado, sem conexão de produção.

Quando essa infraestrutura estiver disponível: executar a mesma matriz com duas conexões MySQL reais, verificar `SELECT` das linhas de `purchases`, `users`, `stock_movements`, `asaas_events`, `reseller_profiles` antes/depois, constraints/locks em concorrência, e conferir estornos e parcelamentos. Solicitar aprovação explícita antes de qualquer Lote 1 ou política financeira.
