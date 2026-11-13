# Hotfix para erro de build na Hostinger

Erro original: `Argument of type ... is not assignable` em
`app/api/public/indicator/order-event/route.ts` na chamada
`calculateInfluencerCashback(campaign, data.productTotalCents)`.

## Correção aplicada

A `resolveCampaign` retorna uma estrutura reduzida com `id`, `code` e `name`.
O caminho de pedidos existentes retornava a estrutura completa de `indicator_campaigns`.
A união dos dois tipos causava o erro de compilação e também permitia perder
regras personalizadas de cashback ao usar a estrutura reduzida.

Agora os dois caminhos carregam o registro completo de `indicator_campaigns`
após validar o identificador da campanha. A regra de cálculo e a confirmação
Asaas não foram alteradas.

## Publicação

- Se a Hostinger está configurada para compilar código vindo do GitHub,
  uma alteração feita apenas no Gerenciador de arquivos do site publicado
  **não é incorporada aos próximos builds do GitHub**.
- Para usar este hotfix, altere a fonte no GitHub via pessoa com permissão de
  escrita **ou** configure um deploy próprio pela Hostinger com o projeto
  completo corrigido. **Não extraia o ZIP em `public_html`** esperando que
  um aplicativo Next.js passe a funcionar.
- Não apague `.env`, banco de dados, credenciais nem arquivos persistentes.
- Depois de publicar, valide `npm run build`, `order-event` e a atribuição do
  checkout, idealmente primeiro em ambiente de testes.

Este pacote é **parcial**: o site `mix10pro.com.br` ainda precisa enviar
os eventos à API privada de ponte; o hotfix não resolve sozinho o contador de
checkouts em produção. Nunca exponha `INDICATOR_BRIDGE_TOKEN` no navegador.
