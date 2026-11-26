import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { manualShipments, stockMovements, users } from "@/db/schema";
import { calculateStock } from "@/lib/stock";
import { planLegacySuspension, planManualDelivery } from "@/lib/manual-shipment-policy.mjs";
import { canAdvanceShipping } from "@/lib/delivery-progress";
import type { PostalEvent } from "@/lib/correios";
import { sendManualShipmentStatusEmail } from "@/lib/order-notification";

type PostalObservation = { originalCode:string; originalCarrier:string|null; event:PostalEvent|null; issue?:string; failed?:boolean };

function clean(value:unknown, fallback:string|null) {
  return typeof value === "string" ? value.trim().slice(0,120) || fallback : fallback;
}

/** Tranca o revendedor antes da remessa para serializar com vendas e ajustes. */
export async function updateManualShipmentShipping(id:string, status:string, carrier?:unknown, trackingCode?:unknown, observation?:PostalObservation) {
  const result=await getDb().transaction(async tx=>{
    const [link]=await tx.select({userId:manualShipments.userId}).from(manualShipments).where(eq(manualShipments.id,id)).limit(1);
    if(!link)throw Error("MANUAL_SHIPMENT_NOT_FOUND");
    await tx.select({id:users.id}).from(users).where(eq(users.id,link.userId)).limit(1).for("update");
    const [shipment]=await tx.select().from(manualShipments).where(eq(manualShipments.id,id)).limit(1).for("update");
    if(!shipment)throw Error("MANUAL_SHIPMENT_NOT_FOUND");
    if(observation && (shipment.trackingCode!==observation.originalCode || shipment.carrier!==observation.originalCarrier || !["separating","shipped"].includes(shipment.shippingStatus)))return {updated:false,ignored:true};
    const now=new Date().toISOString();
    const nextCarrier=clean(carrier,shipment.carrier);
    const nextCode=clean(trackingCode,shipment.trackingCode)?.toUpperCase()||null;
    const trackingChanged=nextCarrier!==shipment.carrier||nextCode!==shipment.trackingCode;
    const patch:Partial<typeof manualShipments.$inferInsert>={};
    if(trackingChanged)Object.assign(patch,{postalEvent:null,postalEventAt:null,postalCheckedAt:null,postalAttemptAt:null,postalIssue:null});
    if(observation){
      patch.postalAttemptAt=now;
      patch.postalIssue=observation.issue||null;
      if(!observation.failed)patch.postalCheckedAt=now;
      status=shipment.shippingStatus;
      if(observation.event && (!shipment.postalEventAt||Date.parse(observation.event.at)>=Date.parse(shipment.postalEventAt))){
        patch.postalEvent=observation.event.description;patch.postalEventAt=observation.event.at;
        if(observation.event.stage && canAdvanceShipping(status,observation.event.stage))status=observation.event.stage;
      }
    }
    if(!canAdvanceShipping(shipment.shippingStatus,status))return {updated:false,ignored:true};
    if(status==="shipped" && !nextCode)throw Error("TRACKING_REQUIRED");
    if(status==="shipped" && /\b(correios|pac|sedex)\b/i.test(nextCarrier||"") && !/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(nextCode||""))throw Error("TRACKING_INVALID");
    if(status==="delivered"){
      const delivery=planManualDelivery(shipment,observation?.event?.stage==="delivered");
      if(delivery.creditBoxes){
        // Crédito e mudança de status são uma única transação: retries não duplicam saldo.
        await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:shipment.userId,type:"entry",boxes:delivery.creditBoxes,referenceType:"manual_shipment_delivery",referenceId:shipment.id,notes:`Entrega de remessa manual ${shipment.orderNumber} · Correios`,occurredAt:now,createdAt:now});
        patch.stockCreditedAt=now;
      }
    }
    if(status!==shipment.shippingStatus||trackingChanged){
      Object.assign(patch,{shippingStatus:status,carrier:nextCarrier,trackingCode:nextCode,updatedAt:now});
      if(status==="shipped"&&!shipment.shippedAt)patch.shippedAt=now;
      if(status==="delivered"&&!shipment.deliveredAt)patch.deliveredAt=now;
    }
    if(Object.keys(patch).length)await tx.update(manualShipments).set(patch).where(eq(manualShipments.id,id));
    return {updated:Object.keys(patch).length>0,ignored:false,notify:status!==shipment.shippingStatus?status:""};
  });
  if(result.notify==="shipped"||result.notify==="delivered"){
    try{await sendManualShipmentStatusEmail(id,result.notify)}catch{console.error("manual_shipment_status_email_pending")}
  }
  return {updated:result.updated,ignored:result.ignored};
}

/** Registros anteriores já foram creditados; permite suspender esse saldo até a entrega. */
export async function suspendLegacyManualShipment(id:string, expectedStock:number, actorId:string){
  return getDb().transaction(async tx=>{
    const [link]=await tx.select({userId:manualShipments.userId}).from(manualShipments).where(eq(manualShipments.id,id)).limit(1);
    if(!link)throw Error("MANUAL_SHIPMENT_NOT_FOUND");
    await tx.select({id:users.id}).from(users).where(eq(users.id,link.userId)).limit(1).for("update");
    const [shipment]=await tx.select().from(manualShipments).where(eq(manualShipments.id,id)).limit(1).for("update");
    if(!shipment)throw Error("MANUAL_SHIPMENT_NOT_FOUND");
    const movements=await tx.select().from(stockMovements).where(eq(stockMovements.userId,shipment.userId)).for("update");
    const current=calculateStock(movements);
    if(current!==expectedStock)throw Error("STALE_STOCK");
    const boxes=planLegacySuspension(shipment,current);
    const now=new Date().toISOString();
    await tx.insert(stockMovements).values({id:crypto.randomUUID(),userId:shipment.userId,type:"adjustment_out",boxes,referenceType:"manual_shipment_hold",referenceId:shipment.id,notes:`Saldo suspenso para envio ${shipment.orderNumber} · BKO ${actorId}`,occurredAt:now,createdAt:now});
    await tx.update(manualShipments).set({stockCreditMode:"on_delivery",updatedAt:now}).where(eq(manualShipments.id,id));
    return {updated:true,stock:current-boxes};
  });
}
