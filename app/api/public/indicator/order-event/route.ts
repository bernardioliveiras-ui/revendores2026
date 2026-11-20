import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { indicatorCampaigns, indicatorExternalOrders } from '@/db/schema';
import { getOptionalEnv } from '@/lib/env';
import { safeHashEqual } from '@/lib/auth';
import { resolveCampaign } from '@/lib/campaigns';
import { ensureCampaignSchema } from '@/lib/campaign-schema';
import { getPayment } from '@/lib/asaas';
import { calculateInfluencerCashback } from '@/lib/indicator-cashback.mjs';
import { isMysqlDuplicateKeyError } from '@/lib/mysql-errors';
import { normalizeIndicatorOrderEvent, paymentTransition } from '@/lib/indicator-order-bridge.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Endpoint privado: nunca chamar pelo JavaScript do navegador da LP. */
export async function POST(request: Request) {
  const expected = getOptionalEnv('INDICATOR_BRIDGE_TOKEN') || '';
  if (!expected || !safeHashEqual(expected, request.headers.get('x-indicator-bridge-token') || ''))
    return Response.json({error:'Não autorizado.'},{status:401});
  const data = normalizeIndicatorOrderEvent(await request.json().catch(()=>null));
  if (!data) return Response.json({error:'Evento inválido.'},{status:400});
  try {
    await ensureCampaignSchema();
    const db=getDb();
    const [existing] = await db.select().from(indicatorExternalOrders)
      .where(eq(indicatorExternalOrders.externalOrderId,data.externalOrderId)).limit(1);
    // Reenvios de pedidos antigos são aceitos mesmo que a campanha tenha sido pausada depois.
    // A resolução pública devolve apenas id/code/name: carregamos a campanha completa
    // para manter cashbackMode e cashbackValue disponíveis e corretamente tipados.
    const resolvedCampaignId = existing?.campaignId ?? (await resolveCampaign(data.campaignCode))?.id;
    const [campaign] = resolvedCampaignId
      ? await db.select().from(indicatorCampaigns).where(eq(indicatorCampaigns.id, resolvedCampaignId)).limit(1)
      : [];
    if (!campaign || campaign.publicCode !== data.campaignCode)
      return Response.json({error:'Campanha não encontrada.'},{status:404});
    if (existing && (existing.campaignId!==campaign.id || existing.asaasPaymentId!==data.asaasPaymentId ||
        existing.productTotalCents!==data.productTotalCents))
      return Response.json({error:'Pedido já vinculado a outros dados.'},{status:409});
    if (!existing && data.event!=='created')
      return Response.json({error:'O checkout ainda não foi registrado. Reenvie o evento created.'},{status:409});
    if (data.event==='created') {
      if (existing) return Response.json({registered:true,duplicate:true,status:existing.paymentStatus});
      const now=new Date().toISOString();
      try {
        await db.insert(indicatorExternalOrders).values({id:crypto.randomUUID(),externalOrderId:data.externalOrderId,
          campaignId:campaign.id,asaasPaymentId:data.asaasPaymentId,
          productTotalCents:data.productTotalCents,paymentStatus:'payment_pending',createdAt:now,updatedAt:now});
      } catch(error) {
        // Duplicidade da referência do pagamento ou chegada simultânea de callbacks: não sobrescrever.
        if(isMysqlDuplicateKeyError(error)) return Response.json({error:'Pedido ou cobrança já registrados. Consulte o pedido antes de reenviar.'},{status:409});
        throw error;
      }
      return Response.json({registered:true,status:'payment_pending'},{status:201});
    }
    if (existing?.paymentStatus==='cancelled')
      return Response.json({registered:true,status:'cancelled',duplicate:true});
    if (existing?.paymentStatus==='paid' && data.event==='paid')
      return Response.json({registered:true,status:'paid',duplicate:true});
    // Verificação oficial, independente do que a loja externa declarou.
    const payment=await getPayment(data.asaasPaymentId);
    const status=paymentTransition(data.event,payment.status, payment.externalReference,data.externalOrderId);
    if (!status) return Response.json({error:'Cobrança não confirmada pelo Asaas ou referência divergente.'},{status:409});
    const now=new Date().toISOString();
    const cashback=status==='paid' ? calculateInfluencerCashback(campaign,data.productTotalCents) : null;
    await db.update(indicatorExternalOrders).set({paymentStatus:status,
      asaasVerifiedAt:status==='paid'?now:null,indicatorCashbackCents:cashback,updatedAt:now})
      .where(eq(indicatorExternalOrders.id,existing!.id));
    return Response.json({registered:true,status});
  } catch(error) {
    console.error('indicator_order_bridge_failed',error);
    return Response.json({error:'Falha ao registrar o pedido atribuído.'},{status:503});
  }
}
