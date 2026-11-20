# Atualização v2.8 — Reposição KIT100 e biblioteca de materiais

## Implementado
- Apenas no painel do revendedor / Estoque / Reposição: KIT100, 100 unidades × R$ 67,90 = **R$ 6.790,00 antes do frete**. Pix/cartão usam o mesmo fluxo Asaas das reposições existentes, e a entrada no estoque continua condicionada à confirmação de pagamento. Não altera a landing page nem os kits iniciais.
- BKO: nova aba **Materiais Revendedor**. Admin publica com título, anexa banners/imagens, vídeos (MP4/WebM) ou PDF até 20 MB e exclui itens antigos.
- Revendedor: nova lista em **Manual do Revendedor**, com download dos arquivos. Não permite upload ou exclusão.
- Arquivos armazenados em MySQL (`reseller_materials`), evitando perdas ao atualizar o código. Tabela criada sob demanda; não é necessário SQL manual, mas exige permissão CREATE TABLE no usuário de banco.
- Downloads exigem autenticação e uma compra quitada com acesso liberado (mesma lógica de acesso ao manual), sem abrir arquivos para indicadores ou usuários anônimos.

## Atenção antes de publicar
- Fazer backup do banco, dos arquivos e das variáveis de ambiente. **Não publicar direto em produção sem testar em homologação.**
- Verificar limite de upload na Hostinger e espaço disponível no MySQL; vídeos grandes devem ser convertidos para menos de 20 MB.
- Testar com contas ADMIN, REVENDEDOR, INDICADOR, sem login e com revendedor sem pagamento liberado.
- Efetuar compra de teste KIT100 no sandbox Asaas e validar: pedido pendente não soma estoque; webhook pago soma exatamente 100 unidades; repetição do webhook não soma novamente; frete e parcelamento cobrados corretamente.
- Esta revisão não constitui auditoria completa dos fluxos em produção. Não houve acesso ao banco/Asaas/Hostinger para testar integrações reais.
