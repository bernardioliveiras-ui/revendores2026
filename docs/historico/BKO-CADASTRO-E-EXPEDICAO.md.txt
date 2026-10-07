# MIX10 PRO — operação do BKO

## Como um novo revendedor é cadastrado

O BKO **não precisa digitar novamente os dados do cliente**. O cadastro é automático:

1. O cliente chega pela LP/VSL e escolhe **KIT20** ou **KIT50**.
2. No checkout ele informa nome, e-mail, WhatsApp, CPF/CNPJ e endereço completo.
3. O Asaas processa a cobrança.
4. Com **Pagamento confirmado**, o sistema cria automaticamente a revenda, o usuário proprietário e o pedido inicial.
5. O pedido entra como **Em separação** e o acesso aparece em **Administrativo → Novos acessos / Expedição**.

Regra comercial: KIT20 = 20 unidades por R$ 74,99 (R$ 1.499,80). KIT50 = 50 unidades por R$ 69,90 (R$ 3.495,00). KIT30 antigo continua apenas no histórico.

## Como enviar o acesso pelo WhatsApp

No card do cliente em **Novos acessos / Expedição**:

1. Clique em **Ver senha** para revelar a senha provisória protegida.
2. Clique em **Copiar** se quiser copiar somente a senha.
3. Clique em **Abrir WhatsApp**. O sistema abre a conversa com uma mensagem pronta contendo o e-mail e, quando a senha estiver revelada, a senha provisória.
4. Envie a mensagem manualmente pelo WhatsApp.
5. Clique em **Acesso enviado** para registrar que o BKO concluiu a entrega das credenciais.

O cliente entra com **e-mail + senha** e é obrigado a trocar a senha no primeiro acesso. Se a senha provisória expirar ou precisar ser substituída, use **Redefinir senha** e envie a nova senha ao cliente.

## Como fazer a expedição

Depois do pagamento, o pedido já nasce como **Em separação**.

- Para enviar, clique em **Marcar despachado**.
- Transportadora é opcional.
- O código de **rastreio é opcional**; o pedido pode ser despachado mesmo quando a transportadora não fornecer rastreio.
- Depois da confirmação de entrega, clique em **Marcar entregue**.

Os dados de endereço do checkout aparecem no card do BKO para que a separação e o transporte possam começar sem pedir os dados novamente ao cliente.

## Métricas continuam onde estavam

A atualização não substitui o dashboard existente. No **Painel administrativo** continuam disponíveis as métricas de revendas cadastradas, pedidos confirmados, caixas vendidas, devoluções, números por revendedor, estoque, indicações, cliques, conversões e logística. O novo bloco de BKO foi adicionado sem remover essas métricas.

## Revendedores que já existiam antes desta atualização

Os dados antigos não são apagados pela migração. Como essas contas usavam código por e-mail e ainda não possuem senha, o BKO deve abrir **Administrativo → Revendedores atuais** e clicar em **Gerar senha provisória** para cada proprietário que precisar acessar. A senha aparece somente naquela tela; copie e envie pelo WhatsApp. No primeiro login o revendedor será obrigado a criar a senha definitiva.

Antes de publicar, faça backup do MySQL e aplique a migration indicada em `database/migrations/2026-09-18-structural-update.sql` somente uma vez no banco antigo.
