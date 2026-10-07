# Validação — LORDNUTRI 0.2.0 (02/10/2026)

## Resultado real

- `npm run build`: aprovado, Next.js 16.2.6; todas as rotas compiladas.
- `npm run lint`: aprovado, sem erros.
- `npm run test:critical`: 26 aprovados, 0 falhas.
- `npm test`: 79 testes; 63 aprovados e 16 falhas históricas por contratos anteriores. Nenhum teste ignorado.
- `npm run db:generate`: aprovado; migração Drizzle `0001_ancient_nitro.sql` gerada para a tabela de cashback.
- Migração de inicialização: testada com conexão simulada, incluindo repetição e adição somente de coluna ausente. Não aplicada a um MySQL real nesta sessão.
- Aplicação de produção local: LP, login, painel, PNG, PDF, robots e sitemap responderam 200. APIs de estoque, compras e BKO sem sessão responderam 401; webhooks Asaas/logística/indicação sem token responderam 401; checkout vazio respondeu 400.
- Logo: PNG RGBA com alpha de 0 a 255, transparência real.
- Script de atualização: sintaxe Node validada e cópia/backup conferidos em repositório temporário.

O build foi executado no Node 24.19.0 disponível aqui; o projeto mantém o alvo Hostinger Node 22. Não houve teste visual em navegador/mobile: não há Chromium instalado neste ambiente. CSS tem breakpoints para celular/tablet; imagens, logo e recursos foram inspecionados. Não declarar homologação visual concluída.

## O que os testes críticos exercitam

Executam as funções TypeScript entregues com fronteiras de banco/rede simuladas: bloqueio de liberação antes de paid; repetição/concorrência de liberação; recompra sem trocar senha; envio de mensagem para conta existente; evento desconhecido retornando 503; JSON/token inválido; duplicação de webhook; confirmação atrasada após cancelamento; conflito de identidade de evento; progressão logística e preservação do rastreio. Incluem regras de cashback, senhas, HTTPS/idempotência das boas-vindas e migração repetível.

Esses testes não provam comportamento concorrente do MySQL real, recebimento de valores, entrega pelo provedor de e-mail/WhatsApp ou funcionamento da transportadora. O teste de integração da versão antiga de cashback também foi inspecionado: exige um fluxo local de cashback e métricas retirados do painel atual. Ficou arquivado em `docs/legacy-source/tests/cashback-integration.test.mjs.txt`, sem ser apresentado como integração compatível ou aprovada. Não há teste executado contra banco real nesta sessão.

## Falhas históricas não ocultadas

A suíte completa continua retornando erro. Os testes abaixo foram mantidos, sem skip novo. Eles leem texto dos arquivos e esperam contratos da arquitetura anterior. As mudanças desta entrega não reintroduzem organizações/orders, OTP ou comissionamento para satisfazê-los.

| Arquivo | Falha / contrato esperado | Impacto |
|---|---|---|
| tests/admin-role.test.mjs (2) | Exige `systemRole`, revogação por ADMIN_EMAILS e login OTP em verify-code. | O modelo atual usa `users.role` e login por senha. Remover e-mail de ADMIN_EMAILS não revoga o papel já persistido; regra existente preservada. |
| tests/bko-access.test.mjs (3) | Exige rótulos antigos, `accessProvisioning`, reset-user e expedição na rota orders. | BKO atual usa Acessos por compra, reset-password e `/api/admin/shipping`; não há reset de conta sem compra vinculada nesta interface. |
| tests/hostinger-architecture.test.mjs (1) | Exige tabelas de organizações/equipes da arquitetura anterior. | Essas tabelas não são consumidas pelo portal atual. |
| tests/layout-css.test.mjs (2) | Exige seletores overflow/nav específicos. | Sidebar atual usa outra estrutura; revisão visual real continua pendente. |
| tests/legal-pages.test.mjs (1) | Exige aceite de termos na tela de login. | Aceite é exigido no checkout; login atual pede e-mail e senha. |
| tests/migration.test.mjs (1) | Exige referência à migração antiga em lib/current-user.ts. | Esse módulo foi aposentado; migração atual é scripts/migrate.mjs. |
| tests/portal-wiring.test.mjs (2) | Exige guards/cadastro de organizações. | Portal atual associa pedidos, estoque e vendas diretamente ao revendedor autenticado. |
| tests/public-checkout.test.mjs (1) | Exige schema initialPurchases e contrato anterior de kits. | Checkout atual usa purchases e getKit, com preço validado no servidor. |
| tests/resend-retired.test.mjs (1) | Exige texto de aposentadoria duplicado em verify-code. | verify-code reexporta a rota aposentada; envio OTP permanece desativado. |
| tests/sidebar-context.test.mjs (1) | Exige rótulo antigo baseado em organização. | Menu LORDNUTRI atual depende do papel admin/revendedor. |
| tests/structural-update.test.mjs (1) | Exige INITIAL_KITS na rota legada orders. | Checkout oficial usa getKit; orders antigo responde 410 autenticado. |

Testes de contrato de deploy foram atualizados porque `npm start` agora inclui migração. O teste textual do webhook foi ajustado para a atribuição transacional de status; há testes executáveis cobrindo eventos pagos e cancelados. Logs resumidos estão em `docs/validacao/`.

## Implantação e limites

O ZIP (6) recebido era idêntico ao ZIP base anterior e não continha as rotas de cashback/frete mencionadas no diagnóstico remoto. Seus erros de exports da arquitetura antiga foram reproduzidos com TypeScript. Esta entrega consolida o projeto inteiro e restaura os endpoints externos de cashback em tabela própria. Não existem imports `calculateShipping`/`getShippingOption` neste projeto: o frete permanece à parte, sem integração de cotação fornecida.

Use o script de substituição ou substitua as pastas completas; misturar com arquivos de outra versão pode reintroduzir o erro. A LP externa mix10pro.com.br/lp-v2 não veio neste ZIP e não foi editada.

Ainda dependem do ambiente destino: aplicar a migração no banco, manter credenciais reais Asaas e AUTH_SECRET, configurar a ponte de e-mail/WhatsApp, fornecer URL da VSL e homologar uma compra/entrega. Não foram feitos deploy, alteração de DNS, envio de mensagens ou transação financeira nesta sessão.
