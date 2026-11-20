# LORD NUTRI — protocolo pendente de integração MySQL real (Lote 0)

**Estado em 20/11/2026:** especificado, **NÃO EXECUTADO**. Não há MySQL/MariaDB nem credenciais separadas de homologação disponíveis no executor. Este arquivo não autoriza SQL ou acesso à produção.

## Pré-condições obrigatórias

1. Provisionar **instância e banco exclusivos** de homologação com nome inequívoco (`lordnutri_homolog_*`), contas próprias, TLS quando aplicável e backup. Não reaproveitar `DATABASE_*` de produção, segredos reais, CPF/e-mail reais ou cópia não anonimizada do banco.
2. Instalar a aplicação **somente no sandbox** com variáveis de banco de homologação e `ASAAS_ENVIRONMENT=sandbox`; preferir mock de API que não envia cobranças ou consulta usuários reais. Não executar `npm start` sem revisar seus efeitos: o script `start` chama `scripts/migrate.mjs` automaticamente.
3. Fazer preflight read-only (`SELECT DATABASE(), CURRENT_USER(), @@hostname, @@version, @@transaction_isolation` ou equivalente da versão) e validar nome, host, usuário, permissões e InnoDB contra a autorização de homologação. Verificar que nenhum endpoint/mensageria real será chamado.
4. Reservar prefixo de IDs totalmente sintéticos `hml-l0-*` e executar contra **dataset descartável**. A futura auditoria SQL só poderá ser aplicada à homologação **após aprovação da proposta não financeira** em `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`.
5. Verificar constraints antes do teste: `users.email` único, `purchases.asaas_payment_id` único, `asaas_events.event_id` chave primária e `reseller_profiles.purchase_id` único; registrar as diferenças do schema real, sem aplicar correções silenciosas.

## Infraestrutura de concorrência

- Abrir **duas conexões independentes MySQL** com sessão/transaction IDs distintos. Confirmar via `SELECT CONNECTION_ID()` e verificar que os IDs diferem.
- Isolamento InnoDB do banco de homologação documentado (`REPEATABLE READ` ou `READ COMMITTED` conforme configuração efetiva), `autocommit` e `innodb_lock_wait_timeout` registrados; não ajustar configuração global da instância.
- Disparar duas invocações simultâneas do **handler real** de reconciliação, passando pelo mesmo `getDb()` conectado ao MySQL e pelo mock Asaas; ao validar webhook, usar o handler real com token **sintético**.
- Instrumentar o banco para evidenciar que as transações ocupam sessões diferentes, adquirir lock na linha `purchases` e constatar espera/liberação. Não inferir concorrência real de `Promise.all` sobre o `memoryDb`.
- Repetir com IDs de webhook iguais **e diferentes** para o mesmo `payment.id`/fato financeiro. Preservar os dois eventos de transporte quando IDs forem distintos, mas somente um `paymentStatus` final, um provisionamento e uma movimentação de entrada.

## Matriz obrigatória (12 cenários + indisponibilidade)

| Cenário | Payload mock principal | Asserção MySQL e HTTP |
|---|---|---|
| 01 `CONFIRMED` | `payment.status=CONFIRMED` | `paid`, `asaas_verified_at` presente; 1 usuário, 1 perfil, 1 entrada de estoque |
| 02 `RECEIVED` | `payment.status=RECEIVED` | Mesmo resultado idempotente; um pedido vinculado |
| 03 `PENDING` | `status=PENDING` | Legado PATCH 409; sem usuário, entrada, acesso ou `paid` |
| 04 `CANCELLED` | `status=CANCELLED` | PATCH 409; sem provisionamento |
| 05 estorno antes/depois | `REFUNDED` e `PAYMENT_REFUNDED` | Antes: não `paid`. Depois: pedido `cancelled`, `asaas_verified_at=NULL`, compensação virtual única; se expedido, sem estorno físico automático |
| 06 parcelada | `installment=ins-hml-01`, `value=54.95` | Parcelamento e valor individual compatíveis aceitos; grupo ou parcela divergente 409, sem efeito |
| 07 valor divergente | `value=109.89` contra 10990 centavos | 409, zero efeitos |
| 08 referência divergente | `externalReference=outro-pedido` | 409, zero efeitos |
| 09 ambiente diferente | `ASAAS_ENVIRONMENT=production` com invoice sandbox **somente em mock** | 409 pré-consulta, ambiente configurado registrado e ambiente consultado NULL na auditoria proposta |
| 10 concorrência | 2 requisições PATCH ao mesmo pedido por conexões diferentes | Unicidade de acesso, perfil, estoque, histórico e status; sem deadlock não tratado ou duplicação |
| 11 acesso sem verificação | `payment_status=paid`, `asaas_verified_at=NULL` | Ação BKO de release 409, sem novas contas ou estoque |
| 12 webhooks IDs distintos | `event.id=hml-evt-1/2`, mesmo `payment.id` | Dois transportes em `asaas_events`, **um** fato financeiro/estoque/acesso; snapshots financeiros não recalculados |
| 13 Asaas fora | Timeout/`AsaasRequestError` do mock | 502 seguro; nenhuma confirmação; **trilha persistida antes da resposta** após schema aprovado |

Usar as variações de payload detalhadas em `docs/lote0-homologacao-parcial-2026-11-20.md`. Nenhuma quantidade, valor ou cashback histórico deve ser recalculado como efeito dos testes; cada fixture deve ter identificadores exclusivos de homologação.

## Consultas de evidência (somente banco de homologação previamente validado)

```sql
-- Substituir os parâmetros exclusivamente por IDs sintéticos da fixture.
SELECT id, payment_status, asaas_verified_at, user_id, access_released_at
  FROM purchases WHERE id = ?;
SELECT id, role, status FROM users WHERE email = ?;
SELECT id, user_id, purchase_id FROM reseller_profiles WHERE purchase_id = ?;
SELECT id, user_id, type, boxes, reference_type, reference_id
  FROM stock_movements WHERE reference_id = ? ORDER BY created_at;
SELECT event_id, event_type, payment_id, purchase_id
  FROM asaas_events WHERE purchase_id = ? ORDER BY received_at;
-- Somente depois da migration não financeira aprovada:
SELECT attempt_id, phase, actor_id, configured_environment,
       consulted_environment, safe_error_code, http_status, outcome, attempted_at
  FROM asaas_reconciliation_audit WHERE purchase_id = ? ORDER BY attempted_at;
```

### Contagens que provam idempotência

- Compra inicial aprovada e com dois webhooks diferentes: `users=1`, `reseller_profiles=1`, entradas associadas à compra `=1`; `asaas_events=2` por IDs de transporte distintos, sem incremento duplicado de cashback.
- Para uma mesma compra, `stock_movements.reference_type='cancelled_purchase'` `<=1` depois de estorno repetido; estorno físico deve seguir o fluxo existente, não inventar reversão de expedição.
- Cada tentativa de conciliação deve produzir registros `started` e `finished` correlacionados; se faltar `finished`, gerar alerta operacional e investigar antes de liberar o Lote 1.

## Evidências a arquivar após execução

- Identidade **não sensível** da instância, versão MariaDB/MySQL, isolamento, `CONNECTION_ID()` A/B e prova de dois locks reais.
- Para cada cenário: request/response HTTP com IDs sintéticos, status, linhas do banco antes/depois, logs redigidos, tempo, erro seguro e ação de rollback dos dados de teste.
- Resultado de `npm test`, integração mock, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, com comparação explícita das dez falhas legadas.
- Capturar `SHOW CREATE TABLE` apenas para as tabelas envolvidas, sem exportar dados pessoais. Validar que nenhuma sessão ou query apontou para produção.

## Limites e portão de decisão

**Não liberar Lote 1** enquanto: (a) MySQL real separado não estiver acessível; (b) teste concorrente com duas conexões não for executado; (c) schema de auditoria não for aprovado e implementado em homologação; (d) cada tentativa não persistir o ambiente efetivo; ou (e) houver novas falhas. A ativação de cashback R$ 20/caixa depende de aprovação posterior independente.
