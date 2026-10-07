# Automações desta versão

## Pagamento, acesso e estoque

Asaas envia eventos autenticados a `/api/billing/webhook`. `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` marcam a compra como paga e em separação. O provisionamento transacional cria uma conta ativa por e-mail e uma entrada de estoque por compra. Recompras preservam a senha existente. Aprovação manual no BKO usa o mesmo provisionamento, após o operador conferir o recebimento; ela não altera a transação na conta Asaas.

Eventos repetidos retomam acesso/boas-vindas pendentes. Pedido ainda não localizado retorna 503 para o Asaas reenviar. Pagamento cancelado não é reativado por confirmação atrasada. Estornos preservam a política de estoque já existente; requerem conciliação operacional no BKO, sem deduzir mercadoria automaticamente.

## Ponte de boas-vindas

O servidor faz POST HTTPS para `WELCOME_AUTOMATION_URL` com `Authorization: Bearer <WELCOME_AUTOMATION_TOKEN>` e `Idempotency-Key` estável para cada compra/geração de senha. O token só existe no servidor.

JSON: `event`, `purchaseId`, `orderNumber`, `name`, `email`, `phone`, `portalUrl`, `temporaryPassword`, `existingAccount`, `channels: ["email", "whatsapp"]`.

O receptor deve deduplicar pelo Idempotency-Key, usar as credenciais dos seus provedores, enviar pelos dois canais e responder 2xx somente quando confirmar os envios. Em recompra, `temporaryPassword` é null e `existingAccount` é true: envie confirmação do pedido e o link do portal, sem substituir a senha.

Erro de rede/HTTP mantém o envio pendente. Asaas pode repetir o webhook; o BKO também tem **Acessos > Enviar boas-vindas**. Sem URL/token, o envio não acontece. Credenciais temporárias ficam criptografadas com o AUTH_SECRET existente até o envio. Preserve esse segredo entre deploys.

## Entrega

POST `/api/shipping/webhook`, cabeçalho `x-shipping-token: <SHIPPING_WEBHOOK_TOKEN>`, JSON:

```json
{"purchaseId":"ID_INTERNO","status":"shipped","carrier":"Transportadora","trackingCode":"CODIGO"}
```

Status: `separating`, `shipped`, `delivered`; aliases `processing`, `ready_to_ship`, `in_transit` aceitos. Exige compra paga; mantém rastreio e impede regressão. O painel do revendedor consulta as atualizações a cada 30 segundos enquanto visível. Esta versão recebe atualizações; não solicita coleta/etiqueta a uma transportadora.

## Indicações existentes

Os endpoints `/r/:code`, `/api/cashback`, `/api/admin/cashback` (PATCH) e `/api/public/affiliate/qualify` continuam disponíveis. A tabela `affiliate_cashbacks` foi restaurada como carteira independente. O menu do revendedor passa a mostrar Manual, Vídeo e Pedido, conforme o pedido mais recente; não há dashboard de cashback nesta interface.

A LP externa precisa preservar os parâmetros e chamar a qualificação **do servidor**, após confirmar o pagamento real no Asaas. A LP externa não veio neste ZIP e não foi alterada.

```http
POST /api/public/affiliate/qualify
x-affiliate-token: <AFFILIATE_WEBHOOK_TOKEN>
Content-Type: application/json

{"referralCode":"CODIGO","externalOrderId":"PEDIDO","buyerEmail":"cliente@exemplo.com","boxes":20,"paymentStatus":"paid"}
```

Crédito fixo de 1500 centavos, uma vez por pedido externo. Pendente/lead/clique não geram crédito. Administração: pending → approved → paid; cancelamento de pending/approved. Marcar pago registra um repasse já realizado e exige referência; não transfere dinheiro.

Pagamentos com referência externa que não corresponde a uma compra deste portal são ignorados pelo webhook local; a qualificação de indicação externa usa sua API própria. Compra local aguardando vínculo ao pagamento retorna 503 para reenvio.
