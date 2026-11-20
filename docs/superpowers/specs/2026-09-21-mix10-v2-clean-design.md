# MIX10 PRO v2 Clean — Design Spec

## Goal
Rebuild the MIX10 PRO reseller funnel and portal from a clean database for Hostinger, keeping the product simple: public VSL landing page, KIT20/KIT50 purchase through Asaas, BKO-controlled access release, reseller dashboard with overview/stock/sales/affiliates, and admin metrics/logistics.

## Public funnel
1. `/` is the public landing page and follows the 2026 LordNutri briefing sequence: opening, 3 steps, market/opportunity, product, 5 reasons, simulator, kits, FAQ and checkout.
2. A local MP4 VSL is loaded from `/videos/vsl-mix10.mp4`; the repository includes instructions but not a fabricated video asset.
3. KIT20: 20 boxes, R$ 74.90 each, R$ 1,498.00 total.
4. KIT50: 50 boxes, R$ 69.90 each, R$ 3,495.00 total.
5. Checkout collects name, email, WhatsApp, CPF/CNPJ, CEP, street, number, complement, district, city, state, selected kit, marketing attribution and legal consent.
6. Server owns kit prices. The browser never supplies authoritative totals.
7. Checkout creates/gets the Asaas customer, creates a payment and redirects to the Asaas invoice URL. Payment methods/instalments displayed by Asaas follow the merchant account configuration.

## Payment and BKO
1. Webhook accepts only requests with the configured Asaas webhook token.
2. Webhook events are idempotent using `asaas_events`.
3. Confirmed/received payment changes purchase to `paid`; it does not create login credentials automatically.
4. BKO sees paid purchases awaiting access and clicks “Liberar acesso”.
5. Access release creates one reseller user/profile, creates initial stock, generates a temporary password, stores only its scrypt hash and returns the temporary password once to the BKO.
6. BKO sends email + temporary password manually by WhatsApp.
7. BKO can reset a temporary password when necessary.
8. Purchase logistics use `payment_pending → paid → separating → shipped → delivered`. Carrier and tracking are optional.

## Authentication
1. Login uses email + password only; no Resend, OTP or email invitation system.
2. Admin can bootstrap on a clean database with `ADMIN_EMAILS` + `ADMIN_BOOTSTRAP_PASSWORD`.
3. First reseller/admin login with a temporary/bootstrap password requires a password change.
4. Session tokens are random, stored as hashes, and sent in HttpOnly cookies.
5. Five invalid password attempts cause a 15 minute lock.

## Reseller portal
Navigation is intentionally small: Visão geral, Estoque, Vendas, Afiliados.
- Overview: current stock, boxes sold, gross sales registered, affiliate links and clicks.
- Stock: current stock and movement history.
- Sales: register sale (boxes, unit price, channel, optional customer and notes); sale cannot exceed stock.
- Affiliates: collect customer name + WhatsApp, generate individual `/r/{code}` link and count clicks; destination is configured by `AFFILIATE_DESTINATION_URL`.

## BKO/Admin portal
Admin dashboard includes paid purchases, pending access releases, active resellers, kits revenue, boxes sold by resellers, aggregate stock, affiliate links/clicks, access release/reset and shipping status management.

## Database
Fresh MySQL schema only; no migrations from legacy MIX10 are required. Tables: `users`, `auth_sessions`, `purchases`, `reseller_profiles`, `stock_movements`, `sales`, `affiliate_referrals`, `affiliate_clicks`, `asaas_events`.

## Hosting
Target is Hostinger Node.js, Node 22.x, MySQL, HTTPS and environment variables. No Cloudflare Worker, D1 or Resend runtime.

## Deliberate V1 exclusions
No multi-user reseller teams, no email delivery service, no automated shipping carrier integration, no training/manual module, no automatic affiliate commissions, and no legacy database migration.
