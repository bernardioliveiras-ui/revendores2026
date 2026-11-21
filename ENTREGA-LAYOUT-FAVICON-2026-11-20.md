# LORD NUTRI — layout dos portais + favicon dourado

**Entrega de código-fonte para atualização manual do GitHub.** Esta entrega não publica nada automaticamente e não autoriza ativação financeira em produção.

## O que vem neste ZIP

- Projeto Next.js completo (BKO, Revendedor, Influenciador, login, APIs, scripts, banco, testes, materiais e documentação), incluindo `package.json` e `package-lock.json`.
- Camada visual `app/portal-modern.css` para os três perfis, com um resumo azul-marinho e dourado nos portais de Revendedor e Influenciador: saldo real de caixas, nome da sessão e campanha real. O botão do revendedor abre o formulário de vendas já existente. A demonstração do ChatGPT Sites é uma **referência visual**, não uma fonte de números ou um backend implantado.
- Favicon **somente com o emblema dourado original, centralizado e com transparência**, sem fundo preto/azul: `app/icon.png`, `app/apple-icon.png`, `public/favicon.png`, `public/favicon-16.png`, `public/favicon-32.png`, `public/favicon.ico`. O SVG antigo permanece no projeto por compatibilidade, mas não é mais a prioridade dos metadados do site.
- Teste automatizado do fundo transparente, centralização e metadados (`tests/lord-nutri-favicon.test.mjs`).

**Não incluído:** `node_modules`, `.next`, `.git`, arquivos `.env` preenchidos, senhas ou backups de banco. Configure os segredos **na Hostinger**, nunca no GitHub.

## Como usar no Windows / GitHub Desktop

1. Baixe e **extraia** o ZIP. O GitHub precisa receber as **pastas e arquivos extraídos**, não o ZIP como um arquivo único.
2. No GitHub Desktop, abra o clone local de `bernardioliveiras-ui/revendores2026`. Confirme que não há alterações suas sem salvar e guarde cópia da versão anterior.
3. Copie o conteúdo **de dentro da pasta do ZIP** para a pasta raiz do clone, preservando `app`, `components`, `public`, `db`, `lib`, `scripts`, `tests`, `private/manual`, `package-lock.json` etc. Aceite substituir arquivos que pertencem à entrega, mas **não apague** a pasta oculta `.git` do clone.
4. No GitHub Desktop, confira a lista de mudanças e o diff, especialmente os arquivos de backend e as variáveis de ambiente. **Não faça push na `main` de produção antes de decidir e aprovar a publicação**: ela pode disparar o deploy automático da Hostinger.
5. Para testar localmente sem banco real, abra o PowerShell na pasta do clone e execute:

```powershell
node --version
npm.cmd ci
node --test tests/lord-nutri-favicon.test.mjs tests/lord-nutri-modern-ui.test.mjs
npm.cmd run build
```

Use Node.js **22.x**. `npm.cmd` evita o erro de política de execução do `npm.ps1` no PowerShell. O `npm ci` reinstala dependências, e o build não substitui homologação das operações de pagamento.

## O que é PowerShell e o que depende de outros painéis

| Etapa | Onde fazer | Observação |
| --- | --- | --- |
| Testes de código e build | PowerShell | `node`, `npm.cmd`, testes e build. |
| Revisar alterações e enviar código | GitHub Desktop | `Commit`/`Push`, somente após conferir o deploy. |
| Segredos, banco, Node e publicação | hPanel Hostinger | Variáveis da aplicação e configuração da implantação. |
| Cobranças, notificações e conciliação | Painel Asaas + sandbox | Validação e webhooks próprios, sem transação real no teste. |
| Etiqueta, cotação, rastreio automático | API/contrato Correios | Integração oficial ainda não está homologada. A interface atual aceita registro de expedição e link de rastreio. |
| Estoque, cashback e influenciadores | Banco de testes isolado e rotas do CRM | Exigem testes de concorrência, duplicidade, cancelamento, estorno e permissão. |

### Situação das integrações

- **Banco/MariaDB:** houve teste anterior de duas conexões e bloqueios em tabela sintética, mas isso não valida todos os handlers reais; não tratar o banco compartilhado como ambiente de testes sem confirmação.
- **Asaas:** há código de conciliação e testes simulados, mas eventos e valores reais precisam de homologação no sandbox antes de produção.
- **Estoque:** já existe lógica de dedução ao registrar venda, porém a operação completa deve ser validada no banco isolado.
- **Influenciador/cashback:** os cálculos existentes foram preservados; a regra nova de R$ 20/caixa não foi ativada nem apresentada como fato real.
- **Correios:** atualização de status no CRM e consulta externa de rastreio não equivalem a uma integração completa automática com os Correios.

### Atenção com inicialização da Hostinger

`npm start` pode invocar `scripts/migrate.mjs` por meio do script prestart. **Não rode migrations nem scripts de limpeza contra o banco online sem análise e aprovação.** Build recomendado: `npm run build`, saída `.next`, Node.js 22.

Após um deploy autorizado, o favicon pode ficar antigo no navegador por cache: atualize com **Ctrl+F5**, abra uma janela anônima e aguarde a atualização do cache. Se a aba ainda mantiver o anterior, confira `/favicon-32.png` e `/favicon.ico` pelo navegador.

## Segurança

Nunca envie em prints, mensagens ou GitHub as senhas MySQL/SSH, `DATABASE_PASSWORD`, `AUTH_SECRET`, tokens Asaas, dados de clientes ou chaves de webhook. Este pacote foi feito para revisão e implantação controlada — **nenhuma cobrança, webhook real, atualização de estoque ou escrita em produção foi executada durante a preparação**.
