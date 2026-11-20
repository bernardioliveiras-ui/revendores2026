# Mix10Pro — correção de rastreamento do influenciador (ponte servidor-servidor)

## Diagnóstico confirmado no código v2.8

A rota `/c/[code]` soma um acesso e redireciona o navegador para
`https://mix10pro.com.br/lp-v2?campanha=<codigo>`.
O painel de influenciadores soma checkouts **somente da tabela local `purchases`**.
Uma venda gerada no checkout de **outro site** não cria automaticamente uma linha
em `purchases` no site de revendedores. Assim, o PIX pode ser gerado e o contador
permanecer em zero. Não se deve inferir, apenas por isso, que houve venda perdida.

## O que este patch modifica

- Adiciona a tabela **nova e isolada** `indicator_external_orders`, sem alterar
  registros financeiros e pedidos já existentes.
- Cria `/api/public/indicator/order-event`, autenticado por cabeçalho secreto.
- `created`: registra checkout/PIX pendente, de forma idempotente.
- `paid`: **consulta Asaas** e aceita apenas `RECEIVED`/`CONFIRMED`, verificando
  também `externalReference` contra o pedido externo; só então soma venda e cashback.
- `cancelled`: verifica status de cancelamento/estorno no Asaas antes de retirar da venda.
- O painel agrega os pedidos locais e externos, sem conceder acesso de revendedor,
  sem mexer em estoque ou alterar o checkout atual.

**LIMITAÇÃO IMPORTANTE:** o código-fonte atual do checkout hospedado em
`mix10pro.com.br` não estava no pacote do painel v2.8. Até instalar o callback
**no backend desse site**, o contador continuará zerado para compras externas.
O patch **não foi publicado** e **não foi homologado com o Asaas real**.

## Integração obrigatória no backend da loja mix10pro.com.br

1. Ao receber o parâmetro `?campanha=<codigo>` na landing, persista-o na sessão
   **do domínio da loja**, até a criação do pedido. Não dependa do cookie `ln_campaign`
   de `revendedores.mix10pro.com.br`, pois ele não atravessa domínios.
2. Na criação da cobrança Asaas, defina `externalReference: externalOrderId`
   (ID estável do pedido da loja, apenas letras/números/`-`/`_`). O mesmo ID deve
   ser usado em todas as chamadas; **não** use um ID novo a cada retry.
3. Quando o Asaas gerar a cobrança, o **servidor da loja** deve chamar o endpoint
   abaixo com `event=created`. Se o destino estiver indisponível, use fila e retry.
4. Quando o webhook Asaas da loja receber pagamento confirmado, o **servidor**
   chama `event=paid`. Para estorno/cancelamento, `event=cancelled`.
5. Os campos devem ser idênticos entre eventos para garantir idempotência.
6. A plataforma de revendedores deve ter configurado o mesmo **ambiente e conta Asaas**
   capazes de consultar esse pagamento. Caso a loja tenha conta Asaas distinta,
   é necessário ajustar a verificação server-to-server antes de publicar.

### Exemplo de payload (dados fictícios)

```
POST https://revendedores.mix10pro.com.br/api/public/indicator/order-event
content-type: application/json
x-indicator-bridge-token: <SEGREDO_CONFIGURADO_NO_SERVIDOR>

{
  "event": "created",
  "externalOrderId": "pedido_123",
  "campaignCode": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "asaasPaymentId": "pay_EXEMPLO",
  "productTotalCents": 149800
}
```

O servidor da loja pode usar o seguinte padrão (Node/Next server-side):

```js
async function avisarPainel(event, pedido) {
  const response = await fetch('https://revendedores.mix10pro.com.br/api/public/indicator/order-event', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-indicator-bridge-token': process.env.INDICATOR_BRIDGE_TOKEN,
    },
    body: JSON.stringify({
      event, externalOrderId: pedido.id,
      campaignCode: pedido.campanha,
      asaasPaymentId: pedido.asaasPaymentId,
      productTotalCents: pedido.produtosEmCentavos,
    }),
  });
  if (!response.ok) throw new Error(`Ponte de campanha falhou: ${response.status}`);
  return response.json();
}
```

O token acima é **secreto**. Nunca chamá-lo do JavaScript do visitante.
Asaas também requer credencial secreta apenas em servidor.

## Implantação segura

- Fazer backup do MySQL e do projeto publicado.
- Comparar o código atual de produção com o patch v2.8 antes de aplicar; não sobrescrever
  versões mais novas nem variáveis de produção.
- Configurar `INDICATOR_BRIDGE_TOKEN` forte **nos dois backends**.
- Publicar backend de revendedores e integrar o backend da loja.
- Testar um pedido sandbox pelo link/campanha: `clicks +1`, `checkouts +1`,
  `pending +1`, `confirmedOrders 0`.
- Reenviar `created` e garantir que continua +1, não +2.
- Confirmar pagamento pelo Asaas sandbox: `confirmedOrders +1`, pending cai,
  cashback de acordo com a campanha; reenvio não duplica.
- Reembolsar no sandbox: a venda não deve mais contar como confirmada.
- Confirmar que compras sem campanha não são atribuídas, e que pedidos de campanhas
  distintas não se misturam.
- Somente depois fazer um teste real autorizado em produção.

## Histórico

As visitas e cobranças antigas não são convertidas em vendas automaticamente.
Para reconstruir atribuições antigas, conciliar pedidos/códigos com IDs de
pagamento Asaas de forma auditável, sem marcar compras não pagas como vendas.
