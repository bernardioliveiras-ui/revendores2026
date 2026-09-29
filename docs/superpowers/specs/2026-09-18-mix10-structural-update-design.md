# MIX10 PRO — Atualização Estrutural de Aquisição, Acesso e Logística

**Data:** 2026-09-18  
**Base:** `revendedores-mix10pro-main.zip`  
**Objetivo:** transformar a LP em canal de aquisição direta, criar a revenda automaticamente após pagamento confirmado no Asaas, trocar login por código/Resend por e-mail + senha e manter o restante da operação atual estável.

## 1. Princípios da V1

- Não reescrever o portal.
- Não duplicar fluxo de pedido, estoque, indicação ou logística já existente.
- Preservar dados existentes no MySQL.
- Manter o módulo de indicação/afiliado que redireciona ao Mercado Livre sem alterações funcionais.
- Separar claramente **compra inicial de entrada** de **pedido de reposição**.
- Um comprador aprovado = uma revenda = um usuário proprietário na V1.
- Sem multiusuário/convites na V1. Tabelas existentes de convites/membros podem permanecer para compatibilidade, mas a interface de equipe fica oculta/desativada.
- Resend deixa de ser dependência da autenticação.

## 2. Kits comerciais

### KIT20
- 20 unidades.
- R$ 74,99 por unidade.
- Total: **R$ 1.499,80**.

### KIT50
- Substitui o antigo KIT30 para novas compras.
- 50 unidades.
- R$ 69,90 por unidade.
- Total: **R$ 3.495,00**.
- Na LP, pode mostrar referência comercial de 50 × R$ 109,90 = R$ 5.495,00 e diferença bruta potencial de R$ 2.000,00, acompanhada do aviso já existente de que resultados dependem da operação do revendedor.

### Compatibilidade histórica
- Pedidos antigos com `kit30` não serão apagados, convertidos nem reprecificados.
- O sistema continua capaz de exibir pedidos históricos `kit30`.
- Novos pedidos não oferecem `kit30`; oferecem apenas `kit20` e `kit50`.

## 3. Novo funil público

Fluxo aprovado:

`Tráfego pago → LP + VSL → KIT20/KIT50 → cadastro de compra → Asaas → pagamento confirmado → revenda + proprietário criados → pedido em separação → acesso aparece no BKO → BKO envia pelo WhatsApp → cliente entra → troca senha → painel MIX10`

A LP existente continua pública e passa a direcionar os CTAs dos kits para o checkout de entrada, em vez de `/entrar`.

## 4. Checkout de entrada

Antes de criar a cobrança, o comprador informa:

- Nome.
- E-mail.
- WhatsApp.
- CPF/CNPJ.
- CEP.
- Endereço.
- Número.
- Complemento opcional.
- Bairro.
- Cidade.
- UF.
- Kit escolhido: KIT20 ou KIT50.
- Forma de pagamento permitida pelo fluxo Asaas existente.

Esses dados já são os dados da futura revenda e do envio físico; não haverá onboarding repetindo os mesmos campos após o pagamento.

O checkout público deve validar duplicidade crítica de e-mail/CPF-CNPJ antes de criar uma nova aquisição, com mensagem clara para casos já existentes.

## 5. Compra inicial separada de reposição

A tabela/fluxo de pedidos continuará sendo a fonte da logística e estoque, mas novos pedidos terão um marcador explícito de origem/tipo:

- `initial` = compra de entrada da revenda.
- `replenishment` = reposição feita dentro do portal.

Pedidos existentes serão tratados como `replenishment` por compatibilidade quando o campo ainda não existir.

A API pública de entrada não exige sessão. A API `/api/orders` existente continua autenticada e voltada a reposições.

## 6. Asaas e provisionamento automático

O webhook do Asaas continua protegido por `ASAAS_WEBHOOK_TOKEN` e idempotência por `asaas_events`.

Quando um evento `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED` atingir uma compra inicial:

1. confirmar o pedido como pago;
2. criar a organização/revenda com os dados do checkout, caso ainda não exista;
3. criar o usuário proprietário com o mesmo e-mail, caso ainda não exista;
4. criar a membership `owner`;
5. gerar uma senha provisória aleatória;
6. gravar apenas o hash da senha;
7. marcar `must_change_password = true`;
8. vincular pedido, organização e usuário;
9. avançar o pedido automaticamente para `processing` / **Em separação**;
10. registrar eventos de auditoria;
11. disponibilizar o acesso no painel BKO.

O processamento precisa ser idempotente por pagamento/pedido: webhook repetido não pode criar segunda revenda, segundo usuário ou segundo pedido.

Eventos de cancelamento/estorno continuam atualizando o pedido; não devem apagar automaticamente uma revenda já criada sem ação administrativa explícita.

## 7. Autenticação por e-mail + senha

Substituir:

`e-mail → código Resend → sessão`

por:

`e-mail + senha → sessão`

Requisitos:

- senha armazenada somente como hash forte;
- sessão atual (`auth_sessions`) pode ser reaproveitada;
- login somente para usuário `active`;
- limite de tentativas/retenção temporária para reduzir brute force;
- senha provisória exige troca no primeiro login;
- após trocar a senha, `must_change_password = false`;
- BKO/Admin terá reset de senha para gerar nova senha provisória;
- `auth_login_codes` pode permanecer no banco por compatibilidade, mas deixa de ser usado;
- `RESEND_API_KEY` e `EMAIL_FROM` deixam de ser obrigatórios e são removidos do fluxo de produção.

## 8. BKO / Administração

Adicionar ao modo administrativo uma área de **Novos acessos / Expedição**.

Para cada compra inicial paga, mostrar:

- cliente;
- e-mail;
- WhatsApp;
- CPF/CNPJ;
- KIT20/KIT50;
- quantidade;
- valor pago;
- endereço completo;
- status do pagamento;
- status logístico;
- data da compra;
- acesso provisionado.

Ações do BKO:

- copiar e-mail;
- revelar/copiar a senha provisória somente quando disponível de forma segura na etapa de provisionamento;
- abrir WhatsApp do cliente com mensagem pré-preenchida, sem envio automático;
- redefinir senha e gerar nova provisória;
- marcar/alterar logística;
- registrar transportadora opcional;
- registrar rastreio opcional;
- marcar `Despachado` mesmo sem código de rastreio;
- marcar `Entregue`.

### Senha provisória

Como senha não pode ser recuperada a partir do hash, a V1 usará um **segredo temporário de entrega criptografado em repouso**, com expiração curta e acesso somente pelo Admin/BKO. A senha provisória nunca será gravada em texto puro no banco nem em logs. Depois de copiada/confirmada pelo BKO ou após a expiração, o segredo temporário é apagado; se necessário, o BKO usa “Redefinir senha” para gerar outra provisória.

## 9. Logística

Status operacionais principais:

`Pagamento confirmado → Em separação → Despachado → Entregue`

- Ao provisionar uma compra inicial paga, status vai automaticamente para **Em separação**.
- Transportadora é opcional.
- Código de rastreio é opcional.
- Data de envio é registrada ao marcar `Despachado`.
- Integração logística automatizada existente permanece disponível e separada; não é obrigatória para avançar manualmente um pedido.

## 10. Portal do revendedor

Após o primeiro login e troca obrigatória de senha, o revendedor entra no portal atual.

Preservar:

- dashboard;
- pedidos de reposição;
- estoque;
- movimentações;
- manual;
- indicação/afiliado Mercado Livre;
- métricas existentes;
- administração existente.

Na V1:

- “Minha equipe” e convite de usuários ficam ocultos/desativados;
- o usuário criado automaticamente é sempre `owner` da própria revenda;
- uma compra inicial não cria usuários adicionais.

## 11. Banco de dados

Mudanças mínimas propostas:

### `users`
- `password_hash` nullable durante migração, obrigatório para novos acessos;
- `must_change_password` boolean/int default 0;
- `failed_login_attempts` e `locked_until` para limite de tentativas e bloqueio temporário.

### `orders`
- aceitar `kit50` além de manter `kit30` histórico;
- `order_type` = `initial` | `replenishment`;
- campos opcionais de transportadora/data de despacho quando necessários.

### Provisionamento
Adicionar tabela pequena `access_provisioning` ou equivalente apenas se necessário para representar:
- pedido inicial;
- usuário/revenda provisionados;
- status do acesso;
- segredo temporário criptografado + nonce/IV + expiração, sem plaintext persistente.

Não criar tabelas paralelas para dados que já existem em `users`, `organizations`, `memberships`, `orders` e `order_events`.

## 12. Segurança

- Nenhuma senha em texto puro no banco permanente.
- Hash de senha com algoritmo apropriado para senha (não HMAC simples).
- Cookies de sessão continuam `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS.
- Endpoints BKO continuam restritos a admin.
- Checkout público não aceita preço enviado pelo navegador; kit e valor são resolvidos no servidor.
- Webhook Asaas continua validando token e idempotência.
- Logs não devem conter senha, token de sessão, API key ou payload de segredo temporário.

## 13. Testes de aceitação

Antes do deploy, validar:

1. KIT20 cria cobrança por R$ 1.499,80.
2. KIT50 cria cobrança por R$ 3.495,00.
3. Novas compras não oferecem KIT30.
4. Pedido histórico KIT30 continua legível.
5. Checkout rejeita dados obrigatórios inválidos.
6. Pagamento confirmado provisiona exatamente uma revenda e um owner.
7. Webhook duplicado não duplica acesso.
8. Pedido inicial vira `Em separação` automaticamente.
9. BKO visualiza compra, acesso e endereço.
10. BKO abre WhatsApp manualmente e consegue redefinir senha.
11. Login correto cria sessão.
12. Senha incorreta não cria sessão.
13. Primeiro login exige troca de senha.
14. Após troca, login normal funciona.
15. Despacho funciona sem rastreio.
16. Link de indicação Mercado Livre continua funcionando.
17. Pedidos de reposição continuam funcionando no portal.
18. Estoque, movimentações e Admin permanecem funcionais.
19. `npm test` passa.
20. `npm run build` passa antes do deploy.

## 14. Deploy

- aplicar migration MySQL sem apagar dados existentes;
- configurar Asaas sandbox primeiro;
- atualizar webhook apenas após rotas novas estarem publicadas;
- remover dependência operacional de Resend;
- antes de trocar o login em produção, definir/resetar uma senha para cada conta Admin/BKO existente para evitar bloqueio administrativo;
- realizar compra sandbox ponta a ponta;
- validar criação automática da revenda e acesso;
- validar fila BKO e expedição;
- somente depois trocar para Asaas produção.

## 15. Fora de escopo da V1

- envio automático de WhatsApp;
- múltiplos usuários por revenda;
- recuperação de senha por e-mail;
- nova integração de marketplace;
- reescrita do módulo de afiliados;
- substituição completa do módulo de logística existente;
- migração destrutiva de pedidos KIT30 históricos.

## 16. Requisitos finais confirmados

- O KIT20 permanece inalterado e continua disponível na LP e nas reposições.
- Somente o KIT30 deixa de ser oferecido para novas compras; o novo KIT50 usa 50 unidades a R$ 69,90, total R$ 3.495,00.
- A aplicação final deve continuar compatível com Node.js 22 + MySQL na Hostinger e ser entregue em ZIP pronto para reenvio ao GitHub.
- A visão de métricas existente do revendedor e do Admin/BKO deve ser preservada. A atualização pode acrescentar dados de aquisição/BKO, mas não pode remover cards, estoque, vendas, pedidos, indicações, movimentos ou visão administrativa atuais.
- O BKO não precisa cadastrar manualmente um comprador pago: o pagamento confirmado provisiona a revenda automaticamente. O painel BKO deve mostrar os novos revendedores e permitir copiar acesso, abrir WhatsApp, redefinir senha e operar expedição.
