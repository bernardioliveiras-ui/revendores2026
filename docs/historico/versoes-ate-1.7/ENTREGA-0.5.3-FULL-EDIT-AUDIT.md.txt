# LORDNUTRI 0.5.3 — FULL EDIT AUDIT

Revisão de estabilidade do editor visual da Landing Page.

## O que foi auditado
- seleção de textos, imagens, grupos e seções;
- duplicação e movimentação de grupos compostos;
- identidade dos elementos após reordenação;
- responsividade desktop/tablet/mobile;
- undo/redo e rascunho/publicação;
- proteção de Checkout e Simulador;
- compatibilidade com os IDs explícitos já adicionados na LP.

## Correção estrutural desta revisão
As chaves automáticas de elementos que vivem dentro de `data-cms-group` deixam de depender da posição do grupo na seção. A identidade passa a usar o nome permanente do grupo + o caminho interno do elemento. Assim, mover `30 + cápsulas`, cards, passos, kits, FAQ e demais grupos não troca a identidade dos textos/imagens internos só porque o conjunto mudou de lugar.

## Regra do builder
Conteúdo e apresentação são persistidos como dados estruturados. O editor não salva HTML arbitrário, scripts ou classes do usuário. Checkout e Simulador continuam funcionais/protegidos, mas suas seções podem participar da organização visual permitida pelo builder.
