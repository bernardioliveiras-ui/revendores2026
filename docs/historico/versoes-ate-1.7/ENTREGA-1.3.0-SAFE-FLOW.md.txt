# LORDNUTRI 1.3.0 — Studio Safe Flow

Revisão de segurança e estabilidade do editor visual da landing page.

## O que mudou

- Checkout Asaas, simulador e avaliações Google são componentes críticos protegidos.
- Um componente crítico e qualquer container que o contenha não podem mais ser excluídos, duplicados, desmontados ou arrastados estruturalmente.
- O Studio continua permitindo editar a aparência externa do bloco quando aplicável.
- Rascunhos antigos que perderam checkout/simulador/Google são reparados automaticamente usando as regiões correspondentes da landing-base.
- Antes de salvar/publicar, o Studio valida se existe exatamente um slot de checkout, simulador e avaliações Google.
- O servidor repete a validação: um payload inválido não pode ser salvo nem publicado apenas burlando a interface.
- A landing pública possui recuperação em runtime. Mesmo que uma versão antiga publicada esteja sem um slot, checkout/simulador/Google são restaurados em fallback para a função não desaparecer.
- Continua sem edição X/Y ou `position:absolute`; a organização permanece em fluxo responsivo.

## Operação

Os elementos comuns continuam permitindo texto, imagem, cor, tipografia, alinhamento, largura, espaçamento, duplicação, exclusão, blocos e reorganização em fluxo.

Os componentes críticos aparecem com cadeado na árvore. O cadeado protege a estrutura e a lógica, não o restante da landing.

## Validação executada

- 31/31 testes focados em Studio + checkout/Asaas + páginas legais aprovados.
- Checagem TypeScript dos arquivos alterados não apontou erros locais de tipo/sintaxe; o ambiente não possui `node_modules`, portanto os únicos erros remanescentes na chamada direta do `tsc` foram imports de dependências não instaladas.
- A suíte `npm test` completa não pode ser considerada verde neste ambiente: testes runtime antigos dependem do pacote local `typescript` dentro de `node_modules` e há testes históricos de versões antigas do editor com expectativas desatualizadas.

## Constantes preservadas

- KIT20: R$ 1.498,00
- KIT50: R$ 3.495,00
- Processo ANVISA: 2535115572620267
