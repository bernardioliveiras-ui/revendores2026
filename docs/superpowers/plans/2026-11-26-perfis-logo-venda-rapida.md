# LORD NUTRI — Perfis, marca e venda rápida Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perfis editáveis, identidade visual nítida e Venda Rápida com preço fixo administrado pelo BKO e débito de estoque transacional.

**Architecture:** Next.js 16 com MySQL/Drizzle. Novas tabelas/colunas aditivas para perfil, configuração de preço e idempotência; componentes compartilhados de perfil/vendas; sem alteração no checkout Asaas. Conteúdo publicado como ZIP de repositório, pois a origem recebida não tem `.git`.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Drizzle ORM/MySQL, testes `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-26-perfis-logo-venda-rapida-design.md`

## Global Constraints

- Preço inicial R$109,90 (10990 centavos), alterável somente pelo BKO; proibir edição na API de revendedor.
- Revenda preserva Asaas/Correios/estoque, não cria cobrança, não altera histórico existente.
- Sem notificações ou Web Push nesta versão.
- Logo fornecida é a referência de marca; imagens de usuário privadas, biografia até 160 caracteres.
- Banco Hostinger atualizado somente por migrações aditivas e idempotentes.

## Review Focus

1. Preço enviado adulterado por revendedor: servidor usa preço BKO, não request (Task 2).
2. Duplo clique/reenvio de POST de venda: mesma solicitação debita uma vez (Task 2).
3. Duas vendas concorrentes excedendo saldo: o lock rejeita excesso (Task 2).
4. Fotos inválidas/disfarçadas ou de outro titular: upload rejeitado e avatar protegido (Task 3).
5. Upload ZIP sobre base antiga: nenhuma tabela/dado removido e BKO/Asaas intactos (Task 4).

---

### Task 1: Preço administrado pelo BKO

**Files:** Create `lib/reseller-sale-price.mjs`, `app/api/admin/reseller-sale-price/route.ts`, tests `tests/reseller-sale-price.test.mjs`. Modify `db/schema.ts`, `database/schema.sql`, `lib/runtime-schema.ts`, `app/api/stock/route.ts`, `app/painel/portal-client.tsx` (admin config only).

**Interfaces:** `getResellerSalePriceCents()` returns integer 10990 by default; `PATCH /api/admin/reseller-sale-price` accepts `{priceCents,reason}`, authenticates admin and appends audit; seller `GET /api/stock` includes `salePriceCents`.

- [ ] RED: test default price, invalid price/reason, admin-only PATCH, audit and immutable existing sales. Run `node --test tests/reseller-sale-price.test.mjs` (must fail).
- [ ] GREEN: additive singleton table + audit table; price GET and BKO config UI. Run same command (must pass).
- [ ] Check TypeScript `npx tsc --noEmit`.

### Task 2: Venda Rápida segura e responsiva

**Files:** Create `components/reseller-quick-sale.tsx`, `lib/reseller-sale-calculation.mjs`, `tests/reseller-quick-sale.test.mjs`. Modify `app/api/sales/route.ts`, `db/schema.ts`, `database/schema.sql`, `lib/runtime-schema.ts`, `app/painel/portal-client.tsx`, `app/portal-modern.css`.

**Interfaces:** `salePriceCents` comes from Task 1; client submits `{boxes,channel?,customerName?,notes?,requestId}`; server locks seller, reads authoritative price, rejects stale stock and inserts one movement for one requestId; UI shows projected saldo e total before submit.

- [ ] RED: tests for preview 50-3=47, price 10990 fixed, validation and idempotency. Run `node --test tests/reseller-quick-sale.test.mjs` (must fail).
- [ ] GREEN: transactional endpoint change, idempotency column unique, compact component/mobile CSS; run targeted tests (must pass).
- [ ] Verify existing sales regressions and TypeScript.

### Task 3: Meu Perfil com foto e bio

**Files:** Create `lib/user-profile.ts`, `app/api/profile/route.ts`, `app/api/profile/avatar/route.ts`, `components/user-profile-editor.tsx`, `tests/user-profile.test.mjs`. Modify `db/schema.ts`, `database/schema.sql`, `lib/runtime-schema.ts`, `components/indicator-portal.tsx`, `app/painel/portal-client.tsx`, CSS.

**Interfaces:** GET/PATCH profile owner `{bio,avatarUrl}`; POST/DELETE avatar authenticated (image bytes validated and optimized by server), `Avatar` never exposed to another reseller. BKO may view avatars with admin session.

- [ ] RED: bio limit, invalid payload/role, avatar MIME+signature+size, owner authorization, removal. Run `node --test tests/user-profile.test.mjs` (must fail).
- [ ] GREEN: persistence, APIs, profile editor in both portals and avatar in headers. Run targeted tests (must pass).
- [ ] Check TypeScript and accessibility.

### Task 4: Marca, Indicações e entrega

**Files:** Modify `components/brand-logo.tsx`, `public/brand/*` (new supplied logo), `app/manifest.ts`, `app/painel/portal-client.tsx`, CSS. Create `tests/lord-profile-brand-ui.test.mjs`, `ATUALIZACAO-PERFIL-VENDAS-LOGO-2026-11-26.md`.

**Interfaces:** BrandLogo shows new high-res asset; compact mark remains legible; reseller nav excludes Referrals and hides inactive view, without deleting `/api/referrals` or rows.

- [ ] RED: test brand asset/source, no reseller indications tab, preserved referral API and data. Run `node --test tests/lord-profile-brand-ui.test.mjs` (must fail).
- [ ] GREEN: asset replacement, CSS for responsive headers, remove only reseller UI; targeted tests pass.
- [ ] Verify `npx tsc --noEmit`, `npm run build`, `npm test` and report baseline failures explicitly.
- [ ] Produce validated ZIP completo + ZIP leve, then save both persistently and return working download links.

## Execution note

The recovered ZIP has no Git metadata, so per-task commits/worktrees are unavailable. The work remains isolated in this recovered source directory and will be delivered as verifiable ZIPs; no external GitHub/Hostinger publication is authorized.
