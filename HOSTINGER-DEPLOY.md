# Guia atualizado — LORD NUTRI 1.8.0

> **ADENDO LOTE 0 — 20/11/2026:** este pacote contém correções de segurança e está **pronto para compilação em Node 22**, mas **não está liberado para produção**. Ainda faltam homologação MySQL real, auditoria persistente das consultas Asaas e aprovação explícita de deploy. Consulte primeiro `README-ENTREGA.md` e `RELATORIO-FINAL-LOTE0.md`.

Consulte [LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md), [AUTOMACOES.md](AUTOMACOES.md) e [validação 1.8.0](docs/VALIDACAO-1.8.0.md).

A versão anterior deste documento está arquivada em docs/historico.

Destino: Hostinger, aplicação Node 22 + MySQL. Build: `npm run build`. Inicialização: `npm start`, com verificação aditiva do banco antes de abrir o servidor.


## Next 16 / Hostinger
O script de produção está configurado como `next build --webpack`. Isso evita o panic interno do Turbopack observado no processamento de `app/globals.css`/PostCSS no ambiente da Hostinger. Mantenha o Build Command como `npm run build` e o Output Directory como `.next`.

## Checklist da entrega Lote 0 (sem execução automática)

1. Antes de publicar em uma branch observada pela Hostinger, confirmar que o pipeline não fará deploy automático sem aprovação. Atualizar GitHub pode disparar build e deploy de produção.
2. Preservar o conteúdo completo deste ZIP, especialmente `package-lock.json`, `private/manual` (fora de `public`), `database` e `.env.example`. Nunca enviar arquivos `.env` preenchidos, `node_modules`, `.next` ou `.git`.
3. Usar Node.js **22.x**, instalação `npm ci`, build `npm run build` e saída `.next`. Variáveis `NEXT_PUBLIC_*` precisam estar configuradas antes do build.
4. Configurar Asaas **sandbox** e banco **exclusivo de homologação**, com segredos fora do repositório. `INFLUENCER_POLICY_V2_ENABLED=false` é marcador reservado; **não ativa cashback**.
5. **Risco de migração:** o script `npm start` executa `scripts/migrate.mjs` antes de iniciar o Next. Não executar contra produção antes de aprovar as alterações de schema existentes. `npm run start:app` não chama esse prestart, mas não elimina toda possível evolução de schema feita sob demanda pela aplicação.
6. Homologar com duas conexões reais MySQL, erros 502 auditados, concorrência, pagamento, acesso e estoque; preservar 10 falhas legadas como riscos conhecidos. Somente após isso solicitar autorização de produção.

**Nenhuma etapa acima foi executada na Hostinger ao gerar este pacote.**
