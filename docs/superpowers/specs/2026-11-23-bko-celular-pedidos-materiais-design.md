# LORD NUTRI — BKO mobile, exclusão de pedidos de teste e substituição de PDFs

## Objetivo

Dar ao administrador um BKO utilizável no celular, permitir exclusão definitiva
de pedidos de teste e atualização dos PDFs sem editar arquivos no servidor.
Preservar o layout desktop e não enviar comandos destrutivos ao Asaas.

## Abordagens consideradas

- **Pedidos — arquivamento reversível:** preserva todas as relações, mas o usuário
  pediu explicitamente exclusão definitiva; descartado.
- **Pedidos — exclusão direta sem verificações:** arrisca estoque, acesso e
  histórico de pagamento inconsistentes; descartado.
- **Pedidos — exclusão definitiva transacional e auditada:** escolhido pelo usuário,
  com checagens de dependências antes da execução.
- **PDF — editor visual do conteúdo:** fora do escopo escolhido; o usuário quer
  substituir o arquivo inteiro.
- **PDF — upload que substitui o anterior:** escolhido pelo usuário; o endereço
  de download do Manual do Revendedor permanece estável.

## Desenho proposto

1. **BKO celular:** cabeçalho escuro compacto com botão para abrir/fechar o menu;
   navegação vertical só quando aberta; dashboard aparece sem rolagem pela
   listagem de menus; filtros de período e cartões cabem na largura de 360px.
   No desktop, menu lateral atual permanece. Revisar o erro que expõe botões de
   acesso para compras pendentes.
2. **Pedidos:** cada cartão de kit ganha `Excluir definitivamente`. O administrador
   deve confirmar o **número completo do pedido**. A API confere permissão,
   verifica atividades relacionadas, registra a exclusão e remove o pedido e
   suas dependências locais em uma transação. Se já existe venda de caixas,
   expedição física, cashback pago ou dependência desconhecida, recusa a
   exclusão com erro específico; nenhuma remoção parcial. Se houve estoque
   concedido apenas por esse pedido, remove as movimentações vinculadas;
   contas usadas por outros pedidos permanecem, e acesso de uma conta exclusiva
   é revogado. **Asaas não é cancelado, estornado nem alterado.** Cobranças já
   existentes no provedor continuarão lá e exigirão conferência externa.
   Auditoria local guarda o número do pedido, referência do pagamento,
   administrador, data e resultado, sem preservar o cadastro completo removido.
3. **PDFs:** em Materiais, permitir atualizar título e substituir o arquivo de
   cada material cadastrado; o identificador e link de download permanecem.
   Um bloco específico substitui o **Manual do Revendedor** principal por PDF
   de até 20 MB, servindo o novo conteúdo no mesmo endpoint protegido; caso
   não exista substituição, segue usando o manual atual. Mostrar visualização
   para conferência e impedir tipos/arquivos inválidos.

## Requisitos de segurança e verificação

- Somente sessão administrativa; validação server-side; atualização de banco
  atômica; arquivos protegidos de acesso não autorizado.
- Sem reset geral do banco e sem mudança nos pagamentos do Asaas.
- Testes de regressão de telas, endpoints, restrições de exclusão e download.
- A exclusão é **irreversível no banco local**; só backup externo permite
  recuperação. O pacote de código não executa exclusões automaticamente.

## Fora do escopo

- Edição de texto/imagens dentro de PDFs, cancelamento/reembolso no Asaas,
  apagamento indiscriminado de vendas, expedições ou contas já utilizadas.

## Estado

Aprovado pelo administrador em 23/11/2026 para implementação e entrega do ZIP.
