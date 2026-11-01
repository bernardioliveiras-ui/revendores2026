# Implantação LORD NUTRI v2.7 — 3 perfis

## ALERTA

Esta entrega é uma versão para **homologação**, não produção certificada. O projeto foi examinado localmente; não há acesso direto ao servidor ou à cobrança Asaas e NÃO publicamos alterações.

**Somente três papéis com login:** ADMIN/BKO, REVENDEDOR, INFLUENCIADOR. O legado `client_indicated` está bloqueado, mas tabelas/dados históricos continuam intactos.

## Implantar com segurança

1. Faça backup integral da aplicação atual e exportação SQL verificada do banco. Configure ambiente de homologação sem compartilhamento de dados reais.
2. Extraia o **projeto completo** em diretório limpo (não copie sobre o diretório antigo sem apagar os caminhos na lista `LORD-NUTRI-v2.7-ARQUIVOS-LEGADOS-A-REMOVER.txt`). A atualização incremental contém apenas arquivos alterados + esta lista, logo o processo de deploy deve removê-los.
3. Transfira variáveis de ambiente por canais seguros, sem colocar `.env.local` no ZIP ou GitHub.
4. Na raiz do projeto: `npm ci`; `npm run db:migrate`; `npm run build`; `npm test` (o último exige dependências React/Next presentes).
5. Execute `npm run check:readiness -- --traffic` somente no ambiente que se pretende publicar. Este diagnóstico **não** comprova conexão com Asaas ou banco.
6. Em homologação, valide as etapas descritas no `REVISAO-PRE-LANCAMENTO-v2.7.md`, em especial a preservação do código da campanha ao sair da página institucional até o checkout.
7. Somente após todos os testes, publique o release e configure monitoramento, backup e rollback. Faça nova validação end-to-end antes de ativar campanhas pagas.

**Nota de compatibilidade**: a antiga URL pública `/ativar-cliente?token=...` é apenas redirecionamento para o novo fluxo. O endpoint de ativação antigo e as APIs individuais foram retirados.

**Não altere tabelas nem usuários manualmente para executar esta atualização.**
