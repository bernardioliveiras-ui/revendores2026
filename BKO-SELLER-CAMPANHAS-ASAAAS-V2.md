# LORD NUTRI — BKO Seller / Campanhas de Influenciadores (v2 de teste)

## O que mudou

- **BKO > CRM Seller · Influenciadores**: cada influenciador pode ter **uma campanha ativa e um link único reutilizável** (`/c/<codigo>`). Editar o campo **CAMPANHA** atualiza o nome sem trocar o código. O BKO pode pausar e reativar a campanha sem perder o histórico.
- **Meu painel do influenciador**: gera e compartilha o mesmo link no WhatsApp/Instagram/outros canais. Não há necessidade de criar um comprador individual nem anexar comprovante no novo fluxo. As APIs legadas continuam disponíveis para registros históricos, mas não são o caminho recomendado.
- **Checkout Asaas**: ao abrir `/c/<codigo>`, registra a abertura e redireciona à página institucional já configurada, enviando `?campanha=<codigo>` e cookie first-party de 30 dias. O checkout lê o código da URL ou `sessionStorage` e também aceita o cookie da própria origem. No backend, o código é validado e o ID da campanha fica associado ao pedido antes da criação da cobrança Asaas.
- **Pagamento**: o webhook autenticado Asaas relaciona `payment.id` / parcela / `externalReference` com o pedido; marca `asaas_verified_at` somente nos eventos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`. Estornos, chargeback, remoção e estorno parcial retiram o pedido das vendas. Eventos repetidos são idempotentes pela chave `asaas_events.event_id`.
- **KPIs**: só `payment_status='paid' AND asaas_verified_at IS NOT NULL` entra em **venda Asaas verificada**. A receita de produto exclui frete e juros (`product_total_cents`, com fallback calculado); comprovante, clique, checkout iniciado ou `paid` manual **não** são faturamento Asaas. Indicadores: compradores convertidos, checkouts, pendentes, receita de produto, ticket médio, conversão checkout, ranking e evolução dos últimos 7 dias; vendas de revendedor registradas manualmente aparecem separadas.

## Atenção ao site institucional e domínios

O redirecionamento segue a URL institucional legada em `INDICATOR_PURCHASE_URL` (atualmente `https://mix10pro.com.br/lp-v2`). Para a conversão ser associada, **a página institucional precisa encaminhar o parâmetro `campanha` à página de checkout** (se mudar de domínio/origem, repassar o parâmetro explicitamente). O código deste pacote implementa a captura na landing e checkout **deste repositório**; não modifica outro site/LP independente. O cookie e `sessionStorage` não atravessam domínios diferentes. Validar com clique real até o checkout antes de lançar anúncios. É permitido mudar `INDICATOR_PURCHASE_URL` no código se a LP efetiva for outra. O backend também aceita um `campaignCode` válido enviado pelo checkout; nunca confia em ID de campanha do cliente.

## Instalação / validação

1. Faça backup do projeto e do banco. Instale as dependências pelo `npm ci` no servidor e configure as variáveis `DATABASE_*`, `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT`, `ASAAS_WEBHOOK_TOKEN` conforme documentação anterior.
2. Rode `npm run db:migrate` para adicionar `indicator_campaigns`, `purchases.campaign_id` e `purchases.asaas_verified_at` sem apagar nada. O código também faz reparo aditivo ao acessar as APIs.
3. Rode `node --test tests/campaign-accounting.test.mjs` para os cenários contábeis e `npm test` para a suíte completa.
4. **Testar no sandbox**: no BKO, criar influenciador e campanha, abrir `/c/<codigo>`, preencher checkout e pagar uma cobrança de teste. Verifique: antes do webhook consta pendente; depois de `PAYMENT_CONFIRMED`/`RECEIVED` consta uma venda; outro comprador com o mesmo código gera a segunda venda; cobrar frete não aumenta receita do produto; estorno remove venda; webhook repetido não duplica. Se o Asaas estiver em sandbox o BKO mostra alerta de ambiente de testes.
5. **Produção**: só mudar `ASAAS_ENVIRONMENT=production` com a chave correspondente e configuração correta do webhook autenticado no Asaas; executar o teste de ponta a ponta no domínio real antes de divulgar. Código sem acesso à conta Asaas/Hostinger não confirma webhook remoto.

## Limpeza dos testes: operação separada e supervisionada

Foi criada a rotina `npm run db:reset:test`. **Nada foi apagado na Hostinger por este pacote.** Ela limpa pedidos, comprovantes, campanhas, acessos de indicadores/revendedores, movimentações, vendas, eventos e sessões de teste, preservando registros ADMIN, configurações, conteúdo institucional e estrutura de tabelas.

Primeiro veja o banco alvo e a contagem sem excluir nada:

```bash
npm run db:reset:test
```

Para efetivamente zerar, faça em horário de manutenção e execute:

```bash
npm run db:reset:test -- --execute --confirm=ZERAR-TESTES --backup=./backups/lordnutri-testes-antes-reset.jsonl.gz
```

A rotina faz backup `.jsonl.gz` antes de abrir a transação de exclusão e aborta caso falhe. **Mantenha o arquivo privado**, pois pode conter dados pessoais e hash de usuários de teste. Faça também backup SQL via painel/Hostinger para restauração integral. Não rode enquanto existirem checkouts ativos nem enquanto o Asaas estiver enviando eventos de pagamentos antigos: limpar banco local não apaga as cobranças no Asaas; webhooks de cobranças anteriores devem ser desativados/reconciliados conforme operação. Nunca publique `.env.local` ou arquivos de backup.

**Observação**: o reset é do banco MySQL deste aplicativo, não apaga cobranças do Asaas, registros em Google/Meta, arquivos em outros sistemas nem dados que não sejam das tabelas comerciais listadas. 

## Validação executada neste pacote

- Unitários: 5/5 cenários de valor sem frete/juros, múltiplas vendas no mesmo link, exclusão de não pagos, estorno e isolamento por influenciador.
- Verificação sintática TypeScript/TSX das rotas e componentes alterados.
- **Não executado**: teste end-to-end de cobrança Asaas e deploy Hostinger, pois credenciais e conexão de banco não foram disponibilizadas. O `npm ci` completo depende do ambiente que tenha acesso às dependências; rodar o build e a suíte completa após instalar.


## Indicadores — criação e recuperação de senha (atualização v2.1)

- **ADMIN/BKO > Central de vendas e influenciadores > + Influenciador**: ao cadastrar, o painel exibe um convite privado de ativação com validade de 24 horas. Envie o link ao parceiro individualmente. Ele define a própria senha com pelo menos 10 caracteres em `/ativar-cliente` e entra em `/entrar`.
- **Indicador existente**: selecione seu cadastro no ranking e clique em **Gerar link para redefinir senha** ou **Gerar convite de ativação**, conforme o status. Use **Copiar convite** e envie apenas ao titular.
- As senhas são armazenadas como hash, não são recuperáveis pelo ADMIN. Um novo convite invalida convites anteriores ainda não utilizados. Para uma conta já ativada, a senha antiga só deixa de funcionar depois que o titular ativa a nova; nesse momento, sessões existentes são encerradas.
- A reemissão de convite não altera campanha, código de divulgação nem dados de vendas. A limpeza de testes é operação separada e apaga contas de indicadores; depois da limpeza, é preciso recadastrá-los.
