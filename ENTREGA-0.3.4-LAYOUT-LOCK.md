# LORDNUTRI Revendedores — Entrega 0.3.4

## Ajustes desta rodada

### Bloco institucional LORD NUTRI
Texto-base revisado para:

- E QUEM ESTÁ POR TRÁS DE TUDO ISSO?
- LORD NUTRI
- A marca por trás do programa de revendedores MIX10 PRO.
- A LORD NUTRI conecta produto, operação e suporte para tornar a revenda mais simples, organizada e segura.
- O MIX10 PRO é o produto central dessa jornada: uma proposta diferenciada para um consumidor que valoriza cuidados, bem-estar, mobilidade e qualidade de vida.

Overrides antigos especificamente desse bloco são ignorados para retirar a copy incorreta/repetitiva já salva na geração 0.3.x. A partir desta versão, novas edições desse bloco são salvas normalmente nas novas chaves estáveis.

### Pessoas integradas ao fundo
- Removido o comportamento visual de card/foto protagonista.
- As cenas ficam com menor opacidade, menor saturação/brilho e máscara radial/gradientes de integração.
- Removida a animação de flutuação das duas cenas com pessoas.
- Desktop: cena lateral discreta, como ambientação editorial.
- Celular: cena suavizada abaixo/ao fundo da copy, sem moldura retangular.

### Conteúdo / CMS protegido
- As chaves do editor agora são estáveis por seção (`inicio`, `lord-nutri`, `mix10pro`, `modelo`, etc.).
- Inserir uma nova seção acima não deve mais fazer uma edição aparecer no texto errado de outra seção.
- Somente folhas de texto, identidade de marca controlada e textos com quebra de linha conhecida são editáveis.
- Blocos compostos com `strong`, `span`, grid, card ou outras estruturas não recebem substituição genérica de conteúdo.
- Spans internos de LORD NUTRI e MIX10 PRO não aparecem como campos separados.
- A API da Landing salva somente `overrides` de texto e `imageOverrides`: HTML, classes, CSS, ícones e estrutura não são persistidos pelo CMS.
- Compatibilidade com overrides 0.3.x foi preservada onde a posição antiga continua confiável.

## Preservado
- Avaliações do Google e link informado pelo cliente.
- CTA para conhecer/comprar uma unidade em https://mix10pro.com.br/lp-v2.
- Processo ANVISA 2535115572620267.
- Checkout, Asaas, estoque, liberação de acesso, notificações, BKO, portal, mídia e manual de 22 páginas.

## Validação desta rodada
- 10/10 testes estruturais focados em CMS, Google, imagens e layout: aprovados.
- `components/content-runtime.tsx` validado em TypeScript `strict` com DOM/ES2022: aprovado.
- Arquivos TS/TSX alterados passaram por validação de sintaxe TypeScript.

A suíte completa não foi usada como critério desta entrega no ambiente de empacotamento porque a instalação local de dependências disponível estava incompleta (pacote `typescript`/type definitions faltando). Na Hostinger/GitHub, use a instalação limpa normal do projeto.

## Hostinger
- Node.js: 22
- Build: `npm run build`
- Output: `.next`
