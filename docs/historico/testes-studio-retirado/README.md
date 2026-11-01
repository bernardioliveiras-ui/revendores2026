# Contratos históricos do Studio — retirados da execução em 1.8.0

O usuário solicitou a remoção integral do editor da landing. Estes 20 arquivos testavam o Free Canvas/Studio e layouts de versões 0.3–1.7, inclusive comportamentos contraditórios entre versões. Foram preservados como histórico com extensão `.txt`, fora da execução de `npm test`.

Cobertura substituta: `landing-static-runtime.test.mjs` renderiza a página entregue, verifica os 66 trechos do briefing publicado, ordem das seções, âncoras válidas, constantes comerciais e uma única instância de checkout/simulador, sem consulta ao CMS. `landing-retirement-runtime.test.mjs` verifica HTTP 410 e autorização dos endpoints retirados. `content-manager-runtime.test.mjs` testa os módulos restantes do BKO e suas operações.

Os testes de negócio presentes em suítes mistas foram mantidos: vídeo Boas Vindas em `content-studio-structural.test.mjs`, preços em `landing-checkout.test.mjs`, ANVISA/preços/texto no teste renderizado. A validação visual responsiva complementa esses contratos. Não se trata de ignorar falhas de negócio: todos os testes de autenticação, pagamentos, estoque, manual, expedição e automações continuam ativos.
