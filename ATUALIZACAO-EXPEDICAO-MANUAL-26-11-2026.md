# LORD NUTRI — Expedição manual integrada (26/11/2026)

Esta versão conecta o cadastro e os envios manuais de revendedores à mesma área operacional de Expedição dos pedidos pagos pelo Asaas, **sem gerar pedido financeiro, pagamento ou cobrança fictícia**.

## O que mudou

1. **BKO → Revendedores → Cadastrar:** informe a quantidade inicial e selecione:
   - **Serão enviadas pelos Correios (padrão):** uma remessa aparece automaticamente em **Expedição**, sem aumentar o estoque disponível até a confirmação de entrega.
   - **Já estão em mãos:** registra a entrada diretamente no estoque. Não cria uma remessa desnecessária.
2. **BKO → Revendedores → Atualizar estoque:** permite tanto ajustar o saldo físico já conferido como **Programar novo envio pelos Correios**. A programação cria remessa, não altera o saldo imediatamente.
3. **BKO → Expedição:** reúne compras pagas e remessas manuais; permite cadastrar ou alterar rastreio, confirmar a entrega e consultar eventos reais dos Correios. A rotina já configurada também consulta remessas manuais.
4. **Portal do revendedor:** exibe remessas manuais e seus códigos/eventos dos Correios, além do saldo atualizado. A entrega credita o estoque uma só vez, dentro da mesma transação.
5. **E-mails de envio e entrega:** seguem o mesmo canal de notificação operacional dos pedidos pagos quando `RESEND_API_KEY` e `WELCOME_EMAIL_FROM` (ou `EMAIL_FROM`) estão configurados.

## Estoques lançados na versão anterior

Para não perder histórico nem duplicar caixas, os lançamentos positivos antigos (`manual_initial_stock` e `bko_stock_adjustment`) aparecem na Expedição identificados como **saldo já contabilizado**. A importação cria somente os registros de envio; **não mexe no saldo antigo**. A entrega desses envios antigos não acrescenta estoque outra vez.

Se as caixas antigas ainda estiverem com a LORD NUTRI, abra a remessa em **Expedição → Acompanhar** e use **Suspender saldo até a entrega**. A ação exige estoque disponível suficiente, registra um ajuste auditável e faz a remessa passar a liberar as caixas apenas após o recebimento. Se houve vendas ou alterações e o saldo não comporta a suspensão, faça a conferência primeiro; nenhuma quantidade será subtraída indevidamente.

## Instalação no GitHub / Hostinger

1. Faça backup do banco MySQL da produção antes do deploy.
2. Substitua os arquivos do repositório pelo conteúdo da pasta `revendores2026-main` deste ZIP, **sem sobrescrever seu `.env`/`.env.local` e sem enviar credenciais ao Git**.
3. Na Hostinger use Node.js 22, execute `npm ci`, `npm run build` e inicie com `npm start`. O comando de inicialização executa `scripts/migrate.mjs` antes de subir o Next.js.
4. As migrações **somente criam a tabela `manual_shipments`** e importam referências de ajustes antigos de forma idempotente. Não há `DROP`, `TRUNCATE`, reset nem alteração em pagamentos Asaas.
5. Entre no BKO, abra **Expedição**, confira os lançamentos antigos e cadastre o rastreio dos Correios. Depois abra o portal do revendedor para confirmar a visibilidade.

**Importante:** a atualização do código não altera um servidor em produção automaticamente; é necessário publicar no GitHub/Hostinger. A confirmação automática de entrega depende de credenciais válidas e rotina de consulta dos Correios já configuradas no ambiente. Se não houver consulta ativa, o BKO poderá confirmar a entrega manualmente.

### Testes executados na entrega

- Compilação de produção `npm run build`: **aprovada**.
- TypeScript `npx tsc --noEmit`: **aprovado**.
- Testes direcionados de remessas, estoque, acesso e expedição: **aprovados**.
- Suite completa: **459 de 470 aprovados**. Permanecem **11 falhas preexistentes** do projeto, sobretudo em mocks de webhook Asaas e testes antigos de manutenção do BKO. Não se afirma homologação com um banco MySQL real de produção.

## Comportamento da compra Asaas

Compras verdadeiramente pagas continuam usando o fluxo Asaas existente, inclusive seus próprios eventos e lançamentos de estoque. Remessas manuais usam o mesmo painel de logística e rastreio, mas são identificadas separadamente para que nenhuma aprovação financeira seja simulada.
