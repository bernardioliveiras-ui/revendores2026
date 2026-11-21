# LORD NUTRI — próximo ensaio Node 22 + MariaDB (auditoria sintética)

**Estado em 20/11/2026:** executor `tests/lote0-homologation-mysql.mjs` preparado localmente e testes de bloqueio executados. **Ainda não foi conectado ao MariaDB da Hostinger nem executou INSERT real.**

## Antes de qualquer execução

1. **Confirmado pelo responsável:** a aplicação online usa `u922332919_revmix10`, e ele autorizou expressamente o reaproveitamento. **Exceção técnica limitada:** o executor permite exclusivamente registros sintéticos na tabela não financeira `asaas_reconciliation_audit` desse banco, usando `HOMOLOGATION_SHARED_AUDIT_ONLY=yes`. Não executar casos que escrevem em pedidos, usuários, estoque, pagamentos ou cashback nessa base compartilhada.
2. Garantir Node **22** em um computador ou runtime isolado. O SSH compartilhado da Hostinger tem PHP/MySQL, mas o comando `node` não estava disponível. Nunca rodar `npm start`: o script do projeto executa migrations automaticamente.
3. Confirmar que a tabela **não financeira** `asaas_reconciliation_audit` já foi criada. Nenhuma migration adicional é exigida por este executor. O ensaio compartilhado deixa quatro linhas sintéticas identificáveis; não as apaga automaticamente.
4. Usar somente o acesso ao banco **expressamente autorizado** para esta auditoria, em processo isolado e por variáveis temporárias. Não salvar `.env` no repositório, capturas de terminal ou relatórios. O executor não tem acesso à chave Asaas e não consulta o serviço externo.

## Testes locais sem conexão

No terminal do projeto:

```bash
node --test tests/lote0-homologation-mysql-runner.test.mjs
node tests/lote0-homologation-mysql.mjs
```

O primeiro deve passar sem abrir rede. O segundo deve recusar execução com instrução de uso; **não** é falha da aplicação.

## Execução restrita à auditoria no banco compartilhado

Uma possibilidade é executar Node 22 no computador Windows e acessar o MariaDB por túnel SSH. **A exceção abaixo permite somente teste de auditoria**, mesmo com banco ligado ao site online; nenhuma ação financeira é autorizada.

Terminal PowerShell A (deixar aberto, usando usuário/host SSH autorizados):

```powershell
ssh -N -o ExitOnForwardFailure=yes -p 65002 -L 13307:127.0.0.1:3306 USUARIO_SSH@HOST_SSH
```

Terminal PowerShell B, dentro da pasta completa do projeto:

```powershell
node -v  # Deve começar com v22.
npm ci
$env:DATABASE_HOST = "127.0.0.1"
$env:DATABASE_PORT = "13307"
$env:DATABASE_NAME = "u922332919_revmix10"
$env:DATABASE_USER = "USUARIO_MYSQL_DO_BANCO_AUTORIZADO"
$env:ASAAS_ENVIRONMENT = "sandbox"
$env:HOMOLOGATION_TEST_ONLY = "yes"
$env:HOMOLOGATION_DATABASE = $env:DATABASE_NAME
$env:HOMOLOGATION_EXCLUSIVE_DB_CONFIRMED = "no"
$env:HOMOLOGATION_SHARED_AUDIT_ONLY = "yes"
```

A senha do banco autorizado pode ser digitada de modo oculto no PowerShell (o valor não aparece no histórico de comandos):

```powershell
$senhaSegura = Read-Host "Senha MySQL do banco autorizado" -AsSecureString
$ponteiroSenha = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)
try { $env:DATABASE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ponteiroSenha) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ponteiroSenha) }
```

Depois de configurada, executar o **preflight somente leitura**:

```powershell
node scripts/homologation-preflight.mjs
```

Se o preflight passar, a pessoa já autorizada configura a confirmação específica **somente da escrita não financeira de auditoria** e executa:

```powershell
$env:HOMOLOGATION_AUDIT_WRITE_CONSENT = "yes"
node tests/lote0-homologation-mysql.mjs --execute
```

O executor abre **duas conexões reais**, verifica o banco/estrutura InnoDB, grava `started`/`finished` pelo serviço TypeScript do produto com Drizzle/mysql2, verifica a persistência e confirma que a constraint `UNIQUE(attempt_id,phase)` bloqueia uma finalização duplicada. Usa apenas IDs sintéticos `hml-*`; **quatro linhas de auditoria permanecem**. Não toca pedidos, usuários, estoque, cashback, pagamentos nem mensagens.

Após o teste, remover do processo a variável `DATABASE_PASSWORD` com `Remove-Item Env:DATABASE_PASSWORD` e encerrar o túnel SSH. **Nunca compartilhar os valores secretos nos resultados.**

## Como ler o resultado

- `AUDITORIA_SQL_APROVADA`: confirma somente persistência de auditoria e unicidade com duas sessões reais; **não** aprova o fluxo financeiro completo.
- Erro de gate, conexão ou schema: interromper e revisar ambiente; não repetidamente tentar em produção.
- Cenários adicionais pendentes: conciliação BKO com handler real, compras sintéticas, acesso, estoque, dois webhooks diferentes, estorno/parcelamento e concorrência financeira. **Esses cenários permanecem proibidos na base compartilhada**, mesmo após o teste de auditoria; exigem ambiente separado.

**Lote 1, deploy e política de cashback V2 continuam bloqueados.**
