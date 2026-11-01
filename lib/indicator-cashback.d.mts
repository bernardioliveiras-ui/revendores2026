export const DEFAULT_INFLUENCER_CASHBACK_CENTS: number;
export function validCampaignCashback(mode:unknown,value:unknown):boolean;
export function calculateInfluencerCashback(campaign:{cashbackMode?:string;cashbackValue?:number}|null, productTotalCents:number):number;
