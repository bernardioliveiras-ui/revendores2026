# LORDNUTRI 1.5.0 — VISUAL STABLE

Objetivo desta revisão: corrigir o checkout publicado e estabilizar visualmente a landing sem alterar a copy da página.

## Correções principais

- Checkout publicado com dupla proteção: portal React no slot protegido e fallback funcional caso o slot exista mas o componente não monte.
- Computador e Celular agora têm CSS de override totalmente separado: desktop somente acima de 700 px e mobile somente até 700 px.
- Propriedades que causavam deriva de layout foram bloqueadas no Studio publicado: posição absoluta/X-Y, z-index livre, altura/min-height/max-height, order e grid positioning por linha/coluna.
- Unidades dependentes do viewport (vw/vh/vmin/vmax) deixam de ser aplicadas em medidas geométricas do Studio.
- Margens negativas do Studio são neutralizadas e larguras são limitadas ao eixo máximo da landing.
- Passada visual final com shell central de 1120 px, overflow horizontal cortado, grids consistentes, fotos sem margens negativas, checkout alinhado e mobile em coluna única.
- Animações de flutuação foram desativadas para eliminar a sensação de cards desalinhados.
- Mantidos somente Computador e Celular.
- Checkout, simulador e avaliações Google continuam protegidos estruturalmente.

## Conteúdo

`app/page.tsx` foi mantido sem alterações nesta revisão. A copy principal, valores dos kits e número ANVISA permanecem iguais à versão 1.4.0.

## Validação local

- 9/9 testes focados da revisão + checkout passaram.
- Verificação de parser TypeScript não encontrou erros TS1xxx de sintaxe nos arquivos alterados.
- O build completo não foi concluído neste ambiente porque `npm ci` excedeu o tempo disponível; a Hostinger deve instalar as dependências normalmente antes de `npm run build`.
