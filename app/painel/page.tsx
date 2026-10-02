import { PortalClient } from "./portal-client";
export const metadata = { title: "Portal LORDNUTRI", robots: { index: false, follow: false } };
export default function PanelPage(){return <PortalClient embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} manualUrl={process.env.RESELLER_MANUAL_URL || "/manual/MIX10-PRO-Manual-do-Revendedor.pdf"}/>}
