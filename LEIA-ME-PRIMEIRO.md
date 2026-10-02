# Primeiro: corrigir o repositório do GitHub

Siga COMO-SUBIR-NO-GITHUB.md para aplicar esta atualização ao ZIP (5). Os demais arquivos devem permanecer no repositório.

# LORDNUTRI — atualização do programa de revendedores

LORDNUTRI é a plataforma e a marca. MIX10 PRO é o produto comercializado por compra e revenda de estoque. A LP preserva o briefing, a calculadora e os kits oficiais.

## Para publicar na Hostinger

1. Faça backup do banco e mantenha todas as variáveis e credenciais existentes.
2. No banco existente, execute UMA VEZ `database/migrations/2026-10-01-lordnutri-welcome.sql`. Não execute o schema completo sobre a instalação em produção. Banco novo: `database/schema.sql`.
3. Suba os arquivos desta pasta ao GitHub, incluindo package-lock.json. Não há node_modules ou .next no pacote.
4. Node 22; instalação `npm ci`; build `npm run build`; inicialização `npm start`.
5. Configure o conteúdo e a ponte de boas-vindas abaixo. Publique e valide um pedido controlado, pagamento, estoque, acesso e entrega de mensagens no ambiente real.

Nenhuma chave Asaas, senha do banco ou regra de preço foi alterada. A migração é aditiva e inclui somente os campos da notificação de boas-vindas. Ela NÃO foi aplicada ao seu banco remoto nesta tarefa, pois não há conexão com esse banco aqui.

## Vídeo e manual

- VSL_EMBED_URL: embed HTTPS YouTube, YouTube No Cookie ou Vimeo. Exemplo: URL /embed/ do vídeo, não link da página watch.
- VSL_VIDEO_URL: URL de MP4 publicado ou `/videos/vsl-mix10.mp4` (coloque o MP4 em public/videos). Embed tem prioridade se os dois forem configurados.
- RESELLER_MANUAL_URL: caminho ou URL do PDF LORDNUTRI + MIX10 PRO. Sem configuração, usa o PDF já incluído em public/manual.

O vídeo não veio nesta tarefa. Sem configuração, a LP mostra uma apresentação de marca sem player quebrado. O manual existente foi preservado; não foi produzido um novo PDF.

## Pagamento e acesso

- Webhook existente: POST /api/billing/webhook, autenticado por ASAAS_WEBHOOK_TOKEN/asaas-access-token.
- Pagamento confirmado: marca paid, coloca em separação e cria o usuário, o perfil e a entrada de estoque em transação.
- Aprovação manual no BKO: Acessos → Confirmar pagamento manual; confirme somente após conferir o recebimento. Isso registra a aprovação interna, não altera a cobrança financeira no Asaas.
- A compra fica vinculada a purchases.user_id. Trava por compra protege repetições e acesso/estoque duplicados. Uma nova compra de um revendedor existente reutiliza sua conta sem trocar a senha e registra novo estoque.
- Senha provisória exige alteração no primeiro login. Senha de boas-vindas armazenada cifrada com AUTH_SECRET e eliminada após confirmação do encaminhamento. Não troque AUTH_SECRET durante a migração.
- BKO mantém liberação manual, nova senha, cópia e abertura de WhatsApp.

## Boas-vindas automáticas — conexão necessária

O ZIP original não incluía um provedor completo de envio de e-mail + WhatsApp. Esta versão fornece uma ponte configurável para conectar sua automação existente:

WELCOME_AUTOMATION_URL=https://seu-servico-de-automacao/seu-webhook
WELCOME_AUTOMATION_TOKEN=token-do-seu-servico

Esses valores não foram inventados nem preenchidos. Sem eles, o acesso e estoque são criados, mas as boas-vindas ficam pendentes e o BKO permite envio manual. Não se trata de um serviço SMTP ou API WhatsApp autônomo incluído no projeto.

A ponte chama seu serviço com Authorization: Bearer e Idempotency-Key. JSON:

```json
{
  "event": "lordnutri.reseller.welcome",
  "purchaseId": "identificador-do-pedido",
  "orderNumber": "numero-do-pedido",
  "name": "Nome do revendedor",
  "email": "email-do-revendedor",
  "phone": "whatsapp-do-revendedor",
  "portalUrl": "https://revendedores.mix10pro.com.br/entrar",
  "temporaryPassword": "senha-provisoria-gerada",
  "channels": ["email", "whatsapp"]
}
```

O receptor deve respeitar a Idempotency-Key por pedido/geração de senha, enviar ambos os canais e retornar 2xx depois de aceitar/processar ambos. Uma falha mantém o envio pendente: o Asaas pode repetir o evento, ou BKO → Acessos → Enviar boas-vindas pode tentar novamente. Não registre o corpo com senha em logs da automação. Reiniciar uma senha cria nova geração de envio.

Nenhum e-mail ou WhatsApp real foi enviado nos testes locais; não há credenciais do seu serviço aqui.

## Pedido e revendedor

Manual do Revendedor, Vídeo de boas-vindas e Acompanhe seu pedido substituem Afiliados na interface. As APIs/dados de indicação existentes permanecem, mas o cashback anterior não foi implementado, seguindo sua mudança de escopo para revenda/portal.

Etapas: Separação → Em percurso → Entregue. O BKO atualiza a etapa; o revendedor consulta apenas seus próprios pedidos. Atualização a cada 30 s com aba visível e botão manual. Não há rastreio GPS.

Webhook logístico opcional: POST /api/shipping/webhook com x-shipping-token igual a SHIPPING_WEBHOOK_TOKEN. JSON: purchaseId, status (separating, shipped ou delivered), carrier/trackingCode opcionais. Etapas antigas não fazem regredir entregas. Também aceita orderId como alias de purchaseId e in_transit como alias de shipped. Contratos antigos por shipmentId pertenciam ao schema abandonado e foram removidos.

## Correção da base

O ZIP misturava purchases/reseller_profiles com módulos antigos de organizations/orders/memberships ausentes. Os módulos sem consumidores na interface atual foram retirados da compilação e preservados integralmente em docs/legacy-source como arquivos .txt, sem criar novas tabelas de organizações ou desativar o typecheck.

Rotas aposentadas: /api/orders, /api/movements, /api/onboarding, /api/team e /api/manual/progress. Não eram utilizadas no painel do ZIP atual. /api/auth/verify-code passa a usar a mesma resposta 410 já utilizada em request-code (acesso atual é e-mail e senha). /api/admin/orders e /api/shipping/webhook foram adaptadas ao schema real purchases. O checkout duplicado de /comprar foi substituído pelo checkout que a LP já usava, corrigindo preço exibido, aceite e contrato de resposta.

## SEO

Metadados, keywords, Open Graph, robots.txt, sitemap.xml e canonical para o subdomínio revendedores. O Google não utiliza meta keywords para ranking; não há promessa de posicionamento, renda ou resultado terapêutico.

- https://revendedores.mix10pro.com.br/sitemap.xml
- https://revendedores.mix10pro.com.br/robots.txt
- Propriedade de domínio mix10pro.com.br: copie o TXT REAL fornecido pelo Search Console e crie esse TXT no DNS. Não foi fornecido um token; nenhum foi inventado.
- https://support.google.com/webmasters/answer/9008080?hl=pt-BR
- https://developers.google.com/search/docs/crawling-indexing/special-tags

A LP externa mix10pro.com.br/lp-v2 não foi editada, pois seu código não consta neste ZIP. Não foi criado Perfil da Empresa Google nem alterada campanha paga. UTMs da LP de revendedores são encaminhadas ao checkout.

## Validação

Veja VALIDACAO-LORDNUTRI.md. Build, TypeScript e lint foram executados. As falhas de testes legados são listadas, sem ocultá-las ou ignorá-las. O uso com banco e pagamento reais requer validação na sua Hostinger após migração e configuração.
