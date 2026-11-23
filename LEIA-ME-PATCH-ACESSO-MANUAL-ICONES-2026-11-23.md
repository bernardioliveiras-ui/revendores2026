# LORD NUTRI — pacote de correção de 23/11/2026

## O que muda

1. **BKO > Revendedores > Gerenciar acesso aos materiais**: administrador pode liberar ou revogar manualmente PDF e materiais após conferir um pagamento externo. Justificativa e referência do comprovante são obrigatórias na concessão; cada decisão fica no histórico do banco.
2. **Manual do Revendedor**: aceita a permissão administrativa explícita mesmo quando a cobrança Asaas relacionada ainda estiver `PENDING`. O acesso não se estende a visitantes, perfis inativos, contas de outros papéis nem sessões com senha obrigatória pendente.
3. **Identidade do BKO**: corrige o espaçamento entre `LORD NUTRI` e `BACKOFFICE PRO` na barra lateral.
4. **App instalado**: fundo de abertura e ícone pretos com a marca dourada centralizada, incluindo Android e Apple.

## Como aplicar

1. Faça cópia/backup do repositório local antes de copiar os arquivos.
2. Extraia o ZIP em uma **pasta separada** e copie suas pastas `app`, `components`, `lib`, `public`, `tests` e `docs` para `C:\Users\hokiz\Documents\GitHub\revendores2026`, mesclando e substituindo apenas arquivos com os mesmos nomes. O ZIP não contém `.git`, credenciais nem arquivos `.env`.
3. No GitHub Desktop, confira a aba **Changes**, crie um commit na branch `main` e clique em **Push origin**.
4. Confira se a Hostinger publicou o novo commit com status **Concluído**.
5. Entre no BKO como administrador, vá a **Revendedores**, localize Jorge, clique em **Gerenciar acesso aos materiais** e confira o comprovante bancário antes de clicar **Liberar materiais manualmente**. Preencha motivo e referência do comprovante. Essa ação **não acontece automaticamente com o deploy**.
6. Peça ao revendedor para atualizar a página do manual. Para o novo ícone aparecer na tela inicial do celular, pode ser necessário remover o atalho/app antigo e instalar novamente após o deploy.

## O que NÃO faz

- Não altera cobrança, status ou confirmação no Asaas.
- Não muda pedido real, estoque, rastreio, senha ou cadastro do revendedor.
- Não aprova automaticamente todos os pagamentos externos; exige decisão administrativa individual.

## Verificação realizada

- Testes direcionados de autorização, auditoria, interface do BKO e PWA executados com sucesso.
- A suíte total está parcialmente bloqueada pela ausência local da dependência `typescript` (163 aprovações, 38 arquivos de teste interrompidos). O `npm ci --offline` não conseguiu baixar um pacote ausente do cache. O build da Hostinger precisa ser conferido após o push.
