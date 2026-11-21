# LORD NUTRI — pacote para teste local, NÃO publicar

**Data:** 20/11/2026. **Objetivo:** permitir testes locais com Node.js 22 e preparar o ensaio de auditoria MySQL em duas sessões, com Asaas simulado. Este pacote **não está autorizado para deploy ou merge na main**.

## Primeiro teste no Windows (sem banco e sem senha)

1. Extraia todo o ZIP em uma pasta, por exemplo `Documentos\lord-nutri-homologacao`.
2. Abra essa pasta no Explorador e, na barra de endereço, digite `powershell` e pressione Enter.
3. Execute estes comandos **um por vez**:

```powershell
node -v
npm ci
node --test tests/lote0-homologation-mysql-runner.test.mjs
```

O Node `v22.16.0` informado pelo responsável está dentro da versão principal pretendida. O teste acima não abre conexão, não pede senha e deve mostrar **4 testes aprovados**.

**Nunca executar `npm start` ou `npm run db:migrate` neste momento:** `npm start` invoca migrations automaticamente. Não criar arquivo `.env` real no ZIP, não enviar senhas, não publicar no GitHub e não rodar a aplicação online neste passo.

## O que foi preparado

- Rotas BKO de conciliação Asaas com auditoria append-only `started`/`finished` e respostas seguras.
- Executor `tests/lote0-homologation-mysql.mjs`, com duas sessões SQL, somente para **4 linhas sintéticas na tabela `asaas_reconciliation_audit`** mediante flags de consentimento. A exceção de banco compartilhado `u922332919_revmix10` **não permite alterar pedidos, acessos, estoque, histórico financeiro ou cashback**.
- Documentação de execução completa em `docs/EXECUCAO-AUDITORIA-NODE22-2026-11-20.md`.
- Interface local branca/dourada em evolução. **Não confundir visual construído com telas integradas/homologadas em produção.**

## Verificações locais antes da entrega

- `npm test`: **342 testes aprovados, 10 falhas legadas, 352 no total** (apenas 4 testes de guarda novos nesta última preparação).
- `npm run build`: aprovado.
- `npx tsc --noEmit`: aprovado.
- `npm run lint`: 349 erros e 222 avisos preexistentes.
- `git diff --check`: aprovado.

O MySQL real da Hostinger e os handlers financeiros concorrentes **não foram testados a partir deste ambiente**. Sem sessão SSH autenticada e sem Node no shell SSH da Hostinger, a conexão Node 22 + MySQL ainda depende do procedimento manual controlado descrito no documento acima. Não inserir dados reais no pacote nem compartilhar credenciais.

## Referências

- `README-ENTREGA.md` e `HOSTINGER-DEPLOY.md` são documentos históricos do Lote 0; não usar os valores antigos de testes como resultado atual.
- `docs/RELATORIO-AUDITORIA-ASAAS-LOTE0-2026-11-20.md` contém os resultados atualizados, riscos e rollback.
- A regra nova do influenciador continua inativa: `INFLUENCER_POLICY_V2_ENABLED=false`.
