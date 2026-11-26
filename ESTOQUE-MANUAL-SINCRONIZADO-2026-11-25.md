# LORD NUTRI — entrega de estoque manual sincronizado

**Data:** 25/11/2026 — pacote completo para atualizar o repositório GitHub/Hostinger.

## Como usar

1. Acesse **BKO > Gerenciar revendedores > + Cadastrar revendedor**.
2. Preencha nome, e-mail, WhatsApp, CPF/CNPJ, endereço e **Estoque atual (caixas disponíveis)**. Exemplo: informe `50` se o revendedor **já tem** 50 caixas em mãos, ou `0` se não tem nenhuma.
3. Clique em cadastrar. O banco grava a conta, o perfil e, se houver caixas, a entrada de estoque numa única transação. O convite privado para criar a senha continua válido por 24 horas. **Nenhum pedido, frete ou cobrança Asaas é criado pelo estoque manual.**
4. Para um revendedor existente, no BKO clique em **Atualizar estoque** e informe o **saldo total físico** contado naquele momento, com um motivo. Exemplo: se o saldo exibido é 40 e o saldo conferido é 25, o sistema registra uma saída de ajuste de 15 caixas. Ele **não** subtrai 25.
5. Veja os ajustes recentes junto ao revendedor no BKO e todas as movimentações no Portal do Revendedor > Estoque. O BKO (na aba Gerenciar revendedores) e o portal atualizam informações sem cache a cada 30 segundos, com atualização ao voltar para a aba e ao receber foco. Depois de salvar, o BKO consulta o saldo novamente.

Se uma venda ou reposição modificar o saldo enquanto o formulário de ajuste estiver aberto, o envio é recusado com uma mensagem para conferir o novo saldo e informar novamente o total. Isso evita que uma contagem antiga apague uma venda recente. A transação de ajuste também bloqueia a faixa de movimentações (`FOR UPDATE`), protegendo a leitura contra entradas automáticas simultâneas no isolamento MySQL/InnoDB `REPEATABLE READ`.

## Integridade e compatibilidade

- A conta de revendedor e o perfil continuam ligados ao banco **MySQL existente**. Não há migração nova: as entradas e correções usam a tabela existente `stock_movements`.
- Movimentações manuais ficam identificadas como `manual_initial_stock` ou `bko_stock_adjustment`, com data, administrador e motivo. Compras pagas continuam vinculadas aos pedidos Asaas. Ajustes posteriores não alteram `reseller_profiles.initial_boxes`, pois esse campo representa o registro **original**, não o saldo corrente.
- Vendas continuam baixando o estoque e reposições pagas continuam acrescentando caixas pela infraestrutura já existente.
- Nenhuma alteração automática foi aplicada a revendedores existentes, incluindo Jorge; seus saldos só mudam por vendas, reposições ou ajustes explicitamente feitos pelo BKO.

## Atualização GitHub / Hostinger

1. Faça um **backup verificado** do banco MySQL e dos arquivos existentes no servidor, incluindo uploads e configurações privadas.
2. Extraia este ZIP no computador. Publique **o conteúdo da pasta `revendores2026-main` no repositório GitHub**, preservando sua estrutura. Não suba o ZIP como se fosse o código da aplicação.
3. Na Hostinger, atualize o deploy da mesma aplicação/repositório (sem criar ou zerar outro banco) e preserve `.env`/`.env.local`, credenciais Asaas, configurações de e-mail e webhooks existentes.
4. Com **Node.js 22**, execute `npm ci`, `npm run db:migrate` e `npm run build`. Reinicie a aplicação usando o comando `npm start` ou o processo de deploy já configurado. Não execute `npm run db:reset:test`.
5. Confira o login do BKO e do revendedor com uma **conta de teste**: cadastrar com 3 caixas; conferir BKO e portal; ajustar o saldo para 2, com motivo; verificar histórico e atualização; registrar uma venda de 1 e conferir saldo 1. Verifique depois os webhooks e a reposição no ambiente **Asaas Sandbox** antes de comercializar.
6. Se houver erro, restaure o código anterior e investigue sem zerar o banco. O histórico de ajustes fica no MySQL mesmo após trocar o código.

> **Esta entrega não executou deploy na Hostinger, alteração de banco de produção, cobrança Asaas ou envio de convites reais.** É necessário fazer os passos de publicação/validação no seu ambiente.

## Resultado dos testes locais

- `npm run build`: **aprovado** (Next.js 16, rota nova `/api/admin/resellers/stock` gerada).
- `./node_modules/.bin/tsc --noEmit`: **aprovado**.
- Testes direcionados de cadastro, ajuste e histórico: **21/21 aprovados**, incluindo verificação de bloqueio da faixa de movimentos.
- `npm test`: **448/459 aprovados, 11 falhas**. Para separar regressões desta mudança, a execução do ZIP original (sem alterações) teve **434/445 aprovados e as mesmas 11 falhas** em testes legados de Asaas, manutenção BKO e contrato de UI. A diferença de 14 testes é a nova cobertura desta entrega.
- `npm run lint`: o repositório ainda possui erros preexistentes de lint em vários módulos; a compilação não depende desse comando. Antes de exigir lint verde no CI, a base existente precisará de um tratamento separado.

Não há como comprovar a sincronização com o banco real, webhooks reais ou a atualização da Hostinger apenas por testes locais. Antes de produção, homologue também **duas transações simultâneas** (ajuste BKO e entrada de reposição Asaas) em MySQL real com isolamento `REPEATABLE READ`. O acompanhamento de publicação acima é obrigatório.
