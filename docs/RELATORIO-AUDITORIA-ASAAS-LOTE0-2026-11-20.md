# LORD NUTRI — implementação local da auditoria persistente Asaas (Lote 0)

**Data:** 20/11/2026  
**Situação:** código implementado e validado com testes de mock, **não publicado e não homologado em integração real Node + MySQL**.

## Infraestrutura real confirmada

- MariaDB 11.8.9, banco `u922332919_revmix10`, confirmado pelo responsável como exclusivamente de testes.
- Duas sessões reais, row locks InnoDB, rollback e unicidade previamente aprovados com tabela sintética removida após execução.
- Tabela persistente **não financeira** `asaas_reconciliation_audit` criada manualmente pelo responsável e validada com 16 colunas InnoDB. O instalador não inseriu registros.
- Não houve acesso remoto ao servidor pelo executor, credenciais reais no projeto, mensagens ou transações financeiras.

## Implementação no worktree isolado

| Arquivo | Alteração |
|---|---|
| `db/schema.ts` | Mapeamento da tabela de auditoria criada, sem nova migration financeira. |
| `lib/asaas-reconciliation-audit.ts` | Grava `started` e `finished` append-only, identificadores correlacionados, operador, pedido, cobrança, ambiente configurado/consultado, status HTTP, resultado e código/motivo seguro. |
| `lib/asaas.ts` | Consulta de cobrança recebe configuração congelada por tentativa; rede/timeout convertem-se em `AsaasRequestError` seguro. |
| `app/api/admin/orders/sync/route.ts` | Exige registro inicial antes da conciliação, persiste decisão antes da resposta; preserva `502` para falha do Asaas com auditoria funcional e responde `503` quando não é possível auditar. |
| `tests/asaas-reconciliation-audit.test.mjs` | Testes do armazenamento mock, erro de rede, ambiente congelado, legado PATCH, falhas da auditoria antes/depois da confirmação. |
| `tests/helpers/asaas-audit-stub.mjs` e fixtures legadas | Fornecem somente a nova dependência aos testes antigos, sem alterar seus cenários ou expectativas. |

## Verificação local de 20/11/2026

- Node do ambiente local: **24.22.3** (o pipeline Hostinger utiliza Node 22; a versão 22 ainda requer validação deste código).
- `npm test`: **342 aprovados / 352 executados, 10 falhas legadas**; nenhuma falha nova identificada. Os 10 testes existentes não foram corrigidos artificialmente.
- `npm run lint`: **349 erros e 222 avisos preexistentes**; não foi iniciado um esforço de correção ampla.
- `npm run build`: **aprovado**, Next.js 16.2.6; a checagem TypeScript executada pelo Next também foi aprovada.
- `git diff --check`: **aprovado**.
- `npx tsc --noEmit`: **aprovado**, executado depois do build para evitar corrida com a geração de `.next/types`.

O primeiro build deste ciclo identificou uma falha nova de *narrowing* TypeScript no tratamento de erro da auditoria. Foi corrigida pontualmente e o **segundo build passou**; não se trata de erro legado.

### Preparação complementar do executor Node para MariaDB

- `tests/lote0-homologation-mysql.mjs`: executor manual com duas sessões reais, serviço TypeScript de auditoria/Drizzle, simulação em memória de falha Asaas, verificação de duas fases persistentes e constraint UNIQUE. Não abre nenhuma conexão sem flags explícitas de homologação; não importa endpoints financeiros, não executa migration e não toca compras ou usuários. **Ainda não executado em MariaDB real.**
- `tests/lote0-homologation-mysql-runner.test.mjs`: quatro testes RED/GREEN comprovando bloqueio antes de abrir socket, exigência de consentimento, timezone UTC e exceção estrita de auditoria compartilhada; **4/4 aprovados**.
- `docs/EXECUCAO-AUDITORIA-NODE22-2026-11-20.md`: instruções para Node 22 e túnel SSH em ambiente de testes. Não executar no banco que sustenta a aplicação online.
- `.env.example`: apenas dois marcadores de autorização manual, ambos desligados (`no`) por padrão.

O projeto validado localmente usa **Node 24.22.3**; Node 22 e MySQL da Hostinger continuam sem execução conjunta. O responsável confirmou que `u922332919_revmix10` é compartilhado com o serviço online e reiterou expressamente autorização de uso. O executor aceita **somente as quatro linhas sintéticas na tabela de auditoria não financeira**, sob consentimento explícito no processo; testes dos handlers que movimentam pedido, estoque, acesso ou financeiro continuam bloqueados nessa base. **O Lote 1 segue bloqueado.**

## Contratos e garantias

- `requestId` e `attemptId` são UUIDs gerados no servidor; nenhum identificador de auditoria vem do navegador.
- `configured_environment` é a configuração capturada para a tentativa; `consulted_environment` é preenchido apenas quando a consulta ao Asaas é iniciada com **a mesma configuração congelada**.
- `provider_consulted=0` indica bloqueios antes de consultar a API (por exemplo, ambiente divergente).
- Motivos e códigos são escolhidos de uma lista segura; CPF, dados bancários, e-mails, tokens, payloads ou `error.message` do provedor não são gravados.
- Falha no `INSERT started` interrompe a conciliação com `503` antes de confirmar pagamento.
- Falha no `INSERT finished` impede uma resposta de sucesso; preserva `started` para investigação e **não reverte artificialmente** um pagamento que o webhook já aplicou.
- Quando o Asaas fica indisponível, a resposta `502` só sai **após** persistir `finished`; erro de escrita da auditoria gera `503` seguro.
- A rota PATCH antiga continua encaminhando à consulta Asaas; não define `paid` por conta própria.
- Nenhuma regra de cashback, estoque, estorno, parcelamento, cobrança ou termo publicado foi alterada neste trabalho.

## Limitações obrigatórias antes de homologar

1. Ainda não existem registros `started`/`finished` reais produzidos pela aplicação em um MySQL de homologação; todos os testes de auditoria de rota foram com armazenamento mock.
2. A Hostinger disponibiliza PHP/MySQL no SSH, mas não expôs um executável Node nesse shell. É necessário um runtime Next.js **isolado** conectado exclusivamente ao banco de testes, com Asaas mock/sandbox, sem acionar migrações automáticas do `npm start`.
3. Falta a matriz real dos handlers com requisições concorrentes, estorno antes/depois, parcelamento, webhooks repetidos e unicidade de acesso/estoque/fato financeiro.
4. A tabela persistente requer definição operacional de retenção LGPD, backup, acesso administrativo e monitoramento de tentativas `started` sem `finished` antes de produção.
5. **Lote 1 e produção continuam bloqueados** até testes reais, revisão do diff e aprovação explícita.

## Rollback

Reverter somente os arquivos de implementação deste lote à revisão anterior, preservando demais mudanças da interface. A tabela de auditoria deve **permanecer intacta**, mesmo se a integração local for desativada: remover tabela apagaria a trilha e exige procedimento e autorização próprios. Nenhum commit, PR ou deploy foi feito pelo executor.
