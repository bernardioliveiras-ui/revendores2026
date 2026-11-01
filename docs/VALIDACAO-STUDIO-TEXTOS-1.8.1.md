# Validação · Studio de textos 1.8.1

Data: 10/10/2026. Base: ZIP completo `LORDNUTRI-REVENDEDORES-1.8.0.zip`. Atualização: editor de textos no BKO, com rascunho, prévia e publicação, preservando o layout existente.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `npm test` | 207 testes passaram; 0 falhas, 0 ignorados |
| `npx tsc --noEmit` | Sem erros |
| `npm run lint` | 0 erros; 14 avisos preexistentes |
| `npm run build` | Compilação de produção concluída, com a rota protegida de prévia |
| Navegador Chromium | 11 cenários passaram; nenhum erro de execução da página |
| HTML inicial completo | Idêntico ao emitido pela versão 1.8.0, incluindo checkout e simulador |
| CSS original e arquivos públicos | `app/landing.css` e os 24 arquivos públicos preservados byte a byte |
| Revisão de código | Achados corrigidos e conferidos por revisão independente |

As verificações locais usaram Node 24.19.0; a configuração de hospedagem continua Node 22 e MySQL. Os avisos do lint são os usos de `img` existentes e funções antigas sem uso em `lib/content-studio.ts`; os arquivos novos não acrescentaram avisos.

## Comportamentos conferidos

O catálogo tem 236 campos de texto. As regras aceitam apenas chaves conhecidas e valores textuais dentro do limite. React escapa o texto; não há interpretação de HTML fornecido pelo editor. Classes CSS, estilos e atributos estruturais ficam fora do catálogo, com uma regressão que verifica esse limite no código da LP.

Rascunho e publicação usam versões distintas. A publicação grava o rascunho e a versão pública de forma atômica; uma versão antiga recebe conflito, sem sobrescrever a edição concorrente. O documento novo não aplica HTML ou estilos guardados pelo construtor antigo. Falha do banco mantém a LP original disponível, e o editor retorna um erro sem revelar credenciais.

Os testes de autorização bloqueiam visitantes, revendedores e administradores com troca inicial de senha pendente antes de acessar os textos. As mutações verificam a origem, o cabeçalho do editor, o formato e o tamanho do corpo.

No navegador, foram conferidos: LP inicial no computador e no celular; texto chegando à prévia; rascunho sem publicação; busca sem esconder o campo enquanto ele é alterado; título longo na prévia móvel; cancelamento ao trocar de aba com edição pendente; campos bloqueados durante recarga; conflito de versão preservando a edição; envio de publicação apenas com textos e versão; BKO móvel com abas legíveis; título e botões no limite de caracteres sem sair dos seus contêineres.

As telas foram verificadas em 1440 × 1000 e 390 × 844. Textos maiores podem aumentar o número de linhas, sem liberar controles de posição, fonte ou cor. Os espaços originais entre trechos e destaques são preservados ao renderizar a edição.

## Limites da validação

A persistência foi exercitada com as instruções SQL reais por um adaptador SQLite de teste. O navegador usou respostas simuladas nas fronteiras de sessão, BKO e armazenamento; a prévia usou os mesmos componentes da LP em uma página temporária, excluída do pacote e da compilação final.

Esta validação não acessou o MySQL de produção, o Asaas real ou a hospedagem do cliente. Não foram criadas cobranças nem enviadas mensagens. A atualização ainda precisa ser publicada na aplicação existente, preservando suas variáveis e credenciais. As orientações estão em `LEIA-ME-PRIMEIRO.md` e `STUDIO-TEXTOS-LEIA-PRIMEIRO.md`.
