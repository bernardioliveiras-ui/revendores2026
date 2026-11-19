# ANVISA Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** conectar a notificação editada no Studio ao mesmo componente da prévia e da LP pública.

**Architecture:** usar `mix10pro.007` de ponta a ponta; derivar três linhas exibidas sem alterar marcação estrutural; migrar a leitura dos textos legados para o novo default mantendo conteúdos personalizados. Usar o armazenamento de rascunho/publicação já existente.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-19-anvisa-studio-design.md`

## Global Constraints

- Não tocar checkout, pagamentos, credenciais ou banco de produção.
- Texto confirmado: `Processo de Notificação Anvisa Nº 25351.205227/2026-38`.
- Manter `mix10pro.007` e as classes `.lnr-anvisa-line`.

## Review Focus

- Texto novo aparece no HTML e texto antigo desaparece.
- Edição sem o padrão ANVISA não é descartada.
- Entidades HTML maliciosas são escapadas.
- Publicação não ocorre ao salvar rascunho.
- Textos legados recebem o novo default, sem substituir personalizações.

### Task 1: Ligação da notificação à landing

**Files:**
- Modify: `components/landing-sections.tsx`
- Modify: `data/landing-texts.json`
- Modify: `lib/landing-texts.ts`
- Create: `lib/anvisa-notification.ts`
- Test: `tests/anvisa-studio-runtime.test.mjs`

**Interfaces:** `parseAnvisaNotification(text: string)` retorna `{ heading: string, subtitle: string, number: string }` para o componente.

- [ ] **Step 1:** criar teste que renderiza a landing com `mix10pro.007` editado e exige o número customizado na prévia/página e não o fixo.
- [ ] **Step 2:** rodar e observar falha específica por número fixo.
- [ ] **Step 3:** conectar o campo, preservar as três linhas e atualizar o default/valores legados.
- [ ] **Step 4:** rodar os testes de notificação e verificar comportamento de rascunho/publicação e HTML escapado.
- [ ] **Step 5:** rodar a suíte geral e checagem TypeScript ou relatar limitação do ambiente.

### Task 2: Entrega segura

**Files:**
- Create: `CORRECAO-STUDIO-ANVISA-LEIA-ME.md`
- Output: `LORDNUTRI-REVENDEDORES-1.8.1-STUDIO-ANVISA-CORRIGIDO.zip`

- [ ] **Step 1:** instruir deploy sem apagar MySQL/variáveis e nova publicação no Studio.
- [ ] **Step 2:** empacotar apenas o projeto completo em ZIP separado do original.
- [ ] **Step 3:** comparar conteúdo do ZIP e entregar arquivo após validação.
