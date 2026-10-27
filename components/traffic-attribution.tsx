"use client";
import { MeasurementConsent } from "@/components/measurement-consent";
import { useEffect } from "react";
export function TrafficAttribution() {
  useEffect(()=>{const code=new URLSearchParams(window.location.search).get("campanha");
   if(code && /^[a-f0-9]{32}$/.test(code)) try {window.sessionStorage.setItem("ln_campaign",code)} catch {};
  },[]);
  return <MeasurementConsent />;
}
