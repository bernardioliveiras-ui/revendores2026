# LORD NUTRI · BKO v2.5 — Revisão de Revendedores e Manutenção

## Por que a aba estava confusa

A tela antiga colocava **Acessos dos revendedores** (que são pedidos para pagamento e liberação de login) junto com o cadastro dos usuários. O print com “14 registros” representa **14 pedidos**, não necessariamente 14 revendedores. Na versão v2.4, um bloco de gerenciamento de contas deveria aparecer antes dos pedidos; se não aparecia, o site provavelmente não tinha recebido o deploy completo da atualização.

## Como ficou o ADMIN/BKO

- **Cadastros · Revendedores**: lista real de usuários. Botões **Editar cadastro** (nome, e-mail e telefone), **Desativar/Reativar**, **Excluir cadastro de teste** e **Limpar revendedores sem movimento**.
- **Pedidos e acessos**: status dos pedidos, liberação de login, redefinição de senhas, envio de boas-vindas e confirmação manual de pagamentos. Nenhuma venda manual é automaticamente verificada como Asaas.
- **Manutenção · Zerar testes**: prévia de dados **consultada no banco real** (por exemplo, revendedores, influenciadores, pedidos, vendas, estoque e cashback), mais comandos de simulação e limpeza completa.

A API permite editar **somente** cadastros de revendedores: não altera papel, status por via de edição, pedidos históricos, estoque, valores ou percentuais de cashback. Rejeita e-mail reservado ao ADMIN, e-mail duplicado e telefone inválido. Alterar e-mail encerra as sessões atuais do revendedor.

## Exclusão individual e limpeza geral são diferentes

- **Excluir cadastro de teste**: apenas revendedor sem vínculo com compras, perfil de compra inicial, estoque, vendas, indicações ou cashback; usa confirmação `EXCLUIR` e transação no banco.
- **Limpar revendedores sem movimento**: tenta excluir em lote somente contas vazias, informando quais foram bloqueadas.
- **Zerar banco comercial de teste**: apaga todos os dados comerciais **inclusive pedidos, acessos, revendedores, indicadores, cashback e aceite**, mas preserva a(s) conta(s) ADMIN, conteúdo institucional e estrutura. **Não afeta a conta Asaas nem os pagamentos de fora da plataforma.**

Por segurança, o zeramento geral **não é executado por botão no navegador**; a aba oferece a prévia e o comando para a Hostinger. Antes, suspenda novas vendas/webhooks e confirme que nenhuma cobrança real ou pendente será processada. Mantenha o backup fora da Hostinger.

### Execução na Hostinger, dentro da pasta do projeto

```bash
npm run db:reset:test
```

Revise o **host e nome do banco** e a contagem de linhas que serão removidas. Se confirmados ambiente de teste, origem das cobranças e backup, execute:

```bash
npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/lord-nutri-antes-reset.jsonl.gz
```

Guarde o arquivo `backups/lord-nutri-antes-reset.jsonl.gz` em lugar seguro fora do servidor. Ele contém dados pessoais e hashes de senha dos cadastros removidos.

O comando não é um recurso de limpeza remota do Asaas; cobranças de teste pendentes devem ser canceladas no Asaas/sandbox para impedir eventos posteriores afetando a conciliação.

## Publicação e teste

1. Faça backup de todo o ambiente e publique o projeto v2.5 **substituindo o v2.4**, preservando `.env`, segredos e bancos; não envie `node_modules` do seu PC.
2. No servidor, execute instalação das dependências, migração e build segundo `HOSTINGER-DEPLOY.md` e reinicie o processo Node.
3. Entre no BKO e confirme que aparecem as 3 abas novas citadas. Se só aparecer **Revendedores** com a lista de pedidos, ainda está no build antigo (revise o deploy/cache/processo).
4. Edite nome e telefone de um revendedor de teste, atualize a página e verifique persistência. Tente excluir somente conta sem movimentações.
5. Abra Manutenção e confira a prévia. Nunca execute a limpeza total em banco com pedidos reais.

## Evidências de validação

- Validação sintática de TSX/TS concluída.
- Testes de edição, permissões de ADMIN, segurança de origem e prévia de manutenção aprovados.
- Suíte completa do projeto v2.4 **já tinha 29 falhas** no ambiente isolado (mocks/desatualizações anteriores); a v2.5 também teve 29, sem aumento desse total. **Build Next.js completo e validação em Hostinger/Asaas não executados aqui**, por falta das dependências instaladas e credenciais.

## Importante

**Este ZIP não publica a aplicação automaticamente, nem zera sua base em produção.**
