# LORD NUTRI — atualização visual dos três perfis

Este pacote contém o projeto Next.js completo, com interfaces atualizadas para BKO, Revendedor e Influenciador.

## Ajustes visuais

- **Influenciador:** cinco páginas independentes (Visão Geral, Campanhas e Links, Vendas e Cashback, Materiais, Meu Perfil), sem rolar a tela por âncoras.
- **BKO:** cartões de campanhas e links individuais criados com os registros reais retornados pelo backend; permanece a gestão existente de acesso, cashback e pedidos.
- **Revendedor:** navegação com a aba **Indicações**, ligada à API autenticada de links individuais já existente.
- **Materiais do influenciador:** grade de arquivos presentes em `public/` (folder, imagens e vídeo), com opções de visualizar, baixar e compartilhar.
- **Meu Perfil:** dados da conta autenticada e resumo da campanha vinculada.

## Importante antes de publicar

1. Faça um backup da versão anterior e das configurações de ambiente da Hostinger.
2. Extraia o ZIP e atualize o **código-fonte** do repositório GitHub; não envie arquivos `.env` ou senhas.
3. Revise as mudanças em `components/`, `app/` e `tests/` antes do push.
4. Execute `npm ci`, `npm run test:critical` e `npm run build`.
5. Na Hostinger, confirme as variáveis de banco e o ambiente Asaas sem exibi-las publicamente; publique e teste cada login separadamente.

Este pacote **não** homologa pagamentos Asaas reais, rastreio dos Correios ou liberação automática de cashback. Essas integrações requerem validação e testes separados. Os números de demonstração do Site original não foram copiados para a operação.
