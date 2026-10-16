# LORD NUTRI — Acessos de clientes indicados

## Hostinger / deploy
- Ambiente: Node.js 22, Next.js, MySQL existente (DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_SSL).
- Para autenticação, manter **AUTH_SECRET** (mín. 32 caracteres) e variáveis **DATABASE_*** da Hostinger. **RESEND_API_KEY**, **WELCOME_EMAIL_FROM** e **NEXT_PUBLIC_APP_URL** NÃO são necessários para a geração manual dos acessos de clientes indicados. Não retire essas variáveis se outros módulos já as usam (por exemplo, avisos de revendedores).
- **Não compartilhe segredos por chat ou código**. Configure-os em Hostinger > aplicação > variáveis de ambiente; replique apenas os nomes necessários, sem valores, no repositório.
- Deploy: `npm run build` e `npm start`. O start executa migrações aditivas `scripts/migrate.mjs`; as novas rotas também incluem fallback aditivo caso o host use diretamente `next start`. Não apagar tabelas.
- O projeto usa o MySQL da Hostinger para as indicações e comprovantes (`indicated_clients`, `indicated_invitations`, `indicated_receipts`). Comprovantes têm acesso privado por sessão, não são hospedados em `public/`.
- Limites da plataforma (upload/requisição, envio de e-mail) devem comportar 8 MB + multipart. Ajustar no provedor se necessário, sem afrouxar validações do aplicativo.

## Papéis e operação
- **Revendedor**: continua exclusivamente no fluxo de compra paga Asaas da LP, sem alterações nos webhooks e provisionamento. O BKO usa a aba antiga “Revendedores” para as ações existentes.
- **Cliente indicado**: nova aba “Acessos” no BKO. O BKO informa nome, e-mail, telefone, canal e responsável. Cada registro `indicated_clients` aponta, por `client_user_id` único, para um usuário somente com role `client_indicated`; não se cria `reseller_profile` nem se libera compra.
- Ao cadastrar, o BKO recebe **somente uma vez** um link de ativação para encaminhar diretamente ao cliente (por exemplo, WhatsApp privado). Não há e-mail automático nem senha provisória. O link inclui token aleatório de 256 bits, cujo hash SHA-256 fica no banco; expira em 24h e pode ser usado uma única vez. O BKO vê o link apenas no momento da geração; não pode consultar tokens antigos. O cliente define a própria senha. Gerar novo link invalida os anteriores ainda não usados; desativar o acesso revoga sessões e links pendentes.
- **Via PowerShell:** no Windows, execute `scripts/criar-cliente-indicado.ps1` apontando `-BaseUrl` para o domínio HTTPS do portal e informando `-Nome`, `-Email`, `-Telefone`, `-Canal`, `-Responsavel`. O script solicita as credenciais do BKO interativamente, usa a autenticação/sessão existente e retorna o link na tela. Para um cadastro existente, use `-IndicationId`. Execute num terminal privado, sem `Start-Transcript`; não salve senhas nem links em arquivos. PowerShell não conecta diretamente ao MySQL da Hostinger.

```powershell
.\scripts\criar-cliente-indicado.ps1 `
  -BaseUrl "https://SEU-PAINEL.com.br" `
  -Nome "Maria Silva" -Email "maria@exemplo.com" `
  -Telefone "11999999999" -Canal "WhatsApp" -Responsavel "BKO"
```

- Se o Windows bloquear o script por política local, use `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\criar-cliente-indicado.ps1 ...` apenas para este comando, depois de conferir a origem do arquivo; não altere a política de execução global. O usuário que roda o script precisa ter login BKO/Admin. **Não use credenciais ou APIs do Asaas.**
- URL do cliente: `/minha-indicacao`. Confirmação de nome e telefone, download do próprio comprovante, reenvio do próprio arquivo e consulta à conferência. Link de compra: https://mix10pro.com.br/lp-v2.
- O cliente envia PDF, JPG ou PNG até 8 MB. MIME é conferido por assinatura binária. O arquivo privado é guardado como BLOB no MySQL; apenas o comprovante atual é baixável e os antigos permanecem como histórico privado.
- O BKO acessa somente `/api/admin/indicated` e `/api/indicated/receipt` sob role admin; revisão PENDENTE/APROVADO/REJEITADO, com orientação obrigatória na rejeição. Só após APROVADO pode marcar status COMPROU manualmente.
- Cashback do cliente indicado é opcional e manual (valor em centavos, sem cálculo ou pagamento), com estados PENDENTE, LIBERADO, PAGO. Isso é separado dos cashbacks existentes de revendedor.

## Migração e implantação
Não foram usadas credenciais reais da Hostinger nesta cópia. Executar a migração aditiva em um backup/homologação antes de produção, conferir políticas de backup e permissões de CREATE TABLE/ALTER TABLE do usuário MySQL, e então publicar. A implantação de produção e o envio real de e-mails exigem acesso às configurações da sua Hostinger e da conta Resend.

## Validação desta entrega (16/10/2026)
- Na entrega inicial, 212 testes de Node foram executados com sucesso, incluindo os testes de cadastro com role restrito, regras de COMPROU, conferência/rejeição, desativação, isolamento, download privado, upload e token de ativação. Na atualização PowerShell, **216 testes passaram**; um teste de renderização da LP não pôde iniciar por ausência das dependências React neste ambiente.
- Sintaxe/transpilação dos arquivos TypeScript/TSX novos e integrados validada com TypeScript.
- A suíte completa inclui `tests/landing-static-runtime.test.mjs`, que não pôde iniciar aqui porque React/React DOM não foram instalados; `npm ci` não concluiu devido a indisponibilidade das dependências. Por isso `npm run build` e `npm run lint` completos não foram validados neste ambiente. Executá-los no CI/Hostinger antes de publicar.
- Sem conexão à Hostinger, nenhuma migração de produção foi aplicada e nenhum convite ou comprovante real foi testado contra MySQL. Os testes de rotas usaram bancos simulados; valide em homologação os links via PowerShell e BKO e o limite de uploads antes de liberar aos clientes.

## Atualização — 16/10/2026: sem Resend para indicações
- O fluxo do cliente indicado é agora **manual** (BKO ou PowerShell). A API de cadastro `POST /api/admin/indicated` devolve `activationPath` e `expiresAt` para **administradores autenticados**. O comando PowerShell faz login, cadastra e imprime um link HTTPS; somente o hash do token fica no banco.
- A rota `POST /api/admin/indicated/invite` gera **novo** link e invalida qualquer convite anterior não utilizado. Links nunca são enviados automaticamente. Se o cliente já ativou a conta, o novo link também permite definir outra senha; ao utilizá-lo, as sessões anteriores serão revogadas.
- O envio do link é responsabilidade do operador BKO, por canal privado. HTTPS é necessário na implantação. O cliente escolhe a senha na página `/ativar-cliente`, não recebe senha por mensagem.
- Não foram alterados o provisionamento, os webhooks ou a contabilidade do Asaas. Os valores de cashback dos indicados continuam manuais e isolados dos revendedores.
