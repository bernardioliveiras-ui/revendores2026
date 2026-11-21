# Separação dos canais comerciais do BKO

## Objetivo aprovado

Não misturar pedidos de kits que geram acesso de revendedor com vendas unitárias do MIX10, atribuídas ou não a influenciadores. Corrigir também os indicadores de acesso e apresentar os canais claramente no layout BKO existente. Preservar integralmente os pedidos, atribuições de campanha, pagamentos e estoque; nenhuma escrita em produção.

## Abordagens

- **Aprovada — classificação de leitura por produto e campanha:** `kit !== 'mix10-unit'` entra em Acessos e Pedidos; `mix10-unit` com `campaignId` fica no módulo de influenciadores; `mix10-unit` sem `campaignId` aparece em Vendas avulsas. A Expedição continua transversal. Mantém banco e financeiro intactos.
- Alternativa descartada — filtrar por pessoa/e-mail: o comprador pode ter papéis distintos e isso trocaria a atribuição financeira.
- Alternativa descartada — reescrever pedidos e cadastros no banco: destrutiva e desnecessária.

## Indicadores e interface

Visão Geral mostra valores da loja inteira com rótulo explícito, e separa a contagem de vendas por canal. `Acessos pendentes` conta apenas kits pagos e verificados que precisam de acesso. Listagens de pedidos de acesso filtram apenas kits; vendas unitárias sem campanha têm aba própria; influenciadores seguem com sua área atual de atribuição e cashback. Resellers continuam filtrados por `users.role = 'reseller'`; não converter usuários por nome.

## Segurança e limites

Nenhuma mudança no webhook Asaas, cadastro de usuários, cálculo financeiro ou estoque. Operações administrativas existentes seguem autenticadas. Dados ambíguos ou antigos não são apagados, e o público não vê dados financeiros. O trabalho é do código local: homologação com serviços reais e publicação exigem etapa posterior.
