# Atualização Asaas — revendedores e influenciadores

## Publicar na Hostinger

1. Faça backup dos arquivos e banco atuais. Atualize este projeto mantendo o .env de produção e os uploads existentes. Não execute limpeza/reset de dados.
2. Use Node.js 22. Execute npm ci, npm run build e reinicie a aplicação com npm start conforme a configuração atual.
3. Mantenha ASAAS_API_KEY, ASAAS_ENVIRONMENT e ASAAS_WEBHOOK_TOKEN atuais. A chave e o ambiente devem corresponder à conta onde estão as cobranças.

## Configurar os webhooks após publicar

Na mesma conta Asaas, configure dois webhooks ativados, com filas ativadas:

- Revendedores: https://revendedores.mix10pro.com.br/api/billing/revendedores/webhook
- Influenciadores: https://revendedores.mix10pro.com.br/api/billing/influenciadores/webhook

Ambos usam o mesmo token secreto que está em ASAAS_WEBHOOK_TOKEN na Hostinger. Não use a chave API como token. Não compartilhe o valor. Eventos a habilitar: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_REFUNDED, PAYMENT_PARTIALLY_REFUNDED, PAYMENT_DELETED, PAYMENT_RECEIVED_IN_CASH_UNDONE e PAYMENT_CHARGEBACK_REQUESTED.

O Asaas pode enviar cada evento às duas URLs. Cada entrada processa somente o tipo de pedido correspondente: mix10-unit em influenciadores; kits e reposições em revendedores. Eventos do outro canal recebem sucesso com ignored=true, sem consumir o evento. A proteção contra duplicidade é compartilhada no banco.

A rota antiga /api/billing/webhook continua funcionando para os dois tipos durante a transição. Mantenha-a até validar as novas entradas; depois desative somente essa configuração antiga dos revendedores para evitar tráfego redundante. O webhook do institucional mix10pro.com.br/api/asaas-webhook deve continuar com sua configuração atual.

## Recuperar o pedido do Rodrigo

1. Entre no BKO como administrador.
2. Na parte superior, em Consultar pagamento de revendedor ou influenciador, informe MIXMWFD7KYD9F90.
3. Clique Sincronizar com Asaas e leia o resultado.
4. Após confirmação, clique Atualizar dados no CRM Seller. O perfil do influenciador também atualiza ao ganhar foco e a cada 30 segundos enquanto visível.

A consulta usa o ID Asaas já salvo no pedido, confere ID, referência externa quando presente, cliente e valor integral para cobrança sem parcelamento. Só confirma quando o Asaas retorna RECEIVED ou CONFIRMED e a cobrança não está excluída. O fluxo compartilhado atualiza o pagamento, apura cashback da campanha existente e aplica estoque/acesso dos kits de revendedor. As vendas avulsas não geram cadastro de revendedor. Repetir a consulta não soma uma nova venda.

Se o pedido não tiver ID Asaas, houver diferença de valor/cliente/referência ou estiver cancelado, o sistema informa o motivo e não confirma automaticamente. Venda sem campanha vinculada é sinalizada; não é atribuída a alguém por nome, telefone ou suposição. Pedidos cancelados e estados Asaas diferentes de RECEIVED/CONFIRMED exigem análise; a sincronização pontual desta versão recupera confirmações, enquanto estornos continuam pelo webhook.

## Correção da fila antiga

Eventos sem correspondência local e sem referência externa passam a ser ignorados, para que cobranças de outro site ou eventos antigos não prendam esta fila. Quando a referência aponta para um pedido local cuja cobrança ainda não foi gravada, o sistema continua solicitando reenvio. Não remova eventos sem identificar a cobrança. Verifique URL, resposta e pedido após cada reenvio.

## Verificação realizada

- Build Next.js de produção: aprovado.
- 45 testes direcionados: aprovados (checkout, webhook, contabilização de campanha e sincronização).
- Cobertura: autenticação administrativa, pendente sem confirmação, divergência de cobrança, cancelamento, canais isolados, reenvios, cashback e preservação do fluxo de estoque.

A publicação, configuração da conta Asaas e consulta da cobrança real dependem do ambiente da Hostinger. Nenhum pedido real foi alterado durante esta revisão. O pacote não inclui credenciais nem banco de produção.
