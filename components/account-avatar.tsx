"use client";
/* eslint-disable @next/next/no-img-element -- Foto protegida pela sessão, sem proxy público de otimização. */
import { useEffect, useState } from "react";

export function AccountAvatar({name,enabled=true}:{name:string;enabled?:boolean}){
 const [src,setSrc]=useState<string|null>(null);
 useEffect(()=>{
   if(!enabled)return;
   let active=true;
   const refresh=()=>{void fetch("/api/profile",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(b=>{if(active)setSrc(b?.avatarUrl||null);}).catch(()=>{});};
   refresh();window.addEventListener("lord-profile-updated",refresh);
   return()=>{active=false;window.removeEventListener("lord-profile-updated",refresh);};
 },[enabled]);
 return <span className="lord-demo-user-avatar" aria-hidden="true">{src?<img src={src} alt="" className="lord-demo-avatar-img"/>:name.trim().charAt(0).toUpperCase()||"LN"}</span>;
}
