# LORDNUTRI Revendedores — entrega 0.3.3

Esta versão parte integralmente da 0.3.2 fornecida pelo cliente e aplica somente os ajustes finais solicitados.

## Landing Page
- Pessoas integradas ao fundo das seções, sem molduras retangulares, com fades laterais/verticais no padrão editorial do PDF.
- Nova seção de avaliações do Google.
- Avaliações fornecidas pelo cliente aparecem como fallback mesmo sem chave da Places API.
- Se `GOOGLE_PLACES_API_KEY` estiver configurada, a API continua podendo substituir o fallback por avaliações públicas atuais.
- Link de prova social: `https://share.google/TfuQVPuf9zfS1dzj7`.
- CTA para o consumidor que ainda não quer entrar no programa: `https://mix10pro.com.br/lp-v2`.

## BKO / editor da LP
- Compatibilidade mantida com textos e imagens já salvos no CMS 0.3.x.
- Campos comuns de texto só podem ser selecionados quando a alteração é estruturalmente segura.
- Frases que usam a identidade visual de `LORD NUTRI` e `MIX10 PRO` têm edição rica segura: o texto é alterado, mas o runtime recria os spans da marca e preserva classes, grid, espaçamento e estilos externos.
- Fotos continuam separadas dos textos no editor.
- Ao salvar rascunho ou publicar, a prévia recarrega automaticamente.

## Preservado
- Processo ANVISA: `2535115572620267`.
- Checkout e preços dos kits.
- Asaas.
- Estoque e liberação de acesso.
- Manual de 22 páginas e editor do manual.
- Portal do Revendedor e demais rotinas do BKO.

## Validação executada neste ambiente
- 6/6 testes estruturais da área de conteúdo e dos ajustes finais: aprovados.
- Parse/transpilação TypeScript/TSX dos quatro arquivos modificados: aprovado.
- Checagem TypeScript isolada dos componentes novos de runtime/prova social: aprovada.
- O `npm ci` completo não pôde terminar neste ambiente por indisponibilidade de DNS para `registry.npmjs.org` (`EAI_AGAIN`). O build da Hostinger continua configurado como `next build --webpack` em Node 22.

## Deploy
Na Hostinger mantenha:

```bash
npm run build
```

Diretório de saída:

```text
.next
```
