# Guia atualizado — LORDNUTRI 0.2.0

Consulte [LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md), [AUTOMACOES.md](AUTOMACOES.md) e [VALIDACAO-LORDNUTRI.md](VALIDACAO-LORDNUTRI.md).

A versão anterior deste documento está arquivada em docs/historico.

Destino: Hostinger, aplicação Node 22 + MySQL. Build: `npm run build`. Inicialização: `npm start`, com verificação aditiva do banco antes de abrir o servidor.


## Next 16 / Hostinger
O script de produção está configurado como `next build --webpack`. Isso evita o panic interno do Turbopack observado no processamento de `app/globals.css`/PostCSS no ambiente da Hostinger. Mantenha o Build Command como `npm run build` e o Output Directory como `.next`.
