> **Atualização:** a navegação e as métricas foram reorganizadas como CRM de Parceiros. Consulte `CRM-PARCEIROS-LEIA-ME.md` para a especificação vigente. O texto abaixo documenta a implantação anterior.

# LORD NUTRI — Indicadores por comprovante (Hostinger)

## Separação operacional

- **Revendedores:** Asaas via LP, estoque, vendas de revendedores e cashback existente continuam **intocados**. A aba do BKO foi identificada como `Vendas · Revendedores`.
- **Clientes indicados antigos:** continuam no módulo `Acessos · Clientes`; não recebem papel de revendedor.
- **Indicadores:** perfil independente `indicator`, cadastro/convite privado pelo BKO > Indicadores ou pelo PowerShell. O perfil não pode acessar `/painel`, dados de outros indicadores ou comprovantes de terceiros.

## Fluxo Isabella → comprador → BKO

1. BKO: painel > **Indicadores** > cadastrar Isabella. Enviar o convite HTTPS privado de uso único (24h) via WhatsApp; ativação define senha escolhida por Isabella.
2. Isabella: entrar no `/entrar`, acessar `/minhas-indicacoes`. Cadastrar cada pessoa (nome e telefone) para criar link individual `/i/<codigo>`; botão **Enviar pelo WhatsApp** prepara mensagem com esse link.
3. Comprador: abre `/i/<codigo>` que redireciona para `https://mix10pro.com.br/lp-v2`. Não recebe acesso ao BKO nem precisa criar conta na plataforma do indicador. **Não há integração de pagamento automática com a LP** neste setor. Cliques podem incluir prévias do WhatsApp e não provam compra.
4. Comprador envia seu comprovante em conversa privada para Isabella, e **Isabella anexa no painel autenticado** à indicação correta (PDF/JPG/PNG, até 8 MB). Caso se deseje upload direto pelo comprador no futuro, será necessário um mecanismo seguro de identidade/link privado separado, não um endpoint público de upload.
5. Ao anexar, a prova fica **PENDENTE**; o status **NÃO** vira COMPROU. BKO > **Indicadores** > **Conferir arquivo** e selecionar `APROVADO` **e** `COMPROU` para contabilizar. `REJEITADO` exige orientação. Reenvio não duplica venda: apenas o comprovante corrente de cada indicação entra na contagem.
6. Painel BKO exibe `Comprovantes recebidos`, `Pendentes`, `Compras confirmadas` e `Rejeitados`. Confirmado = um registro de indicação que contenha comprovante + conferência APROVADO + status COMPROU.
7. Cashback é manual (valor e estado PENDENTE/LIBERADO/PAGO) sem regras de cálculo, estoque, faturamento automático ou pagamento via Asaas.

## Conta Isabella já criada como cliente indicado

No BKO > Indicadores, insira mesmo e-mail, nome e telefone de Isabella e marque **Converter uma conta antiga de cliente indicado em indicadora**. A operação exige um cadastro antigo de `client_indicated` **sem comprovante**, revoga sessões/convites, troca apenas o papel para `indicator`, mantém a indicação antiga no banco como histórico e gera novo convite. A antiga indicação sai da lista operacional de `Acessos · Clientes`. Não há conversão de revendedor nem de administrador.

## Exemplo PowerShell (Windows)

```powershell
& "$env:USERPROFILE\Downloads\criar-indicador.ps1" `
  -BaseUrl "https://revendedores.mix10pro.com.br" `
  -Nome "Isabella" -Email "isabella@exemplo.com" -Telefone "11999999999"
```

Se Isabella já é `client_indicated` sem comprovante, acrescente `-ConverterClienteExistente`. Se a execução for bloqueada por política, somente na janela atual: `Set-ExecutionPolicy -Scope Process RemoteSigned -Force`. O script solicita credenciais BKO, não usa Hostinger/MySQL diretamente. Use a URL **sem** `/painel`.

## Hostinger / banco

1. Faça backup do banco antes de atualizar a aplicação. Publique o conteúdo inteiro deste ZIP, mantendo `.env`/variáveis da Hostinger já configuradas. **Não cole chaves nos arquivos enviados**.
2. Mantenha as variáveis MySQL existentes (`DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` e configuração de porta/SSL), `AUTH_SECRET` e URL HTTPS do painel. `RESEND_API_KEY` e `WELCOME_EMAIL_FROM` não são exigidos pelo setor de indicadores.
3. Execute `npm run db:migrate` no processo de deploy ou deixe `npm start` executar as migrações aditivas. Há também criação controlada de tabelas ao acessar o setor, para hospedeiros que iniciam direto o Next.
4. Tabelas **novas**: `indicator_profiles`, `indicator_leads`, `indicator_receipts`. Não se misturam com `sales`, `affiliate_referrals`, `affiliate_cashbacks`, `reseller_profiles`, `purchases` ou o webhook Asaas.
5. Teste em ambiente de homologação: criar Isabella, ativar com convite, cadastrar comprador, enviar link WhatsApp, anexar comprovante, verificar isolamento com outra indicadora, aprovar e contar uma vez; também testar rejeição/reenvio, conversão e vendas de revendedor.

## Limitações verificadas

- Não foi feita implantação na Hostinger nem migração ou upload em banco real; é necessário validar as permissões reais do usuário MySQL e o tamanho máximo de upload do proxy (8 MB + multipart).
- A LP de destino não comunica pagamentos ou carrinho a este setor; compras são conferidas **manualmente pelo BKO por comprovante**, que por si só deve ser confrontado com o recebimento no meio de pagamento antes de aprovar.
- O botão WhatsApp **abre mensagem para compartilhar**; não envia automaticamente nem comprova entrega, clique humano ou pagamento.
- A compilação Next completa e um teste antigo de renderização da LP exigem React/Next instalados; este ambiente executou as verificações de código e os testes independentes de React.
- Para segurança, cada `client_indicated` convertido mantém o registro antigo arquivado apenas de forma lógica (inacessível pela lista operacional). Nenhum dado histórico é apagado.
