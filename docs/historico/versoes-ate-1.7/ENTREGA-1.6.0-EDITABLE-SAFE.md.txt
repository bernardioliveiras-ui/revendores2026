# LORDNUTRI 1.6.0 — EDITABLE SAFE

Objetivo desta revisão: permitir reconstruir áreas visuais da landing sem perder checkout, simulador ou dados dinâmicos do Google.

Principais mudanças:
- Checkout recebe CSS de segurança depois dos estilos do Studio e não pode permanecer oculto por estilos antigos.
- Se o slot do checkout sumir de um projeto antigo, o runtime recria o slot/section antes do rodapé e monta o CheckoutForm novamente.
- Containers que possuem um slot protegido podem receber novos textos, títulos, destaques, botões, imagens e blocos.
- Novo comando "Limpar conteúdo editável deste bloco" remove a parte visual do bloco preservando automaticamente funções críticas.
- Textos com BR, STRONG, EM, B, I, SMALL, U e MARK passam a ser editáveis no inspector.
- Continua sem posicionamento livre/X-Y. Computador e Celular permanecem os únicos modos.
- app/page.tsx (copy/layout-base) não foi alterado nesta revisão.

Validação local:
- 9/9 testes focados (Studio 1.6 + Asaas + páginas legais) aprovados.
- landing-studio-builder.tsx, studio-published-landing.tsx e content-studio.ts passaram na transpilação TypeScript de sintaxe.
