# LORD NUTRI / MIX10 PRO — entrega completa do Lote 0

**Data de preparação:** 20/11/2026. **Estado:** pacote completo de código-fonte para instalação e compilação, **não homologado nem autorizado para produção**.

## 1. O que foi alterado

- Login não promove um revendedor presente em `ADMIN_EMAILS` antes de validar a senha e o lockout. Sessões usam o papel efetivamente persistido.
- BKO conserva o `PATCH /api/admin/orders`, mas só marca pedido como pago após consulta válida da cobrança ao Asaas pelo serviço de sincronização. Bloqueios abrangem status não confirmado, valor, titular, referência, parcela e ambiente incompatíveis.
- Acesso manual, consulta e troca de senha exigem `paymentStatus='paid'` e `asaasVerifiedAt`.
- Textos do botão BKO foram alinhados ao comportamento **Consultar pagamento no Asaas**.
- Testes de regressão adicionais e baseline documentada, mantendo idempotência existente de webhooks, provisionamento e estoque.

**Não foi alterado:** cálculo de cashback, comissão de revendedores, termos publicados, webhook financeiro legado, banco, storage, integração de Correios, dashboard do Lote 1 ou política planejada de R$ 20 por caixa.

## 2. Versão, origem e conteúdo

- Repositório de origem: `bernardioliveiras-ui/revendores2026`.
- Base original da `main`: `bc1beeda2d34bcc0380343a9982228de14926034`.
- Commit local do Lote 0: `f6261cdc71aa23c291ec722dd05a305cf58a276c`.
- Branch local de referência: `codex/lord-nutri-lote0-20261120`.
- Aplicação: `mix10-pro-revendedores@1.8.1`, Next.js 16.2.6, React 19.2.6, MySQL/Drizzle.
- Inclui **todos os arquivos de aplicação rastreados no commit**, `app`, `components`, `db`, `lib`, `public`, `private/manual`, `scripts`, `tests`, `database`, `docs`, configs e `package-lock.json`.
- Documentos suplementares de homologação ainda pendente foram adicionados à pasta `docs` no pacote, **sem alterar o commit local**. O arquivo histórico `revendores2026-main.rar` foi excluído por não ser parte do runtime e poder conter cópia antiga/duplicada.

## 3. Instalar com Node.js 22

Pré-requisitos: **Node.js 22.x** (verificado com `v22.23.5`) e npm compatível; ambiente MySQL somente de homologação para testes integrados. Não utilizar credenciais de produção para validação.

```bash
node --version
npm ci
```

`npm ci` lê o `package-lock.json` incluído. Não é necessário enviar `node_modules` ou `.next` ao GitHub.

## 4. Configurar variáveis de ambiente

Use `.env.example` como checklist de nomes, **nunca como configuração real**. Para desenvolvimento local, crie sua própria `.env.local` fora do pacote e preencha somente com credenciais isoladas. No Hostinger, configure os segredos pela área segura de variáveis de ambiente; não envie `.env.local`, `.env` ou tokens ao GitHub.

Principais variáveis: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `AUTH_SECRET`, `ADMIN_EMAILS`, `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT`, `ASAAS_WEBHOOK_TOKEN` e `NEXT_PUBLIC_APP_URL`. Considere `WELCOME_AUTOMATION_*`, `RESEND_API_KEY` e `SHIPPING_WEBHOOK_TOKEN` somente quando autorizadas e testadas isoladamente.

```dotenv
ASAAS_ENVIRONMENT=sandbox
INFLUENCER_POLICY_V2_ENABLED=false
```

**Importante:** `INFLUENCER_POLICY_V2_ENABLED=false` é marcador reservado da decisão futura. Esta versão **não implementa a regra V2** e o valor `true` não deve ser utilizado. `EMAIL_FROM` foi documentado no exemplo porque já é consultado por código existente; nenhuma chave nova é obrigatória para as correções do Lote 0.

## 5. Executar os testes

```bash
npm test
node --experimental-strip-types --test tests/lote0-homologation-mock.test.mjs
npm run lint
npx tsc --noEmit
```

**Baseline verificada:** `npm test` = **317 aprovados, 10 falhos**, sem novas falhas; 13/13 cenários da homologação simulada aprovados; TypeScript aprovado; lint com **349 erros e 222 avisos legados**. Os dez testes estão classificados em `docs/lote0-baseline.md` (8 `obsolete`, 2 `preexisting`). Não atualizar testes antigos apenas para elevar a contagem.

Os testes usam dados sintéticos e mocks e **não substituem MySQL real** nem validação Asaas sandbox real.

## 6. Build

```bash
npm run build
```

O script executa `scripts/protect-manual-assets.mjs` e depois `next build --webpack`. Build foi validado no ambiente isolado usando Node 22 e passou. O diretório `.next` é **gerado no destino**, não faz parte deste ZIP. A aplicação é um servidor Node/Next, não export estático.

## 7. Deploy manual na Hostinger — **somente após aprovação futura**

1. **Não envie este pacote diretamente para uma branch com deploy automático de produção sem antes concluir a homologação e liberar o deploy.** Ao atualizar um repositório observado pela Hostinger, o pipeline pode compilar/deployar automaticamente.
2. Após autorização, envie **o conteúdo da pasta raiz do ZIP** ao repositório de destino preservando caminhos relativos, arquivos ocultos de configuração como `.gitignore` e a pasta privada `private/manual`. Não publique `private/manual` dentro de `public`.
3. Configure Node 22, comando de instalação `npm ci`, build `npm run build` e diretório de saída `.next`, respeitando as configurações atualmente aprovadas no Hostinger.
4. Configure as variáveis/segredos na Hostinger; `NEXT_PUBLIC_*` precisa existir **antes** do build.
5. **Atenção:** `npm start` chama `scripts/migrate.mjs` antes de `next start`, podendo executar DDL aditivo. **Não utilize esse start em produção até haver autorização explícita para as migrations existentes**. `npm run start:app` evita o prestart de migração, mas não dispensa verificar as rotinas de schema em runtime e não constitui autorização de produção.
6. Execute smoke test em homologação com MySQL separado, Asaas sandbox, sessão BKO, pagamento pendente/confirmado, idempotência e acesso. Só então solicite aprovação humana para publicação.

Consulte também `HOSTINGER-DEPLOY.md`, `LEIA-ME-PRIMEIRO.md` e `docs/lote0-mysql-homologacao-protocolo-2026-11-20.md`.

## 8. Migrations existentes e desativação

Arquivos históricos **inalterados**, incluídos para compatibilidade e documentação:

- `database/migrations/2026-09-18-structural-update.sql`
- `database/migrations/2026-10-01-lordnutri-welcome.sql`
- `database/migrations/2026-10-02-cashback-table.sql`
- `database/migrations/2026-10-02-checkout-shipping-payment.sql`
- `database/migrations/2026-10-09-purchase-measurement.sql`
- `database/schema.sql`

**Nenhuma migration nova do Lote 0 ou da política V2 foi criada ou executada.** Não há um toggle por arquivo que simplesmente desligue essas migrations: o `scripts/migrate.mjs` pode criar/alterar tabelas ao executar `npm start` ou `npm run db:migrate`. **Não execute `npm run db:push`, `npm run db:migrate` ou `npm start` contra produção sem aprovação específica.** A tabela futura de auditoria `asaas_reconciliation_audit` existe **somente como proposta nos documentos**, não no schema da aplicação.

## 9. Variáveis de ambiente novas

- **Nenhuma variável de runtime obrigatória nova para as correções do Lote 0.**
- `.env.example` apresenta `INFLUENCER_POLICY_V2_ENABLED=false` como marcador **reservado e sem implementação**, e `EMAIL_FROM` como variável opcional já consumida pelo código.

## 10. Riscos que exigem homologação

1. MySQL/MariaDB real separado, com duas conexões concorrentes, locks, transações, constraints e idempotência.
2. Persistência auditável de tentativas Asaas (operador, pedido, pagamento, ambiente efetivamente consultado, erro seguro, resultado), incluindo respostas 502.
3. Parcelamentos e estornos reais no Asaas sandbox; defasagem de eventos de estorno e status local; cenário de acesso liberado antes da atualização de estorno.
4. A rota `PATCH` legada preserva método e parâmetros, mas seu contrato de sucesso já não devolve senha provisória; verificar consumidores antes de produção.
5. Verificar política de retenção e acesso da futura trilha de auditoria, além dos riscos dos 10 testes legados.

## 11. Limitações conhecidas

- Testes: **317/327**; dez falhas legadas são conhecidas e não corrigidas neste pacote.
- Lint: **349 erros/222 avisos** preexistentes; não declare lint aprovado.
- Homologação MySQL real e auditoria persistente **não concluídas**; Lote 1 e produção **bloqueados**.
- A política `R$ 20 por caixa` para influenciadores permanece **não implementada e desativada**; cashback do revendedor permanece intacto.
- Sem upload, mensagem, cobrança, repasse ou integração real de Correios realizados durante a preparação.

## 12. Rollback de arquivos

1. **Antes de qualquer implantação autorizada**, faça backup dos arquivos e da configuração de produção por meios seguros; guarde a revisão anterior `bc1beeda2d34bcc0380343a9982228de14926034`.
2. Se a atualização falhar, retire o tráfego da versão nova conforme o procedimento existente, restaure **todo o código da revisão anterior** no mesmo local (sem sobrescrever credenciais/variáveis da hospedagem) e execute `npm ci`/`npm run build` para a revisão restaurada.
3. Confirme rotas, sessão, estoque, pagamentos e webhooks em ambiente controlado antes de reabrir o tráfego.
4. **Nunca execute rollback automático de banco sem um plano aprovado**; nesta entrega nenhuma migration nova foi aplicada. Preserve os dados históricos. Não use comandos destrutivos amplos.

## Arquivos de apoio

- `RELATORIO-FINAL-LOTE0.md` — evidências finais de teste e inventário.
- `docs/lote0-baseline.md` — matriz detalhada das dez falhas, divergências e rollback.
- `docs/lote0-homologacao-parcial-2026-11-20.md` — payloads sintéticos e 13 cenários mock.
- `docs/lote0-auditoria-preparacao-relatorio-2026-11-20.md` — auditoria pendente.
- `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md` — proposta não executada, **não é migration ativa**.
