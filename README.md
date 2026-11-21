# LORD NUTRI · Plataforma de revendedores e influenciadores

Projeto completo para GitHub e Hostinger. O site usa Next.js, Node 22 e MySQL/MariaDB. A landing, os checkouts, as APIs, as migrações, as mídias e os materiais privados estão incluídos. Para publicar no Windows, siga [o passo a passo do GitHub Desktop](COMO-SUBIR-NO-GITHUB.md).

## Acessos

| Perfil | Endereço após o deploy | O que a conta pode fazer |
| --- | --- | --- |
| Administração BKO | `/bko` | Gerenciar revendedores, influenciadores, pedidos, expedição, acessos, materiais e integrações. |
| Revendedor | `/revendedor` | Consultar Visão geral, Estoque, Vendas, Manual do Revendedor, reposições e Meus Pedidos. |
| Influenciador | `/influenciador` | Aceitar os termos, divulgar sua campanha e consultar suas conversões, vendas e cashback. |

O login geral em `/entrar` identifica o perfil pela conta autenticada. Os endereços antigos `/painel` e `/minhas-indicacoes` encaminham para a área correspondente. O revendedor recebe acesso pelo fluxo do kit. O BKO cria o convite do influenciador. As páginas `/c/[código]` e `/v/[código]` são links comerciais individuais. O vídeo de boas-vindas pode usar `VSL_VIDEO_URL`, por exemplo `/videos/vsl-mix10.mp4`.

## Verificar a conta Asaas

1. No hPanel, preserve a configuração atual de banco e autenticação. Para consultar a conta real, use `ASAAS_ENVIRONMENT=production`, a `ASAAS_API_KEY` dessa conta e `ASAAS_WEBHOOK_TOKEN`. Em testes do provedor, use `sandbox` com as respectivas credenciais. Nunca copie essas chaves para o GitHub.
2. Preencha `NEXT_PUBLIC_APP_URL` com a origem HTTPS do site, antes do build. Na conta Asaas correspondente, confira os **dois webhooks existentes**. Cada URL é o domínio publicado seguido do caminho da tabela. Use o mesmo token de webhook do servidor nas duas configurações.

   | Canal | Caminho para receber eventos |
   | --- | --- |
   | Revendedores e reposições | `/api/billing/revendedores/webhook` |
   | Vendas unitárias dos influenciadores | `/api/billing/influenciadores/webhook` |

   Eventos tratados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_DELETED`, `PAYMENT_RECEIVED_IN_CASH_UNDONE` e `PAYMENT_CHARGEBACK_REQUESTED`. A rota geral histórica `/api/billing/webhook` continua atendendo os dois canais. Se a conta já usa os dois canais, criar uma terceira fila é desnecessário.

3. Entre em **BKO → Integrações → Verificar conexões**. O diagnóstico consulta a API de cobranças e a configuração dos webhooks sem criar cobrança. A tela mostra o ambiente consultado, o resultado da leitura, os eventos faltantes, o estado das filas e a data da última confirmação recebida por canal no banco local. A consulta das filas requer permissão de leitura de webhooks na chave Asaas. Se não houver essa permissão, consulte o painel do provedor.
4. Para confirmar o ciclo **em produção**, escolha um pedido real já pago. Compare número, valor e ID da cobrança com o Asaas. Em **Logs de Webhooks** procure a entrega para a URL correta e a resposta HTTP 200. No BKO confira o mesmo pedido como pago e, conforme o canal, o estoque do revendedor ou a venda atribuída à campanha. Um webhook de outro canal pode responder 200 e ser ignorado. O histórico local pode incluir eventos anteriores à troca de ambiente.
5. Se uma cobrança já paga estiver pendente no BKO, use **Acessos e Pedidos → Sincronizar** e informe o pedido correspondente. Essa operação consulta e concilia a cobrança. Em **Integrações**, a verificação é somente de leitura.

## Ativar o rastreio automático dos Correios

1. Na Hostinger configure `CORREIOS_USUARIO`, `CORREIOS_CODIGO_ACESSO` (código de acesso às APIs gerado no CWS) e `CORREIOS_CONTRATO`. `CORREIOS_DR` é opcional. Use um contrato autorizado para a API Rastro e um objeto vinculado a ele.
2. Gere um segredo aleatório de pelo menos 32 caracteres. No Windows com Node instalado, `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` gera um valor local. Configure **o mesmo valor** como `CORREIOS_CRON_TOKEN` na Hostinger e no GitHub em **Settings → Secrets and variables → Actions → Secrets**. Em **Variables**, crie `PORTAL_URL` com a origem HTTPS definitiva. A chave Asaas e as credenciais dos Correios ficam apenas na hospedagem.
3. No BKO, em **Expedição**, abra **Em percurso** em um pedido pago, informe **Correios** e cole o código de 13 caracteres da etiqueta. Para corrigir um código em percurso, abra esse mesmo botão novamente. O código vem da postagem.
4. Depois do deploy, confirme que **Actions** está habilitado e que `.github/workflows/correios.yml` está na branch padrão. Em **Actions → Rastreio Correios → Run workflow**, execute a primeira consulta. As próximas estão programadas para os minutos 17 e 47 de cada hora. O GitHub pode atrasar uma execução.
5. Em **BKO → Integrações**, confira horário e contagem da execução. Com um código no campo de teste você também pode consultar o objeto diretamente, sem alterar o pedido. O revendedor vê o evento gravado e a data da consulta em **Meus Pedidos**. Quando os Correios informam entrega ao destinatário, o pedido avança para **Entregue**.

Cada execução prioriza os 12 pedidos há mais tempo sem consulta, incluindo os novos. São elegíveis pedidos pagos em separação ou percurso, com código postal válido e transportadora Correios, PAC, SEDEX ou em branco. Pedidos entregues deixam a fila. Eventos de tentativa, devolução ou pré-postagem mostram a descrição recebida. A ausência de eventos, a troca de etiqueta e uma falha temporária da API preservam a consistência do pedido. Uma encomenda sem código precisa do cadastro da etiqueta no BKO.

## Verificações desta entrega

Build Next.js com TypeScript aprovado no Node 22.23.5. Os 368 testes automatizados passaram. No Chromium, foram conferidos o login de cada perfil, o diagnóstico do BKO, o evento de entrega em Meus Pedidos e o cashback do influenciador. Também foi usado um servidor MariaDB local isolado com checkout PIX de kit, cartão para campanha, recebimento duplicado de webhook, controle de acesso dos três perfis, entrada única de estoque, cashback, agendador e leitura do evento pelo revendedor. As respostas do Asaas, dos Correios e do serviço de CEP foram simuladas nessa verificação. O acesso às contas de produção, o disparo pelo GitHub Actions e a confirmação de um objeto real precisam ser verificados após configurar o ambiente.

A página inicial e seus textos foram preservados do ZIP de 21/11. A referência visual dos testes da landing foi atualizada com HTML renderizado de uma extração independente desse original. O texto padrão de notificação do produto nessa versão difere do que consta na referência de 1.8.0. A conferência do número regulatório fica com o titular. O lint geral ainda aponta ocorrências em código anterior, incluindo o servidor Vite legado. O fluxo de produção usa Next.js.

Documentação oficial: [webhooks Asaas](https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook), [logs de entrega Asaas](https://docs.asaas.com/docs/logs-de-webhooks), [API Token dos Correios](https://www.correios.com.br/atendimento/developers/manuais/manual-uso-da-api-token), [API Rastro dos Correios](https://www.correios.com.br/atendimento/developers/) e [agendamento do GitHub Actions](https://docs.github.com/pt/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
