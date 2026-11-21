# LORD NUTRI — Plataforma dos três perfis

Pacote de atualização visual para o projeto Next.js existente de revendedores.

## Origem e preservação

- Base: `bernardioliveiras-ui/revendores2026`, `main` em `ca0ce1ef795ff80209fbf7b2382fbb11dbd6453c`.
- Interface de referência **original, não uma invenção nova**: Site `lord-nutri-bko-demo-20261120`, código da versão `f43cc60c00f4391b1934ba0dc946270790a0f504`.
- Inclui os três perfis reais BKO, Revendedor e Influenciador; os papéis continuam isolados pelo login e pelas APIs do CRM. **Não há alternador público de papéis.**
- Preserva banco, APIs, pagamentos, pedidos, movimentações, termos de influenciador, conteúdo, materiais e favicon dourado transparente existentes.
- Nenhum dado fictício da demonstração foi copiado para as métricas do CRM. O gráfico do BKO usa apenas pagamentos com data de verificação Asaas, sem somar o frete.

## O que mudou

1. Identidade visual do projeto de demonstração: azul-marinho, dourado, menu lateral, cabeçalho com perfil e páginas responsivas.
2. BKO: visão geral com filtros Hoje / 7 dias / 30 dias / Mês atual / Anterior / Todo o período, volume diário verificado, alertas e links para módulos reais.
3. Revendedor: menu e cartão de boas-vindas usando o estoque e a identidade do titular real, mais módulos de vendas, materiais e pedidos existentes.
4. Influenciador: menu próprio, campanha individual, cashback apurado da API e área de perfil de leitura; continua exigindo aceite dos termos antes do painel.
5. Testes de agregação real do BKO para evitar inserir receitas sem confirmação ou valores de frete como produto.

## Atualização pelo GitHub Desktop

1. Antes de substituir arquivos, crie uma cópia de segurança ou uma branch do repositório atual no GitHub Desktop.
2. Extraia o ZIP em uma **pasta separada**. Copie **o conteúdo** para a pasta local do repositório `revendores2026`, substituindo arquivos com mesmo nome. **Não substitua a pasta `.git`** do seu clone.
3. Não copie variáveis secretas para o GitHub. Confira se `.env`, `.env.local`, senhas, tokens Asaas e outras credenciais **não aparecem** em Changes.
4. Rode no PowerShell, dentro da pasta do projeto:

   ```powershell
   npm.cmd ci
   npm.cmd run build
   npm.cmd run test:critical
   ```

5. Revise o diff, faça Commit e Push na branch `main` quando estiver satisfeito. A Hostinger deve executar o build normalmente, conforme a configuração existente.
6. No site publicado, teste em sessões separadas um admin BKO, um revendedor e um influenciador, confirmando os dados reais de cada conta. Confira o acesso à plataforma antes de permitir novos pedidos.

## Limites de homologação

Esta versão contém **a plataforma visual integrada às funções já presentes**. Não autoriza ativar pagamentos reais ou automações financeiras novas. O Site de demonstração era estático; suas operações demonstrativas não foram copiadas como se fossem operações de produção.

**Próxima etapa controlada:**

- Asaas real: credenciais por ambiente, confirmação servidor-servidor, webhook assinado, idempotência, conciliação e testes com reembolso/parcela/concorrência.
- Correios: contrato e credenciais oficiais, API de rastreamento, atualização periódica com persistência e exibição ao cliente do último evento verificado; sem prometer tempo real antes da homologação.
- Influenciadores: links individuais e atribuição, isolamento por login, regras de cashback e auditoria de repasses sem duplicidade; primeiro testar sandbox e banco exclusivo de testes.
- Segurança: revisar avisos de dependências reportados pela Hostinger (39 vulnerabilidades no relatório anterior) e atualizar versões com testes antes de abertura comercial.

**Testes:** `npm run build` e `npm run test:critical` passaram no ambiente de empacotamento; testes gerais mantêm 10 falhas legadas de contratos/snapshots anteriores, relacionadas a fluxos de webhook e landing page e não a esta nova interface. Nenhuma dessas falhas foi declarada resolvida aqui.

**IMPORTANTE:** esta entrega não altera as configurações `DATABASE_*`. Se login der acesso negado, verifique a senha do banco e o host no painel Hostinger, sem publicar essas informações em arquivos Git.
