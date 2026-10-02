# Validação da atualização LORDNUTRI

## Resultado atual

- npm run build: PASSOU, compilação de produção e geração de páginas concluídas.
- npx tsc --noEmit: PASSOU.
- npm run lint: PASSOU, sem erros ou avisos de lint (há apenas aviso do npm sobre configuração de proxy do ambiente).
- 18 testes focados em acompanhamento, boas-vindas, contratos de acesso/pagamento, LP e BKO: 18 passaram.
- npm test completo: 62 testes; 46 passaram, 16 falharam. A suíte inteira NÃO está verde. Falhas listadas abaixo; nenhuma regra de TypeScript/lint ou teste foi desativada.
- npm run db:generate: PASSOU, gerou drizzle-mysql/0000_abandoned_nick_fury.sql e snapshot inicial do schema atual. Esse SQL completo serve como baseline de instalação NOVA; em banco existente, use SOMENTE database/migrations/2026-10-01-lordnutri-welcome.sql.
- Migração remota: NÃO aplicada; não há acesso ao banco da Hostinger nesta sessão.

## Verificação HTTP da versão compilada

Servidor Next em produção iniciado localmente:

- LP: HTTP 200, programa LORDNUTRI e calculadora presentes.
- Logo PNG, PDF incluído, robots.txt e sitemap.xml: HTTP 200.
- /api/my-purchases, /api/admin/overview, /api/admin/access, /api/admin/orders e /api/admin/welcome sem sessão: HTTP 401.
- Webhooks Asaas e logística sem token: HTTP 401.

Esses checks não validam pagamento bancário, estoque em MySQL real, entrega de mensagens ou papel/permissões com usuários reais. Eles exigem o banco migrado e integrações configuradas na instalação destino.

## Limitações visuais

Logo inspecionada como PNG RGBA com transparência real. Fotos fornecidas inseridas na seção do produto. CSS adaptado para celular/tablet/desktop, sem declarar validação visual concluída: o navegador de captura não estava disponível, e sua instalação não pôde ser baixada no ambiente. Revisar visualmente em 360/390/768/1440 px na Hostinger.

## Falhas ainda presentes na suíte histórica

A suíte do ZIP já tinha 14 falhas e misturava contratos de duas versões. A atualização remove módulos abandonados incompatíveis com o schema atual, o que invalida também verificações antigas por texto/import de arquivos. As falhas de contratos antigos continuam abaixo, sem serem ocultadas. Falha num teste de texto não comprova o comportamento em banco real; também não substitui um teste de integração.

| Arquivo | Teste / erro | Impacto |
|---|---|---|
| tests/admin-role.test.mjs | ADMIN_EMAILS é a fonte atual de permissão administrativa, sem admin residual no banco; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/admin-role.test.mjs | novo login também remove papel admin armazenado quando e-mail não está mais em ADMIN_EMAILS; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/bko-access.test.mjs | BKO exibe novos acessos, WhatsApp e permite resetar senha; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/bko-access.test.mjs | admin pode despachar sem rastreio sem apagar os dados da expedição ao entregar; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/bko-access.test.mjs | BKO pode gerar senha provisória para revendedores existentes após retirar Resend; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/hostinger-architecture.test.mjs | schema SQL contém todas as tabelas funcionais do portal; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/layout-css.test.mjs | layout do portal não cria corte horizontal que interfere no sticky; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/layout-css.test.mjs | menu lateral mantém cabeçalho e saída visíveis e rola somente a navegação; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/legal-pages.test.mjs | entrada exige aceite antes de login por senha; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/migration.test.mjs | erro de schema orienta a migration correta para banco existente; Verificação de módulo aposentado / arquivo ou conteúdo antigo ausente | npm test termina com erro; revisão do teste histórico necessária. |
| tests/portal-wiring.test.mjs | navegação para áreas de revenda sem organização abre o cadastro em vez de botão morto; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/portal-wiring.test.mjs | ações de pedido, movimentação e indicação passam pelo guard de revenda; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/public-checkout.test.mjs | checkout público oferece KIT20 e KIT50 e cria compra initial com preço de servidor; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/resend-retired.test.mjs | rotas antigas de código e convite não disparam envio de e-mail; Verificação de módulo aposentado / arquivo ou conteúdo antigo ausente | npm test termina com erro; revisão do teste histórico necessária. |
| tests/sidebar-context.test.mjs | conta administrativa sem revenda não é rotulada falsamente como revenda ativa; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |
| tests/structural-update.test.mjs | KIT20 permanece e KIT50 substitui KIT30 nas novas ofertas; Contrato antigo / assertion de código-fonte não satisfeito | npm test termina com erro; revisão do teste histórico necessária. |

## Correções dos bloqueios originais

A compilação original falhava em app/api/admin/orders, auth/verify-code, manual/progress, movements, onboarding, orders, shipping/webhook, team e lib/access-provisioning, current-user, shipping, pois importavam tabelas ou funções inexistentes. O código original desses módulos foi preservado em docs/legacy-source quando aposentado. As rotas efetivamente usadas agora dependem do schema purchases/reseller_profiles, sem criar uma arquitetura de organizações paralela.

O checkout antigo /comprar usava contrato de resposta e preço divergentes; passou a compartilhar o checkout oficial da LP. Erros de lint em links e initialization do kit foram corrigidos.

## Dependências para funcionar em produção

1. Executar SQL aditivo uma única vez antes do deploy.
2. Manter configurações Asaas, banco e AUTH_SECRET atuais.
3. Configurar vídeo/PDF conforme ATUALIZACAO-LORDNUTRI.md.
4. Conectar WELCOME_AUTOMATION_URL/TOKEN ao serviço que efetivamente envia e-mail e WhatsApp e respeita Idempotency-Key. Não há envio real validado sem esse serviço.
5. Validar compra controlada, callback Asaas, entrada única de estoque, acesso, primeiro login, boas-vindas e atualização de entrega. Publicar o código não confirma esses resultados por si só.

## Revisão do ZIP (5) / correção de upload

ZIP (5) comparado arquivo a arquivo: idêntico ao ZIP original (4). A atualização LORDNUTRI não constava nessa cópia.
Os cinco endpoints antigos e duas bibliotecas que antes precisavam ser apagados agora têm arquivos de substituição explícitos, para o upload do GitHub sobrescrevê-los. A versão no package.json é 0.1.1-lordnutri-buildfix.
Build, lint e TypeScript foram executados novamente e passaram. Suíte completa: 62 testes, 46 passaram e as mesmas 16 falhas históricas listadas acima permaneceram.
