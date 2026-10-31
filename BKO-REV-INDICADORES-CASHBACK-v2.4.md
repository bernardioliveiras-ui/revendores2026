# LORD NUTRI · BKO v2.4

## Mudanças
- **Revendedores**: nova área de controles na aba Revendedores: ativar, desativar, exclusão de conta sem movimentação. Não mexe no fluxo existente de liberação/redefinição de senhas.
- **Influenciadores**: cashback independente dos revendedores, por campanha/link, **R$ 15,00 por venda Asaas verificada** por padrão. O BKO pode alterar para valor fixo (R$) ou percentual sobre os **produtos, sem frete e juros**. Percentuais são gravados em pontos-base.
- A apuração do cashback é calculada **uma única vez ao primeiro evento válido de pagamento confirmado**, guardada no pedido; mudar a regra não recalcua pedidos anteriores. Estorno/cancelamento deixa de contar nos indicadores; repasses não são feitos automaticamente.
- O valor mínimo de R$ 100,00 para repasse na sexta-feira é uma **política de liberação**, não transferência automática.
- Conta de revendedor com qualquer compra, estoque, venda, indicação ou cashback vinculados **não pode ser excluída pela interface**. Use limpeza supervisionada com backup para apagar registros de teste.

## Zerar banco comercial de teste
Antes, confira que **não existem pedidos reais**, mesmo feitos após a última conversa. Faça backup do banco. O script já cria backup obrigatório e preserva ADMIN/estrutura:

```bash
npm run db:reset:test     # simulação sem exclusão
npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/antes-reset-v24.jsonl.gz
```

Só executar no ambiente autorizado e após confirmar host e nome do banco mostrados na simulação. A exclusão não é reversível sem restaurar o backup.

## Validação
Rode `node --experimental-strip-types --test tests/influencer-cashback-v24.test.mjs tests/reseller-admin-v24.test.mjs` e `npx tsc --noEmit` em ambiente com dependências instaladas. Execute homologação contra Asaas sandbox/Hostinger antes da publicação.
