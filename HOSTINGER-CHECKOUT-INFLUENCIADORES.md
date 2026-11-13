# Publicar o checkout dos influenciadores na Hostinger

Use o ZIP na aplicação Node.js existente de `revendedores.mix10pro.com.br`. A pasta raiz do ZIP contém `package.json`.

## Atualizar a aplicação

1. Faça backup do MySQL atual e guarde o pacote anterior. Anote as configurações existentes do hPanel.
2. Mantenha o mesmo banco e os valores atuais de `DATABASE_*`, `AUTH_SECRET` e das demais variáveis da aplicação. Atualize a aplicação no hPanel com o ZIP, usando Next.js, Node 22, npm, build `npm run build` e saída `.next`. O comando `npm start` aplica as migrações aditivas antes de iniciar o Next. Se o seu fluxo inicia o Next diretamente, execute `npm run db:migrate` com as credenciais do ambiente antes da primeira publicação.
3. Configure `NEXT_PUBLIC_APP_URL` com a URL HTTPS da aplicação. Mantenha no ambiente os segredos `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`. Use `ASAAS_ENVIRONMENT=sandbox` com uma chave de testes no ambiente de homologação e `production` com a chave de produção na operação real. Use um banco separado para homologação.
4. No Asaas, confira o webhook existente em `https://revendedores.mix10pro.com.br/api/billing/webhook`. O token enviado em `asaas-access-token` deve corresponder ao configurado na aplicação. Habilite `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_DELETED`, `PAYMENT_RECEIVED_IN_CASH_UNDONE` e `PAYMENT_CHARGEBACK_REQUESTED`. Na homologação, use a URL do ambiente de teste.

A atualização usa o código público já cadastrado para gerar os dois links. A compra avulsa permite de uma a cinco caixas por pedido, conforme a tabela de frete por quantidade. Cartão em 1x e PIX têm encargos de R$ 0,00. O parcelamento usa a regra vigente de 2,99% ao mês de 2x a 6x. Pedidos avulsos pagos entram em separação. Usa também as tabelas e colunas existentes de pedidos, campanhas, eventos e cashback. Preserve os dados ao publicar ou reverter. Para voltar à versão anterior, publique o pacote anterior com as mesmas variáveis e o mesmo banco.

## Validar antes de voltar com os anúncios

1. Em uma campanha ativa, copie o link de vendas no portal do influenciador ou no BKO. Confira se `/v/[codigo]` abre o checkout avulso no domínio de revendedores. O endereço antigo `/c/[codigo]` permanece acessível pelo URL original. Confirme que um código inválido ou pausado impede o checkout.
2. Abra o link de vendas em janela anônima com parâmetros UTM. Confira o valor unitário de R$ 109,90. Escolha duas caixas e confirme o subtotal de R$ 219,80. Calcule o frete e gere um PIX. Confira o pedido atribuído no BKO, o filtro **PIX pendentes** e a fatura hospedada no Asaas. Use o código copia e cola ou QR exibido na fatura.
3. Simule a confirmação do PIX no sandbox. Confira o webhook entregue com HTTP 200, a venda confirmada, o cashback e o cartão de separação do pedido. Reenvie o mesmo evento e confira que os totais permanecem estáveis. Teste também um estorno.
4. Repita com cartão à vista e parcelado. O comprador informa o cartão na fatura do Asaas. Compare o valor da fatura com o total mostrado no checkout.
5. Confira o filtro **Recuperação** do BKO. Ele mostra pedidos aguardando pagamento ou com erro de checkout. A ação abre uma conversa no WhatsApp para atendimento manual. Quando houver fatura pendente cadastrada, o BKO também pode copiar o link da cobrança. Os contatos ficam disponíveis somente no BKO.
6. No Meta Ads, publique `https://revendedores.mix10pro.com.br/v/SEU_CODIGO` após validar o fluxo no ambiente publicado. Use o código exibido no painel.

## Testes realizados

- Build de produção com `npm run build`.
- Testes automatizados de redirecionamento, atribuição, faturamento simulado, webhook, cashback e estorno.
- Verificação HTTP local do checkout público e de código inválido.
- A suíte integral tem duas falhas reproduzidas no ZIP de origem. São as comparações do HTML com a versão 1.8.0 e do briefing histórico da landing. A página institucional foi preservada.
- A homologação com uma conta Asaas e o MySQL da Hostinger deve ser feita no ambiente publicado.

Documentação de referência

- [Publicação de aplicações Node.js na Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Eventos de cobrança do Asaas](https://docs.asaas.com/docs/payment-events)
- [Cobrança Pix](https://docs.asaas.com/docs/cobrancas-via-pix)
- [Cobrança de cartão com fatura hospedada](https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito)
