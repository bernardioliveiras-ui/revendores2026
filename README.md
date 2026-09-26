# MIX10 PRO v2 Clean

Nova versão do Programa de Revendedores LORDNUTRI, criada para rodar 100% em **Hostinger + Node.js + MySQL**.

## Fluxo

`Landing Page + VSL → KIT20/KIT50 → dados do revendedor → Asaas → pagamento confirmado → BKO libera acesso → BKO envia e-mail + senha pelo WhatsApp → revendedor entra no portal`

## Portal do revendedor

A navegação da V1 foi reduzida ao essencial:

- **Visão geral** — estoque, caixas vendidas, valor bruto registrado e indicadores de afiliados.
- **Estoque** — saldo atual e histórico de movimentações.
- **Vendas** — formulário **Registrar venda**; a baixa de estoque é automática e o sistema impede venda maior que o saldo.
- **Afiliados** — coleta nome + WhatsApp e gera um link individual rastreável.

## BKO

O BKO acompanha métricas gerais, compras, pagamentos, revendedores, liberação de acesso e expedição. O acesso não é criado automaticamente pelo webhook: o pagamento fica disponível no BKO e o operador decide quando clicar em **Liberar acesso**.

## Kits

- KIT20: 20 caixas × R$ 74,90 = **R$ 1.498,00**.
- KIT50: 50 caixas × R$ 69,90 = **R$ 3.495,00**.
- Venda de referência usada na LP: R$ 109,90 por caixa.

## VSL

O player da página espera este arquivo:

`public/videos/vsl-mix10.mp4`

O ZIP não inventa uma VSL. Coloque o MP4 final nesse caminho antes ou depois do deploy.

## Banco

Esta versão foi feita para **banco novo/zerado**. Importe `database/schema.sql` uma única vez. Não há migração da versão antiga.

## Deploy

Leia `HOSTINGER-DEPLOY.md` e `BKO-OPERACAO.md` antes de publicar.

## Frete + parcelamento (checkout revendedores)

Esta versão incorpora ao checkout de revendedores a mesma lógica comercial do institucional:

- frete por faixa de CEP usando `lib/shipping-rates.ts` e `lib/shipping.ts`;
- duas opções de envio via Correios: Econômica e Expressa;
- parcelamento em cartão de 1x a 6x;
- 1x sem acréscimo e 2x–6x pela Tabela Price a 2,99% a.m.;
- preço, frete e parcelamento são recalculados no backend antes da criação da cobrança;
- PIX recebe produto + frete sem acréscimo de parcelamento;
- cartão recebe o valor/parcelamento definido pelo servidor;
- BKO mostra produto, frete, acréscimo e total cobrado.

A tabela de frete foi reaproveitada do checkout institucional. Ela é uma tabela própria por faixa de CEP usada para os envios via Correios; não é uma consulta em tempo real à API oficial dos Correios.

Em banco já existente, execute `database/migrate-frete-cartao.sql` uma única vez antes de publicar esta versão.


## Dados fiscais para CNPJ

No checkout, ao informar um CNPJ, passam a ser obrigatórios:

- nome fantasia da empresa;
- pelo menos uma inscrição: Estadual ou Municipal.

Esses dados ficam gravados na compra, aparecem no BKO para apoio à emissão da nota fiscal e são copiados para o perfil do revendedor quando o acesso é liberado.

Em banco já existente que já recebeu `migrate-frete-cartao.sql`, execute também `database/migrate-cnpj-fiscal.sql` uma única vez antes de publicar esta versão.

O favicon foi trocado por uma folha verde em fundo transparente, sem o fundo claro/branco anterior.
