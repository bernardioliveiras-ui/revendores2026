# LORDNUTRI Revendedores — 0.3.3

## Ajustes finais da Landing Page
- As duas fotos com pessoas deixaram de usar molduras/cards e passam a se integrar ao fundo das seções com fades e composição editorial, seguindo o padrão visual do PDF de referência.
- Foi adicionada a seção **Avaliações no Google** com fallback de avaliações fornecidas pelo cliente. Se `GOOGLE_PLACES_API_KEY` estiver configurada, avaliações públicas retornadas pela API continuam tendo prioridade.
- O botão **Ver avaliações no Google** usa o link compartilhado informado pelo cliente.
- Foi incluído o CTA **Quero conhecer 1 unidade primeiro**, apontando para `https://mix10pro.com.br/lp-v2`.

## CMS com layout protegido
- O runtime mantém compatibilidade com os overrides já salvos no 0.3.x.
- Novas seleções comuns de texto são restritas a elementos de texto puros. Frases compostas por `LORD NUTRI`/`MIX10 PRO` usam um modo rico seguro que recria apenas os spans da marca e preserva o elemento externo, classes e grid.
- Imagens continuam editáveis separadamente.
- Depois de salvar rascunho ou publicar, a prévia é recarregada automaticamente.
- O painel avisa que a alteração é de conteúdo e que o layout está protegido.

## Dados preservados
- Processo ANVISA mantido exatamente como `2535115572620267`.
- Checkout, Asaas, estoque, acessos, manual e demais fluxos do BKO não foram alterados por este patch.
