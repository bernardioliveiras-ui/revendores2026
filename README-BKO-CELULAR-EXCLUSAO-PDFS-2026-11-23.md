# LORD NUTRI — atualização do BKO (23/11/2026)

Esta pasta contém o projeto completo. A atualização mantém as integrações
existentes, o cadastro manual de revendedores e as regras de cobrança do Asaas.

## O que mudou

1. **Celular:** o menu do administrador fica recolhido atrás de **Menu**.
   Ao tocar, abre a navegação; ao selecionar uma seção, volta a recolher.
   Filtros de período e conteúdos receberam estilos responsivos.
2. **Acessos e Pedidos:** cada compra de kit tem **Excluir definitivamente**.
   Digite o **número completo do pedido**. Um pedido pago exige confirmação
   adicional. A exclusão remove o pedido e dados locais dependentes em uma
   transação; se houver vendas, expedição, indicações, cashback pago ou outra
   dependência incompatível, o sistema não remove nada. Se houver outro pedido
   válido para o mesmo revendedor, o cadastro permanece vinculado a ele. Os
   identificadores de eventos dos webhooks já recebidos são preservados para
   manter a proteção contra processamento duplicado.
3. **Materiais:** é possível trocar o PDF do **Manual do Revendedor** pelo BKO,
   mantendo o mesmo endereço protegido de acesso. Também é possível renomear
   ou substituir individualmente materiais enviados anteriormente. PDFs podem
   ser abertos em outra aba e baixados. Limite: 20 MB por arquivo.
4. **Acesso:** botões de senha e acesso não aparecem para compras pendentes,
   mesmo que exista algum dado de acesso antigo no cadastro. Revendedores
   cadastrados manualmente pelo BKO, sem pedido Asaas, podem abrir os materiais
   após ativação; compras Asaas continuam exigindo pagamento verificado e
   liberação de acesso.

## Implantação

- Requer Node.js **22.x** e as mesmas variáveis de ambiente já configuradas.
- Instale as dependências com `npm ci` no ambiente de implantação.
- Execute `npm run db:migrate` antes de servir a nova versão (o comando
  `npm start` também executa a migração). As tabelas novas são aditivas:
  `bko_manual_pdfs` e `bko_order_deletions`.
- Compile com `npm run build`, publique a aplicação e confira as três abas no
  celular e computador.
- Mantenha um backup do MySQL antes da primeira exclusão; depois de confirmada,
  a operação não oferece restauração pelo BKO.

## Atenção ao Asaas

**Excluir no BKO NÃO cancela, estorna ou apaga a cobrança no Asaas.** Uma
cobrança que já exista na plataforma financeira permanecerá lá, inclusive se
o pedido correspondente tiver sido apagado neste banco de testes. A ação é
para limpeza manual de registros de teste e precisa de confirmação consciente.

O código **não executa exclusões automaticamente**. Nenhum banco remoto ou
cobrança Asaas foi alterado durante a preparação deste pacote.

## Verificação feita neste ambiente

- 23 testes novos e de regressão passaram: menu mobile, restrição de acesso,
  cadastro manual, upload de PDF, download protegido, permissões, histórico
  dos webhooks e transação de exclusão.
- 120 testes da suíte sem dependências externas executaram com sucesso.
- Não foi possível rodar o build Next.js, nem os testes que importam pacotes
  como `typescript`, `mysql2` e `sharp`, porque `node_modules` não está
  instalado neste ambiente de revisão. Rode `npm ci`, `npm test` e
  `npm run build` no servidor antes da publicação.

Os arquivos antigos do projeto foram preservados, salvo as modificações
identificadas neste documento.
