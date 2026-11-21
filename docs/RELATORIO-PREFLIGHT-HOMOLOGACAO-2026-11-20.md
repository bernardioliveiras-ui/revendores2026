# LORD NUTRI — preflight de homologação MySQL

Data: 20/11/2026. **Estado: preparada a verificação, homologação real ainda bloqueada por acesso.**

## Autorização e segurança

- O responsável identificou `u922332919_revmix10` na Hostinger (31 MB, status associado) e confirmou verbalmente que contém apenas dados de teste; autorizou seu uso como ambiente de homologação.
- Na captura, **conexões externas estavam desativadas**. Este executor não possui `DATABASE_*` configuradas, nem servidor MySQL/MariaDB ou Docker local.
- `scripts/homologation-preflight.mjs` consulta exclusivamente metadados via `SELECT`/`SHOW`, exige `HOMOLOGATION_TEST_ONLY=yes` e `HOMOLOGATION_DATABASE` idêntico a `DATABASE_NAME` e recusa `ASAAS_ENVIRONMENT=production`.
- Nenhum SQL foi executado na Hostinger; nenhum token, CPF, senha, pagamento, e-mail, WhatsApp ou dado real foi utilizado.

## Evidências de teste local

| Verificação | Resultado |
|---|---|
| `node --test tests/homologation-preflight.test.mjs` | **3/3 aprovados**: fail-closed, duas sessões simuladas e fechamento na falha |
| `node --test tests/lote0-homologation-mock.test.mjs` | **13/13 aprovados**: CONFIRMED/RECEIVED, pendente, cancelado, estorno, parcelamento, divergências, ambiente, concorrência simulada, bloqueio de acesso, webhook repetido e indisponibilidade |
| `node scripts/homologation-preflight.mjs` sem configuração | **Bloqueado corretamente**, status 1, antes de conectar |
| `npm test` | **323/333 aprovados, 10 falhas legadas**; nenhuma falha nova |
| `./node_modules/.bin/tsc --noEmit` | Aprovado |
| `npm run lint` | 349 erros e 222 avisos preexistentes |
| `npm run build` | Aprovado (Node `v24.22.3`; Hostinger usa Node 22) |
| `git diff --check` | Aprovado |

Os testes com `connect` simulado **não comprovam** duas conexões InnoDB reais. A mesma matriz de homologação mock do Lote 0 permanece independente dos testes de banco.

## O que ainda precisa ocorrer

1. Executar o preflight a partir de um ambiente com acesso seguro ao banco de testes, preferencialmente via terminal/SSH do ambiente de homologação da Hostinger sem habilitar acesso remoto irrestrito.
2. Confirmar a identidade do banco, `CONNECTION_ID()` A/B distintos, engine InnoDB, índices e inexistência de dados reais; registrar a saída redigida.
3. Obter aprovação específica para a tabela **não financeira** `asaas_reconciliation_audit` e aplicá-la somente na homologação; nunca migrar a produção por esta rotina.
4. Desenvolver/rodar a matriz de integração transacional contra os handlers reais e o Asaas mock controlado; comprovar locks, estorno, parcelamento e idempotência com duas sessões MySQL.
5. Verificar HTTP 502 com auditoria persistida antes da resposta, repetir a suíte completa, e só então reavaliar o gate para qualquer publicação.

## Restrições mantidas

Nenhum push, PR, merge, deploy, cobrança, repasse, alteração de termos/cashback, migration financeira ou envio externo. `INFLUENCER_POLICY_V2_ENABLED=false` permanece o padrão do pacote. Nenhuma produção foi acessada ou alterada.
