import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { readPublishedLandingTexts } from "@/lib/landing-texts-store";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";
export default async function Home() {
  return <LandingPage texts={await readPublishedLandingTexts()} />;
}
