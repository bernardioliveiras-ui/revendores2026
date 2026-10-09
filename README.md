# LORD NUTRI · MIX10 PRO — 1.8.0

Landing e plataforma de revendedores em Next.js 16, React 19 e MySQL. A atualização preserva os textos publicados do briefing e substitui a apresentação da landing por uma composição responsiva em dourado LORD NUTRI e verde MIX10 PRO.

## O que muda

- Landing estática, independente do banco/CMS, com tipografia corporativa, pessoas recortadas, destaque para R$ 10.000 MÊS e CTA, logo original em maior resolução e novos arquivos de ícone.
- Studio da landing removido. Os documentos antigos permanecem no banco para preservar o histórico, mas não alteram a página. Edição futura da LP: `app/page.tsx`, `components/landing-sections.tsx` e `app/landing.css`.
- BKO → Conteúdo mantém Manual, Produtos e Mídia. O manual continua privado, acessível somente com a autorização exigida pelo portal.
- Correções de autenticação, sessão, manual, checkout e automações, cobertas por testes locais de comportamento.
- Canonical, sitemap, robots, imagem social, consentimento e mensuração opcional Google/Meta. Configuração e limites em `docs/SEO-TRAFEGO-1.8.0.md`.

## Portal e operação

O revendedor encontra Boas Vindas, Visão geral, Manual do Revendedor, Estoque, Vendas e Acompanhe seu Pedido. O BKO mantém acessos, expedição, métricas e conteúdo. O pagamento acontece no Asaas; confirmação por webhook controla liberação e estoque.

O vídeo de Boas Vindas pode ser configurado em BKO → Conteúdo → Mídia. O fallback opcional usa `VSL_VIDEO_URL`, por exemplo `/videos/vsl-mix10.mp4`, ou `VSL_EMBED_URL`. A landing preserva o conteúdo atualmente publicado, sem inserir uma VSL nova.

## Instalação e atualização

Use Node 22 e MySQL na Hostinger ou em uma hospedagem Node equivalente. Este projeto não é um export estático para Cloudflare Pages. Comece por `LEIA-ME-PRIMEIRO.md` antes de substituir a versão em produção.

```sh
npm ci
npm run build
npm run db:migrate
npm start
```

Configure as variáveis de `.env.example` no ambiente da hospedagem. `npm start` repete a migração aditiva e idempotente antes de iniciar o Next. Não substitua as credenciais existentes pelos exemplos. Variáveis `NEXT_PUBLIC_*` precisam estar definidas antes do build.

## Validação

```sh
npm test
npm run test:backend
npm run lint
npm run build
```

Os testes isolam banco e provedores externos; não geram cobranças nem enviam mensagens reais. A homologação deve conferir a configuração da hospedagem, o MySQL, o Asaas sandbox e o recebimento das tags nas contas corretas. Resultados desta entrega: `docs/VALIDACAO-1.8.0.md`.

Os contratos antigos do editor retirado foram arquivados em `docs/historico/testes-studio-retirado`. Foram substituídos pela renderização da página estática, comparação do briefing e testes dos módulos restantes; as regras de negócio continuam cobertas.

## Guias

- `LEIA-ME-PRIMEIRO.md`: aplicação desta versão e rollback.
- `BKO-OPERACAO.md` e `AUTOMACOES.md`: operação de acessos e expedição.
- `docs/REVISAO-BACKEND-1.8.0.md`: problemas reproduzidos e correções.
- `docs/SEO-TRAFEGO-1.8.0.md`: domínio, Search Console, Google e Meta.
- `docs/historico/`: registros de versões anteriores; não são instruções para ativar o Studio nesta versão.
