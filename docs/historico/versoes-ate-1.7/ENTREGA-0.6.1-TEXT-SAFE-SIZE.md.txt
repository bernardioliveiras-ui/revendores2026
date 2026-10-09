# LORDNUTRI 0.6.1 — TEXT SAFE + SIZE

A revisão mantém a landing protegida contra alterações estruturais e libera somente dois tipos de edição no BKO: copy e escala de fonte do texto selecionado.

- A− e A+ em passos de 5%.
- Limites rígidos de 80% a 140% do tamanho original.
- 100% restaura o tamanho definido pelo briefing/CSS.
- A escala é reaplicada sobre a tipografia responsiva original em cada viewport, inclusive após resize.
- Imagens, posição, grid, largura, cores, família tipográfica, seções e componentes funcionais continuam bloqueados.
- Restaurar texto e tamanho remove os dois overrides.

A intenção é permitir destaque de títulos, números e CTAs sem reabrir os bugs do antigo page builder.
