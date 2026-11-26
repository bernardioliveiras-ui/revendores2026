# LORD NUTRI — estoque manual sincronizado (25/11/2026)

## Objetivo e aprovação

Permitir que o BKO registre a quantidade de caixas **já em posse** do revendedor ao cadastrá-lo manualmente e corrija posteriormente o saldo real, sem alterar compras pagas nem perder o histórico. O usuário confirmou a opção 1 em 25/11/2026.

## Comportamento

- No cadastro manual, o campo "Estoque atual (caixas)" aceita inteiro de 0 a 2.147.483.647; na ausência do campo, mantém o comportamento antigo de zero. Cadastro e entrada inicial positiva são registrados na mesma transação MySQL. Não é gerado pedido/cobrança Asaas nem expedição fictícia.
- Em BKO > Revendedores, "Atualizar estoque" define o **saldo total**, não adiciona caixas. O BKO informa o motivo; o servidor calcula a diferença a partir do livro de movimentos, salvando `adjustment_in` ou `adjustment_out`, com ator, data e motivo. Saldo igual não cria movimento.
- Para evitar sobrescrever uma venda ou reposição posterior à abertura do formulário, uma correção com saldo-base desatualizado é recusada (HTTP 409), requerendo atualização dos números antes de reenviar. As rotas de venda existentes e a correção usam bloqueio da linha do usuário; a correção bloqueia também a faixa indexada de `stock_movements` via `FOR UPDATE` (InnoDB `REPEATABLE READ`) para serializar entradas automáticas do Asaas que não bloqueiam `users`.
- O BKO exibe o saldo e os ajustes recentes; o portal apresenta o saldo e as movimentações. Ambos já consultam o servidor sem cache a cada 30 segundos, quando visíveis, e ao receber foco. Alterações salvas no BKO atualizam sua própria visão imediatamente.
- A integração Asaas continua fonte única de confirmação de pagamentos, e novas compras/recompras seguem acrescentando as caixas nos lançamentos existentes. Não alterar o tratamento de webhooks ou dados financeiros.

## Preservação e limites

Nenhuma atualização em produção nem reset, migração destrutiva, mudança de perfil ou conversão de pedidos. Usar tabelas existentes (`users`, `reseller_profiles`, `stock_movements`): não precisa modificar o esquema de produção. Histórico de compras e estoques de revendedores existentes, inclusive Jorge, deve permanecer intacto até que o BKO faça uma correção explícita.

## Abordagens consideradas

1. **Livro de movimentos + saldo-base conferido (escolhida):** ajustes auditáveis, sincronizados com relatórios e vendas, sem dupla contagem.
2. Apenas campo inicial sem ajuste posterior: mais simples, mas não permite corrigir saldos reais depois.
3. Sobrescrever diretamente um campo de estoque: descartada por quebrar a contabilidade já baseada em movimentações.

## Verificação e implantação

Testar validação, atomicidade, permissões, duplicidade, saldo-base vencido, ausência de cobrança, diferenciação entre manual/Asaas e visualização. Entregar ZIP integral para GitHub/Hostinger e instruções de aplicação sem excluir banco, `.env` ou arquivos de mídia. A publicação efetiva e a integração com banco/Asaas de produção precisam de validação em ambiente da Hostinger.
