import { PortalClient } from "@/app/painel/portal-client";
import { getStudioDoc } from "@/lib/content-studio";
export async function MemberDashboard(){
  let welcomeVideoUrl = "";
  try {
    const media = await getStudioDoc("media");
    const published = media.published as { welcomeVideo?: { sourceUrl?: string } };
    welcomeVideoUrl = typeof published?.welcomeVideo?.sourceUrl === "string" ? published.welcomeVideo.sourceUrl : "";
  } catch {
    // O portal continua funcionando com as variáveis antigas como fallback.
  }
  return <PortalClient welcomeVideoUrl={welcomeVideoUrl} embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} manualUrl="/api/reseller/manual?edition=material"/>;
}
