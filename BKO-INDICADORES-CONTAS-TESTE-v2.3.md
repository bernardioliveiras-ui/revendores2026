# LORD NUTRI — BKO v2.3 · Ativar, desativar e limpar indicadores de teste

## Problema resolvido

Na Central de vendas e influenciadores o backend já aceitava ativar/desativar via PATCH, mas faltavam botões visíveis. A exclusão ainda não tinha rota. A v2.3 adiciona:

- **Reativar acesso / Desativar acesso** na carteira do influenciador. Desativar invalida sessões e convites; também impede o funcionamento do link público enquanto a conta estiver inativa.
- **Gerar convite de ativação** após reativar, quando não houver senha. Reativar **não** cria senha automaticamente; o próprio indicador define a sua por convite privado válido por 24h.
- **Excluir cadastro de teste**: pede a palavra `EXCLUIR` e remove o indicador apenas se não houver pedidos (pagos ou pendentes), cashback, comprovantes ou histórico comercial associado. Exclusão transacional, protegida por login ADMIN e checagem de origem, com chaves estrangeiras habilitadas. Apaga sessões, convites, aceites do perfil de teste, leads de teste, campanha e conta. Se houver dados financeiros, aborta.
- **Limpar indicadores de teste**: percorre os indicadores listados no BKO, pede a frase `ZERAR INDICADORES` e tenta remover os perfis elegíveis. Os protegidos permanecem e seus motivos aparecem na tela. Esta limpeza **não** zera pedidos, estoque, revendedores e todos os outros módulos.
- Corrigida a seleção após apagar a conta atual: o CRM escolhe automaticamente um indicador ainda existente, ou apresenta o estado vazio.

## Para zerar o banco comercial inteiro (inclusive pedidos de teste)

A rotina que já existia continua sendo a forma correta para limpar **todos** os registros de teste, inclusive contas de revendedores, indicadores, indicações, pedidos e sessões, preservando os usuários de papel `admin`, estrutura e conteúdo institucional. Não existe botão de reset integral na interface para evitar exclusões sem backup.

Na pasta do projeto, conectada ao MySQL correto:

```sh
npm run db:reset:test
```

O comando acima é simulação e imprime host, nome do banco e quantidades.

Após tirar também um backup SQL pela Hostinger, desativar webhooks/processamento de cobranças de teste e confirmar o ambiente, executar:

```sh
npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/testes-antes-reset.jsonl.gz
```

O arquivo `.jsonl.gz` é privado e possui dados de teste; não suba ao GitHub. A rotina não remove cobranças do Asaas e não altera dados de sistemas externos. Não apague pagamentos reais nem use o reset em produção com vendas.

## Como instalar

1. Fazer backup do projeto e do banco atual na Hostinger.
2. Aplicar a atualização v2.3 sobre o código v2.2 existente (ou publicar o ZIP completo pelo seu fluxo GitHub/Hostinger). Não sobrescrever `.env.local` nem credenciais.
3. Executar `npm ci`, `npm run db:migrate`, `npm run build` e os testes num servidor com acesso às dependências.
4. Recarregar a página do ADMIN/BKO, selecionar uma conta e verificar os botões. Antes de remover vários perfis, testar a exclusão de um único indicador fictício sem pedidos.
5. Confirmar que o login ADMIN continua funcionando, que o BKO ficou sem indicadores de teste e que uma nova conta recebe convite e termo de aceite.

## Observações

- O frontend usa uma confirmação escrita antes de excluir; o backend valida ADMIN, origem, e-mail, tipo da conta, confirmação e movimentações financeiras.
- O registro de aceite jurídico e o aviso de cashback da v2.2 continuam presentes, sem alterações nesta atualização.
- Os testes automatizados v2.3 são realizados com banco simulado. Não houve acesso nem mudança direta no MySQL da Hostinger, no Asaas ou no site em produção.
