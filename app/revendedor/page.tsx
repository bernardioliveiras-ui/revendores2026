import { requirePortalPage } from "@/lib/portal-page-access";
import { MemberDashboard } from "@/components/member-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revendedor · LORD NUTRI", robots: { index: false, follow: false } };

export default async function Page() {
  await requirePortalPage("reseller");
  return <MemberDashboard/>;
}
