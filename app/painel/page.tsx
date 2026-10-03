import { PortalClient } from "./portal-client";
export const metadata = { title: "Portal LORD NUTRI", robots: { index: false, follow: false } };
export default function PanelPage(){return <PortalClient embedUrl={process.env.VSL_EMBED_URL} videoUrl={process.env.VSL_VIDEO_URL} manualUrl={process.env.RESELLER_MANUAL_URL || "/manual/MANUAL-DO-REVENDEDOR-LORDNUTRI-MIX10PRO.pdf"}/>}
