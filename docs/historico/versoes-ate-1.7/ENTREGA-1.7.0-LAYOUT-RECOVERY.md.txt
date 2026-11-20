# LORDNUTRI 1.7.0 — LAYOUT RECOVERY

Objetivo: recuperar a landing pública em desktop e celular sem alterar a copy existente do Studio.

## Mudanças principais
- A página publicada deixa de aplicar os overrides de geometria do Studio (largura, margem, padding, flex/grid, escala/transformações) que vinham causando desalinhamento entre preview e produção.
- O HTML/textos publicados pelo Studio continuam sendo usados, mas o layout público volta a obedecer ao CSS estável da landing.
- Checkout removido definitivamente do DOM editável do Studio: ele é renderizado em React fora do HTML editável e não pode desaparecer após publicação.
- Checkout antigo salvo dentro do Studio é ocultado/removido no runtime para evitar duplicidade.
- Simulador continua protegido e recebe fallback se o alvo tiver sido removido.
- Seções aninhadas acidentalmente pelo Studio são devolvidas ao fluxo principal no runtime.
- Desktop e celular usam um único eixo de layout, breakpoint em 700px.
- Removido o item de navegação “Avaliações”, pois a seção Google havia sido retirada anteriormente.
- Passada visual final em shells, grids, cards, produto, faixa institucional, kits, FAQ e checkout.

## Observação
O Studio permanece disponível para conteúdo e ordem estrutural, mas a geometria antiga do Studio fica em quarentena na publicação pública nesta versão. Isso prioriza estabilidade visual e checkout.
