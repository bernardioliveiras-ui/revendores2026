# LORDNUTRI Revendedores — 0.5.0 Page Builder

Esta versão transforma a aba Landing Page do BKO em um editor visual de blocos, preservando o checkout, Asaas e componentes funcionais.

## O que entrou

- Canvas da própria landing dentro do BKO.
- Clique para selecionar e duplo clique para editar texto diretamente na página.
- Arrastar e reordenar seções pelo canvas e pela lista de camadas.
- Duplicar seções completas mantendo conteúdo e estilos.
- Duplicar texto/imagem mantendo conteúdo, tipografia, layout e posição.
- Arrastar elementos dentro da mesma seção.
- Mover elementos por botões subir/descer.
- Ocultar elementos e seções; excluir cópias e blocos adicionados.
- Adicionar novos blocos de título, texto, botão e imagem.
- Copiar/colar estilo e presets LORD NUTRI / MIX10 PRO.
- Desfazer/refazer com Ctrl/Cmd+Z e Ctrl/Cmd+Shift+Z.
- Prévia Desktop, Tablet e Celular.
- Rascunho e publicação continuam separados.
- O editor persiste dados estruturados; não salva HTML arbitrário ou scripts.
- Simulador e checkout continuam protegidos contra duplicação de seção.

## Fluxo rápido

1. Abra BKO > Conteúdo > Landing Page.
2. Clique em um texto ou imagem no canvas.
3. Use Duplicar, Subir/Descer ou o puxador dourado para mover.
4. Para uma seção inteira, use a barra dourada da seção ou Camadas / seções.
5. Duplo clique em texto para editar no próprio canvas.
6. Use Salvar rascunho para testar e Publicar quando estiver pronto.

## Build Hostinger

- Node.js: 22
- Build: `npm run build`
- Output: `.next`

O build continua usando `next build --webpack`.
