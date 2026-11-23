# Auditoria técnica de APIs e webhooks Asaas — 23/11/2026

## Escopo

Revisão do código da integração de pagamentos, das três rotas de webhooks e da conciliação administrativa. Esta auditoria **não é homologação em produção**: não houve acesso à conta Asaas, ao banco Hostinger nem aos logs reais de webhooks.

## Corrigido e demonstrado por teste

**Bloqueio de confirmação sem cliente vinculado.** A rotina `lib/billing-webhook.ts` ignorava a verificação de cliente, referência externa, status e valor quando `purchases.asaasCustomerId` estava vazio; o evento podia marcar o pedido pago e liberar o acesso. Agora um evento pago em pedido com vínculo incompleto recebe `409 PAYMENT_CONFLICT`, sem registrar pagamento nem liberar estoque. Teste: `tests/asaas-webhook-identity.test.mjs` (RED → GREEN, cobertura também de repetição idempotente).

**Cadastro manual isolado.** A nova rota administrativa cria exclusivamente `users`/`reseller_profiles`, sem chamar API Asaas, fabricar pagamento, mexer em pedidos ou conferir o token do webhook. A reposição real continua por Asaas.

## Verificações pelo código

- `/api/billing/revendedores/webhook` e `/api/billing/influenciadores/webhook` continuam independentes por canal. A rota legada `/api/billing/webhook` permanece.
- Token `asaas-access-token` obrigatório para recebimento e deduplicação pelo identificador do evento; confirmação por campos de pagamento, comprador, valor, referência externa e parcelas (quando preenchidos).
- A conciliação do BKO consulta o Asaas em ambiente configurado e não marca localmente uma cobrança como paga sem consulta.
- Cancelamentos e estornos produzem ajustes de estoque antes da expedição. **Não interpretar isso como política financeira homologada.**

## Pendências que exigem decisão ou infraestrutura

1. **Estorno parcial (`PAYMENT_PARTIALLY_REFUNDED`).** O código atual o trata como cancelamento total do pedido e pode retirar todo o estoque vinculado. Precisamos definir a regra comercial para quantidade, expedição e cashback antes de alterar, pois o valor estornado pode não corresponder à totalidade dos produtos.
2. **Tempo de resposta do webhook.** `handleBillingWebhook` espera o provisionamento da conta após gravar o evento. Em alto volume, uma dependência lenta pode causar timeout, tentativas duplicadas e interrupção da fila. A documentação do Asaas recomenda fila durável, resposta HTTP 200 rápida e processamento assíncrono. Requer desenhar job/retry persistente e monitoramento; mover o trabalho apenas para memória após retornar 200 perderia eventos em reinicializações.
3. **Homologação real.** Executar no Sandbox: PIX e cartão; confirmação, recebimento, duplicidade, eventos fora de ordem, estorno/chargeback, webhook de canal divergente, falhas de API e fila interrompida. Conferir o painel Integrações e logs Asaas. Sem isso, não afirmar liberação para operação financeira real.

## Fonte

Documentação oficial Asaas: https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook

## Testes locais

- Novos testes executam com Node 24, sem dependências de aplicação; casos de validação, migração, convite, API de cadastro e autorização, ativação e webhook.
- Suíte completa, build Next.js e verificação de tipos ainda dependem de `npm ci` e ambiente Node 22: este executor não dispõe de todas as dependências e o cache offline do npm está incompleto. Não foi executado deploy nem operações reais no Asaas.
