import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './runtime-loader.mjs';
import { validateBio, identifyAvatar, MAX_AVATAR_BYTES } from '../lib/user-profile-validation.mjs';

function setup(role='reseller'){
 const rows=new Map();
 const pool={async execute(sql,values=[]){
  const id=values[0];
  if(sql.startsWith('SELECT')){const row=rows.get(id);return [row?[{...row}]:[]];}
  if(sql.startsWith('INSERT')){
   const current=rows.get(id)||{bio:'',avatar_mime:null,avatar_bytes:null,updated_at:''};
   if(sql.includes('avatar_mime,avatar_bytes'))Object.assign(current,{avatar_mime:values[1],avatar_bytes:values[2],updated_at:values[3]});
   else Object.assign(current,{bio:values[1],updated_at:values[2]});
   rows.set(id,current);return [{affectedRows:1}];
  }
  if(sql.startsWith('UPDATE')){const current=rows.get(values[1]);if(current)Object.assign(current,{avatar_mime:null,avatar_bytes:null,updated_at:values[0]});return [{affectedRows:1}];}
  throw Error('Unexpected SQL '+sql);
 }};
 const mocks={'@/db':{getMysqlPool:()=>pool},'@/lib/auth':{requireSession:async()=>({id:'person-1',role})},'@/lib/runtime-schema':{ensureOperationalSchema:async()=>{}},'@/lib/user-profile-validation.mjs':{validateBio,identifyAvatar,MAX_AVATAR_BYTES}};
 return {rows,profile:load('app/api/profile/route.ts',mocks),avatar:load('app/api/profile/avatar/route.ts',mocks)};
}
const json=(data,method='PATCH')=>new Request('https://lord.test/api/profile',{method,headers:{'content-type':'application/json'},body:JSON.stringify(data)});

test('revendedor grava biografia, lê a própria conta e não ultrapassa 160 caracteres',async()=>{
 const s=setup();
 assert.equal((await s.profile.PATCH(json({bio:'x'.repeat(161)}))).status,400);
 assert.equal((await s.profile.PATCH(json({bio:'  Revenda com alegria!  '}))).status,200);
 const res=await s.profile.GET(new Request('https://lord.test/api/profile'));
 assert.equal((await res.json()).bio,'Revenda com alegria!');
 assert.equal(s.rows.size,1);
});

test('influenciador pode publicar sua biografia no próprio perfil',async()=>{
 const s=setup('indicator');const r=await s.profile.PATCH(json({bio:'Criadora de conteúdo LORD NUTRI'}));
 assert.equal(r.status,200);assert.equal(s.rows.get('person-1').bio,'Criadora de conteúdo LORD NUTRI');
});

test('foto válida permanece privada; outro usuário não pode lê-la',async()=>{
 const s=setup();
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
 const form=new FormData();form.append('photo',new File([png],'foto.png',{type:'image/png'}));
 const uploaded=await s.avatar.POST(new Request('https://lord.test/api/profile/avatar',{method:'POST',body:form}));
 assert.equal(uploaded.status,200);
 const own=await s.avatar.GET(new Request('https://lord.test/api/profile/avatar'));
 assert.equal(own.status,200);assert.equal(own.headers.get('content-type'),'image/png');
 assert.equal(own.headers.get('cache-control'),'private, no-store');
 const denied=await s.avatar.GET(new Request('https://lord.test/api/profile/avatar?userId=person-2'));
 assert.equal(denied.status,403);
 const removed=await s.avatar.DELETE(new Request('https://lord.test/api/profile/avatar',{method:'DELETE'}));
 assert.equal(removed.status,200);
 assert.equal((await s.avatar.GET(new Request('https://lord.test/api/profile/avatar'))).status,404);
});

test('arquivo disfarçado e upload acima de 2 MB são recusados',async()=>{
 const s=setup();
 for(const file of [new File(['<svg>'],'fake.png',{type:'image/png'}),new File([new Uint8Array(MAX_AVATAR_BYTES+1)],'grande.png',{type:'image/png'})]){
  const f=new FormData();f.append('photo',file);
  const r=await s.avatar.POST(new Request('https://lord.test/api/profile/avatar',{method:'POST',body:f}));
  assert.equal(r.status,400);
 }
 assert.equal(s.rows.size,0);
});
