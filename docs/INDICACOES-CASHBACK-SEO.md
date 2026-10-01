# Indicações, cashback e SEO — MIX10 PRO

## Regra de negócio

- Indicação é uma trilha separada de faturamento, vendas e comissão de revenda.
- Cada compra paga e qualificada de um indicado gera **R$ 15,00 de cashback fixo** para o revendedor.
- A compra pode conter uma ou mais unidades/caixas; o cashback é **um crédito por pedido**, não por unidade.
- O crédito nasce como `pending` quando a compra é confirmada pelo Asaas/LP.
- O BKO pode aprovar (`approved`), marcar como pago (`paid`) ou cancelar (`cancelled`).
- A carteira do revendedor mostra pendente, aprovado e pago.
- A tabela `affiliate_cashbacks` usa `purchase_id` único para impedir duplicidade.

## Integração com `https://mix10pro.com.br/lp-v2`

O redirecionamento `/r/CODIGO` já envia:

- `ref` e `referralCode` com o código público da indicação;
- `utm_source=revendedor`;
- `utm_medium=indicacao`;
- `utm_campaign=cashback-CODIGO`.

A LP externa precisa preservar `referralCode` até a criação do pedido e, **somente após confirmação do pagamento pelo Asaas**, chamar:

```http
POST https://revendedores.mix10pro.com.br/api/public/affiliate/qualify
x-affiliate-token: $AFFILIATE_WEBHOOK_TOKEN
Content-Type: application/json

{
  "referralCode": "ABC123DEF456",
  "externalOrderId": "ID_DO_PEDIDO_DA_LP",
  "buyerEmail": "comprador@exemplo.com",
  "boxes": 20,
  "paymentStatus": "paid"
}
```

Não chamar esse endpoint na criação do pedido, no clique ou quando o pagamento estiver pendente.

## Search Console e SEO

O código inclui metadados, keywords, `robots.txt` e `sitemap.xml`. A verificação por TXT do domínio **não é feita no código**: precisa ser adicionada no DNS do provedor do domínio.

Passos:

1. No Google Search Console, selecione a propriedade de domínio `mix10pro.com.br`.
2. Escolha verificação por registro TXT.
3. No DNS, crie um TXT no host indicado pelo Google e cole o valor real fornecido pelo Search Console.
4. Aguarde a propagação e clique em verificar.
5. Envie `https://revendedores.mix10pro.com.br/sitemap.xml`.

Se for usada a verificação por prefixo de URL, defina `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` com o token de meta fornecido pelo Google.

## Prompt enxuto para o senior

> Atualize o projeto MIX10 PRO sem criar nova arquitetura e sem misturar indicação com faturamento. Preserve Next.js, Drizzle/MySQL, autenticação e Asaas existentes. Implemente cashback fixo de R$ 15,00 por pedido pago de indicado, uma vez por `purchaseId`, com estados `pending`, `approved`, `paid` e `cancelled`. Preserve `referralCode` vindo de `/r/:code` até o checkout. No webhook de pagamento confirmado, crie o cashback pendente; nunca crie no clique ou no pedido pendente. Mostre a carteira no painel do revendedor e indicadores/lista/ações no BKO. Para a LP externa `https://mix10pro.com.br/lp-v2`, mantenha `ref`, `referralCode` e UTMs e use `POST /api/public/affiliate/qualify` com token compartilhado somente após Asaas confirmar `paid`. Gere a migração do schema, atualize testes e rode lint, build e test. Adicione metadados SEO, robots, sitemap e documente que o TXT do Search Console precisa ser criado no DNS; não invente token. Não altere credenciais, billing do Asaas ou regras de comissão sem confirmação.
