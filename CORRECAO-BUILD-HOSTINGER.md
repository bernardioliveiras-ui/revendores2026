# Correção da publicação

O repositório contém a aplicação Next.js (app/, components/, lib/, db/) e arquivos de uma segunda aplicação Vite/Express (server.ts, vite.config.ts, src/, integrations/, utils/).

A Hostinger publica Next.js com npm run build. O TypeScript incluía todos os arquivos das duas aplicações e falhava em dependências do servidor Vite/Express, começando por axios e dotenv.

Alteração: tsconfig.json exclui os arquivos da aplicação Vite/Express da verificação deste build Next.js. strict e a verificação de tipos continuam ativos. Nenhum arquivo do segundo projeto foi apagado; sua publicação independente exige configuração e dependências próprias. A integração Hiper desse outro servidor não passa a funcionar dentro do Next.js por esta alteração.

## Como aplicar pelo GitHub

Para corrigir o repositório atual, basta substituir o tsconfig.json da raiz pelo tsconfig.json deste ZIP e salvar o commit. Este ZIP também contém o projeto completo.

Na Hostinger, faça nova implantação da versão mais recente. Confira se o commit exibido mudou de ef3328b. Mantenha Node.js 22, comando npm run build e a configuração de execução Next.js atual. Preserve .env, banco e uploads.

Após publicar, abra o BKO e consulte MIXMWFD7KYD9F90 em Sincronizar com Asaas. Siga ASAAS-ATUALIZACAO-LEIA-PRIMEIRO.md para os webhooks.
