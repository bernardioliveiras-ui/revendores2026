# BKO — Operação diária

## Entrada no painel

Acesse `/entrar` com o e-mail e a senha do Admin/BKO. A primeira senha do proprietário vem de `ADMIN_BOOTSTRAP_PASSWORD`; no primeiro login o sistema exige uma senha definitiva.

## Novo revendedor

O fluxo normal não exige cadastro manual:

1. O candidato escolhe KIT20 ou KIT50 na landing page e preenche os dados completos.
2. Ele segue para o Asaas e conclui o pagamento.
3. Quando o Asaas envia a confirmação, a compra aparece no BKO como **Pagamento confirmado** e já entra em **Em separação**.
4. Confira nome, e-mail, WhatsApp, CPF/CNPJ, kit e endereço.
5. Clique **Liberar acesso**.
6. O sistema cria a conta, o estoque inicial e mostra e-mail + senha provisória uma única vez na tela.
7. Clique **Abrir WhatsApp** para abrir a conversa do revendedor com a mensagem pronta, ou use **Copiar acesso**.
8. O revendedor entra em `/entrar` e é obrigado a trocar a senha no primeiro acesso.

Se a pessoa perder a senha provisória, use **Gerar nova senha**. A senha anterior deixa de funcionar.

## Expedição

A sequência operacional é:

`Pagamento confirmado → Em separação → Despachado → Entregue`

- **Em separação:** estado automático após confirmação do Asaas; também pode ser marcado manualmente.
- **Despachado:** o sistema pergunta transportadora e código de rastreio. Ambos são opcionais; é permitido despachar sem rastreio quando a transportadora não fornece.
- **Entregue:** encerra o acompanhamento daquele envio.

## Visão geral do BKO

O painel preserva uma visão de métricas com:

- **Revendedores ativos**;
- compras pagas;
- acessos aguardando liberação;
- **Receita de kits**;
- caixas vendidas registradas pelos revendedores;
- estoque agregado em mãos;
- links de afiliado criados;
- cliques nos links de afiliado.

## O que o revendedor vê

O revendedor não entra no BKO. O menu dele contém apenas:

- Visão geral;
- Estoque;
- Vendas;
- Afiliados.

Cada revendedor só acessa os próprios registros.
