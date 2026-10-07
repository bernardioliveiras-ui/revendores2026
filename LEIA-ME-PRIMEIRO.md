# LORD NUTRI — revisão final 0.2.5

Projeto completo: LP, checkout, portal, BKO, manual e correções de automação.

## Aplicar a atualização

1. Extraia o ZIP em uma pasta nova, fora do repositório atual.
2. Na pasta extraída, execute com Node 22:

   `node APLICAR-REVISAO-FINAL.mjs "C:\caminho\do\repositorio"`

   O destino precisa ser o repositório do projeto `mix10-pro-revendedores`. O script faz backup do código anterior ao lado do repositório e preserva `.git`, `.env` e `.env.local`. Não publica nem faz commit.
3. Revise as alterações no GitHub Desktop, faça commit e push na branch vinculada à Hostinger.
4. Na Hostinger: Node 22, instalação `npm ci`, compilação `npm run build`, inicialização `npm start`. O start executa a migração aditiva com `scripts/migrate.mjs`. Se a hospedagem separar as etapas, execute `npm run db:migrate` antes de `npm run start:app`.
5. Preserve suas variáveis atuais. Não copie valores vazios do `.env.example` sobre credenciais existentes.
6. Confira que a versão publicada é `0.2.5-lordnutri-marca-beneficios`.

Use a atualização completa para receber as correções de automação. `APLICAR-LAYOUT-MANUAL.mjs` também aplica a atualização completa, pois o manual precisa da nova rota protegida.

## Banco e credenciais

A migração acrescenta `asaas_installment_id` à tabela de compras, sem apagar dados. O usuário MySQL precisa das permissões necessárias para CREATE/ALTER. Guarde um backup do banco antes de aplicar em produção. Não rode migrations históricas de organizações sobre esta versão.

Confirme na hospedagem: banco MySQL, `AUTH_SECRET` com pelo menos 32 caracteres, `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL`, `ASAAS_API_KEY`, ambiente Asaas e `ASAAS_WEBHOOK_TOKEN`. Se o BKO for criado pela primeira vez, configure `ADMIN_BOOTSTRAP_PASSWORD` e troque a senha no primeiro acesso.

Webhook Asaas: POST `/api/billing/webhook`, autenticado pelo cabeçalho `asaas-access-token`. Configure confirmação, recebimento, estorno, exclusão e chargeback conforme os eventos usados pela operação. Use sandbox para validar antes de trocar chave e ambiente para produção.

Boas-vindas: configure a ponte `WELCOME_AUTOMATION_URL` + `WELCOME_AUTOMATION_TOKEN` para e-mail e WhatsApp, ou `RESEND_API_KEY` + `WELCOME_EMAIL_FROM` para o fallback de e-mail. O fallback não envia WhatsApp. Se nenhum provedor estiver conectado, o envio fica pendente no BKO.

Entrega: o BKO atualiza a expedição. Um sistema logístico externo pode enviar atualizações a `/api/shipping/webhook` usando `x-shipping-token` e `SHIPPING_WEBHOOK_TOKEN`. O projeto não cria etiquetas, agenda coleta ou recebe dados de transportadora sem essa integração.

## Verificações

- `npm test`: suíte atual.
- `npm run test:launch`: testes de execução dos fluxos de compra, CEP, estoque, vendas, webhooks e autorização.
- `npm run check:readiness`: diagnóstico sem imprimir credenciais e sem fazer cobranças.
- `npm run build`: compilação de produção.

O diagnóstico verifica apenas a configuração. Não comprova conexão, pagamento, entrega ou envio de mensagens reais.

Leia `REVISAO-FINAL-TRAFEGO.md` antes de ativar campanhas. O ZIP foi validado localmente; não foi publicado neste atendimento.

## Manual exclusivo e última revisão

O manual está em `private/manual`, fora de `public`, e só é servido a usuários autenticados com kit pago e acesso liberado. O BKO pode conferi-lo. O arquivo não deve ser enviado a serviços de arquivos públicos nem recolocado em `public`. O build limpa cópias públicas antigas e endereços legados passam pela autorização. O card dos R$ 10 mil ganhou animação suave; a seção de produto inclui ativos, uso, conservação e cuidados. LORD NUTRI usa dourado; MIX10 PRO usa branco e verde com tipografia de destaque.


Atualização 04/10: abertura sem logo central duplicada, frase e CTA ampliados, cards com flutuação suave. Manual privado revisado com escrita preservada, dados técnicos atualizados e páginas sobre pessoas próximas, fechamento e construção da revenda.


Última atualização: prioridade de leitura no celular e público 40+. Primeiro bloco com meta de faturamento; confiança na marca e benefícios do suplemento antes dos cálculos. Valores dos kits, fórmulas comerciais e manual privado preservados. Consulte a revisão e as evidências em `docs/validacao`.
