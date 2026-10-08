# LORDNUTRI 1.1.0 — STUDIO FLOW

> Editor da LP revisado para trabalhar em fluxo responsivo, sem posição livre/X-Y. Use BKO → Studio LP. Veja `README-STUDIO-1.1.md`.

# LORDNUTRI Revendedores 0.7.0

Portal de revendedores LORD NUTRI / MIX10 PRO em Next.js 16.

## Free Canvas

O editor de Landing Page usa uma arquitetura híbrida para evitar os bugs das tentativas anteriores de page builder:

1. **Base original protegida** — React/CSS continuam sendo a fonte da estrutura e do responsivo.
2. **Copy original editável** — textos existentes podem ser alterados sem substituir wrappers/classes.
3. **Camadas livres** — textos e imagens duplicados ou criados no editor são armazenados em JSON separado (`freeElements`).
4. **Posicionamento por breakpoint** — Desktop, Tablet e Celular guardam posição/largura próprias.
5. **Pointer drag + resize** — mouse e touch usam pointer events, sem drag-and-drop nativo.
6. **Histórico** — Desfazer/Refazer no BKO.

A camada livre não reordena seções, grids ou elementos funcionais do checkout.

Consulte `ENTREGA-0.7.0-FREE-CANVAS.md` para o fluxo de uso.
