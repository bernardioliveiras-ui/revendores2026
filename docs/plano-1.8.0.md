# LORD NUTRI 1.8.0 — implementação e validação

> Execução: alterações locais na cópia isolada do ZIP, revisão por domínio e validação integrada antes da entrega.

## Objetivo e limites
Atualizar a apresentação da landing existente para celular e computador, mantendo literalmente os textos do briefing/CMS, a área e a identidade da logo, o dourado LORD NUTRI e o verde MIX10PRO. Revisar bugs confirmados do backend e preparar SEO e mensuração Google/Meta. Não publicar nem acionar serviços de pagamento reais durante os testes.

## Decisões de interface
- Consolidar `app/landing.css`, substituindo a cascata histórica por um sistema responsivo único. Tipografia corporativa sem fontes externas; hierarquia forte, bom contraste e alvos de toque acessíveis.
- Tornar a meta R$ 10 mil/mês o elemento numérico dominante, visualmente separado do CTA. Manter seus qualificadores existentes, sem criar contagem regressiva, garantia de renda ou escassez fictícia.
- Integrar as pessoas com recortes transparentes em WebP, máscaras CSS e contraste legível, sem quadros; preservar a arte da logo e usar seu original de maior resolução.
- Incorporar o conteúdo publicado em componentes React e remover o Studio, sem substituir a copy. Preservar formulários, simulador e links funcionais.

## Tarefas
- [x] Registrar baseline: testes, build e HTML publicado; distinguir testes históricos de bugs atuais.
- [x] Backend: reproduzir falhas de manual/autenticação/checkout e corrigir somente causas confirmadas com testes comportamentais.
- [x] SEO/tráfego: canonical, sitemap, robots, previews sociais, IDs configuráveis, consentimento e eventos reais sem confundir pedido pendente com compra paga.
- [x] Frontend: consolidar estilos e normalizar sem perda de conteúdo as estruturas legadas do Studio; conferir 320, 390, 768, 1024 e 1440 px.
- [x] Verificar texto preservado, fotos carregadas, navegação, formulários, cálculo, ausência de rolagem horizontal, SEO renderizado e build.
- [x] Empacotar 1.8.0 com instruções de atualização, IDs necessários e limites dos testes; preservar versão anterior.

## Pontos de revisão
1. HTML personalizado do CMS diferente da landing-base; não perder textos nem a ordem comercial.
2. Checkout e simulador removidos/reordenados no Studio; manter uma única instância utilizável.
3. Pagamentos pendentes, reembolsados e repetidos; nunca produzir compra ou liberar manual incorretamente.
4. Identificadores de anúncios ausentes e consentimento negado; site e compra continuam funcionando.
5. Telas estreitas e zoom; nenhuma sobreposição, texto cortado ou imagem opaca.
