# LORDNUTRI Revendedores — Hotfix 0.3.1

## Correção de build na Hostinger

O build `01a11243-39b3-7274-b0ec-027ad1fd9125` compilou o Webpack com sucesso, mas parou na checagem TypeScript em `components/content-runtime.tsx`.

A função `domPath` foi reescrita com tipos explícitos para o nó atual, elemento pai e lista de irmãos. Isso elimina a inferência circular reportada pelo TypeScript 5.9 (`parent implicitly has type any`) sem alterar o comportamento do CMS/editor.

O comando de produção continua:

```bash
npm run build
```

que executa `next build --webpack`.

Nenhuma regra de checkout, Asaas, estoque, acessos, conteúdo publicado, ANVISA ou manual foi alterada por este hotfix.
