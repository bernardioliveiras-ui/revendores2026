# LORDNUTRI Studio Builder 1.0

Esta versão substitui o fluxo experimental do Free Canvas 0.7.x por um editor visual com documento persistente e IDs estáveis por elemento.

## O que mudou

- Nova aba **BKO > Studio LP**.
- Seleção direta de textos, imagens, botões, cards, seções e containers.
- Adição de texto, título, botão, imagem e seção.
- Duplicação e exclusão de elementos.
- Painel de camadas com reordenação por arrastar.
- Controles de tipografia, dimensões, espaçamentos, cores, fundo, flex/grid e posição.
- Estilos separados para Desktop, Tablet e Celular.
- Posição livre opcional com **ALT + arrastar**; o padrão continua sendo layout responsivo (flex/grid).
- Undo/Redo e atalhos Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl/Cmd+D.
- Biblioteca de imagens já cadastradas no BKO.
- IDs `data-studio-id` persistentes: o editor não depende mais de DOM path para reencontrar um elemento.
- Rascunho e publicação separados.
- Possibilidade de voltar a publicar o layout original do código.

## Componentes protegidos

Checkout/Asaas, simulador e dados dinâmicos das avaliações do Google continuam React por baixo. No Studio eles aparecem como blocos protegidos: podem ser reorganizados e dimensionados sem expor a lógica de pagamento ou cálculo.

## Avaliações Google

A seção foi remodelada para manter somente o Google. O CTA para `mix10pro.com.br/lp-v2` foi removido. A copy agora usa:

- “A confiança também aparece na experiência de quem já comprou.”
- “Confira avaliações reais publicadas por clientes no Google e veja como o MIX10 PRO vem fazendo parte da rotina de diferentes consumidores.”
- CTA único: “VER AVALIAÇÕES NO GOOGLE”.

## Itens preservados

- ANVISA: `2535115572620267`
- KIT20: `R$ 1.498,00`
- KIT50: `R$ 3.495,00`
- Checkout Asaas e componentes operacionais existentes.

## Validação executada neste ambiente

- `tests/studio-builder-1.0.test.mjs`: 7/7 aprovados.
- Verificação de sintaxe TypeScript/TSX: sem diagnósticos de parser nos arquivos alterados.
- O build completo do Next.js não foi executado porque esta cópia não contém `node_modules` e o ambiente não possui acesso ao registro npm. O projeto não adiciona dependência npm nova.
