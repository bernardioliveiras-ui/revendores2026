# Plano de implementação · Clientes + Mobile + Favicon

1. **Dados e contratos** — criar testes que falham para telefone brasileiro, contatos derivados e privacidade; adicionar helper de contatos, campo no schema SQL/Drizzle, migrações aditivas, rota GET `/api/clients`, gravação de telefone em `/api/sales` preservando idempotência, executar testes.
2. **Fluxo de vendas e clientes** — expor nome e telefone no formulário, validação amigável, registrar usando preço BKO, renderizar busca/WhatsApp em tela exclusiva e atualizar contatos ao vender; testar fluxo e contratos.
3. **Layout e identidade** — substituir textos repetidos das marcas pelos papéis, garantir logo integral, criar navegação inferior mobile com Mais, ajustar CSS responsivo; trocar favicon e ícones de instalação com assets nítidos e metadados coerentes; testar.
4. **Verificação e entrega** — `tsc`, testes direcionados, suíte abrangente, build, ZIP atualizado completo e ZIP pequeno incremental, `unzip -t` e disponibilização para baixar.

Checklist de risco: nenhuma destruição de tabelas, número do cliente só visível ao revendedor proprietário, proteção de preço/estoque já existente permanece, vendas legadas sem telefone não falham, sem execução em banco de produção.
