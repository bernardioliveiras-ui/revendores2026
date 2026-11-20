# LORDNUTRI 0.5.4 — TOPBAR FIX

## Correção

A faixa dourada superior (`.lnr-announce`) agora é um bloco estrutural do Page Builder.

- aparece em **Camadas / seções** como **Faixa dourada do topo**;
- o **Cabeçalho / menu** também passa a ser bloco estrutural do builder, mantendo a ordem correta topo → menu → landing;
- pode ser ocultada/exibida como um bloco inteiro;
- não pode ser duplicada, evitando barras de topo duplicadas acidentalmente;
- ao ocultar, desaparecem também os separadores circulares, evitando o estado em que sobravam apenas dois pontos;
- documentos salvos em versões anteriores recebem o novo bloco na posição original do topo, sem movê-lo para o fim da landing page.

A lógica do checkout, Asaas, simulador e demais seções não foi alterada.
