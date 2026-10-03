# LORDNUTRI — projeto completo 0.2.0

Este pacote reúne a LP LORDNUTRI, BKO e portal do revendedor na mesma base Next.js + Drizzle/MySQL. Os preços KIT20/KIT50 e o Asaas existente foram preservados.

## Publicar sem misturar versões

1. Extraia este ZIP em uma pasta nova, fora do repositório.
2. Abra a cópia local do repositório correto no GitHub Desktop. Confira a branch vinculada à Hostinger.
3. No terminal da pasta extraída, execute:

   `node APLICAR-ATUALIZACAO.mjs "C:\caminho\do\repositorio"`

   Requer Node 22. O script substitui as pastas do projeto por inteiro, guarda os arquivos anteriores em um backup ao lado do repositório e preserva `.git` e `.env`. Não faz commit nem publica.
4. No GitHub Desktop, confira as alterações, faça **Commit to [sua branch]** e **Push origin**.
5. Na Hostinger: raiz do projeto onde está `package.json`, Node 22, instalação `npm ci`, build `npm run build`, inicialização `npm start`.
6. Mantenha as variáveis existentes de banco, `AUTH_SECRET`, administração e Asaas. **Não substitua pelas sugestões vazias do `.env.example`.**
7. Inicie a nova compilação na Hostinger e confira o log. A versão do `package.json` deve ser `0.2.0-lordnutri`.

O ZIP é o projeto completo, não um patch. Enviar apenas alguns arquivos pelo navegador pode manter rotas antigas com imports inexistentes. Não coloque a pasta LORDNUTRI dentro de outra raiz Next.js.

## Banco

`npm start` roda a migração aditiva antes de iniciar o Next. Ela cria tabelas faltantes, adiciona os campos de boas-vindas e completa a tabela de cashback. Pode ser repetida e não exclui dados. O usuário MySQL precisa de CREATE/ALTER. Faça backup do banco antes da primeira implantação.

Se sua hospedagem separa migração e inicialização, rode `npm run db:migrate` e depois `npm run start:app`. A migração foi gerada e testada com simulador de conexão; **não foi aplicada ao seu banco remoto neste atendimento**.

Não execute migrations antigas de organizações nem o arquivo inicial Drizzle contra um banco já existente. O caminho desta versão é `scripts/migrate.mjs`.

## O que precisa estar conectado

- **Asaas:** preserve `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT=production` e `ASAAS_WEBHOOK_TOKEN`. Webhook POST em `/api/billing/webhook`, cabeçalho `asaas-access-token`. Pagamento confirmado libera conta e estoque; reenvio conclui etapas pendentes sem duplicá-los.
- **E-mail e WhatsApp:** configure `WELCOME_AUTOMATION_URL` e `WELCOME_AUTOMATION_TOKEN` para sua automação real. O ZIP não trouxe o provedor ou seu fluxo de envio. Veja `AUTOMACOES.md`. Sem essa conexão, a conta e o estoque são criados, mas as mensagens ficam pendentes no BKO.
- **Vídeo:** configure `VSL_VIDEO_URL` com o MP4 publicado (por exemplo `/videos/vsl-mix10.mp4`) ou `VSL_EMBED_URL` com o player YouTube/Vimeo. Nenhum vídeo LORDNUTRI foi fornecido; aparece a apresentação da marca até configurar.
- **Manual:** usa o PDF incluído. `RESELLER_MANUAL_URL` permite substituir pelo PDF LORDNUTRI atualizado.
- **Entrega:** BKO > Expedição atualiza Separação → Em percurso → Entregue. Um sistema externo também pode chamar `/api/shipping/webhook` com `SHIPPING_WEBHOOK_TOKEN`.
- **Frete:** a base recebida cobra apenas os produtos e informa frete à parte. Não há integração de cotação por CEP neste pacote; não foi inventado preço de frete nem alterada a cobrança Asaas.

## Conferência após publicar

Abra LP e login no celular, entre no BKO, confirme uma compra de teste em ambiente apropriado e confira conta, estoque, mensagem e entrega. Build local não comprova recebimento de dinheiro ou envio de mensagens no provedor real.

Os resultados e limitações estão em `VALIDACAO-LORDNUTRI.md`.

Pagamentos com referência externa que não corresponde a uma compra deste portal são ignorados pelo webhook local; a qualificação de indicação externa usa sua API própria. Compra local aguardando vínculo ao pagamento retorna 503 para reenvio.


## Checkout restaurado (0.2.1)
- Frete calculado por CEP antes do pagamento.
- Entrega Econômica e Expressa conforme tabela comercial recuperada.
- PIX à vista.
- Cartão de 1x a 6x.
- 1x sem taxa; de 2x a 6x, taxa de 2,99% a.m. pela Tabela Price, preservando a regra do checkout anterior.
- Produto, frete, taxa e total final são recalculados no backend; o navegador não define preço.
- Build da Hostinger usa `next build --webpack` para evitar o panic do Turbopack observado no Next 16.2.6.

## 0.2.1 consolidada - configuração obrigatória para automação total
Para o fluxo ficar automático em produção, configure na Hostinger:
1. `ASAAS_API_KEY` e `ASAAS_ENVIRONMENT=production` somente após validar no sandbox.
2. `ASAAS_WEBHOOK_TOKEN` e, no Asaas, aponte o webhook para `/api/billing/webhook` usando o mesmo token.
3. `RESEND_API_KEY` e `WELCOME_EMAIL_FROM` para boas-vindas/acesso e e-mails de andamento do pedido.
4. `NEXT_PUBLIC_APP_URL` com a URL final do portal.
5. Opcional: `WELCOME_AUTOMATION_URL/TOKEN` para uma ponte de e-mail + WhatsApp e `SHIPPING_WEBHOOK_TOKEN` para integração logística externa.

A reposição do revendedor está em Estoque: ele escolhe kit/frete/pagamento, segue ao Asaas e, depois da confirmação do webhook, as caixas entram no estoque sem recriar a conta.
