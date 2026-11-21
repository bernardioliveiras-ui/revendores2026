# LORD NUTRI — execução manual do teste de transações InnoDB

**Estado:** script preparado localmente; **ainda não executado no MariaDB de homologação**. O teste será realizado pelo responsável via SSH no banco que declarou exclusivamente de testes. Não é evidência de homologação concluída até receber a saída do terminal.

## O que o script faz

1. Exige `AUTORIZO_TABELA`, senha de banco recebida por pipe do Bash sem eco, destino exato `u922332919_revmix10`, duas conexões independentes e `mysqli`.
2. Cria uma tabela **nova, não financeira e randômica** chamada `lordnutri_hml_tx_<12 hex>`, usando `ENGINE=InnoDB`. Não usa `IF NOT EXISTS`.
3. Insere duas linhas de teste com valores inteiros fictícios, sem dados pessoais.
4. Mantém `UPDATE` da conexão A em transação, exige timeout 1205 no `UPDATE` da conexão B para a mesma linha, depois confirma A e verifica uma única alteração.
5. Faz rollback de um incremento sintético e verifica que ele não persistiu; depois confirma um segundo incremento.
6. Faz `INSERT` concorrente da mesma chave: exige espera/timeout 1205 enquanto A segura a chave e erro 1062 após commit de A; exige quantidade final igual a 1.
7. Executa rollback nas conexões e tenta **DROP TABLE somente na tabela criada pelo próprio processo**. Se não conseguir, mostra o nome exato e encerra com erro.

## Como executar (apenas depois de confirmação de uso exclusivo de testes)

1. Baixe e envie `scripts/homologacao-transacoes-mariadb.php` pelo Gerenciador de Arquivos para a mesma pasta **fora de `public_html`** do teste anterior: `/home/u922332919/domains/revendedores.mix10pro.com.br/`.
2. No SSH, entre na pasta e verifique sintaxe:

```bash
cd /home/u922332919/domains/revendedores.mix10pro.com.br
php -l homologacao-transacoes-mariadb.php
```

3. **Somente se o lint PHP retornar `No syntax errors detected`:** em uma linha própria, peça a senha de modo oculto ao Bash:

```bash
IFS= read -r -s -p 'Senha MySQL (oculta): ' LN_HML_PASS; printf '\n'
```

4. Depois que o prompt `$` reaparecer, execute:

```bash
printf 'AUTORIZO_TABELA\n%s\n' "$LN_HML_PASS" | php homologacao-transacoes-mariadb.php --senha-stdin; unset LN_HML_PASS
```

A senha nunca deve ser copiada para chats, capturas, histórico do shell, argumentos de programa ou arquivos. O nome do banco e os IDs de sessão não são senhas.

## Resultado esperado e contingência

- Os marcadores `[OK]` devem confirmar 1205 na colisão de linha, rollback, segundo commit, 1205/1062 na colisão de chave, **e remoção da tabela**.
- Só considerar o teste aprovado se terminar com `RESULTADO: APROVADO ...` e código zero.
- Se aparecer `[ALERTA] Não foi possível remover a tabela: lordnutri_hml_tx_...`, **não repita nem apague tabelas arbitrárias**. Guarde o identificador completo e peça revisão do `information_schema.TABLES` antes de executar qualquer `DROP` manual.
- Se o PHP emitir erro de sintaxe, conexão ou permissão `CREATE/DROP`, interrompa e encaminhe somente a mensagem redigida (sem senha).

## Limites

Este ensaio demonstra **locks e constraints do banco**, não que os handlers de Asaas/webhook, estoque e acesso implementam idempotência correta. Ainda faltam testes reais dessas rotas com MySQL e mock Asaas, persistência de auditoria, ambiente consultado e revisão da matriz. Não liberar Lote 1 nem produção a partir deste teste isolado.
