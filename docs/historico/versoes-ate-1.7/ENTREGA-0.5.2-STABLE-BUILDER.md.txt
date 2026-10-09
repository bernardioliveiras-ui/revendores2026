# LORDNUTRI Revendedores — 0.5.2 Stable Builder

Esta revisão corrige a instabilidade percebida no editor visual 0.5.1.

## O que mudou

- Containers compostos deixam de ser descobertos por heurística do DOM. Os blocos principais da landing agora possuem IDs explícitos e permanentes (`data-cms-group`).
- O conjunto `30 + cápsulas por caixa` possui identidade fixa (`product-fact-30`) e chaves fixas para número e legenda.
- Cards de confiança, benefícios, passos, cenários, kits, FAQ e pilares do produto também passam a usar grupos explícitos.
- O arraste de elementos/conjuntos usa Pointer Events, funcionando por mouse e touch e sem depender do drag HTML5 do botão.
- O alvo do drop recebe destaque visual antes de soltar o bloco.
- A toolbar flutuante é anexada ao canvas, em vez de ser inserida como irmã do conteúdo selecionado, reduzindo interferência no grid/flex original.
- Desktop, tablet e celular continuam mantendo layout responsivo separado.
- Checkout e simulador continuam protegidos contra duplicação de seção.

## Exemplo principal

No bloco do MIX10 PRO, clique no `30`, escolha `▦ conjunto`, clique em duplicar e use o puxador `⋮⋮`. O bloco duplicado leva o número, a legenda e sua estrutura visual juntos.

## Validação

Os testes focados da 0.5.2 verificam IDs permanentes dos grupos, chaves estáveis do bloco 30, pointer-drag e persistência estruturada/segura. A checagem de sintaxe TypeScript foi executada sem erros de parser; a compilação completa não foi executada porque as dependências npm não estão instaladas neste ambiente e `npm ci` excedeu o tempo disponível.
