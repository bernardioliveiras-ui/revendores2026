# Deploy — Hostinger

Esta versão foi preparada para **Node 22.x + MySQL na Hostinger**, com banco novo/zerado. Não use o banco legado do MIX10 nesta instalação.

## 1. Criar o banco MySQL

No hPanel, crie um novo banco, usuário e senha. Depois abra o phpMyAdmin desse banco e importe:

`database/schema.sql`

A importação cria as 9 tabelas da V1. Não existe arquivo de migração nesta versão porque o projeto parte de banco novo.

## 2. Subir o projeto

Envie este projeto para um repositório GitHub novo ou substitua o repositório escolhido para a nova versão. Na Hostinger, crie/conecte uma aplicação Node.js usando **Node 22.x**.

Comandos:

```bash
npm ci
npm run build
npm start
```

## 3. Variáveis de ambiente

Copie `.env.example` para as variáveis da aplicação e preencha os valores reais:

```env
DATABASE_HOST=
DATABASE_PORT=3306
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_SSL=false

NEXT_PUBLIC_APP_URL=https://revendedores.mix10pro.com.br
AUTH_SECRET=
ADMIN_EMAILS=acesso@mix10pro.com.br
ADMIN_BOOTSTRAP_PASSWORD=

ASAAS_API_KEY=
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_TOKEN=

AFFILIATE_DESTINATION_URL=
NEXT_PUBLIC_BKO_WHATSAPP=5511934924155
```

`AUTH_SECRET` deve ter pelo menos 32 caracteres. Use uma sequência aleatória longa. Não envie essa chave, senha de banco, senha bootstrap ou API key em chats, commits ou screenshots.

## 4. Primeiro acesso do proprietário/BKO

Com o banco vazio, abra `/entrar` e use o e-mail que estiver em `ADMIN_EMAILS` junto da senha definida em `ADMIN_BOOTSTRAP_PASSWORD`. O sistema cria a conta Admin/BKO no primeiro login válido e obriga a troca da senha.

Depois de confirmar que a senha definitiva funciona, você pode remover `ADMIN_BOOTSTRAP_PASSWORD` das variáveis da aplicação.

## 5. Asaas

Comece com:

`ASAAS_ENVIRONMENT=sandbox`

Configure no Asaas o webhook:

`https://revendedores.mix10pro.com.br/api/billing/webhook`

Use no webhook o mesmo token definido em `ASAAS_WEBHOOK_TOKEN`. Habilite pelo menos os eventos de pagamento recebido/confirmado e os eventos de estorno/cancelamento usados pela operação.

O checkout cria uma cobrança com `billingType=UNDEFINED` e redireciona para o ambiente seguro do Asaas. Métodos disponíveis, parcelamento e juros dependem da configuração comercial da conta Asaas e devem ser conferidos em sandbox antes da publicação.

## 6. VSL

O site procura:

`public/videos/vsl-mix10.mp4`

Você pode versionar o MP4 no GitHub ou, se preferir evitar arquivo grande no repositório, enviar o vídeo para esse caminho usando o gerenciador de arquivos da hospedagem após o deploy. Mantenha exatamente esse nome.

## 7. Afiliados

Defina `AFFILIATE_DESTINATION_URL` com o destino oficial do link de indicação, por exemplo o anúncio oficial no marketplace. O portal gera links `/r/CODIGO`, registra o clique e redireciona para esse destino.

## 8. Teste antes da produção

Com Asaas sandbox, valide ponta a ponta:

1. abrir a LP;
2. selecionar KIT20 e concluir checkout de teste;
3. confirmar que o webhook muda para **Pagamento confirmado** e **Em separação**;
4. entrar no BKO;
5. clicar **Liberar acesso**;
6. copiar credenciais e testar o botão **Abrir WhatsApp**;
7. entrar como revendedor e trocar a senha;
8. registrar venda e conferir baixa de estoque;
9. gerar link de afiliado e testar contagem de clique;
10. marcar o pedido **Despachado** sem código de rastreio e depois **Entregue**;
11. repetir o checkout com KIT50.

Somente depois altere `ASAAS_ENVIRONMENT=production` e use a chave de produção.
