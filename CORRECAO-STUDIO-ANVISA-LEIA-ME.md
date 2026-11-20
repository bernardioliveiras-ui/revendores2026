# Correção do campo de notificação ANVISA no Studio da LP

**Atualização:** 19/11/2026. Base: LORD NUTRI 1.8.1 do ZIP fornecido.

## O que foi corrigido

- O texto `mix10pro.007` do Studio deixou de ser um campo sem efeito: a prévia e a LP pública agora renderizam esse mesmo texto.
- Quando o texto segue o formato de notificação ANVISA, a apresentação continua dividida em três linhas, preservando os estilos originais da seção.
- O valor de fábrica foi atualizado para **Processo de Notificação Anvisa Nº 25351.205227/2026-38**, conforme confirmação do responsável.
- Registros antigos que continham apenas o título da notificação ou o identificador anteriormente codificado recebem o novo valor padrão ao serem lidos. Textos personalizados continuam preservados.
- Alterações em rascunho continuam privadas: só aparecem na LP pública depois de clicar em **Publicar textos**.

## Como colocar em produção sem perder dados

1. Faça backup da aplicação e do MySQL da hospedagem antes de atualizar.
2. Implante este projeto em substituição ao código existente, preservando as variáveis de ambiente, banco MySQL, arquivos enviados e permissões.
3. Siga o procedimento de compilação/reinício atualmente usado na hospedagem (Node 22). Não importe um banco vazio e não execute reset de dados.
4. Entre no BKO → **Studio — Textos da LP** → seção **MIX10 PRO** e confirme o texto no campo de notificação. Se necessário, altere-o e clique em **Publicar textos**.
5. Abra a LP em uma nova aba e confira o número; a prévia do Studio também deve mostrar a edição imediatamente.

## Escopo e limitações

- Checkout, meios de pagamento, preços, login e dados do MySQL não foram alterados.
- A edição do **Conteúdo auxiliar → Manual** é separada. O Portal do Revendedor atualmente abre o arquivo estático `Manual_do_Revendedor_Enviado_2026.pdf`; publicar um rascunho do editor do Manual não substitui esse PDF. É preciso decidir qual versão do manual deve ser exibida antes de mudar esse fluxo.
- O identificador foi reproduzido conforme fornecido, sem verificação de validade ou situação regulatória.

## Validação

- Testes específicos da notificação: 4 aprovados.
- TypeScript: sem erros.
- Compilação Next.js de produção: aprovada.
- ESLint dos arquivos alterados: sem problemas.
- A suíte geral e o lint global do ZIP original apresentam falhas em módulos não relacionados (testes antigos de webhook e layout, e regras globais do ESLint); essas falhas não foram encobertas nem alteradas por esta correção.
