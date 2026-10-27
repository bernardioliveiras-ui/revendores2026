# LORD NUTRI — Indicadores, cashback e aceite digital v2.2

## Mudanças entregues
- Aviso permanente no portal: cashback elegível acumulado a partir de R$ 100,00, com repasses programados para sextas-feiras. **Não é motor de pagamento automático** e não calcula a bonificação a partir das vendas sozinho.
- Termo de participação original com 12 seções, elaborado à luz da estrutura pública de programas como Amazon Associates e Hotmart; não reproduz o texto de terceiros.
- Login do indicador requer aceite expresso da versão vigente antes de abrir o link e as métricas; campo desmarcado por padrão.
- POST autenticado e com verificação de origem registra versão, resumo SHA-256, conteúdo integral da versão, data/hora em UTC, IP informado pela infraestrutura e user-agent. Concede acesso somente após registro persistido.
- Registros de versões anteriores são mantidos; atualização da versão exige novo aceite.
- ADMIN/BKO enxerga pendência/aceite e pode abrir a auditoria (acesso restrito ao admin).
- GET/POST de campanhas e endpoints legados de indicador estão bloqueados até o aceite.
- Termo integral consultável em `/termos-indicadores`.

## Integração / instalação
1. Faça backup dos dados e publique os arquivos do ZIP completo ou da atualização sobre a mesma versão v2.1.
2. `npm ci` e `npm run db:migrate` (ou inicialização normal: `npm start` aplica migração). A tabela `indicator_terms_acceptances` será criada. A alteração é aditiva, preserva clientes, administradores, vendas e campanhas.
3. Execute os testes: `node --test tests/indicator-terms-v22.test.mjs` e compile `npm run build` no ambiente com dependências.
4. Entre como indicador sem aceite: deverá aparecer o termo (checkbox vazio). Recuse e verifique saída. Aceite e confira liberação do painel.
5. No BKO, selecione indicador → Auditar aceite. Verifique ID, data, versão, hash, IP e navegador.
6. Altere a versão em código, implemente novo texto e confirme que os usuários precisam aceitar novamente.

## Pontos para revisar ANTES de liberar em produção
- Validar juridicamente o termo com advogado trabalhista e contratual brasileiro, especialmente a operação real (não basta dizer 'sem vínculo').
- Confirmar CNPJ, razão social, e-mail de privacidade e quem operacionaliza o cashback.
- Definir por escrito e implementar a fórmula de cashback e os critérios de liberação, estornos, datas de corte e eventual antecipação de saldo; a receita dos produtos sem frete NÃO equivale ao crédito acumulado.
- Confirmar forma de pagamento e conciliação bancária antes de anunciar liquidação automática nas sextas-feiras.
- Configurar proxy confiável para cabeçalho de IP; IP pode não estar disponível ou pode ser falsificado sem política de proxy.
- Adequar tabela de aceites à política de retenção LGPD; não incluí exclusão automática.
- Testar em ambiente de homologação e no servidor Hostinger, não foram feitas mutações no ambiente real.

## Referências para elaboração (consultadas em 26/10/2026)
- https://associados.amazon.com.br/help/operating/agreement
- https://hotmart.com/pt-br/legal/termos-de-uso
- https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm

**Aviso:** minuta funcional e jurídica para revisão especializada, não parecer jurídico nem garantia de descaracterização de vínculo.
