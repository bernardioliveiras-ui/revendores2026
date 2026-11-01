# LORD NUTRI — Revisão pré-lançamento v2.7 (1º de novembro de 2026)

## Estado do trabalho

Esta atualização foi construída a partir do pacote completo v2.6. NÃO foi publicada no domínio e NÃO acessou ou alterou o banco da Hostinger. Não representa homologação de produção nem garantia de operação 100%.

### Exatamente três perfis operacionais

| Perfil | Login | Páginas | Ações próprias |
|---|---|---|---|
| ADMIN/BKO (`admin`) | E-mail e senha | `/painel` | Revendedores, pedidos, liberação de acessos, WhatsApp/e-mail manual de boas-vindas, CRM, campanhas, cashback, termos, expedição |
| REVENDEDOR (`reseller`) | E-mail e senha | `/painel` | Estoque, vendas, reposição, manual e acompanhamento |
| INFLUENCIADOR (`indicator`) | Convite de 24 h; senha e termo | `/ativar-indicador`, `/minhas-indicacoes` | Link único de campanha, histórico de compras verificadas e cashback |

### Funcionalidades aposentadas

- `client_indicated` não autentica em novos logins nem em sessões já emitidas: acesso antigo está bloqueado **sem apagar históricos**.
- Removidos os endpoints de cadastro, consulta, comprovante e ativação de cliente indicado e a antiga área individual `minha-indicacao`.
- Removidas as antigas APIs de leads/comprovantes e a rota `/i/[code]` de influenciadores; vendas são vinculadas apenas à campanha e verificadas pelo Asaas.
- Removida a aba “Registros antigos” do CRM Seller.
- A rota antiga `/ativar-cliente?token=...` faz somente redirecionamento ao novo formulário `/ativar-indicador`; o backend novo confere **role `indicator` + perfil + token válido**. Convites antigos de clientes indicados não funcionam.
- A tabela `indicated_invitations` continua como armazenamento interno de tokens de influenciadores para preservar convites existentes. As tabelas `indicated_*` históricas não foram destruídas. Migrar o nome interno futuramente só com backup e migração testada.
- Scripts e testes dedicados ao produto aposentado foram preservados sob `docs/legacy-retired-v2.7` para auditoria, nunca para execução.

### Pagamento e boas-vindas

1. Checkout cadastra pedido `payment_pending` e faz cobrança no Asaas. Ninguém recebe acesso por apenas criar a cobrança.
2. `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` autenticados e vinculados ao ID de pagamento local marcam `paid` e chamam provisionamento idempotente.
3. Acesso/estoque ficam associados à compra; BKO exibe `aguardando envio`.
4. BKO clica **Abrir WhatsApp** (`wa.me`) ou **Abrir e-mail** (`mailto`), revisa e **envia manualmente**; nenhuma API do WhatsApp é necessária.
5. Após o envio efetivo, BKO clica **Marcar boas-vindas enviadas**, gerando registro no pedido. Só abrir link não comprova entrega. Mensagens pré-preenchidas não contêm senha.

### Evidência de testes locais

- `node --experimental-strip-types --test tests/*.test.mjs`: **250 aprovados e 1 bloqueado** (o teste de renderização estática da landing não inicia, pois o pacote não contém dependências React/Next completas neste ambiente).
- `tests/three-roles-launch-v27.test.mjs`: 5 aprovados; isolamento das três roles, bloqueio do quarto perfil e convites/ativação restritos, e continuidade de fluxos críticos.
- `tests/manual-welcome-v26.test.mjs`, `tests/campaign-accounting.test.mjs`, `tests/automation-runtime.test.mjs` e `tests/checkout-runtime.test.mjs` cobrem contratos; **não constituem pagamentos efetivos no Asaas**.
- Não foi executado `next build`, por dependências ausentes; executar em ambiente com `npm ci` íntegro.
- O banco e as integrações reais não foram acessados; não houve teste E2E no servidor nem teste de Pix/cartão real.

## Critérios de liberação para tráfego pago — todos obrigatórios

- [ ] Backup SQL integral, snapshot do código atual e plano de restauração verificados.
- [ ] Instalar a versão nova **com exclusão dos arquivos antigos**. Apenas copiar por cima deixa APIs aposentadas no servidor — não basta!
- [ ] `npm ci`, `npm run db:migrate`, `npm run build` e `npm run test:launch` em homologação, sem erros.
- [ ] `npm run check:readiness -- --traffic` na configuração de produção; conferir sem compartilhar segredos.
- [ ] Validar no Asaas Sandbox: cadastro → checkout Pix → evento confirmado → um revendedor → apenas uma entrada de estoque → acesso e senha provisória.
- [ ] Repetir evento de webhook; garantir **sem segundo acesso/segundo estoque**.
- [ ] Testar evento de cancelamento/estorno antes de expedição; conciliação e bloqueio de cashback.
- [ ] Testar pedido sem pagamento e confirmação manual: não contar como venda verificada na campanha.
- [ ] No BKO: pedido pago mostra WhatsApp/e-mail; abrir não muda `welcome_status`; marcar após envio muda uma única vez.
- [ ] Revendedor troca senha e acessa estoque, vendas, material e pedido; tentar entrar em rotas BKO e influenciador deve falhar.
- [ ] Influenciador recebe convite, ativa, aceita termos, cria campanha, acessa link; teste de compra atribuída excluindo frete e juros; teste de cashback padrão R$ 15 e percentual editável.
- [ ] Conferir impossibilidade de acessar áreas e APIs de clientes indicados, inclusive via link antigo e login prévio.
- [ ] Confirmar que a página institucional `mix10pro.com.br/lp-v2` preserva `?campanha=<código>` até o checkout no domínio de revendedores. Caso perca o código, o cashback não será atribuído.
- [ ] Confirmar backup, privacidade e política de cookies, termos de uso e políticas da campanha; validar revisão jurídica dos termos de influenciador.
- [ ] Testar a LP e checkout em Android/iPhone, rede móvel, desktop, navegadores privados e teclado móvel; medir carregamento e conversão.
- [ ] Confirmar pagamentos **reais** de pequeno valor em produção com conciliação/reembolso legítimo e autorização da operação, antes de direcionar tráfego pago.

## SQL de auditoria somente leitura (opcional)

No phpMyAdmin, após publicar a aplicação atualizada, executar esta consulta **sem realizar exclusão**:

```sql
SELECT role, status, COUNT(*) AS quantidade
FROM users
GROUP BY role, status
ORDER BY role, status;
```

Se ainda houver linhas `client_indicated`, são históricos **bloqueados pelo login atualizado**, não quarto perfil ativo. Não delete nem converta essas contas com SQL sem análise específica.

## Reversão

Restaurar o release anterior juntamente com o estado anterior do banco (se houve migração), verificar webhook, logins e manutenção. Esta versão não traz migração destrutiva.

**Decisão:** Não ativar anúncios até todos os critérios obrigatórios serem verificados em ambiente publicado. A aprovação da suíte local não prova prontidão de produção.
