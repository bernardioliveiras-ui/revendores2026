"use client";
import {useEffect,useState} from "react";
import {LandingPage} from "@/components/landing-page";
import {validateLandingTexts,type LandingTexts} from "@/lib/landing-texts";
export function LandingTextPreview({initialTexts}:{initialTexts:LandingTexts}){
 const [texts,setTexts]=useState(initialTexts);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=="LORD_TEXTS_PREVIEW")return;try{setTexts(validateLandingTexts(event.data.texts));}catch{/* Retain the last valid preview. */}};
  window.addEventListener("message",receive);window.parent.postMessage({type:"LORD_TEXTS_READY"},location.origin);return()=>window.removeEventListener("message",receive);
 },[]);
 return <div onSubmitCapture={event=>{event.preventDefault();event.stopPropagation();}} onClickCapture={event=>{const anchor=(event.target as Element).closest("a");if(anchor&&!anchor.getAttribute("href")?.startsWith("#")){event.preventDefault();event.stopPropagation();}}}><LandingPage texts={texts}/></div>;
}
