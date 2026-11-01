# LORD NUTRI — Materiais de divulgação (atualização)

## Revendedores
- No painel do revendedor, em **Manual do Revendedor**, ficam o PDF enviado pelo BKO (22 páginas) e o folder digital MIX10 PRO.
- O arquivo `private/manual/Manual_do_Revendedor_Enviado_2026.pdf` é servido apenas pela rota autenticada `/api/reseller/manual?edition=material`, com a regra anterior de revendedor com pagamento de kit confirmado e acesso liberado, ou BKO/Admin. Não é colocado em `public`.
- O manual anterior e a edição do Studio permanecem preservados; o PDF enviado passou a ser o exibido nessa seção.

## Indicadoras e indicadores
- Em **Minhas indicações**, o parceiro vê somente o folder digital para abrir, baixar, copiar o endereço ou compartilhar no WhatsApp.
- **O manual do revendedor não é exibido nem autorizado para indicadores.** Nada muda nos seus acessos, aprovações ou contabilidade.
- O folder está em `public/materiais/folder-mix10pro.png`: intencionalmente público para permitir que compradores abram o link sem fazer login. Não contém comprovantes ou informações dos usuários.

## Compartilhamento
- Em celulares com Web Share API e compartilhamento de arquivos, o botão oferece o arquivo PNG para a escolha do aplicativo, incluindo WhatsApp quando disponível.
- Em outros aparelhos abre o WhatsApp com **link do folder**. O navegador não comprova que a mensagem foi enviada/lida.
- O compartilhamento do folder não altera o contador de leads, vendas ou cashback: somente links individuais de indicação têm esse acompanhamento.

## Atualização na Hostinger
- Publique o ZIP completo preservando as configurações existentes. Confira que o arquivo PDF privado foi incluído no deploy (o `next.config.ts` já inclui `private/manual/*.pdf` no rastreio do endpoint).
- Não exige SQL/migração, chave Resend ou mudança de variáveis de ambiente.
- Após publicar, teste a aba **Manual do Revendedor** com conta de revendedor autorizada e **Minhas indicações** com conta indicadora.
- Teste também com um indicador e sem login que `/api/reseller/manual?edition=material` devolve erro e nunca conteúdo PDF.
- Abra o folder em uma janela anônima para confirmar que o compartilhamento está público.
- Nenhuma publicação é feita automaticamente: é necessário atualizar o projeto na Hostinger.
