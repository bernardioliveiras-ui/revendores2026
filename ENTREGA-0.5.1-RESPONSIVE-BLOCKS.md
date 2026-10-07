# LORDNUTRI Revendedores — 0.5.1 Responsive Blocks

Esta revisão resolve a limitação do 0.5.0 em que um número, título e legenda ainda eram tratados como elementos isolados. O editor passa a reconhecer e manipular conjuntos visuais como um único bloco responsivo.

## Exemplo: duplicar “30 + cápsulas por caixa”

1. Abra **BKO > Conteúdo > Landing Page**.
2. Clique no **30** no canvas.
3. Clique em **▦ conjunto**. O editor seleciona o container que inclui o número e o texto relacionado.
4. Clique em **Duplicar**. A cópia leva estrutura, conteúdo e formatação do conjunto.
5. Use **⋮⋮** para arrastar o conjunto inteiro para outra posição ou até outra seção compatível.
6. Use **✥** para deslocamento visual livre dentro do breakpoint atual.
7. Troque entre **Desktop / Tablet / Celular** e ajuste X, Y, largura, ordem, grid, margens e demais propriedades separadamente.
8. Use **Salvar rascunho** para testar e **Publicar** quando estiver pronto.

## O que mudou

- Grupos/containers compostos selecionáveis e duplicáveis.
- Duplicação do conjunto sem separar número, título, legenda ou identidade visual.
- Drag and drop entre seções, não apenas dentro da seção de origem.
- Movimento livre por ponteiro com gravação de deslocamento X/Y.
- Layout independente para Desktop, Tablet e Celular, com herança responsiva.
- Inspector responsivo com largura, max-width, X/Y, margens, ordem, grid column/row, z-index, padding e raio.
- Seleção de grupo pelo botão **▦ conjunto** ou pelo próprio container quando aplicável.
- Histórico e estado continuam estruturados; o editor não persiste HTML arbitrário, classes arbitrárias ou scripts.
- Checkout, simulador e demais componentes funcionais permanecem protegidos.

## Compatibilidade e validação

Foram executados 20 testes focados/compatibilidade do Page Builder, layout lock, typography lock, prova final e responsive blocks: **20/20 aprovados**.

Os três arquivos TypeScript/TSX alterados do editor também passaram por verificação de sintaxe/transpilação. O build completo não foi marcado como validado neste ambiente porque a instalação local de dependências expirou durante `npm ci`; a configuração de deploy permanece Node.js 22, `npm run build` e saída `.next`.
