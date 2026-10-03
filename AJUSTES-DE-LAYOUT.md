# LORD NUTRI — revisão visual de 03/10/2026

## Alterações entregues

- Abertura sem painel lateral e com o CTA completo do briefing: VER OS KITS E CALCULAR MEU CENÁRIO.
- Paleta preta, dourada e clara preservada, com tipografia tradicional e espaçamentos responsivos.
- Marca escrita como LORD NUTRI na interface.
- Logo original transparente, aplicada diretamente ao cabeçalho escuro; letras apresentadas em dourado por CSS, preservando o desenho do arquivo original.
- Embalagem substituída pelo PNG transparente enviado em 03/10/2026, sem fundo branco.
- Ordem: abertura; modelo em 3 passos; oportunidade e 5 motivos; simulador; produto; kits; dúvidas; checkout.
- Textos de modelo, oportunidade, vantagens, produto, condições e FAQ extraídos do briefing fornecido, normalizando somente a grafia da marca.
- Textos detalhados acessíveis em blocos expansíveis. Campos e resultados do simulador separados para evitar colisões.
- Cenários de 1, 2 e 3 caixas por dia, em 26 dias, conforme os valores do briefing.
- Processo de Notificação ANVISA nº 2535115572620267, conforme informação enviada pelo usuário e impressa na embalagem.
- Link de consulta ao Google Safe Browsing no rodapé. Não foi inserida alegação de certificação ou segurança verificada; a imagem enviada é um selo visual, não um código do Search Console. A configuração existente GOOGLE_SITE_VERIFICATION permanece disponível caso seja fornecido o token.
- CTAs de KIT20 e KIT50 levam ao checkout com o kit correto. A navegação completa evita a manutenção da seleção anterior pelo roteador.

## Aplicação

O ZIP contém o projeto completo, com os arquivos na raiz. Use o fluxo de atualização e deploy já utilizado pelo projeto, preservando as credenciais e variáveis de ambiente da hospedagem. A entrega não executou publicação nem cobrança.

## Validação

- Compilação de produção e TypeScript: aprovados.
- Inspeção visual em 320, 360, 390, 768, 1024, 1366 e 1440 px: CTA dentro da primeira tela, sem rolagem horizontal e sem interseções entre cards, campos ou resultados.
- CTA principal: chega ao simulador. Links dos dois kits: selecionam o kit correspondente no checkout.
- Simulação de R$ 10.000,00 com custo KIT50 e despesas zeradas: 250 caixas.
- Testes de contrato de landing/checkout: 5 aprovados.
- Suíte geral: 70 aprovados e 16 falhas anteriores também reproduzidas no ZIP original. Nenhuma falha nova após atualizar os contratos de conteúdo para o briefing. As falhas anteriores abrangem contratos de BKO, autenticação, schema, migração e notificações; não foram alteradas nesta revisão visual.
- Lint dos arquivos centrais desta revisão: aprovado. O lint geral mantém dois erros anteriores de tipagem `any` nas APIs de overview e avaliações Google, além de dois avisos anteriores.
- Execução local em Node 24; a configuração de hospedagem do projeto continua em Node 22.
- Banco de dados, cobrança real e serviços externos não foram exercitados nesta validação local.

Prévias e relatório de medidas em `docs/validacao/layout-2026-10-03/`.

## Microajustes finais do hero — continuidade no chat

- Cabeçalho reduzido no desktop e no mobile para a logo não dominar a primeira dobra.
- Headline levemente compactada e limitada para manter proporção melhor em telas grandes e pequenas.
- A mensagem principal foi unificada visualmente em um único bloco: “Com a LORD NUTRI você pode!”, “Vem realizar seus sonhos com a gente!” e o cenário de até R$ 10 mil de ganho bruto.
- O texto de mercado foi deslocado para depois do CTA, deixando a promessa principal mais direta e sem interrupção.
- O bloco principal ganhou borda e fundo dourado discretos e reforço no hover, preservando o efeito de destaque dourado aprovado.
- O CTA continua dentro da primeira dobra nas prévias de 1440, 390 e 320 px.
- Inspeção visual isolada do topo: sem rolagem horizontal nas três larguras acima. Prévias em `docs/validacao/layout-2026-10-03/microajuste-hero-*.png`.
- Testes de contrato de landing/checkout e CSS executados após o ajuste: 7/7 aprovados.
- O restante da landing page, simulador, kits, checkout, APIs, banco e portal não foi alterado nesta microrevisão.
