# LORD NUTRI — cadastro manual + revisão API/Asaas

Versão entregue a partir do ZIP enviado em 23/11/2026. Layout original preservado.

## O que foi incluído

- BKO > Revendedores > **+ Cadastrar revendedor**: nome, e-mail, WhatsApp, CPF/CNPJ válido, CEP, rua, número, complemento, bairro, cidade e UF.
- Botão **Consultar CEP** auxilia preenchimento; falha da consulta não impede preencher manualmente.
- Novo cadastro tem `role=reseller`, perfil completo, estoque inicial **0**, nenhuma compra e nenhum débito Asaas.
- Convite privado com validade de **24 horas**; link `/ativar-revendedor` permite definir a senha uma única vez. **Gerar convite de ativação** renova o link de perfis manuais ativos.
- Revendedores manuais podem usar normalmente o portal, comprar kits para reposição com frete e Asaas posteriormente e registrar vendas somente quando houver estoque.
- Lista de revendedores identifica **Cadastro manual** ou **Compra pelo Asaas**, e indica **Aguardando ativação** antes da senha.
- Uma conta manual sem histórico comercial pode ser excluída pelo BKO sem apagar compras de outras contas; convites são limpos junto.
- Proteção adicional no webhook contra pagamento sem identidade Asaas vinculada; detalhes no relatório `docs/ASAAS-AUDITORIA-2026-11-23.md`.

## Atualização do servidor (Hostinger / Node 22)

1. Fazer backup do banco e da pasta publicada. Preservar `.env`/`.env.local`, credenciais Asaas, uploads e arquivos não presentes no ZIP.
2. Atualizar o código da aplicação a partir deste pacote, sem apagar uploads locais e sem substituir variáveis secretas.
3. Executar `npm ci` com Node 22 e, antes de iniciar o app, `npm run db:migrate`. A migração adiciona `reseller_invitations` e permite `purchase_id` nulo em `reseller_profiles`, preservando pedidos antigos e sua chave estrangeira.
4. Executar `npm run build` e `npm start`. Validar login do BKO, cadastro manual, convite/ativação, estoque zero, reposição e webhooks em Sandbox.
5. Se houver falha na migração, **não** zerar o banco automaticamente: conferir backup, permissão DDL e compatibilidade de FK no MySQL.

**Não executei limpeza de banco ou deploy.** O script `npm run db:reset:test` foi atualizado para incluir os novos convites em seu backup/limpeza, mas não foi utilizado.

## Cuidados

- CPF/CNPJ, endereço e convites são dados sensíveis: apenas administradores devem acessar o BKO. Compartilhe o link de ativação somente com o revendedor correspondente.
- Cadastro manual **não confirma pagamento**; o Asaas permanece como única confirmação de pedidos reais.
- Os testes locais do código novo passaram; testes globais e build precisam ser repetidos na máquina de implantação com dependências instaladas.
