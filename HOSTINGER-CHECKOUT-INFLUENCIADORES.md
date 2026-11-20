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


## Atualização do funil e cashback

O BKO consulta todos os acessos registrados. O influenciador acompanha o link, vendas e cashback. Os contatos dos clientes e a recuperação ficam exclusivos do BKO. O endpoint antigo de funil do influenciador retorna 403. A tabela adicional `checkout_activity` é criada automaticamente no primeiro uso, com os mesmos privilégios de criação já usados nas migrações. Os painéis exibem até 1.000 acessos recentes.

Acesso é uma sessão da aba que carregou o checkout, mesmo entrando diretamente em `/comprar?venda=...`. Uma sessão é reutilizada durante 30 minutos. Checkout iniciado é a interação com o formulário. Carrinho abandonado é um checkout iniciado há pelo menos 30 minutos sem nova atividade e sem pagamento confirmado ou cancelamento. O telefone preenchido permite contato manual pelo WhatsApp. Pedidos pagos deixam a recuperação na próxima atualização do painel. A medição depende do JavaScript e da conexão do navegador.

O texto de privacidade do formulário informa o atendimento pela equipe LORD NUTRI. Os botões de suporte abrem o WhatsApp (11) 93492-4155 com o código do link para a equipe identificar a campanha. O BKO exibe o nome do influenciador, a campanha e os dados preenchidos do cliente. Os termos de participação passam à versão 2026-11-13.1, com novo aceite para os influenciadores. Quando o saldo liberado atingir R$ 100 numa sexta-feira, o montante fica previsto para a sexta-feira da semana seguinte, no horário de São Paulo.

### API de preparação do repasse

`POST /api/admin/cashback/prepare`, com sessão autenticada de administrador.

Exemplo de corpo JSON

```json
{"amountCents":10000,"availableAt":"2026-11-13T10:00:00-03:00"}
```

A resposta é uma simulação com valor, data prevista, `mode=preview` e `automaticTransfersEnabled=false`. O valor informado deve corresponder ao saldo liberado conferido pelo BKO. Esta API prepara o calendário. A ativação dos repasses requer conciliação de valores liberados e pagos, cadastro PIX, registro persistente de lotes e idempotência, integração de transferências e webhooks. Transferências e reservas de saldo ficam fora desta prévia.

O Asaas executa split quando recebe cada cobrança. Para acumular o mínimo e pagar na sexta-feira, o mecanismo adequado é transferência PIX agendada com `scheduleDate`.

- https://docs.asaas.com/docs/split-faq
- https://docs.asaas.com/docs/transfers-faq
