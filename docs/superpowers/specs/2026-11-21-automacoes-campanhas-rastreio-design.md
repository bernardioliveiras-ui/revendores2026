# Campanhas e Correios automáticos — desenho aprovado

O usuário quer que a plataforma LORD NUTRI opere automaticamente e autorizou substituir links antigos: renomear uma campanha altera sua URL pública imediatamente. A atribuição financeira continua referindo-se ao identificador interno imutável. Não é necessário redirecionar URLs antigas.

O BKO cadastra a etiqueta uma vez. O servidor consulta a API oficial dos Correios pela rotina agendada existente, registra tentativa e último evento de forma distinta e atualiza o estado do pedido quando há comprovação de entrega. O BKO pode solicitar uma rodada autenticada de sincronização, sem informar credenciais no navegador. Revendedor e BKO atualizam a visualização periodicamente enquanto a aba estiver aberta, sem provocar consultas ao provedor a cada visualização.

As credenciais reais e a execução do agendador GitHub/Hostinger precisam de verificação externa; não serão presumidas. Nenhum acesso externo ou migração financeira é executado neste trabalho. Cashback, Asaas e estoque permanecem protegidos por suas regras existentes.

Decisão: manter GitHub Actions como agendador de 30 em 30 minutos e permitir acionamento manual exclusivamente ao BKO. Alternativa de cron Hostinger fica para se houver evidência de falha persistente do agendamento atual. Validação do CSS compilado é parte da entrega, mas não modifica dados.
