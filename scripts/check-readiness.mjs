// Read-only: checks configuration shape; never contacts providers or prints values.
for (const file of ['.env.local','.env']) {try {process.loadEnvFile(file)} catch(e){if(e.code!=='ENOENT')throw e}}
const value=name=>(process.env[name]||'').trim();
const traffic=process.argv.includes('--traffic');
const checks=[];
const check=(name,ok)=>{checks.push(ok);console.log(`${ok?'OK':'PENDENTE'}: ${name}`)};
for(const name of ['DATABASE_HOST','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD','ASAAS_API_KEY','ASAAS_WEBHOOK_TOKEN','ADMIN_EMAILS'])check(name,Boolean(value(name)));
check('AUTH_SECRET com pelo menos 32 caracteres',value('AUTH_SECRET').length>=32);
check('NEXT_PUBLIC_APP_URL HTTPS',/^https:\/\//.test(value('NEXT_PUBLIC_APP_URL')));
check('ASAAS_ENVIRONMENT válido',['sandbox','production'].includes(value('ASAAS_ENVIRONMENT')));
if(traffic)check('Tráfego pago: Asaas em produção', value('ASAAS_ENVIRONMENT')==='production');
if(value('ASAAS_ENVIRONMENT')!=='production')console.log('OBSERVAÇÃO: Asaas ainda não está em produção.');
check('Boas-vindas manuais: BKO usa WhatsApp/e-mail por links, sem API externa', true);
if(value('WELCOME_AUTOMATION_URL')||value('WELCOME_AUTOMATION_TOKEN'))console.log('AVISO: variáveis antigas de boas-vindas automáticas estão configuradas; remova-as para evitar confusão de operação.');
if(traffic){
 check('Tráfego pago: domínio oficial HTTPS',/^https:\/\/revendedores\.mix10pro\.com\.br\/?$/.test(value('NEXT_PUBLIC_APP_URL')));
 console.log('EXIGÊNCIA MANUAL: validar compra sandbox, webhook, cancelamento, estoque, login, aceite, boas-vindas e dispositivo móvel antes dos anúncios.');
}
console.log(`Logística externa: ${value('SHIPPING_WEBHOOK_TOKEN')?'token configurado; verificar integração':'atualização manual pelo BKO'}`);
console.log('Este diagnóstico não comprova conexão com MySQL, recebimento de pagamentos, envio de mensagens ou entrega.');
if(checks.some(ok=>!ok))process.exitCode=1;
