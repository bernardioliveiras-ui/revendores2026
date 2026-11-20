# MIX10 PRO v2 Clean Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean Hostinger-ready MIX10 PRO funnel and reseller/BKO portal from a fresh MySQL database.

**Architecture:** One Next.js App Router application runs the landing page, checkout, authenticated portal and API routes. MySQL stores purchases, users, sessions, stock, sales and affiliates. Asaas is the only external payment dependency; BKO manually releases and sends access after payment confirmation.

**Tech Stack:** Node.js 22.x, Next.js 16, React 19, TypeScript, Drizzle ORM, mysql2, native Node crypto, CSS.

**Spec:** `docs/superpowers/specs/2026-09-21-mix10-v2-clean-design.md`

## Global Constraints
- Hostinger + MySQL only; no Cloudflare/D1.
- No Resend/OTP authentication.
- KIT20 = 20 boxes × R$74.90 = R$1,498.00.
- KIT50 = 50 boxes × R$69.90 = R$3,495.00.
- Access is released manually by BKO after Asaas confirms payment.
- One purchase creates at most one reseller account.
- Reseller views only own data; admin sees global metrics.
- Keep V1 small: overview, stock, sales and affiliates.

---

### Task 1: Foundation, kits and fresh schema
**Files:** `package.json`, `.env.example`, `lib/kits.ts`, `db/schema.ts`, `database/schema.sql`, `tests/foundation.test.mjs`
**Interfaces:** `getKit(id)` returns authoritative kit pricing; schema exposes all V1 tables.
- [ ] Write failing tests for kit prices, required schema tables and forbidden legacy dependencies.
- [ ] Run `npm test` and verify failure.
- [ ] Implement config, kit catalog and clean schema.
- [ ] Run `npm test` and verify pass.

### Task 2: Landing page and public checkout
**Files:** `app/page.tsx`, `app/globals.css`, `components/checkout-form.tsx`, `app/api/public/checkout/route.ts`, `lib/asaas.ts`, `tests/landing-checkout.test.mjs`
**Interfaces:** `POST /api/public/checkout` validates buyer/address/kit, uses server price and returns `invoiceUrl`.
- [ ] Write failing source/behavior tests for briefing blocks and server-owned kit pricing.
- [ ] Run tests red.
- [ ] Implement responsive LP, VSL slot, simulator, kits and checkout.
- [ ] Run tests green.

### Task 3: Email/password authentication
**Files:** `lib/passwords.ts`, `lib/auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/change-password/route.ts`, `app/api/auth/session/route.ts`, `app/api/auth/logout/route.ts`, `app/entrar/*`, `app/trocar-senha/*`, `tests/auth.test.mjs`
**Interfaces:** login/session/change-password endpoints; admin bootstrap from env.
- [ ] Write failing tests for password hashing, no OTP/Resend and required first-password-change flow.
- [ ] Run tests red.
- [ ] Implement auth.
- [ ] Run tests green.

### Task 4: Asaas webhook and purchase lifecycle
**Files:** `app/api/billing/webhook/route.ts`, `lib/purchases.ts`, `tests/asaas-webhook.test.mjs`
**Interfaces:** authenticated webhook records event once and marks purchase paid.
- [ ] Write failing tests for token check, idempotency and paid status mapping.
- [ ] Run tests red.
- [ ] Implement webhook lifecycle.
- [ ] Run tests green.

### Task 5: BKO access release and logistics
**Files:** `app/api/admin/overview/route.ts`, `app/api/admin/access/route.ts`, `app/api/admin/shipping/route.ts`, `tests/admin.test.mjs`
**Interfaces:** admin can list metrics/purchases, release/reset access and update shipping.
- [ ] Write failing tests for admin-only release, one reseller per purchase and optional tracking.
- [ ] Run tests red.
- [ ] Implement endpoints transactionally.
- [ ] Run tests green.

### Task 6: Reseller stock, sales and affiliates
**Files:** `app/api/sales/route.ts`, `app/api/stock/route.ts`, `app/api/referrals/route.ts`, `app/r/[code]/route.ts`, `lib/stock.ts`, `tests/reseller-features.test.mjs`
**Interfaces:** stock derived from movements; sales cannot exceed stock; referrals redirect and count clicks.
- [ ] Write failing tests for stock arithmetic, sale constraints and affiliate link shape.
- [ ] Run tests red.
- [ ] Implement APIs and helpers.
- [ ] Run tests green.

### Task 7: Portal UI and legal pages
**Files:** `app/painel/page.tsx`, `app/painel/portal-client.tsx`, `app/termos-de-uso/page.tsx`, `app/politica-de-privacidade/page.tsx`, `tests/portal-ui.test.mjs`
**Interfaces:** reseller gets four simple views; admin gets BKO view with metrics/access/shipping.
- [ ] Write failing UI source tests.
- [ ] Run tests red.
- [ ] Implement portal UI.
- [ ] Run tests green.

### Task 8: Hostinger packaging and verification
**Files:** `HOSTINGER-DEPLOY.md`, `BKO-OPERACAO.md`, `README.md`, `STATUS-VALIDACAO.md`, `tests/deploy.test.mjs`
**Interfaces:** fresh database deploy instructions and BKO operating guide.
- [ ] Write failing deployment-content tests.
- [ ] Run full tests.
- [ ] Add docs/config until full tests pass.
- [ ] Attempt `npm ci`, `npm run build` and record evidence honestly.
- [ ] Package source without secrets, `node_modules` or `.next`.
