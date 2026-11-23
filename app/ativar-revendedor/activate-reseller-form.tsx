"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function ActivateResellerForm(){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[done,setDone]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setNotice("");
  const fields=new FormData(e.currentTarget);
  try {
   const token=new URLSearchParams(location.search).get("token")||"";
   const response=await fetch("/api/reseller/activate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password:fields.get("password"),confirm:fields.get("confirm")})});
   const result=await response.json();if(!response.ok)throw Error(result.error||"Não foi possível ativar a conta.");
   window.history.replaceState({},"","/ativar-revendedor");setDone(true);setNotice("Sua conta está ativa. Entre no portal com seu e-mail e senha.");
  }catch(error){setNotice(error instanceof Error?error.message:"Falha na ativação.")}finally{setBusy(false)}
 }
 return <form className="auth-card" onSubmit={submit}><Link href="/" className="auth-brand"><BrandLogo compact/></Link>
  <span className="section-kicker">Convite de revendedor · LORD NUTRI</span><h1>Ativar meu acesso</h1>
  <p>Crie sua senha para acessar o portal. O convite é individual, válido por 24 horas e só pode ser usado uma vez.</p>
  {notice?<p role="status">{notice}</p>:null}
  {!done?<><label>Nova senha (mínimo 10 caracteres)<input type="password" name="password" minLength={10} maxLength={256} required autoComplete="new-password"/></label>
   <label>Confirme a senha<input type="password" name="confirm" minLength={10} maxLength={256} required autoComplete="new-password"/></label>
   <button className="primary-button full" disabled={busy}>{busy?"Ativando…":"Ativar conta"}</button></>:<Link className="primary-button full" href="/entrar">Entrar</Link>}
 </form>;
}
