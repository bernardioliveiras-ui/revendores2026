import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { affiliateCashbacks } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { canTransitionCashback } from '@/lib/cashback-rules';

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    let body: {id?:unknown;status?:unknown;notes?:unknown;payoutReference?:unknown};
    try {body = await request.json();} catch {return Response.json({error:'JSON inválido.'},{status:400});}
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const status = typeof body?.status === 'string' ? body.status : '';
    const payoutReference = typeof body?.payoutReference === 'string' ? body.payoutReference.trim().slice(0,180) : '';
    if (!id || !['approved','paid','cancelled'].includes(status)) return Response.json({error:'Status de cashback inválido.'},{status:400});
    if (status === 'paid' && !payoutReference) return Response.json({error:'Informe a referência do Pix/repasse já realizado.'},{status:400});
    if (status === 'cancelled' && (typeof body.notes !== 'string' || !body.notes.trim())) return Response.json({error:'Informe o motivo do cancelamento.'},{status:400});
    return await getDb().transaction(async tx => {
      const [row] = await tx.select().from(affiliateCashbacks).where(eq(affiliateCashbacks.id,id)).limit(1).for('update');
      if (!row) return Response.json({error:'Cashback não encontrado.'},{status:404});
      if (row.status === status) {
        if (status === 'paid' && payoutReference !== row.payoutReference) return Response.json({error:'Repasse já registrado com outra referência.'},{status:409});
        return Response.json({updated:true,duplicate:true});
      }
      if (!canTransitionCashback(row.status,status)) return Response.json({error:'Transição inválida. Aprove antes de pagar; créditos pagos ou cancelados são finais.'},{status:409});
      const now = new Date().toISOString();
      const patch: Partial<typeof affiliateCashbacks.$inferInsert> = {status,updatedAt:now};
      if (status === 'approved') {patch.approvedAt=now;patch.approvedBy=admin.id;}
      if (status === 'paid') {patch.paidAt=now;patch.paidBy=admin.id;patch.payoutReference=payoutReference;}
      if (status === 'cancelled') {patch.cancelledAt=now;patch.cancelledBy=admin.id;}
      if (typeof body.notes === 'string') patch.notes=body.notes.trim().slice(0,500);
      await tx.update(affiliateCashbacks).set(patch).where(eq(affiliateCashbacks.id,id));
      return Response.json({updated:true});
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return Response.json({error:'Faça login novamente.'},{status:401});
    if (error instanceof Error && error.message === 'FORBIDDEN') return Response.json({error:'Acesso restrito ao BKO.'},{status:403});
    console.error('admin_cashback_update_failed',error);
    return Response.json({error:'Não foi possível atualizar o cashback.'},{status:500});
  }
}
