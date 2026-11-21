# LORD NUTRI Asaas Audit and MySQL Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar de forma persistente e segura toda tentativa BKO de conciliação Asaas e demonstrar idempotência em duas conexões MySQL reais de homologação.

**Architecture:** Uma tabela append-only não financeira correlaciona eventos `started` e `finished` de cada tentativa, incluindo o ambiente efetivamente consultado; a rota BKO preserva a confirmação via Asaas e chama o webhook idempotente existente. A matriz roda com cobrança mock e um banco MySQL exclusivo, sem mensagens externas.

**Tech Stack:** Next.js, TypeScript, Drizzle ORM, mysql2/MySQL, Node 22 e `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`; protocolo: `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md`.

## Global Constraints

- **Portões obrigatórios:** aprovação explícita da migration de auditoria **não financeira** e disponibilização de MySQL dedicado com dados sintéticos e duas conexões; nada além de documentação/testes antes disso.
- Manter `codex/lord-nutri-lote0-20261120` e `main` intocada; nenhum commit, push, PR, deploy, DDL ou DML em produção.
- Nenhuma cobrança, repasse, webhook real, e-mail, WhatsApp, atualização de cashback, termos, migration financeira ou interface do Lote 1.
- Não alterar as dez falhas de testes legados, salvo relação direta devidamente comprovada.
- Falhas Asaas com auditoria disponível devem preservar HTTP 502 seguro; não registrar credenciais, CPF, payload bruto, stack ou invoice URL.

## Review Focus

1. Configuração de ambiente que muda entre a validação e `getPayment` → testar que ambiente efetivo auditado corresponde ao cliente usado.
2. Falha de INSERT inicial na auditoria → testar que nenhuma confirmação é processada.
3. Falha da gravação `finished` após webhook aplicado → provar que `started` fica pendente/alertável, sem falsa reversão financeira.
4. PATCH legado disparando POST internamente → garantir uma única tentativa correlacionada e contrato de erro intacto.
5. Webhooks com IDs diferentes chegando em conexões SQL distintas → usuário, estoque e cashback únicos, dois eventos de transporte preservados.

---

### Task 1: Infraestrutura de homologação e autorização de schema

**Files:**
- Proposal: `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`
- Protocol: `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md`

**Interfaces:**
- Produces: banco exclusivo com `DATABASE_*` de homologação configurados apenas no processo isolado e aprovação da tabela `asaas_reconciliation_audit`.

- [x] **Step 1:** Obter autorização de DDL **não financeiro** exclusivo de homologação; recusar credenciais de produção.
- [x] **Step 2:** Validar `SELECT DATABASE(), CURRENT_USER(), CONNECTION_ID(), @@version` com duas conexões distintas.
- [x] **Step 3:** Confirmar constraints existentes e aplicar **somente após aprovação** o schema aditivo da proposta (instalador manual executado pelo responsável em homologação).
- [x] **Step 4:** Verificar que a tabela não contém dados reais e não alterou tabelas financeiras (instalador não insere linhas; sem revisão independente do ambiente da aplicação).

### Task 2: Repositório de auditoria e seleção única do ambiente

**Files:**
- Create: `lib/asaas-reconciliation-audit.ts`
- Modify: `db/schema.ts` (somente depois de aprovada a migration)
- Modify: `lib/asaas.ts` (cliente configurado por tentativa)
- Test: `tests/asaas-reconciliation-audit.test.mjs`

**Interfaces:**
- Consumes: tabela aprovada da Task 1.
- Produces: `beginReconciliationAudit(input): Promise<{attemptId,requestId}>`, `finishReconciliationAudit(attemptId,result): Promise<void>` e `getPaymentWithConfig(id,config)` que revela o ambiente efetivamente usado sem expor chave.

- [x] **Step 1 (RED):** Testar `started` append-only, falha de INSERT e correlação `finished`; testar que payload sensível nunca chega ao SQL.
- [x] **Step 2:** Executar `node --experimental-strip-types --test tests/asaas-reconciliation-audit.test.mjs` e confirmar falha pelo contrato ausente.
- [x] **Step 3 (GREEN):** Implementar apenas os serviços listados, códigos/motivos fixos e ambiente congelado por tentativa.
- [x] **Step 4:** Rodar testes específicos e `npx tsc --noEmit`; resolver apenas regressões diretas. **Validação real do SQL segue pendente.**

### Task 3: Integrar à conciliação BKO sem alterar fluxo financeiro

**Files:**
- Modify: `app/api/admin/orders/sync/route.ts`
- Modify: `app/api/admin/orders/route.ts` se necessário para a correlação PATCH
- Test: `tests/payment-sync-runtime.test.mjs`
- Test: `tests/lote0-payment-gate.test.mjs`

**Interfaces:**
- Consumes: `beginReconciliationAudit`, `finishReconciliationAudit`, `getPaymentWithConfig` da Task 2.
- Produces: confirmação somente após Asaas válido, HTTP 502 auditado no erro de provedor e ambiente consultado registrado.

- [x] **Step 1 (RED):** Incluir testes para erro `AsaasRequestError` 502 com `finished` gravado antes de responder, sucesso/rejeição, PATCH legado e falha de storage.
- [x] **Step 2:** Rodar testes específicos e confirmar falhas por ausência de auditoria.
- [x] **Step 3 (GREEN):** Integrar a auditoria às decisões existentes sem reescrever cálculo, webhook, transação, estoque ou acesso.
- [x] **Step 4:** Rodar testes específicos, 13 cenários mock e confirmar que retornos/erro são compatíveis; testes reais ainda pendentes.

### Task 4: Integração real de concorrência

**Files:**
- Create: `tests/lote0-homologation-mysql.mjs` (invocação separada; não inserir no `npm test` genérico até existir infraestrutura)
- Update: `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md` com evidências redigidas

**Interfaces:**
- Consumes: MySQL e mock controlado da Task 1 e rotas auditadas da Task 3.
- Produces: prova de locks InnoDB e contagens de usuários, perfis, entradas, estornos, webhooks e auditoria com duas conexões.

- [ ] **Step 1 (RED):** Preparar fixtures sintéticas e asserções de conexão A/B distinta, mesma compra concorrente, IDs repetidos/distintos, parcelas e estornos pré/pós-confirmação.
- [ ] **Step 2:** Rodar a matriz e observar primeiro falhas para qualquer garantia de concorrência ausente.
- [ ] **Step 3 (GREEN, somente se necessária):** Corrigir apenas problema diretamente comprovado de auditoria/concorrência; não alterar finanças ou legado sem autorização.
- [ ] **Step 4:** Executar matriz final, comparar snapshots SQL antes/depois, registrar A/B connection IDs redigidos, locks, erros e alertas.

### Task 5: Gate final sem merge

**Files:**
- Update: relatório final de homologação Lote 0 sob `docs/`.

**Interfaces:**
- Consumes: resultados das Tasks 2–4.
- Produces: decisão explícita liberar/não liberar Lote 1 **para posterior aprovação do usuário**, sem ativar mudança financeira.

- [ ] **Step 1:** Rodar `npx --yes --package=node@22 -c 'npm test'` e comparar com as dez falhas legadas.
- [ ] **Step 2:** Rodar integração mock e MySQL real, `npx tsc --noEmit`, `npm run lint`, `npm run build` e `git diff --check`.
- [ ] **Step 3:** Conferir `git rev-parse HEAD main`, `git status`, arquivos/migrations, payloads redigidos e ausência de mensagens/pagamentos reais.
- [ ] **Step 4:** Entregar resultados e riscos; **não fazer commit, PR, deploy ou iniciar Lote 1 automaticamente**.

## Estado atual deste plano

**Tasks 1–3 concluídas localmente no âmbito permitido.** A tabela de homologação foi criada pelo responsável via SSH, com sintaxe e estrutura verificadas. A implementação TypeScript passou pelos testes com mocks e typecheck/build local; **ainda não foi executada contra o MySQL real nem publicada**. Para a Task 4, o executor manual `tests/lote0-homologation-mysql.mjs` e os testes dos gates foram preparados e validados localmente, **sem conexão remota ou INSERT**. O ensaio real do executor, a concorrência dos handlers financeiros e a Task 5 dependem de runtime Node 22 isolado e de confirmar que a base está desligada do site online (`docs/EXECUCAO-AUDITORIA-NODE22-2026-11-20.md`). Não há autorização para Lote 1 ou deploy.
