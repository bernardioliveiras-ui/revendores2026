# LORDNUTRI 1.2.0 — Studio Nested Flow

Esta revisão corrige a principal limitação do Studio Flow: elementos agora podem ser movidos entre containers responsivos sem posição absoluta.

## O que mudou

- Drag-and-drop entre cards, blocos e seções.
- Drop no centro de um container insere o elemento dentro dele.
- Novos elementos são criados dentro do bloco selecionado, não no shell externo.
- Painel de Camadas também aceita mover um item para dentro de outro bloco.
- `+ Destaque` cria um bloco pronto `R$ 10 mil/mês` centralizado e dourado.
- `+ Bloco` cria um container responsivo reutilizável.
- Cards/containers ganharam controles rápidos de fundo, borda, gap e presets de layout.
- Componentes funcionais protegidos (Checkout, Simulador e Google dinâmico) podem ser reposicionados como blocos, mas a lógica interna continua bloqueada.
- Continua sem `position:absolute`, X/Y ou edição livre por coordenadas.
- Desktop, Tablet e Celular continuam com estilos por breakpoint.

## Regra de uso

Selecione um card ou seção antes de usar `+ Texto`, `+ Destaque`, `+ Botão`, `+ Imagem` ou `+ Bloco`. O elemento novo será criado dentro do container selecionado.

Para mover um elemento existente para outro card, selecione-o e arraste sobre o centro do card de destino até aparecer o contorno verde tracejado.

## Preservado

- Checkout e integração Asaas.
- KIT20: R$ 1.498,00.
- KIT50: R$ 3.495,00.
- Processo ANVISA: 2535115572620267.
- Avaliações com CTA exclusivo para Google.
