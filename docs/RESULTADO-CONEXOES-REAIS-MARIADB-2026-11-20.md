# LORD NUTRI — resultado de duas conexões reais ao MariaDB

**Data:** 20/11/2026  
**Fonte:** captura do terminal SSH fornecida pelo responsável pelo projeto.  
**Escopo:** verificação de conexão concorrente e de `GET_LOCK`/`RELEASE_LOCK`, sem escrita em tabelas.

## Ambiente observado

| Propriedade | Evidência |
|---|---|
| Host SSH | `br-asc-web1664` |
| PHP CLI | `8.2.36` |
| Extensão MySQL | `mysqli` habilitada |
| MariaDB | `11.8.9-MariaDB-log` |
| Banco declarado de testes | `u922332919_revmix10` |
| Sessão A | `247545590` |
| Sessão B | `247545591` |
| `wait_timeout` de cada sessão | 20 segundos |
| Comando do ensaio | `php homologacao-duas-conexoes.php --senha-stdin` |

Os valores de identificação, versão e timeout foram mostrados pelo próprio script. A classificação do banco como *exclusivamente de testes* foi declarada pelo responsável; não foi verificada de forma independente contra os sistemas publicados.

## Resultado observado

| Verificação | Resultado |
|---|---|
| Duas conexões independentes, IDs diferentes | **APROVADO** |
| Sessão A adquire lock temporário | **APROVADO** |
| Sessão B identifica A como titular do lock | **APROVADO** |
| Sessão B falha ao adquirir lock ocupado (timeout zero) | **APROVADO** |
| Sessão A libera lock | **APROVADO** |
| Sessão B adquire e libera lock após A | **APROVADO** |
| Nenhum erro de MySQL durante a sequência | **APROVADO** |

A captura registra literalmente `RESULTADO: APROVADO - duas conexões e bloqueio consultivo real` e `Nenhum pedido, estoque, cashback ou pagamento foi alterado`. O script usa apenas consultas de identidade e `GET_LOCK`/`IS_USED_LOCK`/`RELEASE_LOCK`; não contém DML ou DDL.

## O que NÃO foi homologado por este ensaio

- Não houve transações concorrentes InnoDB, bloqueio de linha (`SELECT ... FOR UPDATE`) ou testes de deadlock e rollback.
- Não houve criação ou provisionamento concorrente de usuários, acessos ou movimentações de estoque.
- Não foram invocados os handlers reais Next.js de pagamento/webhook contra este MariaDB.
- Não foram simulados estorno, parcelamento ou webhooks com IDs distintos **nesta conexão real**.
- Não foi verificada auditoria persistente de cada tentativa Asaas nem persistência do ambiente consultado.
- Não foi feita prova independente de que nenhum serviço de produção utiliza este banco.

Os 13 cenários anteriormente aprovados em mocks **não equivalem** a estes testes de integração real. Não liberar Lote 1 ou produção com base somente neste resultado.

## Próxima etapa sujeita a validação/autorização

1. Confirmar isolamento e ausência de dados/operações reais no banco usado como homologação.
2. Preparar fixture **sintética e identificável** para bloqueio de linha e rollback, separada de pedidos existentes; qualquer `CREATE`/`INSERT` precisa de autorização específica e plano de limpeza.
3. Exercitar duas transações reais no MySQL e verificar constraints, concorrência e idempotência usando essa fixture.
4. Integrar os handlers reais com Asaas mock/sandbox controlado e capturar evidências dos cenários financeiros **sem cobranças reais**.
5. Aprovar e implantar auditoria não financeira persistente somente em homologação, testar indisponibilidade 502 e ambiente efetivamente consultado.

**Restrições preservadas:** nenhuma alteração na main, produção, cashback, termos, migrations financeiras, cobranças, repasses ou mensagens reais nesta verificação.
