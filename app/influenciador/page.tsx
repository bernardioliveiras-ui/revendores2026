import { requirePortalPage } from "@/lib/portal-page-access";
import { IndicatorPortal } from "@/components/indicator-portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Influenciador · LORD NUTRI", robots: { index: false, follow: false } };

export default async function Page() {
  await requirePortalPage("indicator");
  return <IndicatorPortal/>;
}
