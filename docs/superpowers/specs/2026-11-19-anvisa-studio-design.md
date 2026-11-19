# Correção do campo ANVISA no Studio da LP

**Intenção:** a edição da notificação no Studio deve aparecer na prévia e, depois de clicar em "Publicar textos", na LP pública. O usuário confirmou `25351.205227/2026-38`.

**Comportamento:** manter o campo existente `mix10pro.007` (incluindo rascunhos salvos no MySQL), exibir todo o seu conteúdo sem HTML e preservar as três linhas da apresentação quando o texto segue o formato "Processo de Notificação ANVISA Nº ...". Se o usuário escrever outro texto, a página precisa exibi-lo, não ignorá-lo. Rascunho não publica automaticamente.

**Compatibilidade:** valores antigos de fábrica, sem o novo número ou com o identificador antigo, passam a usar o novo texto-base quando lidos, sem recriar tabelas e sem apagar outros textos. Dados personalizados continuam intactos. Checkout, pagamentos e demais textos permanecem iguais.

**Abordagens:** (1) manter número fixo e mudar apenas o literal (não resolve futuras edições); (2) criar um segundo campo (quebra o texto já editado); (3) reutilizar `mix10pro.007`, formar as três linhas no componente e reconhecer o valor legado (escolhida pelo usuário ao pedir correção pelo Studio).

**Limites:** a atualização precisa ser implantada na hospedagem; o ZIP isolado não altera a página publicada. Não verifica situação regulatória da notificação e não altera manual ou cadastro de produto.
