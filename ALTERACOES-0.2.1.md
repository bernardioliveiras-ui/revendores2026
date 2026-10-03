# LORDNUTRI Revendedores - 0.2.1 final

## Landing page
- O texto existente da 0.2.1 foi preservado; a atualização principal é visual/estrutural.
- Layout reorganizado em linguagem editorial premium, com hierarquia inspirada no material visual de revendedores, sem copiar a paleta do PDF de referência.
- Logo LORDNUTRI GROUP e imagens PNG do MIX10 PRO aplicadas em posições responsivas.
- Nova seção de avaliações Google integrada ao Place ID oficial informado. Sem chave de Places, a LP exibe os atalhos para o perfil; com `GOOGLE_PLACES_API_KEY`, nota e avaliações públicas são carregadas automaticamente.
- SEO reativado: metadata, Open Graph, robots, sitemap, manifest e JSON-LD de organização.

## Checkout
- KIT20 = R$ 1.498,00 e KIT50 = R$ 3.495,00.
- Frete por CEP com Econômica/Expressa.
- PIX e cartão de 1x a 6x.
- 1x sem taxa; 2x a 6x com regra recuperada de 2,99% a.m. pela Tabela Price.
- Backend recalcula kit, frete, parcelas e total antes de criar a cobrança Asaas.

## Portal do Revendedor
- Campo de quantidade de caixas vendidas agora aceita digitação direta e também botões + / -.
- Validação impede vender mais caixas que o estoque disponível.
- Ao registrar a venda, o estoque é baixado automaticamente.
- Reparação automática recria entrada de estoque de compras pagas quando uma implantação antiga deixou a movimentação pendente.
- Manual novo publicado em `/manual/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO.pdf`.

## BKO
- Área de Vendas permite escolher o revendedor e lançar a quantidade de caixas vendidas em nome dele.
- Mesma validação de estoque do portal do revendedor.
- Se o e-mail estiver em `ADMIN_EMAILS`, uma conta existente passa a ter acesso de BKO no próximo login.
- Tela de BKO exibe estado de retry em vez de ficar em branco quando o banco não responde.
- APIs operacionais executam reparo aditivo de schema em runtime para tabelas/colunas de vendas, estoque, perfis e campos de compra, útil quando a Hostinger inicia o Next sem executar o hook customizado de migration.

## Manual do Revendedor
- 11 páginas em formato apresentação/PDF.
- Capa + 4 páginas de LORDNUTRI/modelo/operação e 6 páginas de MIX10 PRO/venda/boas práticas/pós-venda.
- Arquivos editável PPTX e PDF final incluídos no projeto.

## Hostinger / Next.js 16
- `npm run build` continua usando `next build --webpack` para evitar o panic do Turbopack observado no ambiente da Hostinger.
- O diretório de saída continua `.next`.

## Refinamento visual final da LP

- LP compactada visualmente, mantendo a versão 0.2.1 e os fluxos funcionais existentes.
- Estrutura visual aproximada da referência de revendedores fornecida, sem copiar sua paleta.
- Identidade LORDNUTRI aplicada com azul-marinho, dourado e creme.
- Hero reposicionado antes da apresentação em vídeo e logo integrada aos blocos institucionais.
- Avaliações do Google movidas para a área institucional LORDNUTRI, antes da seção do produto.
- Seção MIX10 PRO ganhou resumo visual de cápsulas, constituintes e composição declarada, sem remover o texto comercial existente e sem promessas terapêuticas.
- Espaçamentos, cards, galerias, simulador, kits, checkout e FAQ compactados.

## Consolidação funcional final
- Navegação do Portal do Revendedor organizada exatamente em: Boas Vindas → Visão Geral → Manual do Revendedor → Estoque → Vendas → Acompanhe seu Pedido.
- Reposição de estoque deixou de ser apenas botão visual: agora calcula frete/parcelamento, cria um novo pedido e abre a cobrança no Asaas.
- Quando o Asaas confirma a reposição, o webhook reutiliza o mesmo provisionamento idempotente e adiciona o novo lote ao estoque do revendedor sem criar outra conta nem trocar sua senha.
- Pedidos pendentes exibem link para continuar o pagamento no Asaas e todos os pedidos aparecem no acompanhamento do portal.
- Confirmação do primeiro pagamento cria/libera o acesso, gera senha provisória quando necessário e dispara boas-vindas por automação externa ou, como fallback, por e-mail via Resend.
- Mudanças de expedição para Em percurso/Entregue podem vir do BKO ou do webhook logístico e disparam e-mail de acompanhamento quando o Resend está configurado.
- Manual do Revendedor incorporado dentro do portal, com PDF final de 11 páginas: 5 páginas de LORDNUTRI/modelo/operação e 6 páginas de MIX10 PRO/produto/ativos/venda/boas práticas/relacionamento.
- Favicon alterado para o símbolo dourado LORDNUTRI.
- LP final remove a galeria/mosaico antigo, posiciona reputação/Google junto da área institucional LORDNUTRI e usa apenas os PNGs atuais do produto nas áreas públicas.

## Variáveis para automações
- `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT` e `ASAAS_WEBHOOK_TOKEN`: cobrança e confirmação automática.
- `RESEND_API_KEY` + `WELCOME_EMAIL_FROM` (ou `EMAIL_FROM`): e-mail de acesso/boas-vindas e atualizações de entrega.
- `WELCOME_AUTOMATION_URL` + `WELCOME_AUTOMATION_TOKEN`: opcional; quando preenchido, tem prioridade e pode cuidar de e-mail + WhatsApp.
- `SHIPPING_WEBHOOK_TOKEN`: opcional; permite que logística externa atualize Separação/Em percurso/Entregue.

## Revisão de tipografia e impacto da LP
- Textos e lógica da versão consolidada foram preservados.
- Headline da LP passou a usar tipografia sans-serif de alto impacto e escala maior.
- O bloco existente de `R$ 10 mil de ganho bruto` recebeu destaque editorial com borda dourada, brilho animado e seta em movimento; não foi adicionado contador ou falsa escassez.
- CTA principal recebeu pulsação visual sutil.
- Títulos, subtítulos, cards, kits e avaliações tiveram tamanhos mínimos maiores para melhorar leitura e impacto em desktop e celular.
- Animações respeitam `prefers-reduced-motion`.

## Ajuste visual — logo integrada sem fundo
- A marca principal agora usa `public/brand/lordnutri-logo.png`, com transparência real, em vez da arte quadrada com fundo creme.
- Cabeçalho, login, portal e áreas claras preservam a logo completa sem recorte.
- Em superfícies escuras (hero interno e sidebar), usa-se o símbolo dourado transparente para manter contraste sem parecer uma imagem colada.
- `object-fit: contain` é forçado nos pontos de marca para impedir corte da arte.
