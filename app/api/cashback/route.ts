import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { affiliateCashbacks, affiliateReferrals } from '@/db/schema';
import { requireSession } from '@/lib/auth';
import { summarizeCashbacks } from '@/lib/cashback-rules';
export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (user.role !== 'reseller') return Response.json({error:'Área do revendedor.'},{status:403});
    const rows = await getDb().select({credit:affiliateCashbacks,customerName:affiliateReferrals.customerName,whatsapp:affiliateReferrals.whatsapp,publicCode:affiliateReferrals.publicCode}).from(affiliateCashbacks).innerJoin(affiliateReferrals,eq(affiliateReferrals.id,affiliateCashbacks.referralId)).where(eq(affiliateCashbacks.resellerUserId,user.id)).orderBy(desc(affiliateCashbacks.createdAt));
    const cashbacks = rows.map(({credit,...referral}) => ({...credit,...referral}));
    return Response.json({totals:summarizeCashbacks(cashbacks),cashbacks},{headers:{'cache-control':'no-store'}});
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return Response.json({error:'Faça login novamente.'},{status:401});
    console.error('cashback_load_failed',error);
    return Response.json({error:'Não foi possível carregar o cashback. Verifique a migração do banco.'},{status:500});
  }
}
