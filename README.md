# LORD NUTRI — LP e Portal do Revendedor

Versão 0.2.2-lordnutri-final. Next.js, Node 22, MySQL e Drizzle.

Comece por `LEIA-ME-PRIMEIRO.md`. Aplique a atualização completa para receber tanto o layout quanto as correções de checkout e automação. A revisão e as pendências de homologação estão em `REVISAO-FINAL-TRAFEGO.md`.

A LP apresenta oportunidade, modelo de revenda, simulador, kits e checkout. O portal oferece Visão geral, Estoque, Vendas, Manual do Revendedor e acompanhamento de pedidos; o BKO organiza acessos e expedição. VSL opcional por `VSL_VIDEO_URL` (exemplo: `/videos/vsl-mix10.mp4`) ou `VSL_EMBED_URL`.

Instalação: `npm ci`. Compilação: `npm run build`. Migração: `npm run db:migrate`. Inicialização com migração: `npm start`. Testes: `npm test` e `npm run test:launch`. Diagnóstico de configuração: `npm run check:readiness`.

O projeto preserva os valores KIT20/KIT50. Mensagens, processamento financeiro e atualização externa de entrega dependem das contas e integrações configuradas na hospedagem. O código não é uma homologação dos provedores de produção.
