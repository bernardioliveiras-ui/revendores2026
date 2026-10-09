# Validação da entrega 1.8.0 — 09/10/2026

## Resultado

| Verificação | Resultado |
| --- | --- |
| `npm test` | 194 testes, 194 aprovados, zero falhas. |
| `npm run build` | Compilação de produção e verificação TypeScript concluídas. Landing pré-renderizada como conteúdo estático. |
| `npm run lint` | Zero erros; 14 avisos de imagens nativas/código legado preservado. |
| Landing no navegador | 320, 390, 768, 1024 e 1440 px, sem overflow horizontal ou erros JavaScript. |
| Briefing | 66 trechos publicados comparados, preservados; constantes comerciais e ANVISA verificadas. |
| Elementos funcionais | Um checkout e um simulador, âncoras válidas, FAQ abre, cálculo reage ao valor digitado. |
| Imagens | Cinco imagens da página carregam, incluindo as duas pessoas com transparência e logo original de maior resolução. |
| Compra e consentimento | Checkout real no navegador com APIs/SDKs simulados; sem tags antes da escolha, sem Purchase no navegador, retirada e armazenamento bloqueado verificados. |

Ambiente de execução local: Node **24.19.0**; o projeto mantém como alvo Node **22.x** na Hostinger. Não se afirma execução local sob Node 22. As dependências correspondem ao projeto; o pacote entrega fontes e lockfile, sem `node_modules` ou `.next`.

## Escopo dos testes

Os testes comportamentais cobrem autenticação, sessão, manual, autorização, checkout, provisionamento, estoque, vendas, webhooks, expedição, boas-vindas, BKO, migração, SEO e mensuração. Os fornecedores são substituídos por fronteiras locais; criptografia e regras de negócio usam o código entregue.

A conferência de consentimento compilou temporariamente IDs de teste, interceptando todos os SDKs e APIs no navegador. Nenhuma requisição foi enviada a Google/Meta/Asaas. Depois dessa conferência, um novo build sem esses IDs foi concluído; o ZIP contém apenas fontes, e as variáveis de exemplo deixam o envio desligado.

Na validação visual, os 66 trechos do conteúdo publicado foram comparados em todas as cinco larguras. Também foram conferidos carregamento de imagens, cálculo do simulador, disclosure de dúvidas e formulário único. As prévias de celular/computador e relatórios estão em `validacao-1.8.0/`.

## Limites reais

- Não foi publicado código na hospedagem existente nem alterado o banco de produção.
- Integrações reais exigem os IDs/segredos corretos, a rotina de manutenção agendada e homologação nas contas.
- Os doubles de banco verificam decisões e concorrência lógica; não substituem teste de integração com o MySQL da hospedagem.
- Não se garante aprovação de anúncio, indexação, faturamento, correspondência total da atribuição ou ausência absoluta de bugs.

## Histórico de testes

A versão recebida já possuía testes vermelhos de versões contraditórias do editor. A remoção do Studio solicitada pelo usuário aposentou seus contratos, preservados em `historico/testes-studio-retirado/`. Foram acrescentados testes de renderização estática, preservação do briefing, retirada das APIs, BKO e regressões de backend. Os testes de negócio continuam ativos; o resultado final acima é da suíte inteira atual, sem testes ignorados.
