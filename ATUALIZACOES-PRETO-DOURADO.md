# LORD NUTRI — apresentação revisada 0.2.2

- Layout público reconstruído com escala tipográfica, espaçamentos e componentes consistentes.
- Logo original transparente em arquivo novo para evitar cache antigo, sem recorte nem duplicação.
- Favicon explícito com o símbolo LORD NUTRI.
- Caixa inteira em PNG transparente; removido o banner de montagem cortado.
- Área do produto, constituintes e benefícios nutricionais, jornada da revenda, calculadora, kits, checkout, avaliações e perguntas frequentes.
- Blocos de vídeo exibidos somente quando há vídeo configurado.
- Comparador de kits sincronizado com o checkout; calculadora informa quando não existe margem.

O pagamento real depende da configuração Asaas/MySQL do ambiente. Esta entrega não altera credenciais nem publica automaticamente em produção.

## Verificações desta entrega

- Compilação de produção e TypeScript aprovados.
- Logo original em PNG RGBA, um único elemento e sem clip-path. Favicon SVG respondendo corretamente.
- Caixa em PNG RGBA com transparência real.
- Verificação em navegador a 320, 390, 768 e 1440 pixels, sem largura excedendo a tela.
- Escolha dos kits refletida no checkout; calculadora com meta de R$ 4.000 e aviso de ausência de margem abaixo do custo.
- Consulta ao endpoint local de frete: KIT20 e CEP 06400-000, produtos R$ 1.498,00 + frete R$ 26,50 = R$ 1.524,50.
- Entrada, área do revendedor e BKO inspecionados. Os painéis autenticados foram avaliados com dados fictícios locais, sem alterar cadastros.
- Nenhum pagamento real foi realizado e nenhum pedido foi criado.
- A suíte completa legada já apresentava 25 falhas no arquivo originalmente enviado; esta revisão trata a apresentação e os fluxos de interface citados. Não constitui validação integral do backend em produção.

## Publicação

Substitua os arquivos do projeto pelos deste ZIP e refaça o build. Preserve as variáveis de ambiente já configuradas no servidor. Os novos nomes dos arquivos de marca evitam reaproveitamento das versões antigas em cache. Caso o navegador ainda mostre a versão anterior, atualize com Ctrl+F5 após o novo deploy.
