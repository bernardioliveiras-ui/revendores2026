import {readFile} from 'node:fs/promises';
import {ensureNullableResellerPurchaseId} from '../lib/reseller-schema-migration.mjs';
export async function migrate(connection){
 const schema=await readFile(new URL('../database/schema.sql',import.meta.url),'utf8');
 const ddl=[...schema.matchAll(/CREATE TABLE IF NOT EXISTS `[a-z_]+`[\s\S]+?;/g)].map(m=>m[0]);
 const [lock]=await connection.query("SELECT GET_LOCK('lordnutri-schema-v2', 30) AS acquired");
 if(Number(lock[0]?.acquired)!==1)throw new Error('Outra migração está em execução. Tente novamente.');
 try{
  for(const statement of ddl)await connection.query(statement);
  const additions={
   sales:{client_request_id:'varchar(80) NULL',customer_phone:"varchar(24) NOT NULL DEFAULT ''"},
   purchase_measurement:{activated_at:'varchar(40) NULL'},
   asaas_events:{purchase_id:'varchar(80) NULL'},
   purchases:{postal_event:'varchar(240) NULL',postal_event_at:'varchar(40) NULL',postal_checked_at:'varchar(40) NULL',postal_attempt_at:'varchar(40) NULL',postal_issue:'varchar(120) NULL',indicator_cashback_cents:'int NULL',campaign_id:'varchar(80) NULL',asaas_verified_at:'varchar(40) NULL',asaas_installment_id:'varchar(120) NULL',product_total_cents:'int NOT NULL DEFAULT 0',shipping_type:"varchar(20) NOT NULL DEFAULT ''",shipping_cents:'int NOT NULL DEFAULT 0',payment_method:"varchar(20) NOT NULL DEFAULT ''",installments:'int NOT NULL DEFAULT 1',installment_value_cents:'int NOT NULL DEFAULT 0',interest_cents:'int NOT NULL DEFAULT 0',welcome_status:"varchar(30) NOT NULL DEFAULT 'pending'",welcome_secret:'varchar(1000) NULL',welcome_iv:'varchar(40) NULL',welcome_sent_at:'varchar(40) NULL'},
   indicator_campaigns:{cashback_mode:"varchar(12) NOT NULL DEFAULT 'fixed'",cashback_value:'int NOT NULL DEFAULT 1500'},
   indicator_leads:{share_attempts:'int NOT NULL DEFAULT 0',last_shared_at:'varchar(40) NULL',receipt_id:'varchar(80) NULL',receipt_sent_at:'varchar(40) NULL',receipt_review:"varchar(16) NOT NULL DEFAULT 'PENDENTE'",reviewed_at:'varchar(40) NULL',reviewed_by:'varchar(80) NULL'},
   affiliate_cashbacks:{buyer_email:"varchar(254) NOT NULL DEFAULT ''",paid_by:'varchar(80) NULL',payout_reference:"varchar(180) NOT NULL DEFAULT ''",cancelled_at:'varchar(40) NULL',cancelled_by:'varchar(80) NULL',payment_reversed_at:'varchar(40) NULL'}
  };
  for(const [table,columns] of Object.entries(additions)){
   const [rows]=await connection.execute('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',[table]);
   const existing=new Set(rows.map(r=>r.COLUMN_NAME));
   for(const [name,definition] of Object.entries(columns))if(!existing.has(name))await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`);
  }
  await connection.query('CREATE UNIQUE INDEX `uq_sales_user_request` ON `sales` (`user_id`,`client_request_id`)').catch(error=>{if(error?.code!=='ER_DUP_KEYNAME')throw error;});
  await connection.query("INSERT IGNORE INTO reseller_sale_price_settings (id,price_cents,updated_at) VALUES (1,10990,'')");
  // A primeira revenda agora pode ser cadastrada manualmente, sem um pedido fictício.
  await ensureNullableResellerPurchaseId(connection);
  // Compatibilidade com lançamentos manuais do ZIP anterior (sem tocar no saldo).
  await connection.query(`INSERT IGNORE INTO manual_shipments
    (id,user_id,source_movement_id,order_number,boxes,stock_credit_mode,shipping_status,created_at,updated_at)
    SELECT UUID(),m.user_id,m.id,CONCAT('MAN-',LEFT(REPLACE(m.id,'-',''),24)),m.boxes,'already_in_stock','separating',m.created_at,m.created_at
    FROM stock_movements m INNER JOIN users u ON u.id=m.user_id AND u.role='reseller'
    WHERE m.boxes>0 AND (m.reference_type='manual_initial_stock'
      OR (m.reference_type='bko_stock_adjustment' AND m.type='adjustment_in'))`);
  // Fail clearly on an unrelated/older schema instead of launching a broken app.
  for(const statement of ddl){
   const table=/CREATE TABLE IF NOT EXISTS `([a-z_]+)`/.exec(statement)[1];
   const required=[...statement.matchAll(/(?:^|[\n,])\s*`?([a-z_]+)`?\s+(?:varchar\(\d+\)|int|bigint|text)(?=[\s,])/g)].map(m=>m[1]);
   const [rows]=await connection.execute('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',[table]);
   const existing=new Set(rows.map(r=>r.COLUMN_NAME));
   const missing=required.filter(c=>!existing.has(c));
   if(missing.length)throw new Error(`Schema incompatível: ${table}, colunas ausentes: ${missing.join(', ')}`);
  }
 }finally{await connection.query("SELECT RELEASE_LOCK('lordnutri-schema-v2')");}
}
