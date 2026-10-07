# LORD NUTRI Revendedores - Entrega 0.3.0 CMS

## O que entrou

- Novo BKO > **Conteúdo**, com quatro áreas: Landing Page, Manual, Produtos e Mídia.
- Fluxo **rascunho -> salvar -> publicar** sem alterar imediatamente o que o público vê.
- Editor visual da landing: abra a prévia, clique em um texto ou imagem e edite o elemento selecionado.
- Textos da LP, incluindo menus, legendas, avisos e rótulos renderizados na página, podem receber overrides publicados.
- Biblioteca de mídia com upload de imagens (até 8 MB), armazenadas no MySQL e servidas por URL interna.
- Fotos da LP integradas ao fundo, sem molduras retangulares rígidas.
- Cadastro editorial de produtos e imagens no BKO.
- Processo ANVISA preservado e bloqueado em **2535115572620267**.
- Manual de 22 páginas mapeado para edição no BKO, com os textos atuais como conteúdo inicial.
- PDF do manual publicado é reconstruído a partir do conteúdo publicado, preservando as páginas originais como fundo visual e redesenhando os textos editáveis por cima.
- O PDF-base original permanece preservado e pode ser aberto com `?base=1` na rota autenticada do manual.

## Banco

As tabelas abaixo são criadas de forma aditiva no primeiro uso, sem apagar dados existentes:

- `content_studio`: rascunho e versão publicada de LP, manual, produtos e mídia.
- `media_assets`: imagens enviadas pelo BKO.

## Segurança operacional

- Edição e publicação exigem sessão de administrador.
- A landing pública lê apenas a versão publicada.
- A prévia de rascunho só é entregue para administrador autenticado.
- O valor operacional do checkout continua calculado no servidor; o CMS não substitui as regras financeiras seguras do checkout/Asaas.
- O número do processo ANVISA não é editável no catálogo do BKO.

## Validação realizada nesta entrega

- Testes estruturais do BKO/CMS: aprovados.
- Testes existentes de consolidação/portal: aprovados no conjunto executado.
- Gerador do manual: PDF com 22 páginas gerado e renderizado com sucesso.
- As imagens e composição-base das páginas do manual são preservadas no PDF dinâmico por meio de fundos derivados do PDF original.

## Publicação

O projeto continua com o fluxo Hostinger/Node existente:

```bash
npm ci
npm run build
npm start
```

O `npm start` mantém as migrações existentes. As novas tabelas do CMS também se auto-inicializam de forma aditiva no primeiro uso do BKO/conteúdo.
