# Acesso manual a materiais e marca do BKO — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar liberação manual auditável de PDF/materiais no BKO, corrigir o alinhamento do título da barra lateral e padronizar o ícone instalado do PWA.

**Architecture:** Eventos de acesso em tabela MySQL independente, leitura da decisão mais recente no guard compartilhado de materiais, rota admin autenticada e controle React local à lista de revendedores. Ajuste CSS restrito ao seletor da marca.

**Tech Stack:** Next.js 16, TypeScript, MySQL, React, node:test.

**Spec:** `docs/superpowers/specs/2026-11-23-offline-materials-and-bko-brand-design.md`

## Global Constraints

- Não reescrever status Asaas, compras, estoque nem perfis existentes.
- Apenas administrador concede/revoga, com conferência de identidade e auditoria persistente.
- Acesso padrão continua negado; anonimato e senha obrigatória seguem protegidos.

## Review Focus

- Usuário inexistente/inativo/não revendedor → concessão negada.
- Sem `Origin` confiável, e-mail divergente ou confirmação → nenhuma escrita.
- Revogação e concessão repetidas → operação idempotente rejeitada, histórico preservado.
- Falha de DB → PDF e materiais continuam bloqueados, sem bypass.
- Visão mobile do BKO → logo, texto e botão menu separados.

### Task 1: Acesso manual auditável

**Files:** criar `lib/manual-material-access.ts`, `app/api/admin/resellers/material-access/route.ts` e testes `tests/manual-material-access.test.mjs`; modificar `lib/reseller-materials.ts` e `app/api/reseller/manual/route.ts`.

**Interfaces:** `hasActiveManualMaterialGrant(userId): Promise<boolean>`; `GET /api/admin/resellers/material-access?userId=...`; `POST /api/admin/resellers/material-access` com `userId,email,action,reason,proofReference,confirm`.

- [ ] Escrever testes que falham para concessão/revogação, auditoria, identidade, origem e leitura de PDF/material.
- [ ] Executar os testes e conferir as falhas esperadas.
- [ ] Implementar tabela, guarda compartilhado e rota admin, mantendo a lógica Asaas atual intacta.
- [ ] Executar os testes até passarem.

### Task 2: Controle do BKO e identidade visual

**Files:** criar `components/manual-material-access-admin.tsx`; modificar `app/painel/portal-client.tsx`, `app/portal-modern.css` e adicionar teste visual estrutural.

**Interfaces:** `ManualMaterialAccessAdmin({userId,email,name})` usa rota apenas quando acionado.

- [ ] Escrever testes que falham para integração do botão e título em coluna.
- [ ] Executar os testes e conferir as falhas esperadas.
- [ ] Implementar controle e corrigir seletor CSS `last-of-type`.
- [ ] Executar testes e verificações do projeto.

### Task 3: Marca do app instalado

**Files:** modificar `app/manifest.ts`, `app/layout.tsx`, `app/icon.png`, `app/apple-icon.png`; criar `public/brand/lordnutri-app-icon-512.png` e `tests/pwa-install-branding.test.mjs`.

- [x] Escrever teste que falha para manifesto preto e ícones opacos 512×512.
- [x] Compor a marca existente no fundo preto, mantendo o logo transparente original.
- [x] Conferir ícone gerado e executar os testes da instalação.

### Task 4: Entrega

- [ ] Revisar alterações e executar suite completa; registrar eventuais bloqueios de dependências.
- [ ] Gerar pacote de patch com caminhos relativos preservados e instruções para o GitHub Desktop.
