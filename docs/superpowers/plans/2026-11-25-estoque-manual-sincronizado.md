# Manual Stock Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and adjust current reseller stock in BKO and synchronize with the existing reseller portal and sales.

**Architecture:** Continue to use `stock_movements` as the single inventory ledger. Initial manual stock and the reseller identity share a transaction; later admin corrections compute delta under an account lock with an optimistic expected-balance guard, preserving every prior stock entry. Existing no-cache 30-second refresh feeds BKO and the portal.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle MySQL, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-25-estoque-manual-sincronizado-design.md`

## Global Constraints

- Do not change paid-order provisioning, webhook semantics, Asaas charges, or reseller activation invitations.
- No database reset, data rewrite, or secret files in the delivery.
- No schema migration is required; reuse `stock_movements`.
- Input quantities must be finite, nonnegative safe integers fitting MySQL `int`.
- Do not remotely deploy: deliver a tested GitHub-ready ZIP and deployment notes.

## Review Focus

- A repeated registration cannot leave an orphan inventory movement.
- Zero-stock manual creation does not create a phantom purchase/entry.
- A stock correction after a concurrent sale must not erase the sale.
- A user other than the BKO cannot adjust someone else's stock.
- A manual adjustment cannot be misidentified as an Asaas-confirmed purchase.

---

### Task 1: Initial stock registration

**Files:** `lib/reseller-registration.mjs`, `app/api/admin/resellers/route.ts`, `components/manual-reseller-registration.tsx`, `tests/manual-reseller-registration.test.mjs`, `tests/manual-reseller-route.test.mjs`.

**Interfaces:** Extend `validateManualReseller` output with `initialBoxes`. POST creates an `entry` movement with `referenceType="manual_initial_stock"` and `referenceId=profileId` for positive boxes only.

- [ ] Add validation and route tests for 0, 50, invalid integer, and atomicity; run RED.
- [ ] Implement validation and transactional stock entry; run GREEN.
- [ ] Add initial-stock field and message to BKO form.

### Task 2: Admin current-balance adjustment

**Files:** Create `lib/stock-adjustment.mjs`, `app/api/admin/resellers/stock/route.ts`; create `tests/admin-stock-adjustment.test.mjs`.

**Interfaces:** `validateStockCorrection(body)` validates `userId`, `desiredStock`, `expectedStock`, and `reason`; `planStockCorrection(current,desired,reason,actorId)` computes an adjustment or a no-op. `POST /api/admin/resellers/stock` returns `{updated,changed,stock}`; stale expected stock returns 409 with actual stock.

- [ ] Test pure validation and signed deltas; run RED.
- [ ] Implement validator and planner; run GREEN.
- [ ] Test route role/origin/account lock/current stock/no-op/stale/rollback; run RED.
- [ ] Implement the transactional route with a purchase-ledger repair before the lock; run GREEN.

### Task 3: BKO adjustments and synchronized displays

**Files:** Create `components/admin-reseller-stock-adjustment.tsx`; modify `app/api/admin/overview/route.ts`, `app/painel/portal-client.tsx`; add relevant UI or aggregation contract tests.

**Interfaces:** Include `stockAdjustments` array per admin reseller. Render BKO correction form and audit history; translate entry/adjustment labels on reseller portal. Existing `loadAdmin`, `loadReseller` refresh with no cache at most every 30 seconds and immediately after BKO writes.

- [ ] Add failing integration/aggregation tests for adjustment history visibility.
- [ ] Implement history aggregation and BKO form, labels and refresh.
- [ ] Run focused tests GREEN.

### Task 4: End-to-end verification and ZIP

**Files:** Add `ESTOQUE-MANUAL-SINCRONIZADO-2026-11-25.md`, final ZIP.

- [ ] Run complete `npm test`, TypeScript check, lint and production build if dependencies can be installed.
- [ ] Review new code for auth, concurrency, existing data and financial isolation.
- [ ] ZIP the original project tree without dependencies, secrets or generated files; inspect the ZIP and include deployment instructions.
