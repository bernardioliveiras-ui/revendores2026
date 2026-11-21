# Separação dos Canais BKO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolar compras de kits, vendas unitárias de influenciadores e vendas unitárias diretas sem afetar o ledger financeiro.

**Architecture:** Classificação pura em `lib/purchase-segments.mjs`, compartilhada por API e componentes. Dados completos permanecem no BKO para expedição, mas filas de acessos e vendas diretas usam subconjuntos. Métricas discriminam por origem e painel ganha aba própria para compras unitárias diretas.

**Tech Stack:** Next.js 16, TypeScript/React, Drizzle MariaDB, testes Node.

**Spec:** `docs/superpowers/specs/2026-11-21-separacao-canais-bko-design.md`

## Global Constraints

- Nenhuma escrita em banco online, reclassificação de cadastros ou integração financeira adicional.
- `mix10-unit` nunca libera acesso de revendedor.
- Preservar atribuição de campanha e agendamento Correios previamente implementados.

## Review Focus

- Compra `mix10-unit` com `campaignId`: não entra na fila de acesso nem vendas diretas.
- Compra `mix10-unit` sem `campaignId`: entra somente em vendas diretas e expedição.
- Compra de kit com campanha: continua elegível a acesso, sem perder atribuição.
- Pedido pendente, pago mas não verificado, ou cancelado: não infla acesso pendente.
- Usuários com mesmo nome em papéis distintos não devem ser reunidos pelo nome.

---

### Task 1: Classificação e contadores

**Files:** `lib/purchase-segments.mjs`, `lib/bko-dashboard-data.mjs`, `app/api/admin/overview/route.ts`, `tests/lord-nutri-bko-dashboard.test.mjs`, `tests/purchase-segments.test.mjs`.

**Interfaces:** `isResellerKitPurchase(p)`, `isInfluencerUnitPurchase(p)`, `isDirectUnitPurchase(p)`, `segmentPurchases(rows)`. API continua `purchases` integral e métricas adicionam `directUnitCount`, `influencerUnitCount`, `resellerKitCount`.

- [ ] Adicionar testes literais para as três origens e acesso pendente exclusivo de kit verificado.
- [ ] Executar testes e observar falha por classificação ausente ou contagem incorreta.
- [ ] Implementar helpers e aplicar aos contadores da API e do dashboard.
- [ ] Rodar testes novamente; todos passam.

### Task 2: Filas separadas no BKO

**Files:** `app/painel/portal-client.tsx`, `components/payment-sync.tsx`, `components/bko-control-dashboard.tsx`, `components/bko-direct-sales.tsx`, `tests/bko-order-channels.test.mjs`.

**Interfaces:** `BkoDirectSales({purchases,onRefresh})`; Acessos e Pedidos usa `segmentPurchases(admin.purchases).resellerKits` e Vendas avulsas usa `.directUnits`; `PaymentSync` aceita `audience` configurável.

- [ ] Adicionar teste de comportamento para agrupamento e renderização dos canais, sem acesso em compras unitárias.
- [ ] Executar teste e observar falha relevante.
- [ ] Adicionar aba Vendas avulsas, tabela com status, pedido, cliente e valor; ajustar sync de pagamento da fila de kits.
- [ ] Ajustar rotulagem e indicadores do BKO para total da loja versus origem; testar novamente.

### Task 3: Verificação e entrega

**Files:** `app/portal-modern.css`, `LEIA-ANTES-DE-APLICAR-CORRECOES.txt`.

- [ ] Revisar hierarquia visual das abas afetadas, com navegação/cabeçalhos/cartões no mesmo padrão BKO.
- [ ] Executar `node --test tests/*.test.mjs`, `tsc --noEmit`, `npm run build`.
- [ ] Criar ZIP completo sem `.next`, `node_modules`, `.env` ou CSV e salvar para download.
