# Prompt enxuto — MIX10 PRO

Atualize o projeto MIX10 PRO sem criar nova arquitetura e sem misturar indicação com faturamento. Preserve Next.js, Drizzle/MySQL, autenticação, BKO e Asaas existentes.

## Objetivo

Implementar indicação rastreável e cashback fixo:

- `/r/:code` identifica o revendedor e redireciona para `https://mix10pro.com.br/lp-v2`.
- Preserve `ref`, `referralCode` e UTMs até o checkout.
- Após pagamento confirmado como `paid`, gere **R$ 15,00 por pedido qualificado**, uma única vez por pedido, mesmo com uma ou mais unidades.
- Cashback é uma carteira separada de faturamento e vendas.
- Status: `pending`, `approved`, `paid`, `cancelled`.
- Revendedor vê links, cliques, pedidos qualificados e totais pendente/aprovado/pago.
- BKO vê indicadores, lista de créditos e ações aprovar/marcar pago/cancelar.

## Integração da LP externa

A LP deve preservar `referralCode` e, somente após confirmação Asaas, chamar:

```http
POST https://revendedores.mix10pro.com.br/api/public/affiliate/qualify
x-affiliate-token: $AFFILIATE_WEBHOOK_TOKEN
Content-Type: application/json

{"referralCode":"CODIGO","externalOrderId":"PEDIDO","buyerEmail":"email@cliente.com","boxes":20,"paymentStatus":"paid"}
```

Nunca crie cashback em clique, lead ou pagamento pendente. Use idempotência por `purchaseId`/`externalOrderId`.

## SEO

Adicionar metadados sem promessas médicas, keywords relacionadas a suplemento alimentar, colágeno tipo II, magnésio, vitamina D3, MIX10 PRO, LordNutri e revenda de suplementos. Criar `robots.txt`, `sitemap.xml` e documentação do Search Console. O TXT de verificação é criado no DNS, não invente token.

## Validação obrigatória

1. Gerar/aplicar migração do schema.
2. Rodar testes específicos de indicação/cashback.
3. Rodar lint e build.
4. Se houver falhas legadas fora do escopo, listar arquivo, erro e impacto sem mascarar.
5. Não alterar credenciais, regras de faturamento ou comissionamento sem confirmação.
