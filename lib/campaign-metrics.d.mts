export type CampaignMetricPurchase = {campaignId?:string|null;paymentStatus:string;asaasVerifiedAt?:string|null;
 totalCents:number;productTotalCents:number;shippingCents:number;interestCents:number;indicatorCashbackCents?:number|null;paymentMethod?:string;asaasPaymentId?:string|null};
export type CampaignMetricSource = {id:string;name:string;publicCode:string;active:number;clickCount:number};
export function campaignPurchaseNetCents(p:CampaignMetricPurchase):number;
export function isVerifiedPaid(p:CampaignMetricPurchase):boolean;
export function isPendingPix(p:CampaignMetricPurchase):boolean;
export function isRecoveryOpportunity(p:CampaignMetricPurchase):boolean;
export function summarizeCampaign(c:CampaignMetricSource,p:CampaignMetricPurchase[]):{
 campaignId:string;name:string;code:string;active:boolean;clicks:number;checkouts:number;pending:number;
 pixPending:number;recoveryOpportunities:number;confirmedOrders:number;productRevenueCents:number;cashbackAccruedCents:number;uncalculatedOrders:number;averageTicketCents:number;conversionRate:number;
};
