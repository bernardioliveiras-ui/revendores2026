# LP no padrão do Manual do Revendedor

Atualização visual de 03/10/2026: capa institucional centralizada, logo dourada transparente, preto e verde com detalhes dourados, títulos tradicionais, textos curtos em cards, pessoas nas seções de relacionamento e oportunidade, caixa atualizada na seção de produtos. Manual de 18 páginas incluído.

## Aplicar somente o layout

Extraia o ZIP fora da pasta do seu projeto. No terminal, dentro da pasta extraída, execute:

```powershell
node APLICAR-LAYOUT-MANUAL.mjs "C:\pasta\do\seu\projeto"
```

O comando copia somente os sete arquivos da LP e dos seus materiais, guardando os anteriores em backup. Depois revise no GitHub Desktop, faça commit e Push origin na branch utilizada pela Hostinger. Não é necessário alterar variáveis de ambiente ou o banco de dados para esta atualização visual.

Se preferir, copie manualmente os arquivos listados em APLICAR-LAYOUT-MANUAL.mjs para as mesmas pastas do projeto.

## Verificação

- Build de produção concluído com TypeScript, 44 rotas geradas.
- Sete testes de LP, preços, checkout e CSS do portal passaram.
- Navegador em 320, 390, 768 e 1440 px: sem transbordamento horizontal e sem imagens quebradas.
- Calculadora: meta R$ 1.000 produz 29 caixas no KIT20 e 25 no KIT50 com os valores padrão.
- FAQ abre normalmente; sem erros JavaScript na navegação testada.
- Nenhuma imagem do produto na abertura institucional.
- Suíte geral: 70/86 passaram; 16 falhas já existem também no ZIP de origem. Os arquivos envolvidos no backend não foram alterados nesta atualização. Os testes gerais envolvem contratos antigos de administração, autenticação e rotas descontinuadas; esta entrega não certifica o funcionamento completo do backend em produção.

Publicação e validação de pagamentos em produção não foram executadas.


## Ajuste visual do flyer

As seções de modelo, oportunidade e produto receberam fundo verde profundo, detalhes dourados e contraste revisado. As pessoas aparecem em cenas completas, com ambiente, assentos ou caminho visíveis. As páginas 2 e 5 do manual seguem o mesmo padrão e o PDF atualizado está incluído no site.

O build e os sete testes relevantes passaram novamente. O navegador verificou 320, 390, 768 e 1440 px, incluindo carregamento das imagens abaixo da primeira tela.
