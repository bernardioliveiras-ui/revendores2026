# LORD NUTRI — transações concorrentes InnoDB reais (homologação)

**Data:** 20/11/2026  
**Evidência:** captura do terminal SSH enviada pelo responsável.  
**Resultado:** **APROVADO para o escopo de locks de linha e constraints em tabela sintética.**  
**Não equivale à homologação dos handlers de pagamento, webhook, acesso ou estoque.**

## Ambiente e fixture

| Item | Valor observado |
|---|---|
| Servidor MariaDB | `11.8.9-MariaDB-log` |
| Banco declarado exclusivo de testes | `u922332919_revmix10` |
| PHP CLI | `8.2.36` |
| Sessão A | `247609172` |
| Sessão B | `247609173` |
| Script CLI | `homologacao-transacoes-mariadb.php --senha-stdin` |
| Tabela criada pelo ensaio | `lordnutri_hml_tx_663b8e28e717` |
| Engine | InnoDB |
| Estrutura | `id INT PRIMARY KEY, contador INT` |
| Estado final da tabela | **REMOVIDA**, conforme saída `[OK]` |

O nome foi sorteado pelo próprio script; `CREATE TABLE` ocorreu apenas após duas conexões independentes confirmarem `DATABASE()` com o nome autorizado. O script não executa SQL em tabelas de negócio. A natureza exclusivamente de teste do banco é uma declaração do responsável, não uma auditoria independente do tráfego de produção.

## Matriz observada

| Cenário | Resultado esperado | Resultado capturado | Situação |
|---|---|---|---|
| Concorrência: sessão A segura row lock, B tenta atualizar | B não altera linha; erro 1205 de espera | `[OK] Row lock: B recebeu timeout 1205; A confirmou exatamente um incremento.` | **APROVADO** |
| Rollback de B | Alteração não persistida | `[OK] Rollback da sessão B preservou o valor confirmado.` | **APROVADO** |
| Segundo commit serial | Exatamente um novo incremento | `[OK] Segundo commit aplicou um incremento, sem perda de atualização.` | **APROVADO** |
| Duas transações inserem mesma chave | B aguarda/expira com 1205 | B teve erro 1205 esperado | **APROVADO** |
| Reinserção de chave já confirmada | MariaDB impede duplicidade com 1062 | `[OK] Chave única: B esperou/expirou (1205), depois duplicidade bloqueada (1062).` | **APROVADO** |
| Limpeza da fixture | `DROP TABLE` apenas da tabela criada | `[OK] Tabela sintética removida: lordnutri_hml_tx_663b8e28e717` | **APROVADO** |
| Resultado global da execução | Processo só aprova após remover tabela | `RESULTADO: APROVADO - row locks, transações, rollback e chave única no MariaDB.` | **APROVADO** |

Os erros **1205 e 1062 são resultados esperados e tratados**: 1205 demonstra contenção InnoDB; 1062 demonstra unicidade da chave primária. Não indicam falha de execução. A captura retorna ao prompt do SSH após `RESULTADO: APROVADO`.

## Escopo e limites

- Houve **DDL/DML exclusivamente na tabela sintética autorizada**, criada e removida durante o teste. Nenhuma alteração em `users`, `purchases`, `reseller_profiles`, `stock_movements`, `asaas_events` foi prevista ou executada pelo script.
- Nenhuma API Asaas, Correios, e-mail, WhatsApp, webhook da aplicação ou operação de pagamento foi executada.
- A prova de contenção foi feita entre duas conexões MySQL reais, mas em uma aplicação PHP sequencial com a conexão B esperando por um row lock: **não prova uma corrida entre dois requests HTTP reais do Next.js**.
- Não foi exercitada a idempotência do código de provisionamento, nem a persistência de ambiente/erro de conciliação Asaas.
- A política de cashback do influenciador segue desativada, sem migração ou alteração de termos.

## Próximos gates obrigatórios

1. Provisionar uma aplicação isolada conectada a esse banco de testes sem executar o `npm start` de produção nem migrações automáticas.
2. Executar handlers reais do CRM contra MySQL de homologação + Asaas mock/sandbox controlado e fixtures de compras, sem cobranças reais.
3. Testar em concorrência confirmações simultâneas, IDs de webhook distintos para mesmo fato, estornos/parcelamentos e unicidade de usuário, perfil, estoque e fato financeiro.
4. Aprovar e implementar auditoria não financeira persistente de cada tentativa Asaas (ambiente efetivamente consultado, pedido, cobrança, ator, requestId, código seguro, status HTTP e resultado), antes de homologar indisponibilidade 502.
5. Reexecutar matriz e revisão antes de considerar Lote 1 ou produção.

**Gate:** Lote 1 e produção continuam bloqueados; este relatório não autoriza deploy, migrations financeiras ou mudanças de cashback.
