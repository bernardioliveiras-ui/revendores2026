# Automações de campanha e rastreio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checklist syntax.

**Goal:** Links públicos seguem o nome atual e status dos Correios aparecem automaticamente nos portais.

**Architecture:** Persistir novo public_slug dentro da transação da campanha, sem alterar public_code. Usar a integração Correios e workflow existentes; separar data da tentativa da data de resposta válida, adicionar acionamento autenticado e polling somente da API interna.

**Tech Stack:** Next.js 16, React, TypeScript, Drizzle/MySQL, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-21-automacoes-campanhas-rastreio-design.md`

## Global Constraints

- Não acessar nem modificar o banco online neste trabalho.
- Não registrar dados falsos dos Correios e não realizar repasses financeiros.
- Validar atualização de link sem alterar public_code/campaign_id.
- Não expor token ou credenciais na resposta nem no JavaScript do cliente.

## Review Focus

- Colisão de nomes de campanha: novo slug recebe sufixo único.
- Nome renomeado de novo: URL muda a cada vez, código interno continua.
- Falha de API: último evento válido permanece e tentativa ganha horário.
- Sem eventos: consulta bem-sucedida registrada sem marcar entrega.
- Usuário não administrador: acesso negado ao gatilho manual.

## Task 1 — Nome da campanha e URL

**Files:** `app/api/indicator/campaign/route.ts`, `app/api/admin/indicators/campaign/route.ts`, `tests/campaign-friendly-links.test.mjs`.

- [ ] Escrever teste de PATCH/POST de atualização verificando nome, publicSlug novo e publicCode idêntico; cobrir colisões.
- [ ] Executar teste e observar falha de comportamento.
- [ ] Implementar reserva de slug único e atualização na mesma transação.
- [ ] Reexecutar teste e suíte relevante.

## Task 2 — Consulta dos Correios auditável

**Files:** `lib/shipping.ts`, `tests/integracoes-correios.test.mjs`.

- [ ] Escrever testes para sucesso sem evento e falha, distinguindo postalAttemptAt e postalCheckedAt.
- [ ] Executar RED.
- [ ] Persistir checkedAt em resposta bem-sucedida, mesmo sem evento; manter última consulta válida em falha.
- [ ] Executar GREEN e testes de remessa.

## Task 3 — Sincronização imediata e visualização automática

**Files:** `app/api/admin/shipping/sync/route.ts`, `components/bko-shipping.tsx`, `app/painel/portal-client.tsx`, `tests/integracoes-correios.test.mjs`, `tests/shipping-dashboard.test.mjs`.

- [ ] Escrever testes para endpoint admin-only, botão de disparo e atualização da visão.
- [ ] Executar RED.
- [ ] Implementar endpoint e botão, mostrar tentativa e último resultado, polling do CRM com aba visível.
- [ ] Executar GREEN, suíte completa, TypeScript e build.

## Task 4 — CSS e entrega

**Files:** `app/portal-modern.css`, arquivos de distribuição e README.

- [ ] Verificar regras `.lord-demo-dashboard` e import no layout e compilação.
- [ ] Empacotar somente arquivos necessários e incluir CSS moderno completo.
- [ ] Conferir conteúdo/segredos do ZIP; nenhuma publicação automática.
