# LORDNUTRI 0.3.2 — correção de build TypeScript

## Correção
O listener de clique do editor visual em `components/content-runtime.tsx` agora usa a assinatura DOM genérica `EventListener` e converte o evento para `MouseEvent` dentro do handler.

Isso resolve o erro do Next.js/TypeScript 5.9:

`No overload matches this call ... Argument of type (event: MouseEvent) => void is not assignable to type EventListener`.

A raiz da LP também permanece explicitamente tipada como `HTMLElement`.

## O que não mudou
- CMS/BKO de conteúdo
- rascunho e publicação
- edição da LP
- produtos e mídia
- manual de 22 páginas
- checkout, PIX/cartão, frete e Asaas
- estoque e acessos
- processo ANVISA `2535115572620267`

## Deploy
Continue usando Node 22, `npm run build` e saída `.next`.
