# Manual Resellers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register and activate resellers manually without payments while preserving automatic Asaas onboarding and the current UI.

**Architecture:** Add nullable purchase linkage and separate one-time reseller invitations. New BKO endpoint registers users/profiles atomically and activation endpoint sets the password; a small component extends the existing BKO. Fix proven Asaas webhook fail-open behavior separately.

**Tech Stack:** Next.js 16, React 19, Drizzle MySQL, Node built-in tests, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-23-manual-resellers-design.md`

## Global Constraints

- Preserve existing BKO styling and automatic Asaas purchase provisioning.
- Manual account starts with 0 stock and no purchases/cobrancas.
- Invitation expires in 24h; must not affect indicator invitations.
- Database migration is additive and does not wipe data.
- No writes to live Hostinger or Asaas are authorized.

## Review Focus

- Malformed, duplicate, reserved-admin or conflicting emails should not create any account.
- Invalid/expired/used invitation should not enable password-based access.
- Manually created reseller should quote replenishment using saved CEP and CPF/CNPJ.
- Duplicate or mismatched webhook must not provision an unrelated purchase.
- Paid-by-Asaas profiles must retain their original purchase foreign key and stock rules.

### Task 1: Registration validation and schema

**Files:** Create `lib/reseller-registration.mjs`, modify `db/schema.ts`, `database/schema.sql`, `lib/runtime-schema.ts`, `scripts/migration-core.mjs`, add tests `tests/manual-reseller-registration.test.mjs`.

**Interfaces:** `validateManualReseller(data, normalizeEmail, isAdminEmail) -> {value}|{error}`. Drizzle model `resellerInvitations`. nullable `resellerProfiles.purchaseId`.

- [ ] Write tests for valid canonical address, invalid CPF/CNPJ/CEP, and missing fields; run to see RED.
- [ ] Add pure validation, schema definitions and backward-compatible migration; run GREEN.

### Task 2: Admin registration, invitations and activation

**Files:** Modify `app/api/admin/resellers/route.ts`, add `lib/reseller-invitations.ts`, `app/api/admin/resellers/invite/route.ts`, `app/api/reseller/activate/route.ts`, add `tests/manual-reseller-invitations.test.mjs`.

**Interfaces:** `issueResellerInvitation(userId)` returns `{activationPath,expiresAt}`, admin POST returns `{created,userId,activationPath,expiresAt}`; activation POST accepts `{token,password,confirm}`.

- [ ] Write failing tests for invitation policy and handling; observe RED.
- [ ] Implement atomic registration, invitation generation/regeneration and one-use activation; verify GREEN.
- [ ] Update deletion for empty manual profile and invitations without touching paid orders.

### Task 3: BKO and self-service activation UI

**Files:** Create `components/manual-reseller-registration.tsx`, `app/ativar-revendedor/page.tsx`, `app/ativar-revendedor/activate-reseller-form.tsx`; modify `app/painel/portal-client.tsx`, `app/api/admin/overview/route.ts`; add UI contract tests.

**Interfaces:** `ManualResellerRegistration({onCreated})`, `POST /api/admin/resellers` and `POST /api/admin/resellers/invite`.

- [ ] Write failing UI contract tests; observe RED.
- [ ] Implement preserving existing BKO classes; CEP lookup uses existing backend lookupPostalCode via new BKO GET endpoint; check GREEN.

### Task 4: Asaas webhook audit and regression

**Files:** `lib/billing-webhook.ts`, `tests/asaas-webhook-runtime.test.mjs` (or focused alternative with existing loader), `docs/ASAAS-AUDITORIA-2026-11-23.md`.

- [ ] Reproduce fail-open payment case and verify regression RED.
- [ ] Reject paid webhook missing saved Asaas customer identity; verify GREEN and no regressions.
- [ ] Record unconfirmed issues needing live Asaas sandbox or business-policy choices (webhook latency, partial refund).

### Task 5: Verification and delivery

**Files:** User-facing `REVISAO-E-CADASTRO-MANUAL-2026-11-23.md`, ZIP package.

- [ ] Run full tests, `tsc`, lint and build if dependencies available. State any limits honestly.
- [ ] Ensure no secrets or generated dependencies are in ZIP, pack with original structure and document migration/deployment.
- [ ] Preserve ZIP as a new downloadable artifact.
