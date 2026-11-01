# Backend, revendedores e BKO — revisão 1.8.0

Revisão local de 09/10/2026. Os testes executam o código entregue com fronteiras MySQL/HTTP simuladas, sem cobranças, mensagens ou alterações de contas reais.

## Defeitos reproduzidos e corrigidos

| Fluxo | Problema | Correção |
| --- | --- | --- |
| Login concorrente | Tentativas erradas simultâneas sobrescreviam o contador. | Transação e lock serializam a atualização; bloqueio testado com oito tentativas. |
| Senha corrompida | Digest scrypt vazio podia aceitar senha incorreta. | Validação estrita de salt/digest antes da comparação. Não há evidência de hashes corrompidos no banco real. |
| Sessão | Cookie com escape inválido lançava URIError. | Cookie inválido vira sessão ausente. |
| Login | JSON nulo ou malformado gerava erro interno. | Rejeição 400 sem sessão. |
| Manual PDF | Indisponibilidade de banco/arquivo/CMS era confundida com falta de permissão. | 401/403 para acesso, 503 para dependência indisponível; PDF continua protegido. |
| Manual em API antiga | `/api/public/cms/manual` expunha texto publicado sem a autorização do PDF. | Endpoint aposentado com 410 antes de ler o CMS. Edição admin e PDF autenticado preservados. |
| Conteúdo do BKO | Resposta atrasada de uma aba podia sobrescrever outra e permitir salvar conteúdo no tipo errado. | Cancelamento de carga, verificação do tipo e bloqueio de troca durante gravação. Clicar a aba ativa é no-op. |
| Checkout | Referer completo podia persistir query/fragmento com dados pessoais. | Armazena somente origem e caminho. |
| Boas-vindas | Fallback Resend não usava a chave de idempotência existente. | Chave estável por pedido/geração de senha; nova senha tem nova geração. |

As regressões foram executadas antes e depois das respectivas correções. Os testes antigos do manual também precisavam de atualização das fronteiras simuladas; agora usam o gerador real de PDF e uma imagem privada do pacote.

## Fluxos preservados e testados

- Sessão: token adulterado, expiração, conta inativa, logout e cookies protegidos.
- Revendedor: senha temporária, troca obrigatória e autorização de manual por compra paga/liberada.
- BKO: anônimo/revendedor sem acesso administrativo; aprovação repetida não duplica conta/estoque; reset revoga sessões e prepara nova senha.
- Asaas: token, identidade de evento, repetição, parcelas, pedido ainda não pronto e recuperação após falha de provisionamento.
- Estoque/vendas: provisionamento idempotente, recompra preservando senha, vendas concorrentes sem estoque negativo e estorno anterior à expedição tratado uma vez.
- Automação: pedido pendente não envia acesso; falha permite retry; segredo de boas-vindas é eliminado após sucesso.
- Checkout: kit/frete/parcelas calculados no servidor; preço adulterado ignorado; falha não sobrescreve confirmação concorrente.
- Logística: rastreio preservado e regressão de status rejeitada. Cashback e indicação mantêm as regras existentes.
- Conteúdo: Manual, Produtos e Mídia/Boas Vindas mantêm salvar/publicar/upload; editor da landing removido.

## Mensuração opcional adicionada

Compra paga pode gerar GA4/Meta pelo servidor, com snapshot consentido, confirmação do navegador de que guardou o recibo de retirada, fila durável, deduplicação e retries. Valores vêm do pedido confirmado; pending/cancelled/sem consentimento/sem IDs/sem ativação não enviam Purchase. Falhas de mensuração não bloqueiam pagamento ou provisionamento. A aprovação manual isolada não gera receita publicitária.

A revisão independente identificou e corrigiu três casos: pedidos aprovados manualmente bloqueando a recuperação da fila; desativação do envio impedindo limpeza de identificadores; e retirada durante checkout pendente perdendo o recibo. A elegibilidade agora exige ACK do navegador. Configuração completa: `SEO-TRAFEGO-1.8.0.md`.

## Resultado e limites

Suíte final integrada: **194 testes aprovados, zero falhas**. Build e verificação visual estão registrados em `VALIDACAO-1.8.0.md`.

Não houve conexão com o MySQL/Asaas/Resend/WhatsApp das contas reais. Locks físicos do banco, proxy/cookie, entrega de mensagens, recibo real das conversões e configurações externas precisam da homologação descrita no guia. A flag de troca obrigatória preserva a semântica existente; não foi criado um bloqueio global novo de todas as APIs.

Idempotência externa depende também do prazo e comportamento do fornecedor. Após expedição, cancelamento preserva o estoque físico para conciliação operacional. Conversões já enviadas não recebem ajuste automático de estorno nesta versão.

O relatório intermediário com as falhas históricas de Studio/markup permanece em `historico/revisao-backend-intermediaria-1.8.0.md.txt`. Os 20 contratos exclusivos do editor retirado foram arquivados, com sua substituição documentada. Nenhuma falha de negócio foi marcada como sucesso para fechar a entrega.
