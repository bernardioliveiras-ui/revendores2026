# LORDNUTRI 0.6.0 — TEXT-SAFE

## Objetivo

Estabilizar a edição da landing page priorizando o briefing e a formatação original. O BKO edita somente copy; layout, imagens e responsividade ficam protegidos no código.

## O que mudou

- removidos do editor da landing: arrastar, duplicar, mover, ocultar, editar imagem, copiar estilo, fonte, cor, margem, grid, X/Y e overrides responsivos;
- o CMS da landing passa a persistir somente `overrides` de texto;
- dados antigos de builder são sanitizados na leitura e não afetam mais a LP;
- clique seleciona texto; duplo clique edita direto na prévia;
- lista lateral indexa os textos por seção e possui busca;
- colagem é sempre texto puro;
- `LORD NUTRI` e `MIX10 PRO` recuperam a identidade de marca automaticamente;
- alerta de tamanho de copy ajuda a evitar estouro no mobile sem alterar a tipografia;
- checkout, simulador e avaliações Google dinâmicas são protegidos;
- faixa dourada superior removida do layout-base;
- valores, checkout Asaas, estoque, portal, manual e ANVISA `2535115572620267` preservados.

## Validação desta revisão

`tests/text-safe-editor-060.test.mjs`: 6/6 testes aprovados.

Também foram aprovados os testes de webhook Asaas e testes estáticos de checkout/legal executáveis neste ambiente. A suíte que depende do pacote local `typescript` não pôde executar porque o `node_modules` fornecido no pacote de trabalho está incompleto. A sintaxe TS/TSX dos arquivos modificados foi validada com o compilador TypeScript global via `transpileModule`.

## Deploy

Node 22. Instalação `npm ci`, build `npm run build`, saída Next `.next`.
