# LORD NUTRI — revisão final da LP e dos fluxos

**Versão:** 0.2.2-lordnutri-final · **Data:** 04/10/2026 UTC.

**Resultado:** revisão local concluída. A aprovação para tráfego com objetivo de compra depende da validação no ambiente publicado e dos provedores reais. Nenhuma credencial de produção foi disponibilizada neste pacote; não houve cobrança real, envio real de mensagens, alteração do banco remoto ou publicação.

## Layout corrigido

- Logo totalmente dourada, com o mesmo arquivo do manual e transparência.
- Caixa atualizada sem fundo branco, usando a mesma imagem no desktop e no celular.
- Nomes novos dos recursos para evitar reaproveitar as imagens antigas em cache.
- Setas decorativas removidas dos botões, links e chamadas da LP.
- Paleta verde, preto e dourado preservada. Pessoas em cenas completas.
- Preços dos kits, regras comerciais e manual preservados. O flyer não foi alterado nesta revisão.

## Revisão funcional

| Fluxo | Correção ou comportamento verificado | O que depende da operação real |
|---|---|---|
| CEP | Consulta ViaCEP, preenchimento de rua/bairro/cidade/UF, rejeição de CEP inexistente, tratamento de indisponibilidade e descarte de resposta antiga quando o CEP muda | Disponibilidade e conectividade com ViaCEP no servidor publicado; conferir CEP urbano e CEP geral que não contém rua |
| Frete e total | Produtos, frete e parcelamento calculados novamente no servidor; tentativa de adulterar preço no navegador não altera o valor | Tabela comercial recebida precisa ser conferida com o custo logístico contratado; não é cotação ao vivo de transportadora |
| Asaas PIX/cartão | Link de pagamento, vínculo ao parcelamento, confirmação/estorno de parcelas posteriores; token e repetição do webhook | Chave correta, ambiente, webhook cadastrado e transações sandbox/produção |
| Checkout | Proteção de envio duplo na tela, prazo compatível com as chamadas ao provedor, erro não sobrescreve pagamento já confirmado | Conferir logs e status se houver interrupção de conexão antes de criar outro pedido; idempotência financeira ponta a ponta para novos checkouts não está implementada |
| Acesso | Pagamento pendente não libera conta/estoque; recompra usa conta existente sem substituir senha; reenvio do evento não duplica estoque | Login, troca de senha e contas administrativas na base real |
| Estoque | Compra inicial e reposição confirmadas geram entrada por compra; vendas simultâneas não ultrapassam saldo nos testes; estorno antes do despacho gera uma única saída de ajuste | Conferir saldos reais e movimentações antigas. O saldo é liberado na confirmação financeira, antes da entrega física |
| Estorno após despacho | Cancela situação financeira e mantém movimentações físicas para conciliação | BKO deve tratar devolução, eventual venda já registrada e ajuste de saldo; não há devolução física automática |
| Registro de vendas | Venda e saída de estoque na mesma transação; datas inválidas, JSON malformado e quantidade acima do saldo são rejeitados | Conferir gravação persistente com MySQL e simultaneidade no ambiente real |
| Acompanhamento | Separação → Em percurso → Entregue; preserva rastreio e rejeita regressão de etapa | BKO atualiza manualmente ou um sistema externo envia o webhook. Não há rastreio GPS ou integração automática com transportadora instalada |
| Mensagens | Automação externa de boas-vindas, fallback de e-mail e aviso de expedição/entrega presentes no código | Validar destinatário, remetente/domínio, receptor externo e entrega efetiva. Falhas de e-mail de andamento são registradas; não há fila automática de reenvio desses avisos |
| Campanhas | UTMs persistem entre a entrada na LP e a seleção do kit, e são gravadas na compra | Meta Pixel, GA4/GTM e evento de compra no pagamento confirmado não estão configurados neste projeto |

## Evidências locais

- Compilação de produção concluída com TypeScript e 44 rotas.
- Suíte atual: 97 testes aprovados, zero falhas.
- Testes específicos de execução: 39 aprovados, zero falhas.
- ESLint: zero erros; um aviso de otimização de imagem no portal.
- Navegador: 1440, 768, 390 e 320 px; sem vazamento horizontal, imagens quebradas ou erros JavaScript. Logo dourada e PNG transparente confirmados em todas as larguras. Nenhuma seta decorativa encontrada no texto da LP.
- Checkout no navegador: preenchimento de endereço, descarte de frete atrasado, limpeza do endereço ao mudar CEP, seleção de KIT50 e preservação de campanha.
- Os testes de execução usam o código real com provedores e banco simulados nas fronteiras. Isso não substitui uma validação com MySQL e Asaas reais.

A base recebida tinha 16 falhas em testes que inspecionavam contratos antigos. Os arquivos originais e os nomes de todos esses testes foram preservados em `docs/legacy-tests/`. Não foram reintroduzidas tabelas/rotas antigas para satisfazê-los. A autorização atual reconhece o papel administrativo persistido e `ADMIN_EMAILS`; remover um e-mail da variável não revoga sozinho um admin já cadastrado. Para revogar acesso, inative a conta e suas sessões.

## Sequência para liberar campanhas

1. Aplicar a atualização completa e a migração aditiva. Confirmar versão publicada e abrir a LP em janela privada no PC e no celular.
2. Executar `npm run check:readiness` na hospedagem e conferir conexões reais. A saída local está pendente porque não há credenciais neste ambiente; não informa o estado das variáveis na sua Hostinger.
3. No sandbox Asaas, concluir um PIX e um cartão parcelado. Conferir valor total, pagamento, conta, uma única entrada de estoque e acesso ao portal.
4. Reenviar um evento; confirmar que não há estoque duplicado. Testar estorno antes da expedição, conferindo a saída única de ajuste.
5. Registrar uma venda, conferir saldo e faturamento, iniciar reposição e confirmar pagamento. Verificar que a conta e a senha permanecem as mesmas.
6. Avançar um pedido até entregue e conferir rastreio, atualização no portal e mensagens efetivamente recebidas. Se houver integração externa, testar seu webhook e sua autenticação.
7. Configurar a medição da campanha com seus IDs reais. Verificar o evento de compra após confirmação financeira, sem contar a abertura do checkout como compra.
8. Depois da homologação, conferir chave/ambiente de produção e fazer a primeira compra controlada, acompanhando o fluxo completo antes de aumentar orçamento.

## Referências técnicas consultadas

- Asaas, cobranças parceladas: https://docs.asaas.com/docs/criar-uma-cobranca-parcelada
- Asaas, eventos de cobrança: https://docs.asaas.com/docs/webhook-para-cobrancas
- Asaas, cartão e fatura hospedada: https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
- ViaCEP: https://viacep.com.br/
