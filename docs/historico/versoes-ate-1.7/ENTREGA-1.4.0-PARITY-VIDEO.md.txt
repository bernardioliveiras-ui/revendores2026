# LORDNUTRI 1.4.0 — Studio Parity + Vídeo de Boas-vindas

## O que muda no Studio LP

- O editor passa a ter somente **Computador** e **Celular**.
- Computador é renderizado internamente em viewport real de **1366 px** e Celular em **390 px**.
- O canvas pode ser reduzido visualmente para caber no BKO, mas o iframe mantém a viewport real; por isso os media queries do preview são os mesmos da landing publicada.
- Overrides mobile do Studio passam a usar exatamente `@media(max-width:700px)`, igual ao breakpoint principal da landing.
- Overrides antigos de Tablet do Studio são descartados ao sanitizar/salvar.
- Continua sem posição absoluta/X-Y: o layout permanece em fluxo (flex/grid/blocos).
- Checkout, simulador e avaliações Google continuam protegidos.

## Vídeo no Portal do Revendedor

Em **BKO → Conteúdo → Mídia** existe agora a configuração **Vídeo da aba Boas Vindas**.

É possível:

- colar link de YouTube;
- colar link de Vimeo;
- colar URL HTTPS de vídeo direto;
- enviar MP4/WebM/Ogg de até 12 MB e usar o arquivo no portal.

Após escolher o vídeo, clique em **Publicar** na área Conteúdo. O Portal do Revendedor lê apenas a configuração publicada. As variáveis antigas `VSL_EMBED_URL` e `VSL_VIDEO_URL` continuam como fallback.

## Segurança

A configuração do vídeo não altera checkout, Asaas, estoque, acessos ou pedidos. O upload aceita somente imagem ou os formatos de vídeo liberados.
