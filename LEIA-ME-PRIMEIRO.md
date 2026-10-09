# Atualização LORD NUTRI 1.8.0

Esta é uma nova versão do projeto completo. O Studio da landing foi removido, mantendo os módulos operacionais do BKO e os registros já existentes. O briefing publicado da LP foi preservado. A página pública agora é mantida diretamente nos componentes React.

## 1. Preparar a atualização

1. Faça um backup do código em produção e um backup consistente do MySQL antes da atualização.
2. Preserve as variáveis e credenciais atuais da hospedagem. O arquivo `.env.example` contém apenas nomes e exemplos, não uma configuração de produção.
3. Use uma aplicação Node 22 com MySQL. Não publique como HTML estático. Instale este ZIP em um diretório limpo; não misture `.next` ou `node_modules` da versão anterior.
4. Cadastros, pedidos, senhas, estoque e configurações continuam no mesmo banco. Nenhuma tabela deve ser apagada para instalar a versão.

## 2. Compilar e iniciar na Hostinger

No diretório que contém `package.json`:

```sh
npm ci
npm run build
npm run db:migrate
npm start
```

Configuração: Node 22, comando de instalação `npm ci`, comando de build `npm run build`, saída `.next`, comando de inicialização `npm start`. A migração é aditiva e idempotente; o start também a executa antes de iniciar o servidor. Não use `db:push` para substituir a rotina de atualização em produção.

Informe `NEXT_PUBLIC_APP_URL` com o domínio HTTPS definitivo **antes** do build. Variáveis públicas de Google/Meta também são incorporadas no build; mudar um ID exige recompilar. Segredos de banco, Asaas, automações e conversões ficam somente no servidor.

## 3. Pagamento, acessos e automações

- Preserve `AUTH_SECRET` e as variáveis MySQL da instalação atual.
- Configure o Asaas no ambiente correto (`sandbox` para homologação). O endpoint é `https://SEU-DOMINIO/api/billing/webhook`; use o mesmo `ASAAS_WEBHOOK_TOKEN` da configuração do webhook.
- Um pedido pendente não libera acesso nem representa venda paga. A confirmação do Asaas provisiona a conta/estoque e processa boas-vindas de forma idempotente.
- As automações existentes dependem de `WELCOME_AUTOMATION_URL`/token ou do fallback de e-mail configurado. Um botão de WhatsApp continua dependendo de ação do operador, salvo ponte externa contratada.
- A logística usa `/api/shipping/webhook` com seu token quando há integração externa. A aplicação não compra etiquetas nem agenda coleta por conta própria.
- Confira os detalhes de mensuração e rotina de reenvio em `docs/SEO-TRAFEGO-1.8.0.md`.

## 4. Conferir antes de direcionar tráfego

1. Abra a landing no celular e no computador: marca, fotos, R$ 10.000 MÊS, âncoras, FAQ, simulador e kits.
2. Teste um pedido no ambiente sandbox com CEP, frete e parcelamento; confira os totais no Asaas e a confirmação por webhook.
3. Entre como revendedor de teste, troque a senha temporária, confira manual autorizado, estoque, vendas e acompanhamento do pedido.
4. Entre no BKO com um administrador autorizado e confira acessos, expedição e Conteúdo → Manual/Produtos/Mídia. O Studio não deve aparecer.
5. Inspecione `/robots.txt`, `/sitemap.xml`, canonical e imagem de compartilhamento no domínio definitivo. Verifique a propriedade no Search Console e envie o sitemap.
6. Configure e valide Google/Meta nas contas correspondentes conforme o guia. Verifique consentimento, recusa e eventos; não conte um pedido pendente como receita.

Esta entrega foi validada localmente com provedores simulados; não altera sua hospedagem nem ativa campanhas, contas, pagamentos ou envio real de mensagens.

## 5. Se precisar voltar à versão anterior

Mantenha o pacote anterior e sua configuração. Para rollback de código, reinstale a versão anterior em diretório limpo e recompile com as variáveis anteriores. As migrações desta entrega não removem dados; não restaure o banco antigo por cima de pedidos novos. Qualquer recuperação de banco deve preservar as transações ocorridas após o backup.
