import { redirect } from "next/navigation";
/** Compatibilidade apenas com convites de influenciadores enviados antes da v2.7. */
export default async function OldActivationLink({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const {token}=await searchParams;
  redirect(token?`/ativar-indicador?token=${encodeURIComponent(token)}`:"/ativar-indicador");
}
