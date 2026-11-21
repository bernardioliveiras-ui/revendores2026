# Publicar a plataforma a partir do Windows

1. **Extraia o ZIP** em uma pasta no computador. Abra a pasta e confira se `package.json`, `app`, `public`, `private` e `.github` estão no mesmo nível. O GitHub precisa receber os arquivos extraídos. O manual interno está na pasta `private`, então prefira um repositório privado.
2. **No GitHub Desktop**, abra o clone do repositório que a Hostinger usa. Use **Repository → Show in Explorer**. Copie o conteúdo extraído para essa pasta, incluindo `.github`, `.gitignore` e `.env.example`. Preserve a pasta `.git` do clone. Para um repositório novo, crie-o no GitHub Desktop e coloque o conteúdo na raiz.
3. **Dentro da pasta do clone**, execute `LIMPAR-PUBLIC.cmd` com dois cliques (Node.js 22 instalado). Ele remove arquivos `.csv` e `.csc` em qualquer subpasta de `public`, inclusive com letras maiúsculas. Em **Changes**, confira as exclusões de arquivos já rastreados. Inclua essas exclusões no mesmo commit que o restante da atualização. O build também limpa esses formatos na cópia da hospedagem. O histórico de commits anteriores continua guardando as versões antigas.
4. **Revise o commit.** Inclua o código, mídias, `package-lock.json` e `.github/workflows/correios.yml`. Configure senhas e tokens no hPanel. No GitHub Desktop, faça **Commit** e **Push origin** na branch ligada à Hostinger. Se usar um repositório novo com a mesma operação, vincule-o ao aplicativo Node existente e preserve as variáveis do banco atual.
5. **Na Hostinger**, confira a raiz do projeto e as opções abaixo. Faça backup do banco atual antes do primeiro deploy. A inicialização aplica a migração aditiva ao banco configurado. O pacote contém o esquema e as migrações. Os cadastros e pedidos reais ficam no banco usado pelo site.

   | Campo | Valor |
   | --- | --- |
   | Tipo de aplicação | Next.js / Node.js |
   | Versão do Node | 22.x |
   | Diretório raiz | Pasta do `package.json` |
   | Instalação | `npm ci` |
   | Build | `npm run build` |
   | Inicialização por comando | `npm start` |
   | Se o painel exigir **arquivo** de inicialização | `server.js` |

6. **Revise as variáveis da hospedagem.** Para um projeto novo, use `.env.example` como lista. Para a loja atual, preserve `DATABASE_*` e `AUTH_SECRET`. A primeira conta BKO de uma instalação nova usa `ADMIN_EMAILS` e `ADMIN_BOOTSTRAP_PASSWORD`. Uma conta existente usa sua senha cadastrada.
7. **Abra os perfis e as integrações.** Entre no domínio publicado pelos caminhos `/bko`, `/revendedor` e `/influenciador`. O [README](README.md) apresenta os dois webhooks, as variáveis do rastreio e a primeira execução do agendamento.

## Conferir a aparência antes de publicar

Abra `private/demonstracao/index.html` no navegador. Os botões **BKO**, **Revendedor** e **Influenciador** mostram a referência visual que você enviou, com dados de exemplo. Após entrar como administrador no site publicado, os mesmos atalhos abrem a prévia. As três rotas de login da tabela do README mostram os dados do banco da loja.

## Conferir o build no computador

No PowerShell, na pasta que contém o `package.json`, com Node 22 instalado:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
```

O deploy precisa de uma aplicação Node com MySQL ou MariaDB. Uma publicação estática via GitHub Pages não executa o checkout nem os webhooks.
