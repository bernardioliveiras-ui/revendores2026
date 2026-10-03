"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
type Review = { author:string;rating:number;text:string;relativeTime:string };
type Payload = { configured:boolean;rating?:number;userRatingCount?:number;reviews?:Review[] };
const VIEW_URL="https://www.google.com/maps/search/?api=1&query=LORD%20NUTRI&query_place_id=ChIJCZtZ98MDz5QRWv8YdIPkPic";
export function GoogleReviews(){
 const [data,setData]=useState<Payload|null>(null);
 useEffect(()=>{const controller=new AbortController();fetch('/api/public/google-reviews',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(setData).catch(()=>{});return()=>controller.abort();},[]);
 const reviews=data?.reviews?.filter(r=>r.text)?.slice(0,3)||[];
 return <section className="reviews-section" id="avaliacoes"><div className="shell"><div className="reviews-overview"><div className="reviews-copy"><span className="google-mark" aria-hidden="true">G</span><div><h2>Conheça a LORD NUTRI no Google.</h2><p>{data?.configured&&typeof data.rating==='number'?`${data.rating.toFixed(1)} de 5 · ${data.userRatingCount||0} avaliações públicas`:'Consulte a empresa e as experiências compartilhadas no perfil oficial.'}</p></div></div><div className="reviews-actions"><a href={VIEW_URL} target="_blank" rel="noopener noreferrer" className="text-link">Ver avaliações <ArrowUpRight size={14}/></a><a href="https://g.page/r/CVr_GHSD5D4nECE/review" target="_blank" rel="noopener noreferrer" className="text-link">Compartilhar experiência <ArrowUpRight size={14}/></a></div></div>{reviews.length>0?<div className="review-grid">{reviews.map((r,i)=><article className="review-card" key={`${r.author}-${i}`}><span aria-label={`${r.rating} de 5 estrelas`}>{'★'.repeat(Math.floor(Math.max(0,Math.min(5,r.rating))))}</span><p>{r.text}</p><footer><strong>{r.author}</strong><span>{r.relativeTime}</span></footer></article>)}</div>:null}</div></section>
}
