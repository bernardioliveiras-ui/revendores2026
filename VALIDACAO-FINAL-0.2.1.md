# Validação final - LORDNUTRI Revendedores 0.2.1

## Validado nesta consolidação
- 21/21 testes focados em checkout, Asaas webhook, provisionamento, idempotência, estoque, expedição, portal/BKO e LP passaram.
- 5/5 testes adicionais da consolidação passaram: posição da prova LORDNUTRI/Google, favicon, manual incorporado, reposição Asaas, ordem da navegação, digitação de quantidade e automações de e-mail.
- `app/page.tsx` e `app/painel/portal-client.tsx` foram transpilados com TypeScript sem erro de sintaxe.
- Rotas/serviços alterados passaram em `node --experimental-strip-types --check`.
- Manual PDF renderizado novamente: 11 páginas, sem páginas quebradas ou elementos cortados na inspeção visual.

## Suíte histórica
A suíte completa contém testes antigos de arquiteturas/rotas já aposentadas; 70/86 passaram e 16 expectativas históricas continuam desatualizadas. Os fluxos modificados nesta entrega foram validados pela suíte focada acima.

## Build Hostinger
O projeto permanece configurado com `npm run build` -> `next build --webpack`, Node 22 e saída `.next`. O build completo não foi executado neste ambiente porque as dependências npm não estavam disponíveis offline; a Hostinger fará a instalação e o build a partir do `package-lock.json`.

## Automação de produção
Para automação total, configure `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT`, `ASAAS_WEBHOOK_TOKEN`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` e `WELCOME_EMAIL_FROM`/`EMAIL_FROM`. Integrações opcionais: `WELCOME_AUTOMATION_URL/TOKEN` e `SHIPPING_WEBHOOK_TOKEN`.
