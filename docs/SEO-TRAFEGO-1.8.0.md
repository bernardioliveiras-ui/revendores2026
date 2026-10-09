# SEO e tráfego — configuração da versão 1.8.0

O código está preparado para GA4, Google Ads e Meta, incluindo compra confirmada pelo servidor. As integrações chegam desligadas. Não foram conectadas contas, ativadas campanhas, enviadas cobranças ou conversões reais nesta entrega.

## 1. SEO e domínio

Configure `NEXT_PUBLIC_APP_URL` com a origem HTTPS definitiva antes do build. Canonical, sitemap, robots, Organization JSON-LD e imagem social usam esse domínio. `/sitemap.xml` inclui a landing e as quatro páginas legais. Login, checkout, APIs, portal e rotas operacionais têm noindex; a landing é HTML pré-renderizado independente do banco.

Verifique o domínio no Search Console por DNS ou `GOOGLE_SITE_VERIFICATION`, envie o sitemap e inspecione a URL publicada. HTTPS, DNS e redirecionamentos de domínio pertencem à hospedagem. A implementação não garante posição nem prazo de indexação.

## 2. Variáveis

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ID `G-...` do fluxo web correto. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | ID `AW-...` da tag Ads, opcional. |
| `NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL` | Rótulo exclusivo de conversão **secundária de pedido criado**, valor zero. Nunca use o rótulo de compra paga aqui. |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID numérico do Pixel/dataset web. |
| `PURCHASE_MEASUREMENT_ENABLED` | `true` para habilitar captura e entrega de compra confirmada. Padrão `false`. |
| `GA4_API_SECRET` | Segredo do Measurement Protocol do mesmo fluxo GA4. Somente servidor. |
| `META_CAPI_ACCESS_TOKEN` | Token CAPI do dataset correspondente. Somente servidor. |
| `META_GRAPH_API_VERSION` | Versão suportada pela aplicação Meta, formato `vNN.0`; confira no painel da aplicação. |
| `META_CAPI_TEST_EVENT_CODE` | Código opcional de Test Events na homologação; retire antes de produção. |
| `PURCHASE_MEASUREMENT_ALLOW_SANDBOX` | Só use `true` com stream/pixel exclusivos de testes. Sem isso, compra do Asaas sandbox não gera conversão. |
| `MEASUREMENT_RETRY_TOKEN` | Segredo forte exclusivo para a rotina de fila/limpeza, pelo menos 32 caracteres. |

`NEXT_PUBLIC_*` é incorporado ao navegador durante o build: alterou o ID, recompile. Segredos nunca recebem prefixo público. Não instale um segundo snippet/GTM que duplique os eventos desta implementação.

## 3. Mapa dos eventos

| Situação | Google Analytics | Meta | Google Ads |
| --- | --- | --- | --- |
| Visita consentida | `page_view` | `PageView` | Tag configurada, sem venda. |
| Envio de checkout válido com frete | `begin_checkout` | `InitiateCheckout` | Nenhuma compra. |
| Link Asaas gerado, pagamento pendente | `order_created` customizado | `OrderCreated` customizado | Ação secundária opcional, valor zero. |
| Webhook autenticado confirma pagamento | `purchase` pelo Measurement Protocol | `Purchase` pela CAPI | Importação do `purchase` GA4, após vincular as contas. |

O servidor obtém valores do pedido no MySQL. GA4 usa valor dos produtos e frete separado; juros e total cobrado ficam em parâmetros próprios. Meta usa o total cobrado. Ambos usam BRL e um item correspondente ao kit. O valor de receita entre plataformas pode diferir por essa convenção. Pedido pendente, cancelado antes do envio, aprovação manual isolada ou ausência de consentimento/IDs elegíveis não gera Purchase.

GA4 usa `transaction_id` igual ao número do pedido; Meta usa `event_id` estável por compra. O navegador não envia Purchase. A fila tem uma entrada por pedido/fornecedor, impedindo duplicação na operação normal. Em falha entre aceite externo e gravação local, pode haver reenvio com a mesma identidade para deduplicação pelo fornecedor; não há garantia de entrega exatamente uma vez.

## 4. Consentimento e dados

As tags só iniciam em `/` e `/comprar`, após a autorização correspondente. Google Consent Mode começa negado; análise e publicidade têm escolhas separadas. Não são carregadas tags no BKO, login ou APIs. A navegação para outra página descarrega os SDKs. A compra funciona mesmo sem consentimento, com bloqueador ou falha de mensuração.

Nome, e-mail, telefone, CPF/CNPJ, endereço, cartão e respostas completas do Asaas não são enviados aos fornecedores de mensuração. Antes de carregar os SDKs, query arbitrária e fragmentos são retirados da URL; só permanecem kit e tokens de clique válidos. Referrer usa apenas origem; eventos GA4 recebem caminho público e referrer vazio. Desative mensuração otimizada/formulários, captura automática e advanced matching nas contas para manter esse contrato.

Para Purchase, o navegador consulta `client_id` e `session_id` do GA4 consentido (timeout de 350 ms) e lê `_fbp`/`_fbc` apenas com consentimento de publicidade. Não cria identificadores fictícios se o SDK não responder. O servidor valida formatos, finalidades e o ID do destino antes de guardar um snapshot por até 30 dias de uso. Meta recebe somente fbp/fbc elegíveis e user agent; não há IP, hash de contato ou enhanced conversions. Isso pode limitar correspondência e atribuição.

As preferências locais duram até 180 dias. Atribuição UTM consentida dura 30 dias; os quatro campos UTM existentes permanecem operacionais no pedido, sem envio de texto livre aos fornecedores. IDs de clique validados podem ser lidos pelo SDK na URL, mas esta versão não implementa upload offline direto da Google Ads API. A atribuição depende da sessão/cookies, consentimento e configuração externa; não há promessa de correspondência de toda receita a anúncios.

A resposta do checkout fornece um token aleatório para retirada daquele pedido. O navegador guarda somente esse recibo, e o servidor guarda o hash do token. O snapshot só se torna elegível após confirmação do navegador, depois de persistir o recibo e reavaliar a escolha atual. Resposta perdida, reload durante o checkout ou armazenamento indisponível não ativam uma conversão sem capacidade local de retirada. Ao retirar uma finalidade, solicita o bloqueio dos envios pendentes; falhas de rede ficam pendentes para a próxima visita. Esse controle não desfaz eventos já enviados, não recupera o vínculo se o armazenamento foi apagado/bloqueado e não controla outro dispositivo. Solicitações adicionais seguem o contato da política de privacidade. Não use a política como substituto da revisão das práticas reais da operação.

## 5. Fila durável e manutenção

A migração cria `purchase_measurement`, `measurement_outbox` e acrescenta `purchase_id` aos registros Asaas, sem apagar tabelas existentes. O webhook grava o evento autenticado e tenta enfileirar a compra. Um processamento curto após a resposta tenta entregar até dois eventos. Problemas dessa integração são isolados da liberação de acesso/estoque.

**Configure uma tarefa na hospedagem a cada 5 minutos**, fazendo POST HTTPS para:

```text
/api/internal/measurement/retry
Authorization: Bearer <MEASUREMENT_RETRY_TOKEN>
```

O segredo vai no header, nunca na URL. O endpoint processa até dez eventos por chamada e recupera confirmações interrompidas entre o commit e o enfileiramento. Mantém tentativas/backoff no banco, até oito tentativas para falhas transitórias; erros permanentes ficam `failed`. Consulta estado pago e consentimento sob lock antes do envio. Cancelamento já confirmado no banco impede envio ainda pendente.

A rotina também apaga snapshots vencidos e tokens de retirada. **Mantenha a manutenção agendada mesmo se desativar o envio**; a limpeza continua habilitada com `PURCHASE_MEASUREMENT_ENABLED=false`. Sem execução da rotina não se pode afirmar remoção física no prazo. O agendamento externo não foi criado nesta entrega.

Consulte os estados da fila no MySQL (`pending`, `retry`, `sent`, `failed`, `suppressed`) e seus códigos de erro, que não guardam respostas com segredos. `sent` no GA4 significa sucesso do transporte HTTP; o processamento final precisa ser conferido na conta. Credenciais corrigidas podem exigir reprocessamento operacional de entradas `failed`; não altere um evento já `sent` para forçar duplicação.

O horário inicial da confirmação é preservado. Eventos vencidos para os limites implementados de GA4 (72 horas) e Meta (7 dias) são suprimidos; o código não inventa uma confirmação nova para conseguir reenviar. Estornos **posteriores** ao envio não geram ajuste automático nas plataformas nesta versão; concilie-os no Asaas/BKO e nos relatórios de anúncios. A fila não é um livro financeiro.

## 6. Ativar nas contas corretas

1. Publique em homologação com Asaas sandbox, stream GA4 e Pixel de teste, respectivos segredos e habilitação explícita de sandbox. Confira domínio/HTTPS e as políticas factuais atualizadas.
2. No GA4, selecione o fluxo correto, crie seu segredo do Measurement Protocol e desative a coleta automática adicional indicada acima. Confirme `purchase` com número do pedido e BRL nos relatórios; valide payloads pelo endpoint de depuração antes de confiar na coleta de produção.
3. Vincule a propriedade GA4 à conta Google Ads e importe `purchase` como ação de compra apropriada à campanha. Evite criar uma segunda conversão principal para a mesma venda. `order_created` deve continuar sendo pedido pendente, nunca faturamento.
4. Configure Pixel/dataset, token CAPI e versão Graph na Meta. Use Test Events para verificar Purchase de servidor e sua identidade estável. Desative eventos automáticos/advanced matching. Verificação de domínio e configuração de campanha são feitas na conta.
5. Teste primeira visita, recusa, análise isolada, publicidade isolada, retirada e navegação para o portal. Teste compra paga, repetição do webhook, falha transitória, cancelamento antes do envio e reenvio pela rotina protegida. Nenhuma compra pendente deve aparecer como Purchase.
6. Só então use IDs de produção, retire códigos de teste, confirme Asaas `production`, compile e habilite o envio. Agende e acompanhe a manutenção da fila.

## Evidências e limites

Os testes locais executam os contratos, worker, rotas e componentes com fronteiras MySQL/SDK/HTTP simuladas. Conferem consentimento, dados permitidos, preços do servidor, deduplicação, retry, retirada e falha opcional sem bloquear pagamento. Não comprovam conexão com suas contas, aprovação de anúncios ou recebimento real dos eventos. A validação integrada está em `VALIDACAO-1.8.0.md`.

Referências oficiais consultadas em 09/10/2026:

- Google tag/get: https://developers.google.com/tag-platform/gtagjs/reference
- GA4 Measurement Protocol: https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference
- Google Ads/GA4: https://support.google.com/google-ads/answer/2375435
- Consent Mode: https://developers.google.com/tag-platform/security/guides/consent
- Meta CAPI: https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api

A página completa da Meta limitou acesso durante a pesquisa; a configuração vigente e o recebimento devem ser confirmados no painel de desenvolvedores/Test Events.
