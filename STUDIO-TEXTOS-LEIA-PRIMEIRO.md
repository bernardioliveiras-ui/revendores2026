# Studio de textos · LORD NUTRI 1.8.1

## Instalar uma vez

Substitua o código da aplicação pelo pacote completo, mantendo o banco MySQL e as variáveis atuais da hospedagem. Use Node 22 e os comandos de `LEIA-ME-PRIMEIRO.md`. Não importe um banco vazio nem apague tabelas para atualizar.

O login e a senha do administrador continuam os da sua instalação. Este pacote não cria uma nova senha de acesso. A primeira abertura do Studio cria seu documento de textos de forma aditiva na tabela de conteúdo existente.

## Editar pelo painel

1. Entre no BKO e abra **Studio — Textos da LP**.
2. Escolha uma seção ou busque uma palavra do texto original. Cada trecho destacado tem um campo separado para preservar a apresentação.
3. Altere os textos. A prévia acompanha a edição; use **PC** e **Celular** para conferir.
4. Clique em **Salvar rascunho** para guardar o trabalho sem alterar a página pública.
5. Clique em **Publicar textos** para aplicar a versão à LP. Depois da instalação deste pacote, publicar um texto não exige um novo build.

A prévia não finaliza pagamentos e bloqueia links externos. Os limites de caracteres e a quebra de palavras ajudam a manter os textos dentro dos componentes. Um texto maior pode ocupar mais linhas; confira a prévia antes de publicar. Fontes, tamanhos, cores, imagens, posições e espaçamentos são mantidos pelo layout.

O conteúdo do manual, os produtos e a mídia continuam em **Conteúdo**. Preços calculados, identificadores de produto, número de processo ANVISA, URLs e regras de pagamento ficam fora deste editor. A página inicia com os mesmos textos do ZIP 1.8.0; documentos do construtor antigo não são aplicados.

## Recuperar ou descartar uma edição

- **Restaurar este texto** recupera o texto original daquele campo, ainda como rascunho.
- **Restaurar textos originais** recupera todos os textos do ZIP 1.8.0. A ação exige confirmação e não publica automaticamente.
- **Recarregar rascunho** descarta as alterações locais após confirmação, se houver, e recupera o último rascunho salvo.
- Ao sair com alterações pendentes, o painel avisa. Duas sessões não podem sobrescrever silenciosamente a mesma versão: se houver conflito, copie os trechos que deseja manter, recarregue e reaplique suas mudanças.

O Studio precisa do MySQL configurado. Se o banco estiver indisponível, a LP pública continua exibindo os textos originais, e o editor informa que não conseguiu carregar ou salvar.
