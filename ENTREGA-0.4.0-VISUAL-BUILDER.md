# LORDNUTRI 0.4.0 — Visual Builder

Esta versão evolui a aba Conteúdo de um CMS de campos para um editor visual controlado da landing page.

## O que entrou

- Prévia ao vivo: alterações de texto, tipografia, imagens e ordem das seções aparecem no iframe sem precisar salvar a cada mudança.
- Desfazer / Refazer com atalhos Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl/Cmd+Y.
- Copiar estilo / Colar estilo entre textos.
- Controles de fonte, tamanho, peso, cor, itálico, alinhamento, entrelinha e espaçamento.
- Presets rápidos LORD NUTRI e MIX10 PRO.
- Identidade automática: ao digitar ou colar `MIX10 PRO` ou `LORD NUTRI` em qualquer texto editável, o runtime recria os spans oficiais da marca. Isso evita o problema de o texto colado cair em formatação comum.
- Seções / slides podem ser reordenados por arrastar e soltar ou pelos botões de seta.
- O banco continua guardando conteúdo separado de estrutura. O editor aceita somente propriedades tipográficas previstas e uma lista validada de IDs de seção; HTML, scripts e classes arbitrárias não são persistidos.

## Compatibilidade

- Mantém os overrides das versões 0.3.x.
- Mantém Asaas, checkout, estoque, BKO, acessos, manual, mídia e avaliações.
- Processo ANVISA permanece fixo em `2535115572620267`.
- Node 22, build `next build --webpack`, saída `.next`.

## Validação executada

- 13/13 testes focados de CMS/layout/tipografia/editor visual aprovados.
- `components/content-runtime.tsx` e `components/content-studio-admin.tsx` passaram em checagem TypeScript strict isolada com DOM/ES2023; não houve erros de tipagem do código, apenas os módulos React não estão instalados neste container.
- A suíte completa sem `node_modules` executou 83 testes: 74 passaram; 7 falhas foram por ausência local do pacote `typescript` usado pelo test loader e 2 eram asserts históricos de copy/layout anteriores à versão atual, não relacionados ao Visual Builder.
