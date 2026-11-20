# Histórico aposentado na v2.7

Estes testes e scripts verificavam fluxos de cliente indicado, upload de comprovante ou ações por lead individual. Eles não são compatíveis com o produto de três perfis. Foram preservados SOMENTE como documentação, fora do diretório executável de testes.

A cobertura de acesso, convite, ativação, isolamento e vendas por campanha foi refeita em `tests/three-roles-launch-v27.test.mjs`.

Não execute os scripts legados em produção. As tabelas antigas permanecem intactas para recuperação histórica/backup. Nenhuma migração destrutiva foi incluída.
