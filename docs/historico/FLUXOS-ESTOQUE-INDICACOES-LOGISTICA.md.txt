# Fluxos operacionais do Portal MIX10 PRO

## Estoque automático

- pedido criado: não altera o estoque;
- pagamento confirmado pelo Asaas: cria a fila de logística;
- entrega confirmada: soma as caixas ao estoque;
- venda registrada: subtrai as caixas;
- devolução registrada: devolve as caixas ao saldo;
- entrada ou saída de ajuste: altera o saldo e exige gerente ou proprietário;
- saldo em 15% ou menos da maior capacidade já registrada: exibe alerta de reposição.

O sistema impede venda acima do saldo e devolução acima das vendas registradas.

## Indicações do Mercado Livre

1. O revendedor informa nome e WhatsApp do interessado.
2. A plataforma gera um endereço individual `/r/CODIGO`.
3. O botão de WhatsApp abre a conversa com uma mensagem e o link prontos.
4. O link registra o clique e redireciona ao anúncio oficial do MIX10 PRO.
5. O revendedor informa manualmente se houve venda ou se não converteu.
6. O administrador acompanha revenda, responsável, contato, cliques, situação e valor informado.

O registro manual é necessário porque o anúncio comum do Mercado Livre não
envia a conversão à plataforma. Uma futura integração oficial de afiliados
pode substituir esse passo sem mudar a estrutura da área.

## Contrato da automação logística

Ao confirmar um pagamento, a plataforma envia um `POST` autenticado para
`SHIPPING_AUTOMATION_URL` com o pedido, destinatário, endereço, quantidade de
caixas, URL de retorno e a estratégia `best_cost_and_speed`.

A automação deve responder com JSON neste formato:

```json
{
  "provider": "transportadora",
  "service": "serviço escolhido",
  "shipmentId": "identificador externo",
  "status": "processing",
  "quoteCents": 2590,
  "trackingCode": "opcional",
  "trackingUrl": "opcional",
  "labelUrl": "opcional"
}
```

Status aceitos: `pending_quote`, `processing`, `ready_to_ship`, `in_transit`,
`delivered`, `exception` e `cancelled`.

Para devolver atualizações, envie `POST /api/shipping/webhook` com o cabeçalho
`x-shipping-token` e o mesmo conjunto de campos, incluindo `orderId` ou
`shipmentId`.
