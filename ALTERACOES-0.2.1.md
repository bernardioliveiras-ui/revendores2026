# LORDNUTRI Revendedores — 0.2.1

## Correção Hostinger / Next.js 16
- O build de produção agora executa `next build --webpack`.
- O comando da Hostinger continua `npm run build` e o diretório de saída continua `.next`.
- A mudança evita o panic interno do Turbopack observado ao processar `app/globals.css`/PostCSS.

## Checkout restaurado
- Mantidos KIT20 = R$ 1.498,00 e KIT50 = R$ 3.495,00.
- CEP calcula frete antes do pagamento.
- Modalidades: Entrega Econômica e Entrega Expressa.
- Tabela histórica de frete recuperada e movida para `lib/checkout/`.
- PIX à vista.
- Cartão de 1x a 6x.
- 1x sem taxa de parcelamento.
- 2x a 6x: 2,99% ao mês usando Tabela Price, preservando a regra recuperada do checkout anterior.
- Resumo mostra Produtos + Frete + Taxa de parcelamento + Total final.
- O servidor recalcula kit, frete, parcelas e total; valores monetários enviados pelo navegador não são aceitos como fonte de verdade.

## Asaas
- PIX cria cobrança PIX.
- Cartão cria cobrança CREDIT_CARD.
- Parcelamentos acima de 1x usam `installmentCount` e `totalValue`.
- O webhook existente continua responsável pela confirmação do pagamento e liberação do fluxo posterior.

## Banco de dados
Foram adicionados, de forma aditiva, os campos de detalhamento do checkout em `purchases`:
- `product_total_cents`
- `shipping_type`
- `shipping_cents`
- `payment_method`
- `installments`
- `installment_value_cents`
- `interest_cents`

O `scripts/migration-core.mjs` adiciona automaticamente os campos ausentes ao iniciar a aplicação, sem apagar registros existentes.

## Validação
- Testes específicos do checkout/build: aprovados.
- Teste de runtime do cálculo de frete/parcelamento: aprovado.
- A suíte completa do ZIP original já tinha 17 falhas antes desta atualização; a 0.2.1 permanece com as mesmas 17 falhas antigas, sem regressões adicionais introduzidas por este patch.
- O build completo não pôde ser executado neste ambiente porque a instalação de dependências ficou presa no runtime do contêiner. A correção do comando de build segue a opção suportada pelo Next.js 16.
