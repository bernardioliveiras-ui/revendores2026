# LORD NUTRI — desenho proposto da auditoria de conciliação Asaas

**Data:** 20/11/2026. **Situação atual:** proposta aprovada exclusivamente em homologação; tabela `asaas_reconciliation_audit` criada manualmente no banco de testes pelo responsável (16 colunas InnoDB, conforme captura SSH). Serviços e rota BKO implementados **somente no worktree isolado**, com testes mock; **não publicados, não conectados ao banco real pelo executor e não ativados em produção**. Nenhuma migration financeira aplicada.

## Objetivo e limites

Registrar de forma persistente e sem informações sensíveis **toda tentativa administrativa de conciliar um pedido com o Asaas**, inclusive erros do provedor, bloqueios de vínculo e decisões de não confirmar. Preservar `PATCH /api/admin/orders`, idempotência, Asaas como única fonte de pagamento, estornos, estoque, cashback e resposta segura `502` quando a consulta falhar. Nenhuma alteração de regra financeira, acesso, termos, interface ou migration financeira neste desenho.

## Arquiteturas consideradas

1. **Tabela MySQL append-only exclusiva — recomendada.** Suporta consulta por pedido, operador, ambiente e período, com durabilidade, índice e retenção controlável. Exige uma migration **não financeira** a ser aprovada separadamente.
2. Reutilizar `asaas_events` — rejeitada. A tabela atual armazena eventos de transporte (`event_id`, `event_type`, `purchase_id`, `payment_id`, `received_at`), e acrescentar campos/semânticas de consulta misturaria eventos de webhook com ações BKO.
3. `console.error` ou arquivo local — rejeitada como fonte principal. Não assegura persistência, índice, ownership nem leitura confiável em instâncias efêmeras.

**Decisão proposta:** especificar a opção 1, **sem executar DDL** até aprovação explícita da migration e disponibilidade de MySQL exclusivamente de homologação.

## Schema SQL proposto — NÃO EXECUTAR automaticamente

```sql
-- Proposta aditiva e não financeira; executar somente após aprovação em homologação.
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Reversibilidade:** `DROP TABLE` seria possível estruturalmente, mas destruiria a trilha de auditoria; não automatizar rollback destrutivo. Para desativar o recurso, preservar a tabela e retirar somente a escrita, mediante plano separado. Não colocar FK obrigatória para `purchases`: tentativas de pedido inexistente também devem ser auditáveis. Retenção e acesso LGPD ainda exigem decisão operacional antes de produção; não criar limpeza automática sem política aprovada.

## Contrato de gravação

- **Duas linhas no máximo por tentativa** (`started` e `finished`), não por resultado financeiro. `record_id` e `attempt_id` são UUIDs internos, `attempt_id` correlaciona os dois eventos; `request_id` é criado pelo servidor, sem confiar em cabeçalho fornecido pelo navegador. A linha `started` é gravada antes de qualquer mutação financeira; `finished` registra decisão/resposta. Se a segunda gravação falhar, o início permanece visível como tentativa inconclusa para alerta e reconciliação.
- `actor_id` vem do retorno de `requireAdmin`; nunca inferir papel de `ADMIN_EMAILS`. Sem sessão válida, não consultar Asaas; autenticação pode ter trilha de segurança própria.
- `purchase_id`, `payment_id` somente identificadores; não persistir nome, e-mail, CPF, endereço, token, customer payload, chave, URL de invoice, resposta bruta, stack trace nem dados bancários.
- `configured_environment`: ambiente planejado pela conta; `consulted_environment`: **ambiente efetivamente usado no `getPayment`**, `NULL` se nenhuma requisição foi enviada. `provider_consulted=0` diferencia um bloqueio pré-consulta. Registrar `sandbox`/`production` como *snapshot da tentativa*, nunca reconstruir consultando variáveis de ambiente depois.
- **Congelar uma única configuração Asaas por tentativa:** hoje `sync` chama `getAsaasConfig()` e `getPayment()` pode chamar `getAsaasConfig()` novamente. A futura implementação deve fazer o cliente usar exatamente a configuração capturada, sem expor a chave ao auditor.
- `endpoint_action` de lista fechada, por exemplo `admin.orders.sync` e `admin.orders.patch.legacy`. Conservar a mesma correlação se o `PATCH` encaminhar ao `POST`, sem duplicar desnecessariamente a tentativa.
- `safe_error_code` de lista fechada: `PAYMENT_PENDING`, `PAYMENT_CANCELLED`, `PAYMENT_REFUNDED`, `PAYMENT_MISMATCH`, `INSTALLMENT_MISMATCH`, `ENVIRONMENT_MISMATCH`, `ASAAS_TIMEOUT`, `ASAAS_UNAVAILABLE`, `ASAAS_REQUEST_FAILED`, `AUDIT_WRITE_FAILED` ou `NULL` em sucesso.
- `reason_summary` derivado de mensagens seguras e **fixas**, nunca de `error.message` externo. `attempted_at` em UTC com precisão milissegundos; `http_status` representa a resposta final da rota.
- Operação append-only; leitura só para perfis BKO autorizados. A linha `finished` deve ser inserida **antes de responder**, incluindo 409 e 502. Não registrar dados de consultas financeiras na tabela de `asaas_events`.
- **Falha ao gravar auditoria:** se a gravação inicial falhar, bloquear a conciliação (erro genérico 503) **antes** de qualquer mutação financeira. Se a finalização falhar **depois** do webhook idempotente, não é seguro alegar que o pagamento não foi aplicado; manter `started` pendente, responder erro seguro e alertar para conciliação. O requisito de `502` é preservado para indisponibilidade do Asaas **com armazenamento de auditoria funcional**. A atomicidade do registro final com a transação de provisionamento exige desenho adicional e homologação real; não é presumida aqui.

## Integração futura, após aprovação da migration

1. Auth válida → criar `attempt_id` e `request_id`; resolver pedido e pagamento; inserir a linha `started` antes de qualquer efeito financeiro.
2. Congelar ambiente/configuração; validar ID, status, valor, titular, referência, parcela e grupo.
3. Para `CONFIRMED` ou `RECEIVED` válidos, chamar o fluxo idempotente existente; não inserir estoque/usuário manualmente no auditor.
4. Inserir a linha `finished` com resultado final (sem duplicar fatos financeiros) em `asaas_reconciliation_audit` **antes da resposta**.
5. Em `AsaasRequestError`, classificar erro em código seguro, registrar ambiente efetivamente consultado e status `502`, depois devolver a mensagem já existente. Não registrar `error.message` cru.
6. Se o banco falhar, não inventar confirmação: antes de processar, bloquear; após processar, preservar a tentativa `started` e orientar reconciliação, sem retroceder artificialmente uma transação financeira já confirmada.

## Exemplos sintéticos redigidos

```json
{"record_id":"00000000-0000-4000-8000-000000000011","attempt_id":"00000000-0000-4000-8000-000000000001","phase":"finished","request_id":"req-synthetic-01","actor_id":"admin-synthetic-01","purchase_id":"order-synthetic-01","payment_id":"pay_synthetic_01","configured_environment":"sandbox","consulted_environment":"sandbox","endpoint_action":"admin.orders.patch.legacy","safe_error_code":"ASAAS_UNAVAILABLE","http_status":502,"reason_summary":"Consulta Asaas indisponível","outcome":"provider_error","provider_consulted":true,"attempted_at":"2026-11-20T15:00:00.000Z"}
{"record_id":"00000000-0000-4000-8000-000000000022","attempt_id":"00000000-0000-4000-8000-000000000002","phase":"finished","request_id":"req-synthetic-02","actor_id":"admin-synthetic-01","purchase_id":"order-synthetic-02","payment_id":"pay_synthetic_02","configured_environment":"production","consulted_environment":null,"endpoint_action":"admin.orders.sync","safe_error_code":"ENVIRONMENT_MISMATCH","http_status":409,"reason_summary":"Ambiente do pedido incompatível","outcome":"rejected","provider_consulted":false,"attempted_at":"2026-11-20T15:01:00.000Z"}
```

Estes são **exemplos de formato**, não registros obtidos do MySQL. Só serão reais depois de aprovar, aplicar e testar a migration em homologação.

## Critérios de aceite

- Cada tentativa válida de BKO produz uma linha persistente `started` e, quando finalizada normalmente, uma `finished` com requestId, actorId, IDs, ambiente efetivo, ação, status, código seguro, motivo e tempo; tentativas pendentes são alertáveis.
- `getPayment` consulta sandbox/produção **exatamente** como escrito no registro; consulta não realizada consta como `NULL` + `provider_consulted=0`.
- `502` não contém chaves, PII, payload Asaas nem stack; registro ocorre antes da resposta.
- Teste com duas conexões reais confirma integridade/idempotência do fluxo anterior e que o auditor não cria duplicações ou aprova artificialmente cobrança.
- Nenhuma alteração em cashback, cálculos, webhooks históricos, regras de estoque e migrations financeiras; as dez falhas legadas não são reescritas.
