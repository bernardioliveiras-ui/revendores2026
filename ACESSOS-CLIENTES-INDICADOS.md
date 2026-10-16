# LORD NUTRI — Acessos de clientes indicados

## Hostinger / deploy
- Ambiente: Node.js 22, Next.js, MySQL existente (DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_SSL).
- Configurar **NEXT_PUBLIC_APP_URL** com a URL pública HTTPS do portal, **AUTH_SECRET** (mín. 32 caracteres), **RESEND_API_KEY** e **WELCOME_EMAIL_FROM** (remetente verificado no Resend). Essas variáveis já aparecem em `.env.example`.
- **Não compartilhe segredos por chat ou código**. Configure-os em Hostinger > aplicação > variáveis de ambiente; replique apenas os nomes necessários, sem valores, no repositório.
- Deploy: `npm run build` e `npm start`. O start executa migrações aditivas `scripts/migrate.mjs`; as novas rotas também incluem fallback aditivo caso o host use diretamente `next start`. Não apagar tabelas.
- O projeto usa o MySQL da Hostinger para as indicações e comprovantes (`indicated_clients`, `indicated_invitations`, `indicated_receipts`). Comprovantes têm acesso privado por sessão, não são hospedados em `public/`.
- Limites da plataforma (upload/requisição, envio de e-mail) devem comportar 8 MB + multipart. Ajustar no provedor se necessário, sem afrouxar validações do aplicativo.

## Papéis e operação
- **Revendedor**: continua exclusivamente no fluxo de compra paga Asaas da LP, sem alterações nos webhooks e provisionamento. O BKO usa a aba antiga “Revendedores” para as ações existentes.
- **Cliente indicado**: nova aba “Acessos” no BKO. O BKO informa nome, e-mail, telefone, canal e responsável. Cada registro `indicated_clients` aponta, por `client_user_id` único, para um usuário somente com role `client_indicated`; não se cria `reseller_profile` nem se libera compra.
- O cliente recebe e-mail com URL de ativação (token aleatório de 256 bits, hash SHA-256 no banco, prazo de 24h, uso único). Define a própria senha; o BKO nunca recebe senha ou token. Reenvio disponível ao BKO, e desativação revoga sessões e convites pendentes.
- URL do cliente: `/minha-indicacao`. Confirmação de nome e telefone, download do próprio comprovante, reenvio do próprio arquivo e consulta à conferência. Link de compra: https://mix10pro.com.br/lp-v2.
- O cliente envia PDF, JPG ou PNG até 8 MB. MIME é conferido por assinatura binária. O arquivo privado é guardado como BLOB no MySQL; apenas o comprovante atual é baixável e os antigos permanecem como histórico privado.
- O BKO acessa somente `/api/admin/indicated` e `/api/indicated/receipt` sob role admin; revisão PENDENTE/APROVADO/REJEITADO, com orientação obrigatória na rejeição. Só após APROVADO pode marcar status COMPROU manualmente.
- Cashback do cliente indicado é opcional e manual (valor em centavos, sem cálculo ou pagamento), com estados PENDENTE, LIBERADO, PAGO. Isso é separado dos cashbacks existentes de revendedor.

## Migração e implantação
Não foram usadas credenciais reais da Hostinger nesta cópia. Executar a migração aditiva em um backup/homologação antes de produção, conferir políticas de backup e permissões de CREATE TABLE/ALTER TABLE do usuário MySQL, e então publicar. A implantação de produção e o envio real de e-mails exigem acesso às configurações da sua Hostinger e da conta Resend.

## Validação desta entrega (16/10/2026)
- 212 testes de Node executados com sucesso, sem falhas, incluindo 9 testes novos: cadastro com role restrito, regras de COMPROU, conferência/rejeição, desativação, isolamento de clientes, download privado, assinatura de arquivos, upload e token de ativação.
- Sintaxe/transpilação dos arquivos TypeScript/TSX novos e integrados validada com TypeScript.
- A suíte completa inclui `tests/landing-static-runtime.test.mjs`, que não pôde iniciar aqui porque React/React DOM não foram instalados; `npm ci` não concluiu devido a indisponibilidade das dependências. Por isso `npm run build` e `npm run lint` completos não foram validados neste ambiente. Executá-los no CI/Hostinger antes de publicar.
- Sem conexão à Hostinger, nenhuma migração de produção foi aplicada e nenhum convite ou comprovante real foi testado contra MySQL/Resend. Os testes de rotas usaram bancos simulados; valide em homologação o limite de uploads e o remetente do e-mail antes de liberar aos clientes.
