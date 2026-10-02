import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { affiliateCashbacks, affiliateReferrals, users } from '@/db/schema';
import { getOptionalEnv } from '@/lib/env';
import { safeHashEqual } from '@/lib/auth';
import { isMysqlDuplicateKeyError } from '@/lib/mysql-errors';
import { CASHBACK_CENTS, parseQualification } from '@/lib/cashback-rules';

// Exclusivamente servidor-servidor; a LP chama após confirmação autenticada do Asaas.
export async function POST(request: Request) {
  const expected = getOptionalEnv('AFFILIATE_WEBHOOK_TOKEN') || '';
  if (!expected || !safeHashEqual(expected,request.headers.get('x-affiliate-token') || '')) return Response.json({error:'Endpoint não autorizado.'},{status:401});
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({error:'JSON inválido.'},{status:400}); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({error:'Compra não qualificada.'},{status:400});
  const input = parseQualification(body);
  if (!input) return Response.json({error:'Compra não qualificada. Informe pedido, e-mail e quantidade válida com paymentStatus paid.'},{status:400});
  const db = getDb();
  const [referral] = await db.select({id:affiliateReferrals.id,userId:affiliateReferrals.userId,role:users.role,userStatus:users.status}).from(affiliateReferrals).innerJoin(users,eq(users.id,affiliateReferrals.userId)).where(eq(affiliateReferrals.publicCode,input.referralCode)).limit(1);
  if (!referral || (referral.role !== 'reseller' || referral.userStatus !== 'active')) return Response.json({error:'Indicação não encontrada.'},{status:404});
  const purchaseId = `external:${input.externalOrderId}`;
  const duplicate = async () => {
    const [known] = await db.select().from(affiliateCashbacks).where(eq(affiliateCashbacks.purchaseId,purchaseId)).limit(1);
    if (!known || known.referralId !== referral.id || known.buyerEmail !== input.buyerEmail || known.qualifyingBoxes !== input.boxes) return Response.json({error:'Pedido já vinculado a outra indicação ou dados divergentes.'},{status:409});
    return Response.json({qualified:known.status !== 'cancelled',duplicate:true,cashbackCents:known.amountCents,status:known.status});
  };
  try {
    const now = new Date().toISOString();
    await db.insert(affiliateCashbacks).values({id:crypto.randomUUID(),referralId:referral.id,resellerUserId:referral.userId,purchaseId,amountCents:CASHBACK_CENTS,status:'pending',qualifyingBoxes:input.boxes,buyerEmail:input.buyerEmail,createdAt:now,updatedAt:now});
    return Response.json({qualified:true,cashbackCents:CASHBACK_CENTS,status:'pending'},{status:201});
  } catch (error) {
    if (isMysqlDuplicateKeyError(error)) return duplicate();
    console.error('affiliate_qualification_failed',error);
    return Response.json({error:'Não foi possível registrar a indicação.'},{status:500});
  }
}
