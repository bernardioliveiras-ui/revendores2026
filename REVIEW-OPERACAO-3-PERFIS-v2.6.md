# LORD NUTRI — revisão v2.6: boas-vindas manuais sem integração WhatsApp

## Fluxo confirmado no código
1. Revendedor se cadastra e o pedido é registrado como pendente.
2. Webhook Asaas com `ASAAS_WEBHOOK_TOKEN` válido recebe confirmação/recebimento e marca `paid` + `asaas_verified_at`.
3. `provisionPaidPurchase` cria a conta do revendedor (perfil `reseller`), senha provisória com troca obrigatória, estoque inicial; repetições são idempotentes.
4. Nenhuma mensagem é disparada pelo webhook. `welcome_status` permanece `pending`.
5. ADMIN/BKO → **Pedidos e acessos**: no pedido pago com acesso criado, **Abrir WhatsApp** abre `wa.me` com mensagem pré-preenchida e sem a senha; **Abrir e-mail** abre o cliente local com `mailto:`. Ambos são disparados apenas pelo clique do BKO.
6. Para compartilhar o acesso provisório existente, clique **Ver acesso**; o servidor devolve o segredo apenas para o ADMIN/BKO, sem redefinir senha. Se indisponível, **Gerar nova senha**. A senha não entra no endereço `wa.me` ou `mailto:`.
7. O BKO revisa, envia e somente depois clica **Marcar boas-vindas enviadas**. Precisa confirmar o canal. A API exige sessão ADMIN e confirmação explícita; o registro não prova entrega no WhatsApp/e-mail.
Nenhuma senha é adicionada à URL de WhatsApp ou `mailto:`. Compartilhe-a diretamente com o destinatário, preferindo um canal privado de confiança.

**WhatsApp**: a ação não depende de WhatsApp Business API, WhatsApp Cloud API, token nem provedor externo. Exige WhatsApp Web ou aplicativo disponível no dispositivo do BKO. `mailto:` exige cliente de e-mail configurado, ou pode-se copiar e enviar pelo provedor de e-mail usado pelo BKO.

**Três perfis em foco:** `admin`, `reseller`, `indicator`. Há também `client_indicated` legado, que não deve ser apagado sem migração específica. Cadastro do influenciador, campanha e cashback são distintos dos de revendedor.

## Roteiro de homologação na Hostinger/Asaas Sandbox
- Pedido pendente: zero acesso habilitado e zero mensagem automática.
- Pagamento confirmado via webhook autenticado: um perfil `reseller`, um estoque inicial e status `pending`.
- Reenviar o mesmo evento: estoque e conta não duplicam; nenhuma mensagem é disparada.
- Pedido pago: abrir WhatsApp e e-mail; a mensagem deve incluir o endereço do portal e **não** senha ou token. Abrir e fechar o link mantém o status pendente.
- Registrar envio exige confirmar canal no BKO. Registros repetidos são idempotentes. Outro perfil não pode acionar `/api/admin/welcome`.
- Revendedor troca senha no primeiro login. Influenciador só vê seu próprio portal, aceita termos e acompanha campanhas sem acesso a BKO.
- Estornos e cobranças canceladas: conferir acesso, estoque e reversões separadamente antes de lançar.

## Limites
Testes locais não comprovam deploy, banco Hostinger, webhook Asaas de produção, entrega por WhatsApp/e-mail ou recepção das mensagens. Não houve publicação ou exclusão remota. Não compartilhe credenciais, tokens ou prints de senhas.
