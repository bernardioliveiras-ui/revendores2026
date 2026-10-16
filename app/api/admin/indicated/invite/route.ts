import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { indicatedClients } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ensureIndicatedSchema } from "@/lib/indicated-schema";
import { sendIndicatedInvitation, invitationReady } from "@/lib/indicated-invitations";
import { cleanText, indicatedError } from "@/lib/indicated-security";
export async function POST(request:Request) {
  try {
    await requireAdmin(request); await ensureIndicatedSchema();
    if (!invitationReady()) return Response.json({error:"Configure o envio por Resend nas variáveis da Hostinger."},{status:503});
    const body=await request.json().catch(()=>null);const id=cleanText(body?.id,80);
    const [row]=await getDb().select({clientUserId:indicatedClients.clientUserId}).from(indicatedClients).where(eq(indicatedClients.id,id)).limit(1);
    if(!row)return Response.json({error:"Indicação não encontrada."},{status:404});
    await sendIndicatedInvitation(row.clientUserId);
    return Response.json({sent:true});
  } catch(error){ if(error instanceof Error && error.message==="INVITE_FORBIDDEN")return Response.json({error:"Ative o acesso antes de enviar o convite."},{status:409});return indicatedError(error); }
}
