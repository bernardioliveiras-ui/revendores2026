# LORD NUTRI · Clientes, mobile e marca

## Decisões aprovadas

- A tela Clientes do revendedor reúne **somente compradores registrados nas vendas**. Não existe cadastro manual independente.
- O lançamento rápido exige nome e telefone visíveis; preço continua exclusivamente configurado no BKO e cada venda baixa o estoque apenas uma vez.
- Histórico anterior permanece intacto, inclusive vendas antigas sem telefone; essas vendas não formam um contato acionável na tela Clientes.
- Contatos pertencem somente ao revendedor autenticado. A tela agrupa vendas por telefone, mostra a compra mais recente e abre `wa.me` para atendimento.
- Desktop e mobile exibem a marca completa, sem recorte, ao lado do nome do papel (Administrador, Revendedor, Influenciador).
- Favicon e ícones de instalação usam a identidade visual dourada atual, com cache-busting para evitar versões antigas.
- Sem notificações ou área de indicações na navegação do revendedor.

## Desenho técnico

Campo `sales.customer_phone` é adicionado por migração idempotente sem apagar registros. No POST de venda, normalizar número BR (10 ou 11 dígitos, com 55 opcional); permitir payload legado sem nome nem telefone, mas exigir ambos se qualquer um estiver preenchido. A interface nova exige sempre os dois. GET `/api/clients` restringe ao `user.id` da sessão e deriva lista a partir de `sales`, sem tabela nova; ordenar por compra recente, consolidar por telefone, somar caixas.

Interface de venda apresenta estoque, contador, nome e telefone, resumo com preço bloqueado e confirmação clara. Clientes possui pesquisa em tempo real e CTA WhatsApp. Na largura pequena, cinco ações essenciais são alcançáveis por barra inferior fixa; demais opções permanecem acessíveis por menu Mais. Conteúdo reserva espaço inferior para não ser encoberto.

Verificações: testes de normalização, consolidação e isolamento; testes de rota de venda com persistência e estoque; compilação TypeScript/Next; revisão de largura 360–390px; ambos ZIPs testados, sem incluir dados locais `.env` nem `node_modules`.
