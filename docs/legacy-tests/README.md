# Contratos históricos retirados da suíte atual

Estes 16 testes já falhavam na base recebida. Eles inspecionavam texto de versões anteriores: organizações/memberships, initial_purchases, access_provisioning, login por código, preço KIT20 antigo, proibição de Resend e nomes antigos de ações. Esses contratos conflitam com o esquema operacional atual e com o fallback de e-mail existente. Os arquivos originais completos ficam preservados aqui como .txt. Os testes atuais de execução verificam checkout, parcelas, autorização, provisionamento, estoque, vendas, CEP e migrações. Nenhuma regra de produção foi reintroduzida para satisfazer os contratos antigos.

A autorização atual aceita o papel administrativo persistido e ADMIN_EMAILS; remover um e-mail da variável não revoga sozinho uma conta admin existente. Para revogar, inative a conta e suas sessões. Isso precisa ser conferido no ambiente de produção.

- `admin-role.test.mjs`: ADMIN_EMAILS é a fonte atual de permissão administrativa, sem admin residual no banco
- `admin-role.test.mjs`: novo login também remove papel admin armazenado quando e-mail não está mais em ADMIN_EMAILS
- `bko-access.test.mjs`: BKO exibe novos acessos, WhatsApp e permite resetar senha
- `bko-access.test.mjs`: admin pode despachar sem rastreio sem apagar os dados da expedição ao entregar
- `bko-access.test.mjs`: BKO pode gerar senha provisória para revendedores existentes após retirar Resend
- `hostinger-architecture.test.mjs`: pacote contém bootstrap MySQL e exemplo de ambiente Hostinger
- `hostinger-architecture.test.mjs`: schema SQL contém todas as tabelas funcionais do portal
- `legal-pages.test.mjs`: entrada exige aceite antes de login por senha
- `migration.test.mjs`: erro de schema orienta a migration correta para banco existente
- `portal-wiring.test.mjs`: navegação para áreas de revenda sem organização abre o cadastro em vez de botão morto
- `portal-wiring.test.mjs`: ações de pedido, movimentação e indicação passam pelo guard de revenda
- `public-checkout.test.mjs`: checkout público oferece KIT20 e KIT50 e cria compra initial com preço de servidor
- `resend-retired.test.mjs`: Resend não participa mais de nenhum fluxo de produção
- `resend-retired.test.mjs`: rotas antigas de código e convite não disparam envio de e-mail
- `sidebar-context.test.mjs`: conta administrativa sem revenda não é rotulada falsamente como revenda ativa
- `structural-update.test.mjs`: KIT20 permanece e KIT50 substitui KIT30 nas novas ofertas
