# Checkout em etapas — 13/11/2026

O checkout do link de vendas agora tem resumo lateral e etapas Identificação, Entrega e Pagamento. Em telas pequenas, resumo e formulário ficam empilhados. Fotos originais e vídeos estão abaixo do pedido. Os links Institucional abrem https://mix10pro.com.br/lp-v2 em outra aba; o suporte abre o WhatsApp LORD NUTRI.

Mantidos: preço de R$ 109,90 por caixa, quantidade de 1 a 5, cotação de frete, encargos do cartão, identificação da campanha, API de checkout e pagamento na fatura hospedada do Asaas. Alterar a quantidade invalida a cotação anterior e exige frete atualizado antes do pagamento. Dados de cada etapa permanecem no formulário ao navegar.

## Publicação na Hostinger

1. Faça backup dos arquivos e do banco atual.
2. Atualize o código com este pacote, mantendo o .env de produção e os dados/uploads existentes. Não execute db:reset:test.
3. Use Node.js 22, execute npm ci e npm run build. Reinicie com npm start conforme a configuração atual da aplicação.
4. Consulte HOSTINGER-CHECKOUT-INFLUENCIADORES.md para variáveis, webhook e homologação.
5. Abra um link /v/CODIGO válido. Confira identificação, CEP, frete, mudança de quantidade, PIX e cartão. Faça homologação no Asaas sandbox antes de pagamentos reais.

A alteração não requer apagar ou recriar usuários, campanhas ou pedidos. O institucional e /c/CODIGO continuam com o comportamento anterior.

## Verificação

Build de produção concluído. Suíte completa: 275 testes executados; 272 passaram, duas divergências históricas da landing e uma expectativa de texto antigo do painel. A expectativa antiga exigia a frase sobre comprovantes que foi removida a pedido do usuário; foi atualizada. Reexecução dos testes de checkout e três perfis: aprovada.

Não foi possível validar a renderização em um navegador neste ambiente. Os estilos incluem pontos de adaptação para PC/celular, mas a conferência visual final deve ocorrer após publicação. Nenhuma cobrança real nem conexão ao banco de produção foi realizada nesta revisão.
