# Studio Visual Stable 1.5

Esta versão foca em paridade real entre editor e landing publicada.

O Studio trabalha somente com **Computador (acima de 700 px)** e **Celular (até 700 px)**. Overrides de um modo não vazam mais para o outro. Propriedades que tiram elementos do fluxo responsivo são ignoradas no preview e na publicação.

O checkout, simulador e avaliações Google são slots protegidos. Se o checkout não montar no slot publicado, a página renderiza um fallback funcional antes do rodapé para não interromper vendas.

A revisão também adiciona um acabamento global de layout: shell central, grids previsíveis, imagens contidas, ausência de margens negativas e remoção das animações de flutuação.
