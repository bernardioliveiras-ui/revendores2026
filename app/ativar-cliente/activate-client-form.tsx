"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
export function ActivateClientForm(){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[done,setDone]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice("");const form=new FormData(e.currentTarget);
  try{const token=new URLSearchParams(location.search).get("token")||"";const r=await fetch("/api/indicated/activate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password:form.get("password"),confirm:form.get("confirm")})});const b=await r.json();if(!r.ok)throw new Error(b.error);setDone(true);window.history.replaceState({},"","/ativar-cliente");setNotice("Conta ativada. Agora você pode entrar com seu e-mail e senha.");}
  catch(error){setNotice(error instanceof Error?error.message:"Erro na ativação.");}finally{setBusy(false);}}
 return <form className="auth-card" onSubmit={submit}><Link href="/" className="auth-brand"><BrandLogo compact/></Link><span className="section-kicker">Cliente indicado · LORD NUTRI</span><h1>Ativar acesso</h1><p>Crie sua senha. O convite é individual e expira após 24 horas.</p>
 {notice?<p role="status">{notice}</p>:null}
 {!done?<><label>Nova senha (mínimo 10 caracteres)<input type="password" name="password" minLength={10} maxLength={256} required autoComplete="new-password"/></label><label>Confirme a senha<input type="password" name="confirm" minLength={10} maxLength={256} required autoComplete="new-password"/></label><button className="primary-button full" disabled={busy}>{busy?"Ativando…":"Ativar minha conta"}</button></>:<Link className="primary-button full" href="/entrar">Entrar</Link>}
 </form>;
}
