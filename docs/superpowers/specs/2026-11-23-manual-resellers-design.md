# Cadastro manual de revendedores e revisão de webhooks — design

## Objetivo

Permitir que o administrador do BKO cadastre um revendedor completo sem compra de kit, cobrança Asaas ou movimentação fictícia. A compra automática, a reposição real e o layout atual continuam funcionando.

## Campos e fluxo aceitos

Nome completo, e-mail, WhatsApp, CPF/CNPJ, CEP, rua/avenida, número, complemento, bairro, cidade e UF. O CEP preenche dados conhecidos por consulta assistida; o frete só é calculado quando houver compra/reposição real.

O BKO abre o cadastro em **Revendedores**; o backend exige administrador, valida os dados e cria `users(role=reseller)` e `reseller_profiles` de origem manual na mesma transação. O perfil possui `purchase_id=NULL`, `initial_kit='manual'` e `initial_boxes=0`. Sem `purchases`, `stock_movements` ou chamadas Asaas. O revendedor aparece no CRM com estoque zero e pode comprar reposição por PIX/cartão pelo fluxo preexistente.

O admin obtém convite individual de 24h (somente hash no banco). O revendedor escolhe a senha no portal `/ativar-revendedor`. Convite vencido, repetido, de outra função, desativado ou inválido não ativa contas. Pode gerar novo convite que invalida os anteriores. Senhas nunca são apresentadas no BKO. Excluir cadastro manual sem histórico remove o perfil e convite, sem mexer nas compras reais.

## Integrações e segurança

- Não mudar o checkout, as duas URLs de webhook e a regra Asaas como fonte única de pagamentos reais.
- Preservar os vínculos e dados já existentes; migração aditiva permite `reseller_profiles.purchase_id` nulo e cria `reseller_invitations`; sem reset automático do banco.
- Não misturar carteiras, estoque, campanhas e papéis de influenciadores e revendedores.
- Validar e-mail único, CPF/CNPJ, CEP, telefone, endereço e origem do POST admin; proteger tokens contra replay; respostas sem cache.
- Auditar os webhooks contra documentação Asaas, com testes de regressão em falhas comprovadas. Alterações em regras financeiras ambíguas (como cancelamento integral decorrente de estorno parcial) precisam de decisão de negócio antes de mudar.

## Abordagens consideradas

1. **Convite privado de 24h (escolhida)**: segue a experiência dos influenciadores; senha definida pelo titular e sem exposição ao administrador. Exige tabela e rota próprias.
2. Senha temporária gerada pelo BKO: reutiliza parte da infraestrutura de kits, mas cria uma senha visível ao administrador e mistura fluxo administrativo com histórico de compras.

## Não objetivos

Não criar pedidos pagos fictícios, conceder estoque inicial, enviar automaticamente WhatsApp/e-mail, zerar banco, criar cliente Asaas no cadastro ou redesenhar o BKO.
