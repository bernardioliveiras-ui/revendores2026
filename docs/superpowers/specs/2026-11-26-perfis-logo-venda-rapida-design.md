# LORD NUTRI — Perfis, nova marca e venda rápida (proposta)

**Data:** 26/11/2026 · **Status:** aguardando aprovação do proprietário.

## Objetivo

Dar identidade própria aos revendedores/influenciadores e reduzir o esforço para registrar vendas, com estoque real atualizado e histórico íntegro. Reforçar a nitidez e o contraste da marca em toda a plataforma.

## Escopo desta entrega

1. **Meu Perfil para os dois papéis:** foto opcional e biografia curta editáveis pelo titular. Exibição no próprio portal, cabeçalhos e BKO, sem tornar dados públicos automaticamente.
2. **Identidade visual:** substituir a logo antiga pelo arquivo enviado pelo usuário, `2048 × 2048` PNG RGBA, e otimizar sua utilização em desktop/celular. Atualizar logo completa, símbolo compacto e elementos de login/landing/BKO/portais; preservar os ícones instaláveis 512×512 e os favicons específicos já nítidos, para evitar transparência inadequada no PWA. Preservar marca e tipografia.
3. **Revendedor sem aba Indicações:** retirar navegação e a tela obsoleta da área do revendedor, mantendo registros no banco e demais operações intactos.
4. **Venda rápida responsiva:** nova interface mobile-first, quantidade com botões grandes de `−` e `+`, saldo disponível, quantidade a baixar, saldo estimado depois, **preço fixo inicial R$ 109,90 definido exclusivamente pelo BKO** e total. Botão principal visível. Canal, nome do cliente e observações em seção opcional expansível. Histórico de vendas com cartões compactos em celular e PC.
5. **Registro contábil seguro:** manter `/api/sales` como fonte de verdade, validar quantidade positiva e estoque em transação, **ignorar o preço enviado pelo navegador** e usar a configuração oficial do BKO, registrar `sales` mais `stock_movements` e atualizar saldo/últimas vendas após resposta do servidor. Adicionar proteção server-side contra repetição involuntária de uma mesma solicitação ao tocar duas vezes/repetir requisição.
6. **Controle BKO:** tela autenticada para mudar o preço por caixa, com registro de auditoria de cada alteração. Mudanças futuras não recalculam vendas passadas nem preços de checkout/Asaas.

## Não objetivos

- **Sem notificações nesta versão:** nenhum Web Push, pop-up de incentivo, permissões do navegador, cron novo ou variáveis VAPID.
- Não apagar histórico de indicações, dados pessoais anteriores, vendas, estoque, remessas, pedidos ou pagamentos.
- Não alterar os cálculos e confirmações do Asaas nem os eventos dos Correios.
- Não abrir perfis pessoais para a internet sem uma decisão posterior específica.

## Abordagens e decisão proposta

- **Venda A (escolhida):** cartão de venda rápida com quantidade, valor fixo administrado pelo BKO e total visíveis, sem campo de edição de preço para o revendedor, com mais detalhes opcionais. Resultados e estoque após a venda em destaque. Menos rolagem no celular.
- **Venda B (alternativa):** mesmo formulário atual reorganizado em colunas e com indicadores. Menor mudança de UI, mas mantém campos demais no caminho.
- Para imagem pessoal, guardar foto JPEG/PNG/WebP de até 2 MB numa tabela própria MySQL (sem pasta volátil), validar MIME/assinatura e limitar o tamanho bruto; a biografia fica em coluna de perfil associada a `users` e limitada a 160 caracteres. Otimização adicional de dimensões fica para uma fase futura.
- Para a marca, reutilizar o logo enviado como fonte fiel; evitar recriação gerativa que distorça o desenho. Em espaços pequenos usar símbolo compacto preparado a partir de arte existente, mantendo alto contraste.

## Comportamento visível esperado

- Tela de venda exibe antes de salvar: `Saldo: 50 | Vender: 3 | Restarão: 47 | Total: R$ 329,70` (exemplo).
- Após confirmação do servidor, estoque visível passa a 47, a venda aparece no histórico, e o botão é reabilitado. Se houve outra venda, o backend impede saldo negativo e solicita atualização.
- Se estoque estiver zerado, mostrar reposição e acesso ao histórico, sem permitir registro.
- O preço de R$ 109,90 é configurado somente pelo BKO. O servidor registra o valor efetivo vigente no instante da venda e impede que alterações maliciosas no navegador modifiquem o faturamento.
- O usuário escolhe foto da galeria, visualiza miniatura e pode trocar/remover. Quem não possui foto vê iniciais. Bio e fotos não influenciam controle financeiro.

## Segurança e testes

- Rotas autenticadas e mesmo domínio, limite de imagem e validação de arquivo real, tratamento seguro de metadados e sem HTML na biografia.
- Unicidade de requisição de venda com ID de operação; nenhuma venda é escrita duas vezes por repetição idêntica.
- Migrar banco de forma aditiva sem `DROP`, reset ou deleção de histórico.
- Testes red/green de perfil, permissões, validação de imagem e bio, cálculo de saldo, duplicidade, estoque insuficiente, tela responsiva e ocultação de indicações; `tsc`, `npm run build`, testes direcionados e comparação com baseline antes de criar ZIP completo e ZIP leve.

## Aprovação pedida

**Aprovado pelo proprietário na conversa:** Venda A, com preço de R$ 109,90 travado para o revendedor, exclusivo do BKO; detalhes opcionais, nova logo, perfil privado e sem notificações. Prosseguir com o plano e implementação.
