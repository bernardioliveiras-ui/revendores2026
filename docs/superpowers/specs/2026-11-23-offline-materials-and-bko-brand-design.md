# Acesso manual a materiais e marca do BKO — design

## Objetivo

Permitir que o administrador libere ou revogue **somente o acesso ao PDF/manual e aos materiais** de revendedores com pagamento externo comprovado, sem alterar o registro de compra, cobrança do Asaas, estoque, senha ou vínculo existente. Corrigir a apresentação do título `LORD NUTRI / BACKOFFICE PRO` na barra lateral do BKO. Padronizar o ícone de instalação do PWA com fundo preto e marca dourada centralizada.

## Abordagens consideradas

1. **Escolhida: histórico de concessões em tabela separada**, com última decisão determinando a autorização, operação administrativa explícita e motivo/comprovante obrigatórios. Preserva toda a semântica das compras.
2. Marcar o pedido como confirmado pelo Asaas: rejeitada, pois falsearia uma verificação financeira.
3. Transformar o perfil do revendedor em cadastro manual: rejeitada, pois apagaria a distinção entre uma compra real e um cadastro administrativo.

## Regras

- Apenas administrador autenticado pode consultar, conceder ou revogar; mutações exigem origem idêntica, confirmação, e-mail conferido, justificativa e referência de comprovante na concessão.
- A permissão extra vale somente para conta `reseller` ativa, dentro das mesmas verificações de sessão e senha que já protegem os PDFs; jamais torna um usuário anônimo elegível.
- Eventos `grant` e `revoke` são imutáveis e registram administrador, data e motivo; a decisão mais recente governa a permissão. A revogação não anula um acesso legitimamente obtido por compra confirmada ou cadastro manual.
- Nenhuma rota escreve em `purchases`, `stock_movements`, `reseller_profiles` ou no status Asaas.
- A tabela é criada de forma aditiva e segura no primeiro acesso, preservando bancos existentes. Falhas de banco **negam** acesso.
- No BKO, botão de gerenciamento junto a cada revendedor, com formulário e estado atual, sem expor dados ou controles a revendedores.
- A marca usa bloco flex vertical para `LORD NUTRI` e `BACKOFFICE PRO`, tanto em desktop quanto em mobile, sem interferir no botão de menu.
- O PWA usa `background_color` e `theme_color` pretos, ícone de 512×512 opaco para `any`/`maskable` e os mesmos motivos no favicon de aplicação e ícone Apple. Preservar o PNG transparente original do logo.

## Verificação

Testes de negação por padrão, concessão, revogação, auditoria, autorização de PDF e materiais, proteção de mutações, regressão de estilo da marca e configurações do manifesto PWA. Build do Next.js quando dependências estiverem disponíveis.
