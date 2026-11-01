# LORD NUTRI — CRM de parceiros (Hostinger + MySQL)

## Por que existe somente uma aba principal para este setor?

O BKO tem a aba **Indicadores · CRM de Parceiros**, com três seções internas:

- **Parceiros e pedidos:** crie ou selecione Isabella, veja a carteira individual, links, compradores, etapas e comprovantes por card.
- **Fila de conferência:** reúne comprovantes pendentes, rejeitados e aprovados ainda sem confirmação de compra. Somente o BKO pode conferir.
- **Clientes antigos:** o módulo original de `client_indicated` foi preservado como área secundária, sem exclusão de registros.

Revendedores, Asaas, estoque, reposição e a aba **Vendas · Revendedores** são outros setores. Não foram alterados. Nenhuma nova conta deste CRM vira revendedora.

## Fluxo dos indicadores

1. BKO cria Isabella em **Indicadores** pelo próprio painel ou pelo script `scripts/criar-indicador.ps1` existente. Envia um convite privado HTTPS e de uso único (24 horas); Isabella cria a senha.
2. Isabella entra em `/minhas-indicacoes` e cadastra um comprador. O sistema cria um link individual `/i/<codigo>` que abre a LP `https://mix10pro.com.br/lp-v2`.
3. Isabella clica **Abrir WhatsApp com link** para *preparar* uma mensagem. O CRM registra o clique em compartilhar. **Não existe confirmação de mensagem enviada, entregue ou lida pelo WhatsApp**. Copiar o link separadamente não é contado como clique em compartilhar.
4. O redirecionamento individual soma uma abertura estimada. Robôs e prévias de WhatsApp podem acessar links; essa métrica **não representa pessoas únicas nem vendas**.
5. Após o pagamento, o comprador encaminha o comprovante em privado para Isabella, que faz upload no card correto (PDF, JPG, PNG, até 8 MB). O comprovante entra como `PENDENTE`.
6. BKO confere o comprovante **e verifica a efetiva entrada do pagamento**. Para contar a conversão, BKO escolhe `APROVADO` e `COMPROU`. Há somente **uma compra confirmada por card** (não por clique, reenvio de comprovante ou tentativa de WhatsApp).
7. Em caso de rejeição, BKO registra orientação. Cashback permanece manual: R$ e estados `PENDENTE`, `LIBERADO`, `PAGO`, sem cálculo ou pagamento automático.

## Métricas do funil

- **Links individuais gerados:** número de cards (pessoas indicadas).
- **Cliques em compartilhar:** número de acionamentos do botão WhatsApp pela indicadora, capturados no backend; não comprova envio real.
- **Aberturas estimadas:** número de redirecionamentos pelo `/i/<codigo>`; não são visitantes únicos.
- **Comprovantes pendentes:** cards com arquivo atual e conferência `PENDENTE`.
- **Compras confirmadas:** cards com arquivo atual, conferência `APROVADO` e status `COMPROU`.
- **Rejeitados:** comprovantes rejeitados e orientações do BKO. Aprovados sem `COMPROU` seguem na fila.

Os dados de cada parceiro são calculados exclusivamente sobre o `indicator_user_id`. Indicadores não acessam o BKO, registros de outros parceiros, dados dos revendedores nem arquivos de terceiros.

## Implantação na Hostinger

1. Faça **backup do MySQL** e, preferencialmente, teste primeiro em homologação.
2. Publique o conteúdo completo do projeto (raiz `revendores2026-main/` no ZIP) pela rotina usada no seu projeto. Não sobrescreva `.env` e não inclua credenciais ou tokens reais no ZIP.
3. Mantenha as variáveis já usadas: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_SSL` (quando aplicável), `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` HTTPS e variáveis do restante do projeto. O CRM **não requer Resend** para convites manuais.
4. Execute `npm run db:migrate` antes de iniciar a versão nova, ou use `npm start` conforme rotina atual. A alteração de esquema é **aditiva**: duas colunas em `indicator_leads` — `share_attempts INT NOT NULL DEFAULT 0` e `last_shared_at VARCHAR(40) NULL` — sem apagar dados existentes. Há verificação na inicialização das rotas do módulo.
5. Verifique em um ambiente real: Isabella consegue logar, criar indicação, abrir compartilhamento, anexar arquivo; BKO vê o dado na carteira certa, confere e marca COMPROU; outro indicador não acessa os dados nem o comprovante da Isabella; revendedores seguem funcionando normalmente.
6. Convites previamente expostos em conversa, print ou logs devem ser revogados e reemitidos por BKO.

## Validação local

`npm test` executou 228 verificações: **227 passaram e 1 teste não iniciou** por falta da dependência React no ambiente. Foram aprovados os testes novos de CRM, isolamento de indicadores, regras de contabilização, migração e os testes anteriores de revendedores/Asaas. Não houve publicação ou conexão com o MySQL de produção neste ambiente; compilação Next.js completa também não foi validada por ausência das dependências.

## Alterações de escopo

- `app/painel/portal-client.tsx` — menu principal simplificado (clientes antigos passam para dentro do CRM).
- `components/indicator-admin.tsx` e `components/indicator-portal.tsx` — CRM BKO e carteira responsiva da indicadora.
- `app/globals.css` — layout do CRM seguindo a identidade visual existente.
- `lib/indicator-crm.ts` — agrupamento, etapas e métricas sem converter clique em compra.
- `app/api/indicator/leads/share/route.ts` — contagem autorizada das tentativas de compartilhamento.
- `app/api/indicator/leads/route.ts` — entrega da métrica à carteira autenticada.
- `db/schema.ts`, `database/schema.sql`, `lib/indicator-schema.ts`, `scripts/migration-core.mjs` — migração MySQL aditiva.
- `next.config.ts` — proteção noindex/no-store da área da indicadora.
- `tests/indicator-crm-runtime.test.mjs` — testes adicionais.

Nenhum código das rotas de Asaas, vendas de revendedores, estoque ou cobrança foi alterado.
