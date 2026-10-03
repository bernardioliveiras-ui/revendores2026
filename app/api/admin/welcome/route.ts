import { requireAdmin } from "@/lib/auth";
import { sendWelcome } from "@/lib/welcome-notification";
export async function POST(request:Request){
 try{await requireAdmin(request);const b=await request.json();if(typeof b.purchaseId!=="string")return Response.json({error:"Compra inválida."},{status:400});const result=await sendWelcome(b.purchaseId);return Response.json(result,{status:result.sent?200:409});}
 catch(error){if(error instanceof Error&&error.message==="UNAUTHORIZED")return Response.json({error:"Faça login novamente."},{status:401});if(error instanceof Error&&error.message==="FORBIDDEN")return Response.json({error:"Acesso restrito."},{status:403});console.error("welcome_failed");return Response.json({error:"Não foi possível enviar. Confira a automação."},{status:502});}
}
