# LORD NUTRI — LP e Portal do Revendedor

Versão 0.6.0 — TEXT-SAFE. Next.js, Node 22, MySQL e Drizzle.

Comece por `LEIA-ME-PRIMEIRO.md`. Aplique a atualização completa para receber tanto o layout quanto as correções de checkout e automação. A revisão e as pendências de homologação estão em `REVISAO-FINAL-TRAFEGO.md`.

A LP apresenta oportunidade de faturamento, confiança na LORD NUTRI, MIX10 PRO e benefícios, modelo de revenda, simulador, kits e checkout, nessa ordem. A comunicação prioriza o público 40+ e a leitura no celular. O portal oferece Visão geral, Estoque, Vendas, Manual do Revendedor e acompanhamento de pedidos; o BKO organiza acessos e expedição. VSL opcional por `VSL_VIDEO_URL` (exemplo: `/videos/vsl-mix10.mp4`) ou `VSL_EMBED_URL`.

Instalação: `npm ci`. Compilação: `npm run build`. Migração: `npm run db:migrate`. Inicialização com migração: `npm start`. Testes: `npm test` e `npm run test:launch`. Diagnóstico de configuração: `npm run check:readiness`.

O projeto preserva os valores KIT20/KIT50. Mensagens, processamento financeiro e atualização externa de entrega dependem das contas e integrações configuradas na hospedagem. O código não é uma homologação dos provedores de produção.

O manual atualizado tem 22 páginas, escrita do PDF-base preservada e sete cenas diferentes de pessoas. Fica em `private/manual`, servido por `/api/reseller/manual`, com sessão válida e kit pago vinculado ao comprador. O BKO também pode consultar. Não há link público na LP. A variável antiga `RESELLER_MANUAL_URL` não é usada. A compilação remove cópias de PDF/PPTX que restarem em `public/manual`.


## Revisão de 04/10 — abertura e movimento

Abertura sem a logo central duplicada; marca mantida no cabeçalho. Título e CTA ampliados. Cards com flutuação suave e suporte a movimento reduzido. Manual privado atualizado com escrita preservada, capa somente com marca e título, três capítulos adicionais e composição atualizada.



## Editor da Landing 0.6.0 — TEXT-SAFE

A aba **BKO > Conteúdo > Landing Page** foi simplificada para editar **somente textos**. A LP não aceita mais pelo CMS mudanças de fonte, cor, tamanho, margem, posição, ordem, imagens, duplicação de blocos ou drag-and-drop. Essas decisões ficam no código e no briefing visual, reduzindo o risco de quebrar o responsivo.

O editor permite selecionar o texto pela prévia ou pela lista lateral, editar em campo de texto, dar duplo clique na própria LP, desfazer/refazer, restaurar a copy original e conferir Desktop/Tablet/Celular. Colagens entram como texto puro. As palavras **LORD NUTRI** e **MIX10 PRO** recuperam automaticamente a identidade visual definida no CSS.

Dados antigos do Page Builder (layout, estilos, clones, posições e imagens) são ignorados ao ler a landing e descartados no próximo salvamento. O checkout, simulador e avaliações dinâmicas ficam protegidos do editor de copy. A antiga faixa dourada do topo foi retirada do briefing-base.
