"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, BookOpen, Boxes, ChartNoAxesCombined, ClipboardList, FilePenLine, FolderOpen, LayoutDashboard, Link2, LogOut, Menu, Package, Settings, ShoppingBag, Truck, UserRound, Users, Wallet } from "lucide-react";

const icons = {overview:LayoutDashboard, indicators:Users, access:ShoppingBag, shipping:Truck, orders:ClipboardList,
  studio:FilePenLine, materials:FolderOpen, integrations:Activity, maintenance:Settings, content:BookOpen,
  sales:ChartNoAxesCombined, stock:Boxes, manual:FolderOpen, delivery:Truck, referrals:Link2,
  campaigns:Link2, cashback:Wallet, profile:UserRound, welcome:Package};
type Section = { id:string; label:string; onOpen:()=>void };
export function PortalFrame({role,name,sections,active,onLogout,children}:{
  role:"admin"|"reseller"|"indicator"; name:string; sections:Section[]; active:string; onLogout:()=>void; children:ReactNode;
}) {
  const [open,setOpen]=useState(false);
  const opener=useRef<HTMLButtonElement>(null);
  const side=useRef<HTMLElement>(null);
  const label={admin:"Backoffice Pro",reseller:"Portal do Revendedor",indicator:"Portal do Influenciador"}[role];
  useEffect(()=>{
    if(!open) return;
    const lastOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
    side.current?.querySelector<HTMLButtonElement>("[aria-current=page],button")?.focus();
    function close(event:KeyboardEvent){
      if(event.key==="Escape"){setOpen(false);opener.current?.focus();}
      if(event.key==="Tab"){
        const items=side.current?.querySelectorAll<HTMLButtonElement>("button");
        if(!items?.length)return;
        if(event.shiftKey && document.activeElement===items[0]) {event.preventDefault();items[items.length-1].focus();}
        else if(!event.shiftKey && document.activeElement===items[items.length-1]) {event.preventDefault();items[0].focus();}
      }
    }
    function resized(){if(window.innerWidth>980)setOpen(false);}
    window.addEventListener("keydown",close);window.addEventListener("resize",resized);
    return ()=>{document.body.style.overflow=lastOverflow;window.removeEventListener("keydown",close);window.removeEventListener("resize",resized);};
  },[open]);
  return <div className="ln-ui"><div className="app">
    {open && <button className="overlaymobile show" aria-label="Fechar menu" onClick={()=>{setOpen(false);opener.current?.focus();}}/>}
    <aside className={"sidebar"+(open?" open":"")} ref={side} id="ln-sidebar">
      <div className="brand"><div className="brandmark"><img src="/brand/lordnutri-mark.png" alt="" width="58" height="58"/></div><div><b>LORD NUTRI</b><small>{label}</small></div></div>
      <div className="navgroup"><div className="navlabel">{role==="admin"?"Plataforma":"Meu portal"}</div>
      <nav aria-label={label}>{sections.map(item=>{
        const Icon=icons[item.id as keyof typeof icons]||FolderOpen;
        return <button key={item.id} type="button" className={"navbtn"+(active===item.id?" active":"")} aria-current={active===item.id?"page":undefined} onClick={()=>{item.onOpen();setOpen(false);if(open)opener.current?.focus();window.scrollTo(0,0);}}>
          <Icon size={18}/><span className="navtext">{item.label}</span></button>;
      })}</nav></div>
      <div className="navfoot"><div className="mini"><span className="statusdot"/><div><strong>{name || label}</strong><small>{label}</small></div></div></div>
    </aside>
    <main className="main"><header className="topbar">
      <button type="button" ref={opener} className="iconbtn menu-toggle" aria-label="Abrir menu" aria-controls="ln-sidebar" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={19}/></button>
      <div className="crumb">LORD NUTRI <span>/</span> <strong>{sections.find(item=>item.id===active)?.label || "Acesso"}</strong></div>
      <div className="top-actions"><div className="avatar"><div className="avatar-circle">{name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase() || "LN"}</div><div><b>{name || label}</b><small>{label}</small></div></div><button type="button" className="iconbtn" title="Sair" aria-label="Sair" onClick={onLogout}><LogOut size={17}/></button></div>
    </header>
    {role==="admin" && <div className="preview-rolebar"><p><strong>Visualizar os três perfis</strong> · demonstração</p><div className="role-switch" aria-label="Abrir demonstração em outra aba">
      {([["admin","BKO"],["reseller","Revendedor"],["influencer","Influenciador"]] as const).map(([id,title])=><a key={id} className={id==="admin"?"active":""} href={"/api/admin/demonstracao?perfil="+id} target="_blank" rel="noopener noreferrer">{title}</a>)}</div></div>}
    <div className="content">{children}</div></main>
  </div></div>;
}

export function PortalMetric({label,value,detail,icon,tone=""}:{label:string;value:ReactNode;detail:string;icon:ReactNode;tone?:string}) {
  return <article className={"box metric "+tone}><div className="mlabel">{label}<span className="micon">{icon}</span></div>
    <div className="value">{value}</div><div className="meta">{detail}</div></article>;
}
