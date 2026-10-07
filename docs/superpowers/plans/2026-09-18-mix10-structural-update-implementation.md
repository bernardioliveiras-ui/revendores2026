# MIX10 PRO Structural Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o MIX10 para aquisição pública via Asaas, provisionamento automático de revenda, login por e-mail + senha e operação BKO, preservando KIT20, métricas e recursos existentes.

**Architecture:** Manter o monólito Next.js/Node.js existente e o MySQL da Hostinger. Reaproveitar `orders`, `users`, `organizations`, `memberships`, `auth_sessions`, `asaas_events` e o dashboard atual; adicionar apenas campos/tabela de provisionamento necessários, uma rota pública de checkout e rotas administrativas pequenas.

**Tech Stack:** Next.js 16, React 19, Node.js 22, TypeScript, Drizzle ORM, MySQL, Asaas, Node `crypto`, testes `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-18-mix10-structural-update-design.md`

## Global Constraints

- KIT20 permanece 20 unidades a R$ 74,99, total R$ 1.499,80.
- Novas compras usam KIT20 ou KIT50; KIT50 = 50 unidades a R$ 69,90, total R$ 3.495,00.
- KIT30 histórico deve continuar legível, mas não pode ser oferecido em novas compras.
- Hostinger Node.js 22 + MySQL é o ambiente de produção.
- Métricas atuais do portal e Admin/BKO devem permanecer funcionais.
- O módulo de indicação/Mercado Livre deve permanecer funcional.
- Resend deixa de ser requisito de autenticação.
- Um pagamento inicial confirmado provisiona exatamente uma revenda e um owner.
- WhatsApp do BKO é manual.

---

### Task 1: Travar regressões comerciais e Hostinger

**Files:**
- Create: `tests/structural-update.test.mjs`
- Modify: `app/page.tsx`
- Modify: `app/api/orders/route.ts`
- Modify: `app/painel/portal-client.tsx`
- Modify: `.env.example`
- Modify: `HOSTINGER-DEPLOY.md`

**Interfaces:**
- Produces: novos valores KIT50 nas superfícies públicas/internas; preserva KIT20, métricas e Hostinger.

- [ ] **Step 1: Write the failing test**

```js
assert.match(landing, /KIT50/);
assert.match(ordersApi, /kit50/);
assert.doesNotMatch(landing, /Escolher KIT30/);
assert.match(portal, /Caixas em estoque/);
assert.match(portal, /Cliques em indicações/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL porque KIT50 ainda não existe e o KIT30 ainda é oferecido.

- [ ] **Step 3: Write minimal implementation**

Trocar apenas a oferta nova KIT30 por KIT50, mantendo `kit30` no tipo histórico. Atualizar preço e textos da LP e do diálogo de reposição.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 2: Senhas e sessão sem Resend

**Files:**
- Create: `lib/passwords.ts`
- Create: `tests/passwords.test.mjs`
- Modify: `db/schema.ts`
- Modify: `database/schema.sql`
- Modify: `lib/auth.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/change-password/route.ts`
- Modify: `app/api/auth/session/route.ts`
- Modify: `app/entrar/login-form.tsx`
- Modify: `app/entrar/page.tsx`

**Interfaces:**
- Produces: `hashPassword(password)`, `verifyPassword(password, encoded)`, login POST `/api/auth/login`, troca POST `/api/auth/change-password`, `mustChangePassword` na sessão.

- [ ] **Step 1: Write the failing test**

```js
const encoded = await hashPassword('Senha@123');
assert.equal(await verifyPassword('Senha@123', encoded), true);
assert.equal(await verifyPassword('errada', encoded), false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL porque `lib/passwords.ts` não existe.

- [ ] **Step 3: Write minimal implementation**

Usar `crypto.scrypt` com salt aleatório e comparação `timingSafeEqual`; adicionar `password_hash`, `must_change_password`, `failed_login_attempts`, `locked_until`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 3: Checkout público de entrada

**Files:**
- Create: `lib/kits.ts`
- Create: `app/comprar/page.tsx`
- Create: `app/comprar/checkout-form.tsx`
- Create: `app/api/public/checkout/route.ts`
- Modify: `lib/asaas.ts`
- Modify: `db/schema.ts`
- Modify: `database/schema.sql`
- Modify: `app/page.tsx`
- Create: `tests/public-checkout.test.mjs`

**Interfaces:**
- Produces: `INITIAL_KITS`, POST `/api/public/checkout`, pedidos `orderType='initial'` sem sessão.

- [ ] **Step 1: Write the failing test**

```js
assert.match(checkoutRoute, /orderType:\s*"initial"/);
assert.match(checkoutRoute, /349500/);
assert.match(landing, /\/comprar\?kit=kit50/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Criar cadastro temporário de compra inicial no próprio pedido, usando organização/usuário placeholder somente após pagamento; guardar dados de comprador/endereço em campos próprios do pedido para provisionamento. Preço é resolvido no servidor por `INITIAL_KITS`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 4: Provisionamento idempotente no webhook Asaas

**Files:**
- Create: `lib/access-provisioning.ts`
- Modify: `app/api/billing/webhook/route.ts`
- Modify: `db/schema.ts`
- Modify: `database/schema.sql`
- Create: `tests/provisioning-contract.test.mjs`

**Interfaces:**
- Produces: `provisionInitialOrder(orderId)`; cria organization + user + membership owner uma única vez, senha temporária criptografada, status `processing`.

- [ ] **Step 1: Write the failing test**

```js
assert.match(webhook, /provisionInitialOrder/);
assert.match(provisioning, /mustChangePassword:\s*1/);
assert.match(provisioning, /processing/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Usar transação MySQL/Drizzle e chaves únicas existentes. Persistir senha temporária somente cifrada via AES-GCM derivado de `AUTH_SECRET`; hash da senha fica em `users.password_hash`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 5: BKO novos acessos e logística manual

**Files:**
- Modify: `app/api/admin/overview/route.ts`
- Create: `app/api/admin/access/route.ts`
- Modify: `app/api/admin/orders/route.ts`
- Modify: `app/painel/portal-client.tsx`
- Create: `tests/bko-access.test.mjs`

**Interfaces:**
- Produces: GET/POST `/api/admin/access` para revelar uma vez/resetar senha; overview inclui `orderType`, telefone, endereço e estado de provisionamento; despacho aceita rastreio vazio.

- [ ] **Step 1: Write the failing test**

```js
assert.match(portal, /Novos acessos/);
assert.match(portal, /Abrir WhatsApp/);
assert.match(adminOrders, /carrier/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Adicionar bloco BKO sem remover `AdminView` nem as métricas existentes. Ações: copiar e-mail, copiar senha temporária, WhatsApp manual, reset de senha, status `processing/shipped/delivered`, transportadora/rastreio opcionais.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 6: Remover Resend do fluxo e ocultar multiusuário

**Files:**
- Modify: `app/painel/portal-client.tsx`
- Modify: `app/termos-de-uso/page.tsx`
- Modify: `app/politica-de-privacidade/page.tsx`
- Modify: `.env.example`
- Modify: `HOSTINGER-DEPLOY.md`
- Modify: `tests/legal-pages.test.mjs`
- Modify: `tests/hostinger-architecture.test.mjs`

**Interfaces:**
- Produces: produção sem `RESEND_API_KEY`/`EMAIL_FROM`; navegação não mostra equipe; termos descrevem e-mail + senha.

- [ ] **Step 1: Write the failing test**

```js
assert.doesNotMatch(envExample, /RESEND_API_KEY/);
assert.doesNotMatch(loginPage, /código de 6 dígitos/);
assert.doesNotMatch(navigationSource, /\["team"/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Retirar dependência operacional de Resend; manter tabelas/rotas legadas não referenciadas apenas para compatibilidade de banco, sem exposição na UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 7: Migração segura e documentação BKO/Hostinger

**Files:**
- Create: `database/migrations/2026-09-18-structural-update.sql`
- Modify: `database/schema.sql`
- Modify: `HOSTINGER-DEPLOY.md`
- Create: `BKO-CADASTRO-E-EXPEDICAO.md`
- Modify: `LEIA-ME-PRIMEIRO.md`
- Create: `tests/migration.test.mjs`

**Interfaces:**
- Produces: migration não destrutiva; guia de uso do BKO e deploy Hostinger.

- [ ] **Step 1: Write the failing test**

```js
assert.match(migration, /ADD COLUMN.*password_hash/i);
assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/i);
assert.match(guide, /Pagamento confirmado/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Criar migration aditiva e documentação com sequência: backup → migration → env → deploy → webhook → sandbox → produção.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

### Task 8: Verificação final e pacote GitHub/Hostinger

**Files:**
- Modify: `STATUS-VALIDACAO.md`
- Package: `/mnt/data/MIX10-PRO-HOSTINGER-STRUCTURAL-UPDATE.zip`

**Interfaces:**
- Consumes: todas as tarefas anteriores.
- Produces: ZIP sem `node_modules`, `.next`, `.env` ou segredos reais.

- [ ] **Step 1: Run full tests**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 2: Install dependencies and build**

Run: `npm ci && npm run build`
Expected: build Next.js de produção concluído. Se o registry estiver indisponível, registrar exatamente a limitação e ainda executar todas as verificações estáticas disponíveis.

- [ ] **Step 3: Verify package hygiene**

Run: `grep -R "sk_live\|ASAAS_API_KEY=.*[^=]" . --exclude-dir=.git --exclude='*.md'`
Expected: nenhum segredo real.

- [ ] **Step 4: Create ZIP**

Run: `zip -r /mnt/data/MIX10-PRO-HOSTINGER-STRUCTURAL-UPDATE.zip . -x 'node_modules/*' '.next/*' '.env' '.git/*'`
Expected: ZIP íntegro e pronto para GitHub/Hostinger.
