# LORD NUTRI — 0.2.4

## Revisão solicitada

- Tipografia tradicional Arial/Helvetica, títulos sem itálico, números tabulares.
- Cenários do briefing em três quadros: 1, 2 e 3 caixas por dia em 26 dias, com ganhos brutos de ambos os kits.
- Calculadora em uma grade própria: campos alinhados acima, KIT20 e KIT50 com os mesmos indicadores e posições.
- Distinção entre faturamento, ganho bruto e valor após despesas. A meta de ganho bruto determina as caixas necessárias; despesas são descontadas do ganho bruto, sem mudar essa meta para líquida.
- Ativos em quadros legíveis, kits com destaque para o ganho bruto ao vender todas as caixas pelo preço de referência.
- Chamadas, títulos, pilares e FAQ alinhados ao briefing. Dado de mercado com fontes IMARC e ABIAD no rodapé.
- Revendedor, BKO e login claros, com logo original e detalhes dourados.
- Entrada do revendedor em Boas-vindas; menu: Boas-vindas, Manual do revendedor, Visão geral, Acompanhe seu pedido, Estoque. Vendas preservada após essas áreas para manter o registro operacional.
- Vídeo de boas-vindas mostrado somente quando configurado; o manual continua usando a configuração existente.

A embalagem informa 30 cápsulas. Mantida essa informação sem presumir equivalência com as 30 porções mencionadas no briefing.

## Validação e limites

Build de produção/TypeScript aprovado. Treze testes focados: preços, fluxo de checkout, cashback e cálculos dos cenários. Verificação em navegador nas larguras 320, 390, 768 e 1440; seleção dos kits, calculadora, ausência de margem, consulta local de frete, logo e favicon.

Painéis autenticados conferidos com dados fictícios locais. Nenhum pagamento ou pedido real foi criado. A suíte legada completa apresentava 25 falhas no pacote original; não houve validação integral do backend em produção. Esta revisão não modifica a integração Asaas, o banco ou as credenciais.

## Aplicação

Substitua os arquivos do projeto por este pacote e faça novo build, preservando as variáveis de ambiente do servidor. Prévia e capturas estão na pasta PREVIAS. Esta entrega não publica automaticamente.
