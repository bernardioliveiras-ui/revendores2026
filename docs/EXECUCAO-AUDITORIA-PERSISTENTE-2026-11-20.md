# LORD NUTRI — instalação manual da tabela de auditoria Asaas em homologação

**Estado em 20/11/2026:** o responsável executou manualmente `scripts/homologacao-criar-auditoria.php` no SSH e compartilhou captura mostrando **RESULTADO: APROVADO**. A tabela não financeira persistente `asaas_reconciliation_audit` foi criada no banco identificado como exclusivo de testes `u922332919_revmix10`, com InnoDB e 16 colunas. **O backend não foi conectado ao MySQL real nem implantado por este trabalho.** Os passos abaixo ficam como registro histórico do procedimento executado, não como instrução para repeti-lo.

## Escopo exato

- Executa uma consulta de identidade do banco e valida `DATABASE()` e `CURRENT_USER()` antes de qualquer alteração.
- Confirma que `asaas_reconciliation_audit` **não existe**. Se já existir, encerra sem modificar.
- Executa **uma única instrução `CREATE TABLE`** com os 16 campos e índices definidos em `docs/superpowers/specs/2026-11-20-asaas-auditoria-design.md`.
- Confirma mecanismo InnoDB e número de colunas após a criação.
- A tabela **permanece**. Não é uma fixture descartável, e nenhum dado de auditoria é inserido pelo instalador.
- Não altera `purchases`, `users`, `reseller_profiles`, `stock_movements`, `asaas_events`, configurações globais, valores financeiros, termos ou cashback.
- Não consulta nem envia dados ao Asaas, Correios, WhatsApp ou e-mail.

## Passos no SSH (Hostinger, fora de `public_html`)

1. Baixar somente `scripts/homologacao-criar-auditoria.php` e fazer upload para `/home/u922332919/domains/revendedores.mix10pro.com.br/`, junto dos dois scripts anteriores.
2. No SSH, executar a verificação de sintaxe:

```bash
cd /home/u922332919/domains/revendedores.mix10pro.com.br
php -l homologacao-criar-auditoria.php
```

3. **Somente se `php -l` retornar sem erros**, digitar a senha de modo oculto (o comando não contém a senha):

```bash
IFS= read -r -s -p 'Senha MySQL (oculta): ' LN_HML_PASS; printf '\n'
```

4. Após digitar a senha e pressionar Enter, executar:

```bash
printf 'AUTORIZO_AUDITORIA_PERSISTENTE\n%s\n' "$LN_HML_PASS" | php homologacao-criar-auditoria.php --senha-stdin; unset LN_HML_PASS
```

O Bash recebe a senha sem eco. O script PHP recebe a senha via pipe, não imprime nem salva credenciais. **Nunca enviar a senha ou uma captura de sua digitação.**

## Interpretação do resultado

- `RESULTADO: APROVADO - tabela de auditoria não financeira criada e verificada.`: tabela existe, persistente, sem dados inseridos; guardar a saída sem segredos.
- `A tabela ... já existe`: não tentar recriar nem apagar; enviar o aviso e revisar o schema.
- `ERRO` ou `RESULTADO: NÃO APROVADO`: interromper, não repetir às cegas; enviar somente a mensagem segura.
- Se houver falha **após a criação**, a tabela pode existir. O script avisa e não tenta removê-la. Uma futura remoção exige identificação exata e autorização própria para não apagar trilha de auditoria.

## Após aprovar a instalação

Implementar a gravação `started`/`finished` na rota BKO e testar HTTP 502 com auditoria escrita antes da resposta. Somente depois exercer os handlers reais com Asaas mock/sandbox e MySQL de homologação. **Criar a tabela não significa que a auditoria já esteja funcionando.**

Lote 1, deploy, cashback novo, migrations financeiras e mensagens reais permanecem bloqueados.
