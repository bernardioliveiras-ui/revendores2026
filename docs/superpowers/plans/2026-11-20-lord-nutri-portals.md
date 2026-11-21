# LORD NUTRI — integração do visual aprovado ao CRM real

## Base e limites

- Origem: `origin/main` em `84aff930c9af55026409e08d0da5a017223dac3a`.
- Trabalho local isolado: `codex/lord-nutri-visual-20261120`; sem publicação externa.
- Três perfis existentes e API Asaas, acesso, vendas, estoque e webhooks preservados.
- Sem ativação `INFLUENCER_POLICY_V2_ENABLED`, mudanças de cashback, termos, migrations financeiras ou consultas a credenciais reais.
- A prévia privada aprovada é uma referência **visual**; não usar métricas simuladas ou identidades fictícias na aplicação real.

## Plano incremental

1. Testar o contrato visual: oito módulos BKO, subáreas legadas preservadas, campanha de influenciador carregada da API, e sem texto de preço avulso indesejado no kit.
2. Reorganizar BKO com sidebar responsiva branca/dourada/azul-marinho, marca original, indicadores reais e acesso claro às abas existentes; preservar confirmação de saída do Studio.
3. Refinar as telas de revendedor e influenciador com cartões de dados reais, links e materiais já existentes, cabeçalhos claros e feedback acessível.
4. Exibir no pedido o último status conhecido e a data da última atualização do **CRM**; não apresentar isso como consulta em tempo real aos Correios.
5. Validar testes de regressão, suíte completa, TypeScript, lint, build e `git diff --check`.
6. Gerar entrega completa para upload manual: projeto, lockfile, `.env.example` seguro, README, relatório e ZIP sem `.git`, `.next`, `node_modules` ou segredos.

## Bloqueios de produção que permanecem

- MySQL/MariaDB homologação exclusivo, concorrência real de duas conexões, trilha persistente de falha Asaas e ambiente de conciliação por tentativa.
- Integração Correios CWS/contrato e persistência de eventos não estão no escopo deste release exclusivamente visual.
- Slug público amigável por campanha exige contrato de atribuição e testes de histórico; nome TORREI é somente exemplo, nunca constante global.
- Filtros e rankings financeiros por período exigem agregações autenticadas no backend; não simular com dados de demonstração.

## Rollback

Repor os arquivos do pacote anterior (ou reverter o commit **após** revisão manual), reconstruir com Node 22 e validar autenticação, BKO, três perfis, webhooks e pedidos. Nenhuma migration nem dado financeiro requer rollback nesta etapa.
