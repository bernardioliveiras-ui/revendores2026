export function campaignCodeFromSearch(value) {
 let text=String(value||'');try{text=decodeURIComponent(text)}catch{}
 return text.match(/(?:^|[^a-f0-9])([a-f0-9]{32})(?![a-f0-9])/i)?.[1]?.toLowerCase() || '';
}
export function matchesIndicatorSearch(query, partner, campaign) {
 const code=campaignCodeFromSearch(query);
 if(code)return String(campaign?.publicCode||'').toLowerCase()===code;
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 return normalize([partner?.name,partner?.email,partner?.phone,campaign?.name,campaign?.publicCode].join(' ')).includes(normalize(query));
}
