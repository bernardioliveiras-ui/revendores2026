# BKO Mobile, Pedido Definitivo e PDF Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar BKO responsivo, exclusão definitiva segura de compras de teste e troca de PDFs no painel.

**Architecture:** React/CSS adapta o menu admin sem alterar o desktop. MySQL guarda arquivos substituídos e exclusões auditadas; a API só permite exclusão com confirmação estrita e sem dependências ativas. Integração Asaas permanece intacta.

**Tech Stack:** Next.js/React, TypeScript, MySQL/mysql2, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-23-bko-celular-pedidos-materiais-design.md`

## Global Constraints

- Não chamar mutação Asaas para excluir pedido; não executar reset total do banco.
- Pedidos com vendas, expedição ou cashback pago não podem ser apagados.
- PDFs restritos a login válido; 20 MiB máximo; link do manual estável.
- Tela de 360px não deve empurrar indicadores para depois de todos os menus.
- Ambiente sem `.git` e sem dependências `node_modules`: executar verificações Node suportadas e relatar limitações.

## Review Focus

- Pedido com email existente e outras compras não pode remover conta compartilhada: teste em `bko-order-delete.test.mjs`.
- Pedido pendente que inexplicavelmente tem `accessReleasedAt` não deve exibir nova senha: teste em `bko-mobile-materials.test.mjs`.
- Pedido com evento Asaas e pagamento confirmado: exclusão não pode chamar API externa; teste em `bko-order-delete.test.mjs`.
- Upload de PDF vazio, HTML disfarçado de PDF ou arquivo grande deve falhar: teste em `bko-pdf-replace.test.mjs`.
- Substituição manual não deve tornar PDF público: teste em `bko-pdf-replace.test.mjs`.

---

### Task 1: Navegação mobile e correção de acesso pendente

**Files:** Modify `app/painel/portal-client.tsx`, `app/portal-modern.css`; Test `tests/bko-mobile-materials.test.mjs`.

**Interfaces:** State `mobileMenuOpen`, toggle `.lord-mobile-menu-trigger`, sidebar `.is-mobile-open`; seleção de tab fecha o menu; compra paga + `asaasVerifiedAt` é condição necessária para acesso.

- [ ] Escrever testes estáticos para menu mobile, regras CSS 780px, status pendente e responsividade dos filtros.
- [ ] Rodar teste e confirmar falha relevante.
- [ ] Implementar menu expansível apenas no mobile, filtros envolventes, ações de acesso protegidas.
- [ ] Rodar os testes até passarem.

### Task 2: Substituição de PDF e metadados

**Files:** Modify `components/reseller-materials.tsx`, `app/api/admin/reseller-materials/route.ts`, `app/api/reseller/manual/route.ts`, `lib/reseller-materials.ts`; Test `tests/bko-pdf-replace.test.mjs`.

**Interfaces:** `PUT /api/admin/reseller-materials` aceita `FormData` `{id,title,file?}` ou `{kind:'manual',title,file}`; `GET /api/reseller/manual` usa registro manual sobrescrito, com fallback para arquivo atual; helper `getPublishedManual()` consulta MySQL.

- [ ] Criar testes para validação MIME/magic bytes, update atômico, senha/autorização, link estável e fallback.
- [ ] Rodar os testes e verificar falha antes da alteração.
- [ ] Implementar validação de upload, PUT de arquivo existente, publicação manual em tabela singleton e UI de substituir/editar.
- [ ] Rodar testes novos e regressões de materiais.

### Task 3: Exclusão definitiva de compras no BKO

**Files:** Create `app/api/admin/orders/delete/route.ts`, `lib/bko-order-deletion.mjs`; Modify `app/painel/portal-client.tsx`, `database/schema.sql`; Test `tests/bko-order-delete.test.mjs`.

**Interfaces:** `DELETE /api/admin/orders/delete` JSON `{purchaseId,orderNumber,confirm}` com `confirm===orderNumber`; retorna `{deleted:true}` ou `{error,code,blockers}`. MySQL transaciona eliminação de vínculos e grava tombstone `bko_order_deletions` antes do commit.

- [ ] Criar testes para auth/origem/confirmação, bloqueios, reversão em falha, compra pendente, conta compartilhada, Asaas sem mutação.
- [ ] Confirmar estado RED.
- [ ] Implementar rota, whitelist de tabelas dependentes, auditoria e UI de botão com prompt de número do pedido.
- [ ] Confirmar estado GREEN e regressões.

### Task 4: Verificar e empacotar

**Files:** New ZIP `LORD-NUTRI-BKO-MOBILE-EXCLUSAO-PDF-2026-11-23.zip`.

- [ ] Rodar suíte completa; listar explicitamente qualquer teste bloqueado por dependência de ambiente.
- [ ] Conferir alteração de código, schema e proteções com revisões estáticas.
- [ ] Criar ZIP sem credenciais/temporários e validar com `unzip -t`.
- [ ] Salvar ZIP para entrega e fornecer link verificável.
