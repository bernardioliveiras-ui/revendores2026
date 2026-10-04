# Correção da compilação — GitHub e Hostinger

O ZIP (5) recebido nesta revisão era idêntico ao ZIP original (4), sem a atualização LORDNUTRI.

Este pacote contém apenas os arquivos novos/alterados em relação ao ZIP (5). Mantenha os demais arquivos do repositório. Não recrie nem esvazie o repositório.

1. Extraia LORDNUTRI-ATUALIZACAO-GITHUB.zip no computador.
2. Abra seu repositório no GitHub e selecione a mesma branch conectada à Hostinger.
3. Clique Add file → Upload files.
4. Arraste o CONTEÚDO extraído: pastas app, components, db, lib, public, database etc. e os arquivos package.json, package-lock.json etc. Não envie o ZIP fechado nem uma pasta externa envolvendo tudo.
5. Os arquivos devem ficar na mesma raiz do package.json existente. Confirme o commit.
6. Abra package.json no GitHub e confira version: 0.1.1-lordnutri-buildfix. Se aparecer 0.1.0, a branch/raiz ainda não recebeu esta atualização.
7. Antes de publicar, aplique uma única vez database/migrations/2026-10-01-lordnutri-welcome.sql no MySQL existente, caso ainda não tenha aplicado. Preserve as variáveis atuais de banco, AUTH_SECRET e Asaas. Isso é necessário para o funcionamento do painel, não para corrigir os imports do build.
8. Na Hostinger, confira que repositório, branch e diretório raiz correspondem aos arquivos atualizados. Faça nova implantação a partir do commit novo. Node 22; npm ci; npm run build; npm start.

Os endpoints antigos sem consumidores no painel atual foram substituídos por respostas 410 autenticadas, e suas bibliotecas abandonadas foram sobrescritas. Isso evita que arquivos não apagados num upload continuem quebrando a compilação. Não foram inventadas tabelas ou funções para satisfazer imports.

Vídeo, PDF e boas-vindas: veja ATUALIZACAO-LORDNUTRI.md. Para envio automático de e-mail e WhatsApp é necessário configurar a ponte com sua automação real. Nenhuma mensagem real foi enviada nesta revisão.

A lista de testes históricos ainda falhando permanece em VALIDACAO-LORDNUTRI.md.
