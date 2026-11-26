# LORD NUTRI — Atualização de 26/11/2026

## O que mudou

- **Venda Rápida:** caixa única com quantidade (+/− ou digitação), valor total, saldo previsto e botão de confirmação. Canal, cliente e notas ficam em detalhes opcionais. Layout adaptado para celular e desktop.
- **Preço fixo do revendedor:** R$ 109,90 por caixa, armazenado como 10.990 centavos. O revendedor não recebe permissão de editar o preço nem por requisição HTTP. Somente BKO altera em **Vendas → Preço da venda pelo revendedor**, informando um motivo. Ajustes ficam no histórico e só se aplicam a vendas futuras. Lançamentos manuais efetuados *pelo BKO* seguem com os controles administrativos existentes.
- **Estoque sincronizado:** registro de venda reduz o saldo usando a transação e o bloqueio do registro do revendedor já existentes. Identificador exclusivo da solicitação impede baixas duplicadas em tentativas de reenvio.
- **Perfis:** revendedores e influenciadores têm seção **Meu Perfil**, para bio curta (até 160 caracteres) e foto JPEG/PNG/WebP (até 2 MB). Fotos ficam no banco e só são servidas com sessão autenticada ao próprio titular ou ao BKO.
- **Marca:** arquivo oficial `lordnutri-logo-2026.png` (2048 × 2048, transparente) aplicado ao logo compartilhado, páginas e metadados da marca. Os ícones instaláveis do celular preservam a versão própria, quadrada e opaca, para evitar fundo branco ao instalar o app.
- **Indicações:** área retirada da navegação do revendedor. Os dados históricos e a API antiga **não** são excluídos. O módulo de campanhas do influenciador permanece independente.
- **Notificações:** não foram implementadas nesta atualização, conforme solicitado.

## Publicar sem perder dados

1. Faça **backup do banco de produção** antes da publicação. Não execute `npm run db:reset:test`, `DROP TABLE`, `TRUNCATE` ou limpeza de cadastros.
2. Substitua o código do repositório pelo **ZIP completo** ou aplique os arquivos do **ZIP leve** sobre a base **LORD-NUTRI-EXPEDICAO-ESTOQUE-SINCRONIZADOS-2026-11-26**. O ZIP leve **não** é um projeto independente.
3. Configure as variáveis de ambiente existentes como antes. Nenhuma senha, banco ou token Asaas está incluído nos ZIPs.
4. No deploy, instale dependências (`npm ci`) e execute `npm run db:migrate` com acesso ao MySQL. A rotina executa **somente alterações aditivas**, incluindo as tabelas de perfis/precificação e a coluna `sales.client_request_id`, sem zerar registros. O processo `npm start` também executa o migrador; as rotas operacionais possuem verificação adicional do esquema.
5. Execute `npm run build`, publique e confira os itens abaixo.

## Checklist pós-publicação

- **BKO → Vendas:** confirmar preço R$ 109,90 e teste de alteração com justificativa (opcional; reverter para 109,90 depois).
- **Revendedor → Vendas:** abrir no celular; com 50 caixas em saldo, cadastrar 3 deve mostrar R$ 329,70 e saldo previsto 47; após confirmar, o estoque e histórico devem registrar a baixa uma vez.
- Atualizar a página: o histórico, preço e saldo devem permanecer iguais. Reenviar a mesma solicitação não deve duplicar venda.
- **BKO → Estoque:** conferir que a movimentação de saída acompanha o mesmo revendedor.
- **Revendedor/Influenciador → Meu Perfil:** salvar bio, enviar foto, recarregar, verificar persistência e remover foto se necessário.
- Conferir ícones/logo na página pública, BKO e portais; fazer atualização forçada do navegador se a marca antiga estiver em cache.
- Conferir que expedição/Correios e confirmação de pagamento Asaas seguem operando normalmente.

## Testes locais

As rotas de venda BKO/portal, integridade de estoque, tratamento de reenvio, isolamento de perfil e formato de foto possuem testes específicos em `tests/lord-sale-api.test.mjs`, `tests/lord-profile-api.test.mjs` e `tests/lord-seller-experience.test.mjs`.

> Este pacote altera **código e esquema de banco**, não migra dados diretamente no banco da sua hospedagem. Para comprovar a sincronização em produção, execute o checklist com usuários de teste e confira os registros reais após o deploy.
