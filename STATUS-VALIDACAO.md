# Status de validação — MIX10 PRO v2 Clean

Data da validação: 21/09/2026.

## Verificações concluídas neste ambiente

- 23/23 testes automatizados passaram.
- 36 arquivos TypeScript/TSX passaram na verificação sintática por transpile do TypeScript, com 0 erros de sintaxe.
- Auditoria de imports locais: 0 imports locais ausentes.
- Banco novo: `database/schema.sql` contém exatamente 9 tabelas operacionais da V1.
- Busca de runtime legado: nenhum Resend, Wrangler, Cloudflare ou D1 em `app`, `lib`, `db`, `database`, `components`, `package.json` ou `.env.example`.
- Nenhum arquivo `.env`, `.env.local` ou `.env.production` é incluído no projeto.
- KIT20 e KIT50 estão com preços definidos no servidor; o checkout não aceita preço enviado pelo navegador.

## Build completo

O build Next.js **não pôde ser comprovado neste ambiente** porque o container não conseguiu baixar as dependências do `registry.npmjs.org`. Uma tentativa de `npm ci` ficou bloqueada por acesso de rede/DNS e uma chamada direta anterior ao registry retornou `EAI_AGAIN`. Sem `node_modules`, `npm run build` retorna `next: not found`.

Isso é uma limitação do ambiente de validação, não uma confirmação de build. Na Hostinger, execute obrigatoriamente:

```bash
npm ci
npm run build
npm start
```

Só publique em produção se `npm run build` terminar com exit code 0.

## Item externo ainda necessário

A VSL final não foi fornecida com este briefing. O player e o layout estão prontos, mas você deve colocar o MP4 real em:

`public/videos/vsl-mix10.mp4`

## Publicação recomendada

Use `ASAAS_ENVIRONMENT=sandbox` primeiro e complete o checklist ponta a ponta de `HOSTINGER-DEPLOY.md` antes de mudar para produção.
