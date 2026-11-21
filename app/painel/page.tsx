import { requirePortalPage } from "@/lib/portal-page-access";
export const dynamic = "force-dynamic";
export default async function PanelPage() { await requirePortalPage(); return null; }
