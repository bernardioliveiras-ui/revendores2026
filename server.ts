import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ESM/CJS safe __dirname and __filename
let _filename = "";
let _dirname = "";

try {
  if (typeof module !== "undefined" && module.filename) {
    _filename = module.filename;
    _dirname = path.dirname(_filename);
  }
} catch (e) {}

if (!_dirname || !_filename) {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      _filename = fileURLToPath(import.meta.url);
      _dirname = path.dirname(_filename);
    }
  } catch (e) {}
}

const __filename = _filename || path.join(process.cwd(), "server.js");
const __dirname = _dirname || process.cwd();


// Load environment variables from multiple possible locations to handle different server execution CWDs
const envPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
];
envPaths.forEach((p) => {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
});

import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { sendOrderToHiper, getHiperToken, findLeadForOrder, mapOrderToHiperPayload } from "./integrations/hiper";
import { logServer, logLead, logCheckout, logHiper, logPayment, logError } from "./utils/logger";
import { calculateShipping } from "./src/utils/calculateShipping";
import { calculateInstallmentPrice, INSTALLMENT_RULES } from "./src/utils/installmentCalculator";

// Uncaught exceptions and rejections logging
process.on("uncaughtException", (error) => {
  logError("Uncaught Exception", error);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled Rejection", reason);
});

const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";

let activeDataDir = "";
let isDataDirFallback = false;

let dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
try {
  const resolved = path.resolve(dataDir);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  // Test write permission
  const testFile = path.join(resolved, ".write_test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);

  dataDir = resolved;
  activeDataDir = resolved;
  isDataDirFallback = false;
} catch (err: any) {
  logError(`[ERRO CRÍTICO] Falha ao acessar ou criar DATA_DIR (${dataDir})`, err);
  dataDir = path.join(process.cwd(), "data");
  activeDataDir = path.resolve(dataDir);
  isDataDirFallback = true;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Ensure files exist
const couponsFile = path.join(dataDir, "coupons.json");
const ordersFile = path.join(dataDir, "orders.json");
const leadsFile = path.join(dataDir, "leads.json");
const customersFile = path.join(dataDir, "customers.json");
const shipmentsFile = path.join(dataDir, "shipments.json");

// System version helper
const systemVersion = "v2-hiper-doc-format-2026-06-22";

// Server Boot Diagnostics Logging
logServer(`[BOOT] Servidor iniciado
NODE_ENV: ${process.env.NODE_ENV || "development"}
process.cwd(): ${process.cwd()}
DATA_DIR: ${dataDir}
LEADS_FILE: ${leadsFile}
ORDERS_FILE: ${ordersFile}
CUSTOMERS_FILE: ${customersFile}
COUPONS_FILE: ${couponsFile}
versão do sistema: ${systemVersion}`);

if (!fs.existsSync(couponsFile)) {
  fs.writeFileSync(couponsFile, JSON.stringify([
    {
      code: "MIX10OFF",
      type: "percentage",
      value: 10,
      active: true,
      expiresAt: "2050-12-31T23:59:59Z",
      maxUses: 1000,
      usedCount: 0,
      minOrderValue: 0,
      appliesToPlans: [1, 3, 5]
    },
    {
      code: "PRIMEIRA20",
      type: "fixed",
      value: 20,
      active: true,
      expiresAt: "2050-12-31T23:59:59Z",
      maxUses: 1000,
      usedCount: 0,
      minOrderValue: 50,
      appliesToPlans: [1, 3, 5]
    },
    {
      code: "VIP30",
      type: "percentage",
      value: 30,
      active: true,
      expiresAt: "2050-12-31T23:59:59Z",
      maxUses: 100,
      usedCount: 0,
      minOrderValue: 0,
      appliesToPlans: [1, 3, 5]
    }
  ], null, 2));
}

if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(leadsFile)) {
  fs.writeFileSync(leadsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(customersFile)) {
  fs.writeFileSync(customersFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(shipmentsFile)) {
  fs.writeFileSync(shipmentsFile, JSON.stringify([], null, 2));
}

// Automatic Rotational Backup Function
function backupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const backupDir = path.join(dataDir, "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `${base}_${timestamp}${ext}`);
      fs.copyFileSync(filePath, backupPath);

      // Keep only last 5 backups per file type to save space
      const files = fs.readdirSync(backupDir)
        .filter((file) => file.startsWith(base))
        .map((file) => ({
          name: file,
          time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 5) {
        files.slice(5).forEach((f) => {
          fs.unlinkSync(path.join(backupDir, f.name));
        });
      }
    }
  } catch (error) {
    logError(`Erro ao criar backup para o arquivo ${filePath}`, error);
  }
}

// Database Helper Functions
const getCoupons = () => JSON.parse(fs.readFileSync(couponsFile, "utf-8"));
const saveCoupons = (data: any) => {
  backupFile(couponsFile);
  fs.writeFileSync(couponsFile, JSON.stringify(data, null, 2));
};
const getOrders = () => JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
const saveOrders = (data: any) => {
  backupFile(ordersFile);
  fs.writeFileSync(ordersFile, JSON.stringify(data, null, 2));
};
const getLeads = () => JSON.parse(fs.readFileSync(leadsFile, "utf-8"));
const saveLeads = (data: any) => {
  backupFile(leadsFile);
  fs.writeFileSync(leadsFile, JSON.stringify(data, null, 2));
};
const getCustomers = () => JSON.parse(fs.readFileSync(customersFile, "utf-8"));
const saveCustomers = (data: any) => {
  backupFile(customersFile);
  fs.writeFileSync(customersFile, JSON.stringify(data, null, 2));
};

// ==========================================
// SYSTEM ANALYTICS & EVENT TRACKING ENGINE
// ==========================================

const analyticsDir = path.join(dataDir, "analytics");
if (!fs.existsSync(analyticsDir)) {
  fs.mkdirSync(analyticsDir, { recursive: true });
}

const analyticsLogDir = path.join(dataDir, "logs");
if (!fs.existsSync(analyticsLogDir)) {
  fs.mkdirSync(analyticsLogDir, { recursive: true });
}
const analyticsLogFile = path.join(analyticsLogDir, "analytics.log");

const logAnalyticsError = (msg: string) => {
  try {
    const line = `[${new Date().toISOString()}] ERROR: ${msg}\n`;
    fs.appendFileSync(analyticsLogFile, line);
  } catch (e) {}
};

const logAnalyticsInfo = (msg: string) => {
  try {
    const line = `[${new Date().toISOString()}] INFO: ${msg}\n`;
    fs.appendFileSync(analyticsLogFile, line);
  } catch (e) {}
};

// Memory Event Buffer & Thread Safety Traps
let analyticsBuffer: any[] = [];
let isFlushing = false;

// Token-Bucket/Sliding Window Rate Limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  if (!current) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (now - current.windowStart > 10000) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  current.count += 1;
  if (current.count > 30) {
    return false;
  }
  return true;
};

// Deduplication Engine
const dedupCache = new Set<string>();

const getEventDedupHash = (evt: any): string | null => {
  const ev = evt.event;
  if (ev === "page_view" || ev === "view_content") {
    return `${ev}:${evt.sessionId}:${evt.path}`;
  }
  if (ev === "select_kit") {
    return `${ev}:${evt.sessionId}:${evt.plan}:${evt.quantity}`;
  }
  if (ev === "add_to_cart" || ev === "initiate_checkout" || ev === "add_payment_info") {
    return `${ev}:${evt.sessionId}:${evt.checkoutSessionId}`;
  }
  if (ev === "purchase") {
    return `${ev}:${evt.orderId || evt.paymentId || evt.id}`;
  }
  if (ev === "payment_created" || ev === "payment_confirmed") {
    return `${ev}:${evt.orderId || evt.paymentId}`;
  }
  if (ev === "checkout_recovery_shown" || ev === "checkout_recovery_continue" || ev === "checkout_recovery_dismissed") {
    return `${ev}:${evt.checkoutSessionId}`;
  }
  if (ev === "checkout_recovery_whatsapp") {
    // 2-second rate limit window to deduplicate WhatsApp clicks
    const roundedTime = Date.now() - (Date.now() % 2000);
    return `${ev}:${evt.checkoutSessionId}:${roundedTime}`;
  }
  if (ev === "checkout_recovery_recovered") {
    return `${ev}:${evt.orderId || evt.paymentId}:${evt.recoveryStage}`;
  }
  if (ev === "exit_popup_shown") {
    return `${ev}:${evt.sessionId}`;
  }
  if (ev === "exit_popup_choose_kit" || ev === "exit_popup_whatsapp" || ev === "exit_popup_dismissed") {
    const roundedTime = Date.now() - (Date.now() % 2000);
    return `${ev}:${evt.sessionId}:${roundedTime}`;
  }
  return null;
};

const initDedupCache = () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dateFilePath = path.join(analyticsDir, `events-${today}.json`);
    if (fs.existsSync(dateFilePath)) {
      const events = JSON.parse(fs.readFileSync(dateFilePath, "utf-8"));
      events.forEach((evt: any) => {
        const hash = getEventDedupHash(evt);
        if (hash) dedupCache.add(hash);
      });
      logAnalyticsInfo(`Deduplication cache initialized with ${events.length} events from today.`);
    }
  } catch (e: any) {
    logAnalyticsError(`Failed to initialize dedup cache: ${e.message}`);
  }
};
initDedupCache();

// Flush buffer to daily JSON stream files in atomic batches
const flushAnalyticsBuffer = () => {
  if (isFlushing || analyticsBuffer.length === 0) return;
  isFlushing = true;

  const batch = [...analyticsBuffer];
  analyticsBuffer = [];

  try {
    const grouped: Record<string, any[]> = {};
    batch.forEach((evt) => {
      // Group by official server timestamp date YYYY-MM-DD
      const date = evt.createdAt.split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(evt);
    });

    Object.keys(grouped).forEach((date) => {
      const dateFilePath = path.join(analyticsDir, `events-${date}.json`);
      let currentEvents = [];
      
      if (fs.existsSync(dateFilePath)) {
        try {
          currentEvents = JSON.parse(fs.readFileSync(dateFilePath, "utf-8"));
        } catch (e: any) {
          logAnalyticsError(`Failed to parse file ${dateFilePath}, resetting contents: ${e.message}`);
        }
      }

      currentEvents.push(...grouped[date]);

      const tmpPath = dateFilePath + ".tmp";
      fs.writeFileSync(tmpPath, JSON.stringify(currentEvents, null, 2));
      fs.renameSync(tmpPath, dateFilePath);
    });

    logAnalyticsInfo(`Successfully flushed batch of ${batch.length} events to daily storage.`);
  } catch (err: any) {
    logAnalyticsError(`Failed to flush analytics batch: ${err.message}`);
    // Put events back to retry on next flush
    analyticsBuffer.unshift(...batch);
  } finally {
    isFlushing = false;
  }
};

// Batch Timer Loop (5s)
const flushInterval = setInterval(flushAnalyticsBuffer, 5000);

// Shutdown Handlers to flush remaining buffer items
const handleAnalyticsShutdown = () => {
  logServer("[SHUTDOWN] Flushing analytics buffer...");
  clearInterval(flushInterval);
  if (analyticsBuffer.length > 0) {
    try {
      const batch = [...analyticsBuffer];
      analyticsBuffer = [];
      
      const grouped: Record<string, any[]> = {};
      batch.forEach((evt) => {
        const date = evt.createdAt.split("T")[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(evt);
      });

      Object.keys(grouped).forEach((date) => {
        const dateFilePath = path.join(analyticsDir, `events-${date}.json`);
        let currentEvents = [];
        if (fs.existsSync(dateFilePath)) {
          try {
            currentEvents = JSON.parse(fs.readFileSync(dateFilePath, "utf-8"));
          } catch (e) {}
        }
        currentEvents.push(...grouped[date]);
        const tmpPath = dateFilePath + ".tmp";
        fs.writeFileSync(tmpPath, JSON.stringify(currentEvents, null, 2));
        fs.renameSync(tmpPath, dateFilePath);
      });
      logServer(`[SHUTDOWN] Flushed ${batch.length} events on shutdown.`);
    } catch (e: any) {
      console.error("Failed to flush analytics on shutdown:", e);
    }
  }
};
process.on("SIGTERM", () => {
  handleAnalyticsShutdown();
  process.exit(0);
});
process.on("SIGINT", () => {
  handleAnalyticsShutdown();
  process.exit(0);
});

// Helper for finding files by range
const getDailyAnalyticsFiles = (fromStr: string, toStr: string): string[] => {
  try {
    const files = fs.readdirSync(analyticsDir);
    return files
      .filter((file) => {
        const match = file.match(/^events-(\d{4}-\d{2}-\d{2})\.json$/);
        if (!match) return false;
        const fileDate = match[1];
        return fileDate >= fromStr && fileDate <= toStr;
      })
      .map((file) => path.join(analyticsDir, file));
  } catch (e) {
    return [];
  }
};

const normalizeLpVersion = (value?: string | null): string => {
  const clean = String(value ?? "").trim().toLowerCase();

  if (!clean) return "unknown";

  if (
    clean === "original" ||
    clean === "default" ||
    clean === "v1" ||
    clean === "lp-original"
  ) return "original";

  if (clean === "v2" || clean === "lp-v2") return "v2";
  if (clean === "v3" || clean === "lp-v3") return "v3";

  return clean;
};

// Status Helpers
const normalizeOrderStatus = (status?: string | null): string => {
  const clean = String(status ?? "").trim().toLowerCase();
  if (!clean) return "pendente";
  
  if (clean === "pago" || clean === "paid" || clean === "confirmed" || clean === "received") {
    return "pago";
  }
  if (clean === "pendente" || clean === "pending" || clean === "bank_slip_viewed" || clean === "updated") {
    return "pendente";
  }
  if (clean === "cancelado" || clean === "cancelled" || clean === "deleted" || clean === "overdue") {
    return "cancelado";
  }
  if (clean === "reembolsado" || clean === "refunded") {
    return "reembolsado";
  }
  return clean;
};

const isPaidOrder = (status?: string | null): boolean => {
  return normalizeOrderStatus(status) === "pago";
};
const getShipments = () => JSON.parse(fs.readFileSync(shipmentsFile, "utf-8"));
const saveShipments = (data: any) => {
  backupFile(shipmentsFile);
  fs.writeFileSync(shipmentsFile, JSON.stringify(data, null, 2));
};

// CPF Masking Helper
function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
}

// Customer Name Helpers
const genericNames = ["cliente asaas", "cliente", "consumidor", "pagador", "não informado", "sem nome"];

function isPlaceholderName(name: string | null | undefined): boolean {
  if (!name) return true;
  const clean = name.trim().replace(/\s+/g, " ").toLowerCase();
  
  // Normalizar acentos / diacríticos
  const normalized = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Termos de placeholder conhecidos (exatos ou inclusos)
  const placeholders = [
    "teste", "test", "novo lead", "cliente", "usuario", 
    "sem nome", "undefined", "null", "cliente asaas", "consumidor", 
    "pagador", "nao informado", "n/a", "na", "nenhum", "ignorar"
  ];
  if (placeholders.some(p => normalized === p || normalized.includes(p))) {
    return true;
  }

  // 2. Padrões de repetição repetida de caracteres (ex: "aaa", "xxx", "zzz")
  if (/([a-z0-9])\1\1/i.test(normalized)) {
    return true;
  }

  // 3. Placeholder contendo dígitos (ex: "Teste123", "Cliente 1", "Lead 02")
  if (/\d+/.test(normalized) && (normalized.includes("teste") || normalized.includes("cliente") || normalized.includes("lead"))) {
    return true;
  }

  return false;
}

function isValidLeadName(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();

  return (
    normalized.length >= 2 &&
    normalized !== "cliente" &&
    normalized !== "nome não informado" &&
    normalized !== "não informado"
  );
}

function isValidCustomerName(name?: string | null): boolean {
  if (!name) return false;
  // 1. Normalizar espaços múltiplos antes da validação
  const normalized = name.trim().replace(/\s+/g, " ").toLowerCase();
  
  // 2. Rejeitar tamanho mínimo menor que 3
  if (normalized.length < 3) return false;
  
  // 3. Rejeitar placeholders/nomes genéricos
  if (isPlaceholderName(normalized)) return false;
  
  // 4. Rejeitar e-mails
  if (normalized.includes("@")) return false;
  
  // 5. Rejeitar números e símbolos de telefone
  if (/^[0-9\s()+-]+$/.test(normalized)) return false;
  
  // 6. Exigir pelo menos uma letra com suporte Unicode
  const hasLetter = /\p{L}/u.test(normalized);
  if (!hasLetter) return false;
  
  return true;
}

function redactEmail(email?: string | null): string {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length < 2) return "***";
  return `${parts[0].substring(0, 2)}***@${parts[1]}`;
}

function redactPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 6) return "***";
  return `${clean.substring(0, 4)}***${clean.substring(clean.length - 2)}`;
}

function redactName(name?: string | null): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  return words.map(w => w.length > 2 ? `${w[0]}***` : w).join(" ");
}

function normalizeDisplayName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

function getNameQuality(name?: string | null): number {
  if (!name) return 0;
  const clean = normalizeDisplayName(name);
  if (!isValidCustomerName(clean)) return 0;
  const words = clean.split(/\s+/).filter(w => w.length >= 2);
  return clean.length + words.length * 10;
}

function resolveBestName(...names: (string | null | undefined)[]): string {
  for (const name of names) {
    if (isValidLeadName(name)) {
      return normalizeDisplayName(name);
    }
  }
  return "";
}

// Identity Migration Configuration & Routine
const ENABLE_IDENTITY_MIGRATION = true;

function runExistingDataCorrection() {
  const startTime = Date.now();
  const migrationsDir = path.join(dataDir, "migrations");
  const markerFile = path.join(migrationsDir, "identity-correction-v1.completed");

  // If migration completed file exists, skip execution
  if (fs.existsSync(markerFile)) {
    return;
  }

  logServer("[MIGRAÇÃO] Iniciando rotina de correção de nomes genéricos...");
  
  let leadsLocalBakPath = leadsFile + ".bak";
  let ordersLocalBakPath = ordersFile + ".bak";
  let customersLocalBakPath = customersFile + ".bak";

  let leadsTmpPath = leadsFile + ".tmp";
  let ordersTmpPath = ordersFile + ".tmp";
  let customersTmpPath = customersFile + ".tmp";

  try {
    // 1. Create backups in backups directory (automatic rotational backup)
    backupFile(leadsFile);
    backupFile(ordersFile);
    backupFile(customersFile);

    // 2. Create local .bak files for transactional rollback
    if (fs.existsSync(leadsFile)) fs.copyFileSync(leadsFile, leadsLocalBakPath);
    if (fs.existsSync(ordersFile)) fs.copyFileSync(ordersFile, ordersLocalBakPath);
    if (fs.existsSync(customersFile)) fs.copyFileSync(customersFile, customersLocalBakPath);

    const leads = getLeads();
    const orders = getOrders();
    const customers = getCustomers();

    let leadsAnalyzed = leads.length;
    let ordersAnalyzed = orders.length;
    let customersAnalyzed = customers.length;

    let correctionsApplied = 0;
    let ambiguousCount = 0;
    let unresolvedCount = 0;

    // Helper to find unambiguous real name from linked collections
    const findUnambiguousRealName = (phoneStr?: string | null, emailStr?: string | null, cpfStr?: string | null, paymentIdStr?: string | null) => {
      const cleanPhone = phoneStr ? phoneStr.replace(/\D/g, "") : null;
      const cleanEmail = emailStr ? emailStr.toLowerCase().trim() : null;
      const cleanCpf = cpfStr ? cpfStr.replace(/\D/g, "") : null;

      const candidatesSet = new Set<string>();

      // A. Match by paymentId / orderId
      if (paymentIdStr) {
        // Search in orders
        const oMatch = orders.find((o: any) => o.paymentId === paymentIdStr);
        if (oMatch) {
          const name = oMatch.checkoutCustomerName || oMatch.customer?.name || oMatch.customerName;
          if (isValidCustomerName(name)) candidatesSet.add(normalizeDisplayName(name));
        }
        // Search in leads
        const lMatch = leads.find((l: any) => l.paymentId === paymentIdStr);
        if (lMatch) {
          if (isValidCustomerName(lMatch.name)) candidatesSet.add(normalizeDisplayName(lMatch.name));
        }
      }

      // B. Match by CPF
      if (cleanCpf) {
        // Search in orders
        orders.forEach((o: any) => {
          const oCpf = o.customer?.cpf ? o.customer.cpf.replace(/\D/g, "") : null;
          if (oCpf === cleanCpf) {
            const name = o.checkoutCustomerName || o.customer?.name || o.customerName;
            if (isValidCustomerName(name)) candidatesSet.add(normalizeDisplayName(name));
          }
        });
        // Search in leads
        leads.forEach((l: any) => {
          const lCpf = l.cpf ? l.cpf.replace(/\D/g, "") : null;
          if (lCpf === cleanCpf) {
            if (isValidCustomerName(l.name)) candidatesSet.add(normalizeDisplayName(l.name));
          }
        });
        // Search in customers
        customers.forEach((c: any) => {
          const cCpf = c.cpf ? c.cpf.replace(/\D/g, "") : null;
          if (cCpf === cleanCpf) {
            if (isValidCustomerName(c.name)) candidatesSet.add(normalizeDisplayName(c.name));
          }
        });
      }

      // C. Match by E-mail
      if (cleanEmail) {
        // Search in orders
        orders.forEach((o: any) => {
          const oEmail = o.customer?.email ? o.customer.email.toLowerCase().trim() : null;
          if (oEmail === cleanEmail) {
            const name = o.checkoutCustomerName || o.customer?.name || o.customerName;
            if (isValidCustomerName(name)) candidatesSet.add(normalizeDisplayName(name));
          }
        });
        // Search in leads
        leads.forEach((l: any) => {
          const lEmail = l.email ? l.email.toLowerCase().trim() : null;
          if (lEmail === cleanEmail) {
            if (isValidCustomerName(l.name)) candidatesSet.add(normalizeDisplayName(l.name));
          }
        });
        // Search in customers
        customers.forEach((c: any) => {
          const cEmail = c.email ? c.email.toLowerCase().trim() : null;
          if (cEmail === cleanEmail) {
            if (isValidCustomerName(c.name)) candidatesSet.add(normalizeDisplayName(c.name));
          }
        });
      }

      // D. Match by Phone
      if (cleanPhone) {
        // Search in orders
        orders.forEach((o: any) => {
          const oPhone = o.customer?.phone ? o.customer.phone.replace(/\D/g, "") : null;
          if (oPhone === cleanPhone) {
            const name = o.checkoutCustomerName || o.customer?.name || o.customerName;
            if (isValidCustomerName(name)) candidatesSet.add(normalizeDisplayName(name));
          }
        });
        // Search in leads
        leads.forEach((l: any) => {
          const lPhone = l.phone ? l.phone.replace(/\D/g, "") : null;
          if (lPhone === cleanPhone) {
            if (isValidCustomerName(l.name)) candidatesSet.add(normalizeDisplayName(l.name));
          }
        });
        // Search in customers
        customers.forEach((c: any) => {
          const cPhone = c.phone ? c.phone.replace(/\D/g, "") : null;
          if (cPhone === cleanPhone) {
            if (isValidCustomerName(c.name)) candidatesSet.add(normalizeDisplayName(c.name));
          }
        });
      }

      const candidates = Array.from(candidatesSet);
      if (candidates.length === 1) {
        return candidates[0]; // Inequívoca!
      } else if (candidates.length > 1) {
        ambiguousCount++;
        return "AMBIGUOUS";
      } else {
        unresolvedCount++;
        return null;
      }
    };

    let needsLeadsSave = false;
    let needsOrdersSave = false;
    let needsCustomersSave = false;

    // Correct Leads
    leads.forEach((l: any) => {
      if (!isValidCustomerName(l.name)) {
        const realName = findUnambiguousRealName(l.phone, l.email, l.cpf, l.paymentId);
        if (realName && realName !== "AMBIGUOUS") {
          l.name = realName;
          correctionsApplied++;
          needsLeadsSave = true;
        }
      }
    });

    // Correct Orders
    orders.forEach((o: any) => {
      const currentName = o.customer?.name || o.customerName;
      if (!isValidCustomerName(currentName)) {
        const realName = findUnambiguousRealName(o.customer?.phone, o.customer?.email, o.customer?.cpf, o.paymentId);
        if (realName && realName !== "AMBIGUOUS") {
          o.customerName = realName;
          if (o.customer) {
            o.customer.name = realName;
          }
          if (!o.checkoutCustomerName) {
            o.checkoutCustomerName = realName;
          }
          correctionsApplied++;
          needsOrdersSave = true;
        }
      }
    });

    // Correct Customers
    customers.forEach((c: any) => {
      if (!isValidCustomerName(c.name)) {
        const realName = findUnambiguousRealName(c.phone, c.email, c.cpf, null);
        if (realName && realName !== "AMBIGUOUS") {
          c.name = realName;
          correctionsApplied++;
          needsCustomersSave = true;
        }
      }
    });

    // Generate and validate temporary files first
    if (needsLeadsSave) fs.writeFileSync(leadsTmpPath, JSON.stringify(leads, null, 2));
    if (needsOrdersSave) fs.writeFileSync(ordersTmpPath, JSON.stringify(orders, null, 2));
    if (needsCustomersSave) fs.writeFileSync(customersTmpPath, JSON.stringify(customers, null, 2));

    // Validate the .tmp files structure using JSON.parse
    if (needsLeadsSave) JSON.parse(fs.readFileSync(leadsTmpPath, "utf-8"));
    if (needsOrdersSave) JSON.parse(fs.readFileSync(ordersTmpPath, "utf-8"));
    if (needsCustomersSave) JSON.parse(fs.readFileSync(customersTmpPath, "utf-8"));

    // Replace files atomic rename sequence
    if (needsLeadsSave) fs.renameSync(leadsTmpPath, leadsFile);
    if (needsOrdersSave) fs.renameSync(ordersTmpPath, ordersFile);
    if (needsCustomersSave) fs.renameSync(customersTmpPath, customersFile);

    // Verify written files on disk by reading them back and parsing
    JSON.parse(fs.readFileSync(leadsFile, "utf-8"));
    JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
    JSON.parse(fs.readFileSync(customersFile, "utf-8"));

    // Success! Clean local .bak backups
    if (fs.existsSync(leadsLocalBakPath)) fs.unlinkSync(leadsLocalBakPath);
    if (fs.existsSync(ordersLocalBakPath)) fs.unlinkSync(ordersLocalBakPath);
    if (fs.existsSync(customersLocalBakPath)) fs.unlinkSync(customersLocalBakPath);

    // Create completed version file
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    const completionMetadata = {
      date: new Date().toISOString(),
      leadsAnalyzed,
      ordersAnalyzed,
      customersAnalyzed,
      correctionsApplied,
      ambiguousCount,
      unresolvedCount,
      durationMs: Date.now() - startTime
    };
    fs.writeFileSync(markerFile, JSON.stringify(completionMetadata, null, 2));

    // Print styled console log block
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`
======================================
IDENTITY MIGRATION V1
Leads analisados: ${leadsAnalyzed}
Pedidos analisados: ${ordersAnalyzed}
Clientes analisados: ${customersAnalyzed}
Correções aplicadas: ${correctionsApplied}
Ambíguos: ${ambiguousCount}
Sem correspondência: ${unresolvedCount}
Rollback: NÃO
Tempo: ${elapsedSeconds}s
======================================
`);
  } catch (err) {
    logError("Erro crítico durante a execução da migração histórica. Executando rollback integral...", err);

    // Rollback: Restore files from local .bak copies
    try {
      if (fs.existsSync(leadsLocalBakPath)) {
        fs.copyFileSync(leadsLocalBakPath, leadsFile);
        fs.unlinkSync(leadsLocalBakPath);
      }
      if (fs.existsSync(ordersLocalBakPath)) {
        fs.copyFileSync(ordersLocalBakPath, ordersFile);
        fs.unlinkSync(ordersLocalBakPath);
      }
      if (fs.existsSync(customersLocalBakPath)) {
        fs.copyFileSync(customersLocalBakPath, customersFile);
        fs.unlinkSync(customersLocalBakPath);
      }
    } catch (restoreErr) {
      logError("Erro catastrófico ao tentar restaurar arquivos do backup (.bak) durante rollback!", restoreErr);
    }

    // Clean up residual .tmp files
    try {
      if (fs.existsSync(leadsTmpPath)) fs.unlinkSync(leadsTmpPath);
      if (fs.existsSync(ordersTmpPath)) fs.unlinkSync(ordersTmpPath);
      if (fs.existsSync(customersTmpPath)) fs.unlinkSync(customersTmpPath);
    } catch (cleanErr) {
      // ignore
    }

    // Print failed log summary
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`
======================================
IDENTITY MIGRATION V1 - FALHOU
Rollback: SIM (Todos os arquivos restaurados com sucesso)
Tempo decorrido: ${elapsedSeconds}s
======================================
`);
  }
}

function getUniqueBackupPath(baseDir: string, filename: string): string {
  let candidate = path.join(baseDir, filename);
  if (!fs.existsSync(candidate)) return candidate;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let counter = 1;
  while (fs.existsSync(path.join(baseDir, `${base}_${counter}${ext}`))) {
    counter++;
  }
  return path.join(baseDir, `${base}_${counter}${ext}`);
}

function runIdentityCorrectionV2() {
  const startTime = Date.now();
  const migrationsDir = path.join(dataDir, "migrations");
  const markerPath = path.join(migrationsDir, "identity-correction-v2.completed");

  if (fs.existsSync(markerPath)) {
    return;
  }

  logServer("[MIGRAÇÃO V2] Iniciando rotina de migração de nomes legados V2...");

  // Files we need to load
  let leads: any[] = [];
  let orders: any[] = [];
  let customers: any[] = [];

  try {
    // 1. Load files (fail-safe: if missing, create as empty arrays)
    if (fs.existsSync(leadsFile)) leads = JSON.parse(fs.readFileSync(leadsFile, "utf-8"));
    if (fs.existsSync(ordersFile)) orders = JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
    if (fs.existsSync(customersFile)) customers = JSON.parse(fs.readFileSync(customersFile, "utf-8"));
  } catch (err) {
    logError("[MIGRAÇÃO V2] Falha crítica ao ler/parsear os arquivos originais. Abortando migração...", err);
    return; // Don't crash server
  }

  const leadsAnalyzed = leads.length;
  const ordersAnalyzed = orders.length;
  const customersAnalyzed = customers.length;

  let correctionsAppliedLeads = 0;
  let correctionsAppliedOrders = 0;
  let correctionsAppliedCustomers = 0;

  let recoveredLeads = 0;
  let clearedPlaceholdersLeads = 0;
  let unrecoverableLeads = 0;

  let recoveredOrders = 0;
  let clearedPlaceholdersOrders = 0;
  let unrecoverableOrders = 0;

  let recoveredCustomers = 0;
  let clearedPlaceholdersCustomers = 0;
  let unrecoverableCustomers = 0;

  // Helpers to normalize strings for cross-referencing
  const normalizePhone = (p: any): string => (typeof p === "string" ? p.replace(/\D/g, "") : "");
  const normalizeEmail = (e: any): string => (typeof e === "string" ? e.trim().toLowerCase() : "");
  const normalizeCpf = (c: any): string => (typeof c === "string" ? c.replace(/\D/g, "") : "");

  // Helper to extract alternative names from within an object
  const findAlternativeName = (obj: any): string | null => {
    if (!obj) return null;
    const candidates = [
      obj.customerName,
      obj.fullName,
      obj.personalInfo?.name,
      obj.formData?.name,
      obj.billing?.name,
      obj.shipping?.name
    ];
    for (const cand of candidates) {
      if (isValidLeadName(cand)) {
        return cand.trim();
      }
    }
    return null;
  };

  // Helper to cross-reference other collections to find an unambiguous name
  const findCrossReferencedName = (phoneStr?: string | null, emailStr?: string | null, cpfStr?: string | null): string | null => {
    const cleanPhone = normalizePhone(phoneStr);
    const cleanEmail = normalizeEmail(emailStr);
    const cleanCpf = normalizeCpf(cpfStr);

    const candidatesSet = new Set<string>();

    // Priority 1: CPF
    if (cleanCpf) {
      orders.forEach((o: any) => {
        const oCpf = o.customer?.cpf ? normalizeCpf(o.customer.cpf) : normalizeCpf(o.cpf);
        if (oCpf === cleanCpf) {
          const name = findAlternativeName(o) || (o.customer && findAlternativeName(o.customer)) || o.customerName || o.customer?.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      leads.forEach((l: any) => {
        const lCpf = normalizeCpf(l.cpf);
        if (lCpf === cleanCpf) {
          const name = findAlternativeName(l) || l.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      customers.forEach((c: any) => {
        const cCpf = normalizeCpf(c.cpf);
        if (cCpf === cleanCpf) {
          const name = findAlternativeName(c) || c.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      
      const cands = Array.from(candidatesSet);
      if (cands.length === 1) return cands[0];
      if (cands.length > 1) return null; // Avoid ambiguous choice
    }

    // Priority 2: E-mail
    if (cleanEmail) {
      orders.forEach((o: any) => {
        const oEmail = o.customer?.email ? normalizeEmail(o.customer.email) : normalizeEmail(o.email);
        if (oEmail === cleanEmail) {
          const name = findAlternativeName(o) || (o.customer && findAlternativeName(o.customer)) || o.customerName || o.customer?.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      leads.forEach((l: any) => {
        const lEmail = normalizeEmail(l.email);
        if (lEmail === cleanEmail) {
          const name = findAlternativeName(l) || l.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      customers.forEach((c: any) => {
        const cEmail = normalizeEmail(c.email);
        if (cEmail === cleanEmail) {
          const name = findAlternativeName(c) || c.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });

      const cands = Array.from(candidatesSet);
      if (cands.length === 1) return cands[0];
      if (cands.length > 1) return null; // Avoid ambiguous choice
    }

    // Priority 3: Telefone
    if (cleanPhone) {
      orders.forEach((o: any) => {
        const oPhone = o.customer?.phone ? normalizePhone(o.customer.phone) : normalizePhone(o.phone);
        if (oPhone === cleanPhone) {
          const name = findAlternativeName(o) || (o.customer && findAlternativeName(o.customer)) || o.customerName || o.customer?.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      leads.forEach((l: any) => {
        const lPhone = normalizePhone(l.phone);
        if (lPhone === cleanPhone) {
          const name = findAlternativeName(l) || l.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });
      customers.forEach((c: any) => {
        const cPhone = normalizePhone(c.phone);
        if (cPhone === cleanPhone) {
          const name = findAlternativeName(c) || c.name;
          if (isValidLeadName(name)) candidatesSet.add(name.trim());
        }
      });

      const cands = Array.from(candidatesSet);
      if (cands.length === 1) return cands[0];
      if (cands.length > 1) return null; // Avoid ambiguous choice
    }

    return null;
  };

  // Perform corrections in memory
  leads.forEach((l: any) => {
    if (!isValidLeadName(l.name)) {
      const alt = findAlternativeName(l) || findCrossReferencedName(l.phone, l.email, l.cpf);
      if (alt) {
        l.name = alt.trim();
        recoveredLeads++;
      } else {
        l.name = "";
        unrecoverableLeads++;
      }
      clearedPlaceholdersLeads++;
      correctionsAppliedLeads++;
    }
  });

  orders.forEach((o: any) => {
    const currentName = o.customerName || (o.customer && o.customer.name);
    if (!isValidLeadName(currentName)) {
      const alt = findAlternativeName(o) || (o.customer && findAlternativeName(o.customer)) || findCrossReferencedName(o.customer?.phone || o.phone, o.customer?.email || o.email, o.customer?.cpf || o.cpf);
      const val = alt ? alt.trim() : "";
      o.customerName = val;
      if (o.checkoutCustomerName !== undefined) o.checkoutCustomerName = val;
      if (alt) {
        recoveredOrders++;
      } else {
        unrecoverableOrders++;
      }
      clearedPlaceholdersOrders++;
      correctionsAppliedOrders++;
    }
    // Correct nested customer object if it exists
    if (o.customer && !isValidLeadName(o.customer.name)) {
      const alt = findAlternativeName(o.customer) || findAlternativeName(o) || findCrossReferencedName(o.customer?.phone || o.phone, o.customer?.email || o.email, o.customer?.cpf || o.cpf);
      o.customer.name = alt ? alt.trim() : "";
    }
  });

  customers.forEach((c: any) => {
    if (!isValidLeadName(c.name)) {
      const alt = findAlternativeName(c) || findCrossReferencedName(c.phone, c.email, c.cpf);
      if (alt) {
        c.name = alt.trim();
        recoveredCustomers++;
      } else {
        c.name = "";
        unrecoverableCustomers++;
      }
      clearedPlaceholdersCustomers++;
      correctionsAppliedCustomers++;
    }
  });

  // Prepare backup directory
  const backupDir = path.join(dataDir, "backups", "identity-correction-v2");
  
  // Get unique backup paths that do not overwrite
  const leadsBak = getUniqueBackupPath(backupDir, "leads.json");
  const ordersBak = getUniqueBackupPath(backupDir, "orders.json");
  const customersBak = getUniqueBackupPath(backupDir, "customers.json");

  // Prepare temporary files paths
  const leadsTmp = leadsFile + ".tmp2";
  const ordersTmp = ordersFile + ".tmp2";
  const customersTmp = customersFile + ".tmp2";

  try {
    // 3. Create backups
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    if (fs.existsSync(leadsFile)) fs.copyFileSync(leadsFile, leadsBak);
    if (fs.existsSync(ordersFile)) fs.copyFileSync(ordersFile, ordersBak);
    if (fs.existsSync(customersFile)) fs.copyFileSync(customersFile, customersBak);

    // 4. Write temporary files
    fs.writeFileSync(leadsTmp, JSON.stringify(leads, null, 2));
    fs.writeFileSync(ordersTmp, JSON.stringify(orders, null, 2));
    fs.writeFileSync(customersTmp, JSON.stringify(customers, null, 2));

    // 5. Validate temporary files
    JSON.parse(fs.readFileSync(leadsTmp, "utf-8"));
    JSON.parse(fs.readFileSync(ordersTmp, "utf-8"));
    JSON.parse(fs.readFileSync(customersTmp, "utf-8"));

    // 6. Rename atomic sequence
    fs.renameSync(leadsTmp, leadsFile);
    fs.renameSync(ordersTmp, ordersFile);
    fs.renameSync(customersTmp, customersFile);

    // 7. Write marker file
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    fs.writeFileSync(
      markerPath,
      JSON.stringify(
        {
          date: new Date().toISOString(),
          leads: {
            analyzed: leadsAnalyzed,
            corrected: correctionsAppliedLeads,
            recovered: recoveredLeads,
            cleared: clearedPlaceholdersLeads,
            unrecoverable: unrecoverableLeads
          },
          orders: {
            analyzed: ordersAnalyzed,
            corrected: correctionsAppliedOrders,
            recovered: recoveredOrders,
            cleared: clearedPlaceholdersOrders,
            unrecoverable: unrecoverableOrders
          },
          customers: {
            analyzed: customersAnalyzed,
            corrected: correctionsAppliedCustomers,
            recovered: recoveredCustomers,
            cleared: clearedPlaceholdersCustomers,
            unrecoverable: unrecoverableCustomers
          },
          durationMs: Date.now() - startTime,
        },
        null,
        2
      )
    );

    console.log(`
======================================
MIGRAÇÃO DE NOMES LEGADOS V2 CONCLUÍDA
Leads analisados: ${leadsAnalyzed} (recuperados: ${recoveredLeads}, limpos: ${clearedPlaceholdersLeads}, sem nome: ${unrecoverableLeads})
Pedidos analisados: ${ordersAnalyzed} (recuperados: ${recoveredOrders}, limpos: ${clearedPlaceholdersOrders}, sem nome: ${unrecoverableOrders})
Clientes analisados: ${customersAnalyzed} (recuperados: ${recoveredCustomers}, limpos: ${clearedPlaceholdersCustomers}, sem nome: ${unrecoverableCustomers})
Backup criado em: ${backupDir}
Tempo: ${((Date.now() - startTime) / 1000).toFixed(2)}s
======================================
`);

  } catch (err) {
    logError("[MIGRAÇÃO V2] Erro crítico na migração. Iniciando restauração e rollback...", err);
    // Rollback renaming files if temporary or failed writes occurred
    try {
      if (fs.existsSync(leadsBak)) fs.copyFileSync(leadsBak, leadsFile);
      if (fs.existsSync(ordersBak)) fs.copyFileSync(ordersBak, ordersFile);
      if (fs.existsSync(customersBak)) fs.copyFileSync(customersBak, customersFile);
      logServer("[MIGRAÇÃO V2] Rollback de backups concluído com sucesso.");
    } catch (rbErr) {
      logError("[MIGRAÇÃO V2] Falha grave ao tentar reverter backups de arquivos", rbErr);
    }
    // Clean up tmp files
    try {
      if (fs.existsSync(leadsTmp)) fs.unlinkSync(leadsTmp);
      if (fs.existsSync(ordersTmp)) fs.unlinkSync(ordersTmp);
      if (fs.existsSync(customersTmp)) fs.unlinkSync(customersTmp);
    } catch (cleanErr) {}
  }
}

// Cookie parser helper
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=");
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

const isProduction = process.env.NODE_ENV === "production";

// Safe centralized credentials provider
function getAdminCredentials() {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (isProduction) {
    if (!user || !password || !secret) {
      logError("[ERRO CRÍTICO] ADMIN_USER, ADMIN_PASSWORD e ADMIN_SESSION_SECRET são obrigatórios em ambiente de produção. Login administrativo bloqueado.");
      return null;
    }
    return { user, password, secret };
  } else {
    // Development local fallbacks
    return {
      user: user || "adminmix10pro",
      password: password || "MiX882*",
      secret: secret || "default_mix10pro_session_secret_2026",
    };
  }
}

// Generate secure admin token using HMAC SHA256
function generateAdminToken(username: string): string {
  const creds = getAdminCredentials();
  const secret = creds ? creds.secret : "invalid_production_secret_key";
  const payload = JSON.stringify({
    user: username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  const base64Payload = Buffer.from(payload).toString("base64");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${base64Payload}.${signature}`;
}

// Validate admin token
function isAuthenticated(req: express.Request): boolean {
  try {
    const creds = getAdminCredentials();
    if (!creds) return false;

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.admin_token;
    if (!token) return false;

    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return false;

    const payloadStr = Buffer.from(base64Payload, "base64").toString("utf-8");
    const expectedSignature = crypto.createHmac("sha256", creds.secret).update(payloadStr).digest("hex");

    if (signature !== expectedSignature) return false;

    const payload = JSON.parse(payloadStr);
    if (payload.user !== creds.user) return false;
    if (payload.expiresAt < Date.now()) return false;

    return true;
  } catch (e) {
    return false;
  }
}

// Admin Authentication Middleware
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login." });
  }
  next();
};

// Rate Limit store for login (attempts per IP)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

function checkLoginRateLimit(ip: string): { allowed: boolean; waitTimeMinutes?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt) return { allowed: true };

  if (now > attempt.resetTime) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const waitTimeMinutes = Math.ceil((attempt.resetTime - now) / (60 * 1000));
    return { allowed: false, waitTimeMinutes };
  }

  return { allowed: true };
}

function recordLoginAttempt(ip: string, success: boolean) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    attempt.count += 1;
    loginAttempts.set(ip, attempt);
  }
}

function calculateDiscount(orderValue: number, coupon: any, shippingCost: number = 0) {
  if (coupon.type === "percentage") {
    return (orderValue * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    return coupon.value > orderValue ? orderValue : coupon.value;
  } else if (coupon.type === "free_shipping") {
    return shippingCost;
  }
  return 0;
}

function validateCouponLogic(coupon: any, orderValue: number, planMonths: number) {
  if (!coupon) return { valid: false, message: "Cupom inválido." };
  if (coupon.archived === true) return { valid: false, message: "Cupom arquivado." };
  if (coupon.active !== true) return { valid: false, message: "Cupom inativo." };

  if (coupon.maxUses === 1 && (coupon.status === "used" || coupon.usedCount >= 1)) {
    return { valid: false, message: "Cupom já utilizado." };
  }
  if (coupon.status === "used") {
    return { valid: false, message: "Cupom já utilizado." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: "Cupom expirado." };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "Limite de usos excedido." };
  }
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    return { valid: false, message: `Valor mínimo não atingido (R$ ${coupon.minOrderValue.toFixed(2)}).` };
  }
  if (coupon.appliesToPlans && coupon.appliesToPlans.length > 0 && !coupon.appliesToPlans.includes(planMonths)) {
    return { valid: false, message: "Cupom não aplicável a este plano." };
  }

  return { valid: true };
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VOLTEI-${result}`;
}

/**
 * Futura integração de leads com CRM ou WhatsApp.
 * Esta função prepara a estrutura para envio dos dados.
 */
function triggerLeadIntegrations(lead: any, eventType: "create" | "update") {
  try {
    const integrationPayload = {
      event: eventType,
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      cpf: lead.cpf,
      step: lead.step,
      status: lead.status,
      planId: lead.planId,
      couponCode: lead.couponCode,
      zipCode: lead.zipCode,
      address: lead.address,
      addressNumber: lead.addressNumber,
      complement: lead.complement,
      province: lead.province,
      cityState: lead.cityState,
      paymentMethod: lead.paymentMethod,
      timestamp: new Date().toISOString(),
    };

    logLead(`[INTEGRAÇÃO FUTURA - CRM/WhatsApp] Evento: ${eventType} para Lead ID: ${lead.id}`);
    // Exemplo de integração:
    // axios.post("https://api.crm.com/v1/leads", integrationPayload);
  } catch (error) {
    logError("Erro na futura integração de leads", error);
  }
}

/**
 * Função para registrar uma compra bem-sucedida, atualizando o Lead para pago
 * e salvando/atualizando o cliente no arquivo customers.json.
 */
function registerPurchaseSuccess(
  paymentId: string,
  valuePaid: number,
  customerEmail?: string,
  customerPhone?: string,
  customerName?: string
) {
  try {
    const now = new Date().toISOString();
    const leads = getLeads();

    // 1. Tentar localizar o pedido correspondente em orders.json pelo paymentId
    const orders = getOrders();
    const matchedOrder = orders.find((o: any) => o.paymentId === paymentId);

    if (matchedOrder) {
      const orderIdx = orders.findIndex((o: any) => o.id === matchedOrder.id);
      if (orderIdx > -1) {
        orders[orderIdx].status = "pago";
        orders[orderIdx].updatedAt = now;
        saveOrders(orders);
        logPayment(`Pedido ${orders[orderIdx].id} atualizado para status pago via registerPurchaseSuccess`);
      }
    }

    // Se o pedido foi encontrado, usamos os dados do pedido como fonte principal
    const orderName = matchedOrder?.customer?.name || matchedOrder?.customerName || "";
    const orderEmail = matchedOrder?.customer?.email || "";
    const orderPhone = matchedOrder?.customer?.phone || "";
    const orderCpf = matchedOrder?.customer?.cpf || "";
    const orderPlanId = matchedOrder ? (matchedOrder.planMonths === 1 ? 1 : matchedOrder.planMonths === 3 ? 2 : matchedOrder.planMonths === 5 ? 3 : 1) : null;
    const orderCouponCode = matchedOrder?.couponCode || null;
    const orderPaymentMethod = matchedOrder?.paymentMethod || null;

    // Encontrar lead pelo paymentId
    let lead = leads.find((l: any) => l.paymentId === paymentId);

    const orderLpVersion = matchedOrder?.lp_version || null;

    // Busca alternativa por email ou telefone se não encontrado por paymentId
    const searchEmail = orderEmail || (customerEmail ? customerEmail.toLowerCase().trim() : null);
    const searchPhone = orderPhone ? orderPhone.replace(/\D/g, "") : (customerPhone ? customerPhone.replace(/\D/g, "") : null);

    if (!lead) {
      if (searchPhone) {
        lead = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, "") === searchPhone);
      }
      if (!lead && searchEmail) {
        lead = leads.find((l: any) => l.email && l.email.toLowerCase().trim() === searchEmail);
      }
    }

    const email = orderEmail || customerEmail || (lead ? lead.email : "");
    const phone = orderPhone || customerPhone || (lead ? lead.phone : "");
    const name = resolveBestName(
      matchedOrder?.checkoutCustomerName,
      lead?.name,
      orderName,
      customerName
    );
    const cpf = orderCpf || (lead ? lead.cpf : "");

    // 2. Atualizar o Lead
    if (lead) {
      const leadIndex = leads.findIndex((l: any) => l.id === lead.id);
      if (leadIndex > -1) {
        leads[leadIndex] = {
          ...leads[leadIndex],
          origin: leads[leadIndex].origin || "checkout_site",
          source: leads[leadIndex].source || "site",
          name: resolveBestName(name, leads[leadIndex].name),
          email: email || leads[leadIndex].email || "",
          phone: phone || leads[leadIndex].phone || "",
          cpf: cpf || leads[leadIndex].cpf || "",
          planId: orderPlanId || leads[leadIndex].planId || 1,
          quantity: matchedOrder?.quantity || leads[leadIndex].quantity || 1,
          couponCode: orderCouponCode || leads[leadIndex].couponCode,
          paymentMethod: orderPaymentMethod || leads[leadIndex].paymentMethod,
          zipCode: matchedOrder?.address?.cep || leads[leadIndex].zipCode || "",
          address: matchedOrder?.address?.logradouro || leads[leadIndex].address || "",
          addressNumber: matchedOrder?.address?.numero || leads[leadIndex].addressNumber || "",
          complement: matchedOrder?.address?.complemento || leads[leadIndex].complement || "",
          province: matchedOrder?.address?.bairro || leads[leadIndex].province || "",
          cityState: matchedOrder?.address?.cidade && matchedOrder?.address?.estado
            ? `${matchedOrder.address.cidade}/${matchedOrder.address.estado}`
            : (leads[leadIndex].cityState || null),
          codigoIbge: matchedOrder?.address?.codigoIbge || leads[leadIndex].codigoIbge || 0,
          status: "paid",
          step: "purchase_completed",
          paymentId: paymentId || leads[leadIndex].paymentId,
          lp_version: orderLpVersion || leads[leadIndex].lp_version || null,
          updatedAt: now,
        };
        saveLeads(leads);
        logLead(`Lead ${leads[leadIndex].id} atualizado para status pago (compra concluída) com dados completos via paymentId ${paymentId}`);
        triggerLeadIntegrations(leads[leadIndex], "update");
      }
    } else {
      const newLead = {
        id: `lead_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: resolveBestName(name),
        email: email || null,
        phone: phone || null,
        cpf: cpf || null,
        planId: orderPlanId || 1,
        quantity: matchedOrder?.quantity || 1,
        couponCode: orderCouponCode || null,
        paymentMethod: orderPaymentMethod || null,
        zipCode: matchedOrder?.address?.cep || null,
        address: matchedOrder?.address?.logradouro || null,
        addressNumber: matchedOrder?.address?.numero || null,
        complement: matchedOrder?.address?.complemento || null,
        province: matchedOrder?.address?.bairro || null,
        cityState: matchedOrder?.address?.cidade && matchedOrder?.address?.estado
          ? `${matchedOrder.address.cidade}/${matchedOrder.address.estado}`
          : null,
        codigoIbge: matchedOrder?.address?.codigoIbge || null,
        status: "paid",
        step: "purchase_completed",
        paymentId: paymentId || null,
        lp_version: orderLpVersion,
        origin: "checkout_site",
        source: "site",
        createdAt: now,
        updatedAt: now,
      };
      leads.push(newLead);
      saveLeads(leads);
      logLead(`Novo lead completo criado direto com status pago (compra concluída): ${newLead.id} via paymentId ${paymentId}`);
      triggerLeadIntegrations(newLead, "create");
    }

    // 3. Salvar ou atualizar cliente no arquivo customers.json
    const customers = getCustomers();
    let customerIndex = -1;

    const cleanCustEmail = email ? email.toLowerCase().trim() : null;
    const cleanCustPhone = phone ? phone.replace(/\D/g, "") : null;

    if (cleanCustPhone) {
      customerIndex = customers.findIndex((c: any) => c.phone && c.phone.replace(/\D/g, "") === cleanCustPhone);
    }
    if (customerIndex === -1 && cleanCustEmail) {
      customerIndex = customers.findIndex((c: any) => c.email && c.email.toLowerCase().trim() === cleanCustEmail);
    }

    if (customerIndex > -1) {
      const existingCustomer = customers[customerIndex];
      customers[customerIndex] = {
        ...existingCustomer,
        name: resolveBestName(name, existingCustomer.name),
        email: email || existingCustomer.email,
        phone: phone || existingCustomer.phone,
        cpf: cpf || existingCustomer.cpf || "",
        totalOrders: (existingCustomer.totalOrders || 0) + 1,
        totalSpent: (existingCustomer.totalSpent || 0) + valuePaid,
        updatedAt: now,
      };
      saveCustomers(customers);
      logServer(`Cliente existente atualizado na base: ${customers[customerIndex].id} - Total de Pedidos: ${customers[customerIndex].totalOrders}, Total Gasto: ${customers[customerIndex].totalSpent}`);
    } else {
      const newCustomer = {
        id: `customer_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: resolveBestName(name),
        phone: phone || "",
        email: email || "",
        cpf: cpf || "",
        totalOrders: 1,
        totalSpent: valuePaid,
        createdAt: now,
        updatedAt: now,
      };
      customers.push(newCustomer);
      saveCustomers(customers);
      logServer(`Novo cliente registrado na base: ${newCustomer.id}`);
    }
  } catch (error) {
    logError("Erro em registerPurchaseSuccess ao registrar status pago/cliente", error);
  }
}

async function startServer() {
  if (ENABLE_IDENTITY_MIGRATION) {
    runExistingDataCorrection();
    runIdentityCorrectionV2();
  }

  const app = express();
  app.set("trust proxy", 1);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Robots noindex header for LP V3 (with optional trailing slash)
  app.use((req, res, next) => {
    if (/^\/lp-v3\/?$/.test(req.path)) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    next();
  });

  // Prevent direct public URL access to sensitive data and backups directories
  app.use((req, res, next) => {
    const pathName = req.path.toLowerCase();
    if (
      pathName === "/data" ||
      pathName.startsWith("/data/") ||
      pathName === "/backups" ||
      pathName.startsWith("/backups/")
    ) {
      console.warn(`Blocked unauthorized access attempt to: ${req.path}`);
      return res.status(403).json({ error: "Access denied." });
    }
    next();
  });

  // Helper function to call Asaas API
  const getAsaasClient = () => {
    let apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      throw new Error("ASAAS_API_KEY is not defined in environment variables");
    }
    // Hostinger hPanel automatic escaping workaround:
    if (apiKey.startsWith("\\$")) {
      apiKey = apiKey.substring(1);
    }
    const baseURL = process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3";
    return axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "mix10pro-checkout",
        "access_token": apiKey,
      },
    });
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/debug-env", (req, res) => {
    const key = process.env.ASAAS_API_KEY || "";
    let cleanKey = key;
    if (cleanKey.startsWith("\\$")) {
      cleanKey = cleanKey.substring(1);
    }
    res.json({
      hasKey: !!key,
      keyLength: key.length,
      rawPrefix: key.substring(0, 10),
      cleanPrefix: cleanKey.substring(0, 10),
      baseUrl: process.env.ASAAS_BASE_URL || "https://api.asaas.com/v3",
    });
  });

  // POST /api/leads/capture endpoint
  app.post("/api/leads/capture", (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        cpf,
        planId,
        quantity,
        couponCode,
        step,
        status,
        zipCode,
        address,
        addressNumber,
        complement,
        province,
        cityState,
        paymentMethod,
        paymentId,
        codigoIbge,
      } = req.body;

      if (process.env.NODE_ENV === "development") {
        console.log(`[LEAD] payload name present: ${name !== undefined && name !== null && name !== ""}`);
        console.log(`[LEAD] payload name length: ${name ? String(name).length : 0}`);
      }

      const redactedBody = {
        ...req.body,
        name: redactName(name),
        email: redactEmail(email),
        phone: redactPhone(phone),
        cpf: cpf ? maskCpf(cpf) : null,
      };
      logLead(`[LEAD_CAPTURE_RECEIVED] Payload: ${JSON.stringify(redactedBody)}`);

      if (!email && !phone) {
        if (process.env.NODE_ENV === "development") {
          console.log("[LEAD] autosave skipped: insufficient data");
          logLead("[LEAD] autosave skipped: insufficient data");
        }
        return res.status(400).json({ error: "E-mail ou telefone obrigatório para registrar lead." });
      }

      const leads = getLeads();
      const cleanEmail = email ? email.toLowerCase().trim() : null;
      const cleanPhone = phone ? phone.replace(/\D/g, "") : null;

      // Find existing lead, prioritizing phone, then email
      let leadIndex = -1;
      let matchedBy: "phone" | "email" | null = null;
      if (cleanPhone) {
        leadIndex = leads.findIndex((l: any) => l.phone && l.phone.replace(/\D/g, "") === cleanPhone);
        if (leadIndex > -1) matchedBy = "phone";
      }
      if (leadIndex === -1 && cleanEmail) {
        leadIndex = leads.findIndex((l: any) => l.email && l.email.toLowerCase().trim() === cleanEmail);
        if (leadIndex > -1) matchedBy = "email";
      }

      const now = new Date().toISOString();

      // Resolve incoming LP version parameters in priority order
      const incomingLp =
        req.body.lpId ||
        req.body.lpVersion ||
        req.body.lp_version ||
        req.body.analytics?.lpId ||
        req.body.analytics?.lpVersion;

      const incomingLpId = normalizeLpVersion(incomingLp);
      let incomingLpVersion = "";
      if (incomingLpId === "original") incomingLpVersion = "LP Original";
      else if (incomingLpId === "v2") incomingLpVersion = "LP V2";
      else if (incomingLpId === "v3") incomingLpVersion = "LP V3";

      const hasLpId = incomingLpId !== "unknown" && incomingLpId !== "";

      if (leadIndex > -1) {
        const existingLead = leads[leadIndex];
        
        const incomingName = typeof name === "string" ? name.trim() : "";
        const previousName = existingLead.name;
        
        if (isValidLeadName(incomingName)) {
          existingLead.name = incomingName.trim();
        } else if (!isValidLeadName(previousName)) {
          existingLead.name = "";
        }


        const shouldUpdateName = existingLead.name !== previousName;

        // Step non-regression protection
        const STEP_PRIORITY: Record<string, number> = {
          "personal_info_typing": 1,
          "personal_info": 2,
          "address_completed": 3,
          "payment_started": 4,
          "purchase_completed": 5
        };
        const newStepPriority = STEP_PRIORITY[step] || 0;
        const existingStepPriority = STEP_PRIORITY[existingLead.step] || 0;
        const shouldUpdateStep = newStepPriority >= existingStepPriority;

        // Status non-regression protection
        const STATUS_PRIORITY: Record<string, number> = {
          "checkout_started": 1,
          "paid": 2
        };
        const newStatusPriority = STATUS_PRIORITY[status] || 0;
        const existingStatusPriority = STATUS_PRIORITY[existingLead.status] || 0;
        const shouldUpdateStatus = newStatusPriority >= existingStatusPriority;

        // Track changed fields
        const changedFields: string[] = [];
        if (shouldUpdateName) changedFields.push("name");
        if (email !== undefined && email !== null && email !== "" && email !== existingLead.email) changedFields.push("email");
        if (phone !== undefined && phone !== null && phone !== "" && phone !== existingLead.phone) changedFields.push("phone");
        if (cpf !== undefined && cpf !== null && cpf !== "" && cpf !== existingLead.cpf) changedFields.push("cpf");
        if (planId !== undefined && planId !== null && planId !== existingLead.planId) changedFields.push("planId");
        if (shouldUpdateStep && step !== existingLead.step) changedFields.push("step");
        if (shouldUpdateStatus && status !== existingLead.status) changedFields.push("status");
        if (zipCode !== undefined && zipCode !== null && zipCode !== "" && zipCode !== existingLead.zipCode) changedFields.push("zipCode");
        if (address !== undefined && address !== null && address !== "" && address !== existingLead.address) changedFields.push("address");
        if (addressNumber !== undefined && addressNumber !== null && addressNumber !== "" && addressNumber !== existingLead.addressNumber) changedFields.push("addressNumber");
        if (complement !== undefined && complement !== null && complement !== "" && complement !== existingLead.complement) changedFields.push("complement");
        if (province !== undefined && province !== null && province !== "" && province !== existingLead.province) changedFields.push("province");
        if (cityState !== undefined && cityState !== null && cityState !== "" && cityState !== existingLead.cityState) changedFields.push("cityState");
        if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== "" && paymentMethod !== existingLead.paymentMethod) changedFields.push("paymentMethod");
        if (paymentId !== undefined && paymentId !== null && paymentId !== "" && paymentId !== existingLead.paymentId) changedFields.push("paymentId");

        // Resolve LP fields update and fill legacy ones if present
        let updatedLpId = existingLead.lpId;
        let updatedLpVersion = existingLead.lpVersion;

        if (hasLpId) {
          updatedLpId = incomingLpId;
          updatedLpVersion = incomingLpVersion;
          if (updatedLpId !== existingLead.lpId) changedFields.push("lpId");
        } else {
          // If incoming LP is not valid/unknown, preserve existing. If existing lead only has lp_version, fill from it.
          const resolvedExistingLpId = normalizeLpVersion(existingLead.lpId || existingLead.lp_version);
          if (resolvedExistingLpId !== "unknown" && resolvedExistingLpId !== "") {
            if (!updatedLpId) {
              updatedLpId = resolvedExistingLpId;
              changedFields.push("lpId");
            }
            if (!updatedLpVersion) {
              if (resolvedExistingLpId === "original") updatedLpVersion = "LP Original";
              else if (resolvedExistingLpId === "v2") updatedLpVersion = "LP V2";
              else if (resolvedExistingLpId === "v3") updatedLpVersion = "LP V3";
              changedFields.push("lpVersion");
            }
          }
        }

        const updatedLead = {
          ...existingLead,
          origin: existingLead.origin || "checkout_site",
          source: existingLead.source || "site",
          name: existingLead.name,
          email: email !== undefined && email !== null && email !== "" ? email : existingLead.email,
          phone: phone !== undefined && phone !== null && phone !== "" ? phone : existingLead.phone,
          cpf: cpf !== undefined && cpf !== null && cpf !== "" ? cpf : existingLead.cpf,
          planId: planId !== undefined && planId !== null ? planId : existingLead.planId,
          quantity: quantity !== undefined && quantity !== null ? Number(quantity) : (existingLead.quantity || 1),
          couponCode: couponCode !== undefined && couponCode !== null ? couponCode : existingLead.couponCode,
          step: shouldUpdateStep ? step : existingLead.step,
          status: shouldUpdateStatus ? status : existingLead.status,
          zipCode: zipCode !== undefined && zipCode !== null && zipCode !== "" ? zipCode : existingLead.zipCode,
          address: address !== undefined && address !== null && address !== "" ? address : existingLead.address,
          addressNumber: addressNumber !== undefined && addressNumber !== null && addressNumber !== "" ? addressNumber : existingLead.addressNumber,
          complement: complement !== undefined && complement !== null && complement !== "" ? complement : existingLead.complement,
          province: province !== undefined && province !== null && province !== "" ? province : existingLead.province,
          cityState: cityState !== undefined && cityState !== null && cityState !== "" ? cityState : existingLead.cityState,
          paymentMethod: paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== "" ? paymentMethod : existingLead.paymentMethod,
          paymentId: paymentId !== undefined && paymentId !== null && paymentId !== "" ? paymentId : existingLead.paymentId,
          codigoIbge: codigoIbge !== undefined && codigoIbge !== null && codigoIbge !== "" ? codigoIbge : existingLead.codigoIbge,
          lpId: updatedLpId || null,
          lpVersion: updatedLpVersion || null,
          updatedAt: now,
          // Reset archive status
          archived: false,
          archivedAt: null,
          archivedBy: null,
        };

        // Remove from current position and move to index 0 (top of the panel)
        leads.splice(leadIndex, 1);
        leads.unshift(updatedLead);
        saveLeads(leads);

        if (process.env.NODE_ENV === "development") {
          const logMsg = `[LEAD] updated by ${matchedBy}`;
          console.log(logMsg);
          console.log(`[LEAD] updated fields: ${changedFields.join(",")}`);
          logLead(`${logMsg}. Fields changed: ${changedFields.join(",")}`);
        } else {
          logLead(`[DEDUPLICAÇÃO] Lead atualizado - ID: ${updatedLead.id}
Etapa: ${updatedLead.step}
Status: ${updatedLead.status}
Origem: ${updatedLead.origin}
Motivo da Deduplicação: Correspondência encontrada no índice ${leadIndex} (${cleanPhone ? 'telefone' : 'email'})`);
        }

        // Futura integração com CRM / WhatsApp
        triggerLeadIntegrations(updatedLead, "update");

        res.json({ success: true, action: "updated", lead: updatedLead });
      } else {
        // Create new lead
        const incomingName = typeof name === "string" ? name.trim() : "";
        const finalName = isValidLeadName(incomingName) ? incomingName.trim() : "";


        const newLead = {
          id: `lead_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          name: finalName,
          email: email || null,
          phone: phone || null,
          cpf: cpf || null,
          planId: planId || null,
          quantity: quantity ? Number(quantity) : 1,
          couponCode: couponCode || null,
          step: step || "personal_info",
          status: status || "checkout_started",
          zipCode: zipCode || null,
          address: address || null,
          addressNumber: addressNumber || null,
          complement: complement || null,
          province: province || null,
          cityState: cityState || null,
          paymentMethod: paymentMethod || null,
          paymentId: paymentId || null,
          codigoIbge: codigoIbge || null,
          lpId: hasLpId ? incomingLpId : null,
          lpVersion: hasLpId ? incomingLpVersion : null,
          origin: "checkout_site",
          source: "site",
          createdAt: now,
          updatedAt: now,
          archived: false,
        };

        leads.unshift(newLead); // Insert at index 0 (top of the panel)
        saveLeads(leads);

        if (process.env.NODE_ENV === "development") {
          console.log("[LEAD] created");
          logLead("[LEAD] created");
        } else {
          logLead(`[NOVO LEAD] Lead criado - ID: ${newLead.id}
Etapa: ${newLead.step}
Status: ${newLead.status}
Origem: ${newLead.origin}`);
        }

        // Futura integração com CRM / WhatsApp
        triggerLeadIntegrations(newLead, "create");

        res.json({ success: true, action: "created", lead: newLead });
      }
    } catch (error: any) {
      logError("Erro ao capturar lead", error, req);
      res.status(500).json({ error: "Erro interno ao capturar lead.", details: error.message });
    }
  });

  const asaasPaymentsStore = new Map<string, string>();

  // Create customer endpoint
  app.post("/api/create-customer", async (req, res) => {
    try {
      const {
        name,
        email,
        cpf,
        phone,
        zipCode,
        address,
        addressNumber,
        complement,
        province,
        city,
        state
      } = req.body;
      const asaas = getAsaasClient();
      const customerResponse = await asaas.post("/customers", {
        name,
        email,
        cpfCnpj: cpf,
        phone,
        mobilePhone: phone,
        postalCode: zipCode,
        address,
        addressNumber,
        complement,
        province,
      });
      res.json({ customerId: customerResponse.data.id });
    } catch (error: any) {
      logError("Erro ao criar cliente no Asaas", error, req);
      res.status(500).json({ error: "Failed to create customer", details: error.response?.data || error.message });
    }
  });

  // POST /api/analytics/track
  app.post("/api/analytics/track", (req, res) => {
    try {
      const bodyStr = JSON.stringify(req.body);
      if (bodyStr.length > 5120) {
        logAnalyticsError("Payload size limit exceeded (> 5KB)");
        return res.status(400).json({ error: "Payload too large" });
      }

      const { event, visitorId, sessionId, checkoutSessionId, lpId, lpVersion, path: eventPath, plan, quantity, origin, value, device } = req.body;

      if (!event || !visitorId || !sessionId) {
        return res.status(400).json({ error: "Missing required tracking parameters" });
      }

      const VALID_EVENTS = new Set([
        "page_view",
        "view_content",
        "select_kit",
        "add_to_cart",
        "initiate_checkout",
        "add_payment_info",
        "purchase",
        "exit_popup_shown",
        "exit_popup_choose_kit",
        "exit_popup_whatsapp",
        "exit_popup_dismissed",
        "checkout_recovery_shown",
        "checkout_recovery_continue",
        "checkout_recovery_whatsapp",
        "checkout_recovery_dismissed",
        "checkout_recovery_recovered"
      ]);

      if (!VALID_EVENTS.has(event)) {
        return res.status(400).json({ error: "Invalid event type" });
      }

      // Check Rate Limit
      if (!checkRateLimit(sessionId) || !checkRateLimit(visitorId)) {
        logAnalyticsError(`Rate limit hit for session/visitor: ${sessionId} / ${visitorId}`);
        return res.status(429).json({ error: "Too many requests" });
      }

      // Normalization
      const normalizedLpId = normalizeLpVersion(lpId || lpVersion);

      // Construct clean event (stripping personal data)
      const cleanEvent = {
        id: `evt_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
        event,
        visitorId,
        sessionId,
        checkoutSessionId: checkoutSessionId || null,
        lpId: normalizedLpId,
        lpVersion: lpVersion || "original",
        path: eventPath || "/",
        plan: plan ? Number(plan) : null,
        quantity: quantity ? Number(quantity) : null,
        origin: origin || null,
        value: value ? Number(value) : null,
        currency: "BRL",
        orderId: req.body.orderId || null,
        paymentId: req.body.paymentId || null,
        device: device || "desktop",
        utm_source: req.body.utm_source || null,
        utm_medium: req.body.utm_medium || null,
        utm_campaign: req.body.utm_campaign || null,
        utm_content: req.body.utm_content || null,
        utm_term: req.body.utm_term || null,
        kitQuantity: req.body.kitQuantity ? Number(req.body.kitQuantity) : null,
        kitName: req.body.kitName || null,
        checkoutStep: req.body.checkoutStep || null,
        paymentMethod: req.body.paymentMethod || null,
        popupOrigin: req.body.popupOrigin || null,
        popupVariant: req.body.popupVariant || null,
        recoveryAction: req.body.recoveryAction || null,
        recoveryStage: req.body.recoveryStage || null,
        createdAt: new Date().toISOString()
      };

      // Server-side Deduplication check
      const hash = getEventDedupHash(cleanEvent);
      if (hash && dedupCache.has(hash)) {
        return res.status(200).json({ status: "ignored_duplicate" });
      }
      if (hash) {
        dedupCache.add(hash);
      }

      analyticsBuffer.push(cleanEvent);

      if (analyticsBuffer.length >= 50) {
        flushAnalyticsBuffer();
      }

      return res.status(200).json({ status: "queued" });
    } catch (err: any) {
      logAnalyticsError(`Error in track route: ${err.message}`);
      return res.status(500).json({ error: "Internal tracking failure" });
    }
  });

  // GET /api/admin/analytics/funnel
  app.get("/api/admin/analytics/funnel", requireAdminAuth, (req, res) => {
    try {
      const { dateFrom, dateTo, plan } = req.query as {
        dateFrom?: string;
        dateTo?: string;
        plan?: string;
      };

      const todayStr = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      const fromStr = dateFrom || thirtyDaysAgoStr;
      const toStr = dateTo || todayStr;

      const files = getDailyAnalyticsFiles(fromStr, toStr);
      const events: any[] = [];

      files.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            events.push(...data);
          }
        } catch (e: any) {
          logAnalyticsError(`Failed to parse daily file ${filePath}: ${e.message}`);
        }
      });

      // Filter and aggregate
      const lpVersionsList = ["original", "v2", "v3", "unknown"];
      const groupedStats: Record<string, any> = {};
      const overallStats: any = {
        page_view: { visitors: new Set(), sessions: new Set(), total: 0 },
        view_content: { visitors: new Set(), sessions: new Set(), total: 0 },
        select_kit: { visitors: new Set(), sessions: new Set(), total: 0 },
        add_to_cart: { visitors: new Set(), sessions: new Set(), total: 0 },
        initiate_checkout: { visitors: new Set(), sessions: new Set(), total: 0 },
        add_payment_info: { visitors: new Set(), sessions: new Set(), total: 0 },
        payment_created: { visitors: new Set(), sessions: new Set(), total: 0 },
        payment_confirmed: { visitors: new Set(), sessions: new Set(), total: 0 },
        revenue: 0
      };

      lpVersionsList.forEach((version) => {
        groupedStats[version] = {
          page_view: { visitors: new Set(), sessions: new Set(), total: 0 },
          view_content: { visitors: new Set(), sessions: new Set(), total: 0 },
          select_kit: { visitors: new Set(), sessions: new Set(), total: 0 },
          add_to_cart: { visitors: new Set(), sessions: new Set(), total: 0 },
          initiate_checkout: { visitors: new Set(), sessions: new Set(), total: 0 },
          add_payment_info: { visitors: new Set(), sessions: new Set(), total: 0 },
          payment_created: { visitors: new Set(), sessions: new Set(), total: 0 },
          payment_confirmed: { visitors: new Set(), sessions: new Set(), total: 0 },
          revenue: 0
        };
      });

      events.forEach((evt) => {
        if (plan) {
          if (evt.plan !== Number(plan)) return;
        }

        const ev = evt.event;
        const v = evt.lpId || "unknown";
        
        // Grouped
        if (groupedStats[v] && groupedStats[v][ev]) {
          if (evt.visitorId) groupedStats[v][ev].visitors.add(evt.visitorId);
          if (evt.sessionId) groupedStats[v][ev].sessions.add(evt.sessionId);
          groupedStats[v][ev].total += 1;
          if (ev === "payment_confirmed" && evt.value) {
            groupedStats[v].revenue += Number(evt.value);
          }
        }

        // Overall
        if (overallStats[ev]) {
          if (evt.visitorId) overallStats[ev].visitors.add(evt.visitorId);
          if (evt.sessionId) overallStats[ev].sessions.add(evt.sessionId);
          overallStats[ev].total += 1;
          if (ev === "payment_confirmed" && evt.value) {
            overallStats.revenue += Number(evt.value);
          }
        }
      });

      const formatStats = (statsObj: any) => {
        const pageViewSessions = statsObj.page_view.sessions.size;
        const pageViewVisitors = statsObj.page_view.visitors.size;
        const paymentConfirmedSessions = statsObj.payment_confirmed.sessions.size;
        const paymentConfirmedVisitors = statsObj.payment_confirmed.visitors.size;

        return {
          page_view: {
            uniqueVisitors: pageViewVisitors,
            uniqueSessions: pageViewSessions,
            totalEvents: statsObj.page_view.total
          },
          view_content: {
            uniqueVisitors: statsObj.view_content.visitors.size,
            uniqueSessions: statsObj.view_content.sessions.size,
            totalEvents: statsObj.view_content.total
          },
          select_kit: {
            uniqueVisitors: statsObj.select_kit.visitors.size,
            uniqueSessions: statsObj.select_kit.sessions.size,
            totalEvents: statsObj.select_kit.total
          },
          add_to_cart: {
            uniqueVisitors: statsObj.add_to_cart.visitors.size,
            uniqueSessions: statsObj.add_to_cart.sessions.size,
            totalEvents: statsObj.add_to_cart.total
          },
          initiate_checkout: {
            uniqueVisitors: statsObj.initiate_checkout.visitors.size,
            uniqueSessions: statsObj.initiate_checkout.sessions.size,
            totalEvents: statsObj.initiate_checkout.total
          },
          add_payment_info: {
            uniqueVisitors: statsObj.add_payment_info.visitors.size,
            uniqueSessions: statsObj.add_payment_info.sessions.size,
            totalEvents: statsObj.add_payment_info.total
          },
          payment_created: {
            uniqueVisitors: statsObj.payment_created.visitors.size,
            uniqueSessions: statsObj.payment_created.sessions.size,
            totalEvents: statsObj.payment_created.total
          },
          payment_confirmed: {
            uniqueVisitors: paymentConfirmedVisitors,
            uniqueSessions: paymentConfirmedSessions,
            totalEvents: statsObj.payment_confirmed.total
          },
          revenue: statsObj.revenue,
          conversionRates: {
            visitorToViewContent: pageViewSessions > 0 ? (statsObj.view_content.sessions.size / pageViewSessions) * 100 : 0,
            viewContentToSelectKit: statsObj.view_content.sessions.size > 0 ? (statsObj.select_kit.sessions.size / statsObj.view_content.sessions.size) * 100 : 0,
            selectKitToAddToCart: statsObj.select_kit.sessions.size > 0 ? (statsObj.add_to_cart.sessions.size / statsObj.select_kit.sessions.size) * 100 : 0,
            addToCartToInitiateCheckout: statsObj.add_to_cart.sessions.size > 0 ? (statsObj.initiate_checkout.sessions.size / statsObj.add_to_cart.sessions.size) * 100 : 0,
            initiateCheckoutToAddPaymentInfo: statsObj.initiate_checkout.sessions.size > 0 ? (statsObj.add_payment_info.sessions.size / statsObj.initiate_checkout.sessions.size) * 100 : 0,
            addPaymentInfoToPurchase: statsObj.add_payment_info.sessions.size > 0 ? (paymentConfirmedSessions / statsObj.add_payment_info.sessions.size) * 100 : 0,
            
            sessionToConfirmedPayment: pageViewSessions > 0 ? (paymentConfirmedSessions / pageViewSessions) * 100 : 0,
            visitorToConfirmedPayment: pageViewVisitors > 0 ? (paymentConfirmedVisitors / pageViewVisitors) * 100 : 0,
          }
        };
      };

      const resultGrouped: Record<string, any> = {};
      Object.keys(groupedStats).forEach((version) => {
        resultGrouped[version] = formatStats(groupedStats[version]);
      });

      const dailyPurchases: Record<string, Record<string, number>> = {};
      try {
        let cur = new Date(fromStr + "T00:00:00");
        const endD = new Date(toStr + "T23:59:59");
        while (cur <= endD) {
          const dStr = cur.toISOString().split("T")[0];
          dailyPurchases[dStr] = {};
          lpVersionsList.forEach((version) => {
            dailyPurchases[dStr][version] = 0;
          });
          cur.setDate(cur.getDate() + 1);
        }

        events.forEach((evt) => {
          if (evt.event === "payment_confirmed") {
            const date = evt.createdAt.split("T")[0];
            const v = evt.lpId || "unknown";
            if (dailyPurchases[date]) {
              dailyPurchases[date][v] = (dailyPurchases[date][v] || 0) + 1;
            }
          }
        });
      } catch (err: any) {
        logAnalyticsError(`Failed to build daily purchases in funnel endpoint: ${err.message}`);
      }

      return res.json({
        grouped: resultGrouped,
        overall: formatStats(overallStats),
        dailyPurchases
      });
    } catch (error: any) {
      logAnalyticsError(`Failed to aggregate admin funnel metrics: ${error.message}`);
      return res.status(500).json({ error: "Failed to load funnel metrics" });
    }
  });

  function getPlanPrice(planMonths: number): number {
    if (planMonths === 1) return 109.9;
    if (planMonths === 3) return 229.7;
    if (planMonths === 5) return 349.7;
    return 109.9;
  }

  // Create payment endpoint
  app.post("/api/create-payment", async (req, res) => {
    try {
      const { paymentMethod, customerId, customerData, orderValue, creditCardData, couponCode, planMonths, shippingCost, lp_version, analytics } = req.body;
      const quantity = Math.max(1, Math.min(50, Number(req.body.quantity || analytics?.quantity || 1)));
      const asaas = getAsaasClient();

      // Recalculate baseline values
      const basePlanPrice = getPlanPrice(planMonths);
      const planPrice = planMonths === 1 ? Math.round(basePlanPrice * quantity * 100) / 100 : basePlanPrice;
      const cleanCep = String(customerData?.zipCode || "").replace(/\D/g, "");
      const totalBoxes = planMonths === 1 ? quantity : planMonths;
      const shippingOptions = calculateShipping(cleanCep, totalBoxes);
      const calculatedShippingCost = shippingOptions && shippingOptions.length > 0 ? shippingOptions[0].price : 0;
      const originalPrice = Math.round((planPrice + calculatedShippingCost) * 100) / 100;

      // Audit log if frontend values differ from recalculated backend values
      const clientShippingCost = Number(shippingCost) || 0;
      const clientOrderValue = Number(orderValue) || 0;

      if (Math.abs(clientShippingCost - calculatedShippingCost) > 0.01) {
        logCheckout(`[AUDIT] Divergência de frete detectada para o CEP ${cleanCep}: Frontend enviou R$ ${clientShippingCost.toFixed(2)}, Backend recalculou R$ ${calculatedShippingCost.toFixed(2)}. Usando valor do Backend.`);
      }
      if (Math.abs(clientOrderValue - originalPrice) > 0.01) {
        logCheckout(`[AUDIT] Divergência de valor total original detectada para o CEP ${cleanCep}: Frontend enviou R$ ${clientOrderValue.toFixed(2)}, Backend recalculou R$ ${originalPrice.toFixed(2)}. Usando valor do Backend.`);
      }

      // Recalculate discount
      let discountApplied = 0;
      let usedCoupon = null;

      if (couponCode) {
        const coupons = getCoupons();
        usedCoupon = coupons.find((c: any) => c.code === couponCode.toUpperCase());
        const validation = validateCouponLogic(usedCoupon, originalPrice, planMonths);

        if (validation.valid) {
          discountApplied = calculateDiscount(originalPrice, usedCoupon, calculatedShippingCost);
        } else {
          logCheckout(`Cupom rejeitado no backend: ${couponCode} - Motivo: ${validation.message}`);
          usedCoupon = null;
        }
      }

      // baseValue = planPrice + frete - discount
      const baseValue = Math.round((planPrice + calculatedShippingCost - discountApplied) * 100) / 100;

      // Enforce installments validations
      let installments = 1;
      if (paymentMethod === 'pix') {
        const reqInst = creditCardData?.installments;
        if (reqInst && Number(reqInst) !== 1) {
          return res.status(400).json({ error: "Opções de parcelamento inválidas para pagamento via PIX." });
        }
        installments = 1;
      } else if (paymentMethod === 'credit') {
        installments = Number(creditCardData?.installments) || 1;
        const maxInstAllowed = totalBoxes >= 5 ? 10 : totalBoxes >= 3 ? 6 : totalBoxes >= 2 ? 6 : (INSTALLMENT_RULES.maxInstallmentsByPlanMonths[planMonths] || 3);
        if (installments < 1 || installments > maxInstAllowed) {
          return res.status(400).json({ error: `Quantidade de parcelas (${installments}) excede o limite máximo permitido (${maxInstAllowed}) para este produto.` });
        }
      } else {
        return res.status(400).json({ error: "Método de pagamento inválido." });
      }

      // Calculate interest using Price formula with strict rounding policy
      const calc = calculateInstallmentPrice(baseValue, installments);
      const installmentValue = calc.installmentValue;
      const chargedValue = calc.chargedValue;
      const interestValue = calc.interestValue;

      // Preserve finalValue as commercial value before interest for ERP compatibility
      const finalValue = baseValue;

      // Log checkout start/submission
      logCheckout(`Checkout iniciado (Recalculado) - Cliente ID: ${customerId}, Método: ${paymentMethod}, Valor Original: ${originalPrice}, Frete Calculado: ${calculatedShippingCost}, Plano: ${planMonths} meses, Quantidade: ${quantity} (Total Caixas: ${totalBoxes}), Cupom: ${couponCode || "Nenhum"}, Parcelas: ${installments}, Base: ${baseValue}, Cobrado: ${chargedValue}`);

      let paymentPayload: any = {
        customer: customerId,
        billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
        value: chargedValue, // Value sent to Asaas matches chargedValue exactly!
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Pedido Mix10 Pro - ${totalBoxes} ${totalBoxes === 1 ? 'caixa' : 'caixas'}`,
      };

      if (paymentMethod === 'credit' && creditCardData) {
        paymentPayload = {
          ...paymentPayload,
          creditCard: {
            holderName: creditCardData.holderName,
            number: creditCardData.number,
            expiryMonth: creditCardData.expiryMonth,
            expiryYear: creditCardData.expiryYear,
            ccv: creditCardData.ccv,
          },
          creditCardHolderInfo: {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpf,
            postalCode: customerData.zipCode,
            addressNumber: customerData.addressNumber,
            addressComplement: customerData.complement,
            province: customerData.province,
            phone: customerData.phone,
          },
          installmentCount: installments,
          installmentValue: installmentValue,
        };
      }

      // Log payment request to Asaas (redacting credit card sensitive details)
      const redactedPayload = JSON.parse(JSON.stringify(paymentPayload));
      if (redactedPayload.creditCard) {
        redactedPayload.creditCard.number = redactedPayload.creditCard.number ? redactedPayload.creditCard.number.replace(/\d(?=\d{4})/g, "*") : undefined;
        redactedPayload.creditCard.ccv = "***";
      }
      if (redactedPayload.creditCardHolderInfo && redactedPayload.creditCardHolderInfo.cpfCnpj) {
        redactedPayload.creditCardHolderInfo.cpfCnpj = maskCpf(redactedPayload.creditCardHolderInfo.cpfCnpj);
      }
      logPayment(`Enviando pedido de criação de pagamento ao Asaas. Payload: ${JSON.stringify(redactedPayload)}`);

      const paymentResponse = await asaas.post("/payments", paymentPayload);
      const paymentId = paymentResponse.data.id;

      asaasPaymentsStore.set(paymentId, paymentResponse.data.status || "PENDING");
      const asaasStatus = String(paymentResponse.data.status || "PENDING").toUpperCase();
      const initialOrderStatus = (paymentMethod === "credit" && (asaasStatus === "CONFIRMED" || asaasStatus === "RECEIVED"))
        ? "pago"
        : "pendente";

      // Save Order locally
      const orders = getOrders();
      const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Resolve best name
      let leadName = null;
      try {
        const leads = getLeads();
        const cleanEmail = customerData.email ? customerData.email.toLowerCase().trim() : null;
        const cleanPhone = customerData.phone ? customerData.phone.replace(/\D/g, "") : null;
        let matchedLead = null;
        if (cleanPhone) {
          matchedLead = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, "") === cleanPhone);
        }
        if (!matchedLead && cleanEmail) {
          matchedLead = leads.find((l: any) => l.email && l.email.toLowerCase().trim() === cleanEmail);
        }
        if (matchedLead) {
          leadName = matchedLead.name;
        }
      } catch (e) {
        // ignore
      }

      const resolvedName = resolveBestName(customerData.name, leadName);
      const checkoutCustomerName = normalizeDisplayName(customerData.name);

      const isHiperEnabled = process.env.HIPER_ENABLED === "true";
      const isProduction = process.env.NODE_ENV === "production";
      const initialHiperStatus = (!isHiperEnabled && isProduction) ? "disabled" : "pending";

      const isFreeShipping = usedCoupon && usedCoupon.type === "free_shipping";
      const shippingDiscount = isFreeShipping ? calculatedShippingCost : 0;
      const productDiscount = !isFreeShipping ? discountApplied : 0;
      const finalShipping = isFreeShipping ? 0 : calculatedShippingCost;

      const bodyAnalytics = analytics || {};
      const orderAnalytics = {
        visitorId: bodyAnalytics.visitorId || null,
        sessionId: bodyAnalytics.sessionId || null,
        checkoutSessionId: bodyAnalytics.checkoutSessionId || null,
        lpId: bodyAnalytics.lpId || null,
        lpVersion: bodyAnalytics.lpVersion || null,
        device: bodyAnalytics.device || null,
        UTMs: {
          utm_source: bodyAnalytics.utm_source || null,
          utm_medium: bodyAnalytics.utm_medium || null,
          utm_campaign: bodyAnalytics.utm_campaign || null,
          utm_content: bodyAnalytics.utm_content || null,
          utm_term: bodyAnalytics.utm_term || null
        },
        plan: bodyAnalytics.plan || (planMonths === 3 ? 2 : planMonths === 5 ? 3 : 1),
        quantity: quantity,
        origin: bodyAnalytics.origin || null,
        checkoutRecoveryShown: bodyAnalytics.checkoutRecoveryShown || false,
        checkoutRecoveryAction: bodyAnalytics.checkoutRecoveryAction || null
      };

      orders.push({
        id: orderId,
        paymentId,
        customerId,
        status: initialOrderStatus,
        checkoutCustomerName,
        customerName: resolvedName,
        originalValue: originalPrice,
        discount: discountApplied,

        // Detailed Financial Fields (Unified Rounding Policy)
        baseValue,
        interestValue,
        chargedValue,
        installments,
        installmentValue,
        interestRate: 0.0299,
        interestMethod: "PRICE",

        // finalValue (commercial value before interest, i.e., baseValue) for ERP compatibility
        finalValue: baseValue,

        couponCode: usedCoupon ? usedCoupon.code : null,
        couponType: usedCoupon ? usedCoupon.type : null,
        couponDiscountValue: discountApplied,
        shippingDiscountValue: shippingDiscount,
        productDiscountValue: productDiscount,
        originalShippingValue: calculatedShippingCost,
        finalShippingValue: finalShipping,
        planMonths,
        quantity,
        origin: "checkout_site",
        source: "site",
        closingChannel: "checkout",
        createdAt: new Date().toISOString(),
        hiperStatus: initialHiperStatus,
        hiperOrderId: null,
        hiperSentAt: null,
        hiperError: null,
        lp_version: lp_version || null,
        // Detailed customer and address info for Hiper ERP integration
        customer: {
          name: resolvedName,
          cpf: customerData.cpf || "",
          email: customerData.email || "",
          phone: customerData.phone || ""
        },
        address: {
          cep: customerData.zipCode || "",
          logradouro: customerData.address || "",
          numero: customerData.addressNumber || "",
          complemento: customerData.complement || "",
          bairro: customerData.province || "",
          cidade: customerData.city || "",
          estado: customerData.state || "",
          codigoIbge: customerData.codigoIbge !== undefined ? (parseInt(String(customerData.codigoIbge), 10) || 0) : 0
        },
        paymentMethod: paymentMethod || "",
        analytics: orderAnalytics
      });
      saveOrders(orders);

      // Emit backend payment_created event
      try {
        const paymentCreatedEvent = {
          id: `evt_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
          event: "payment_created",
          visitorId: orderAnalytics.visitorId || "unknown",
          sessionId: orderAnalytics.sessionId || "unknown",
          checkoutSessionId: orderAnalytics.checkoutSessionId || null,
          lpId: orderAnalytics.lpId || "original",
          lpVersion: orderAnalytics.lpVersion || "original",
          path: "/checkout",
          plan: orderAnalytics.plan,
          quantity: orderAnalytics.quantity,
          value: finalValue,
          currency: "BRL",
          orderId: orderId,
          paymentId: paymentId,
          device: orderAnalytics.device || "desktop",
          createdAt: new Date().toISOString(),
          ...orderAnalytics.UTMs
        };

        const hash = getEventDedupHash(paymentCreatedEvent);
        if (!hash || !dedupCache.has(hash)) {
          if (hash) dedupCache.add(hash);
          analyticsBuffer.push(paymentCreatedEvent);
        }

        // If recovery was shown/acted upon in this session, record recovered status
        if (orderAnalytics.checkoutRecoveryShown) {
          const recoveryEvent = {
            id: `evt_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
            event: "checkout_recovery_recovered",
            visitorId: orderAnalytics.visitorId || "unknown",
            sessionId: orderAnalytics.sessionId || "unknown",
            checkoutSessionId: orderAnalytics.checkoutSessionId || null,
            lpId: orderAnalytics.lpId || "original",
            lpVersion: orderAnalytics.lpVersion || "original",
            path: "/checkout",
            plan: orderAnalytics.plan,
            quantity: orderAnalytics.quantity,
            value: finalValue,
            currency: "BRL",
            orderId: orderId,
            paymentId: paymentId,
            device: orderAnalytics.device || "desktop",
            createdAt: new Date().toISOString(),
            recoveryStage: "order_created",
            recoveryAction: orderAnalytics.checkoutRecoveryAction || "continue",
            ...orderAnalytics.UTMs
          };
          const rHash = getEventDedupHash(recoveryEvent);
          if (!rHash || !dedupCache.has(rHash)) {
            if (rHash) dedupCache.add(rHash);
            analyticsBuffer.push(recoveryEvent);
            logCheckout(`[RECUPERADO - PEDIDO CRIADO] Evento registrado para o checkoutSessionId: ${orderAnalytics.checkoutSessionId}`);
          }
        }
      } catch (e: any) {
        logAnalyticsError(`Failed to emit payment_created event: ${e.message}`);
      }

      // Associate lead with paymentId
      try {
        const leads = getLeads();
        const cleanEmail = customerData.email ? customerData.email.toLowerCase().trim() : null;
        const cleanPhone = customerData.phone ? customerData.phone.replace(/\D/g, "") : null;

        let leadIndex = -1;
        if (cleanEmail && cleanPhone) {
          leadIndex = leads.findIndex((l: any) =>
            (l.email && l.email.toLowerCase().trim() === cleanEmail) ||
            (l.phone && l.phone.replace(/\D/g, "") === cleanPhone)
          );
        } else if (cleanEmail) {
          leadIndex = leads.findIndex((l: any) => l.email && l.email.toLowerCase().trim() === cleanEmail);
        } else if (cleanPhone) {
          leadIndex = leads.findIndex((l: any) => l.phone && l.phone.replace(/\D/g, "") === cleanPhone);
        }

        const now = new Date().toISOString();
        if (leadIndex > -1) {
          leads[leadIndex] = {
            ...leads[leadIndex],
            paymentId,
            paymentMethod,
            planId: planMonths === 1 ? 1 : planMonths === 3 ? 2 : planMonths === 5 ? 3 : 1,
            quantity: quantity,
            couponCode: usedCoupon ? usedCoupon.code : leads[leadIndex].couponCode,
            step: "payment_started",
            status: initialOrderStatus === "pago" ? "paid" : "checkout_started",
            origin: leads[leadIndex].origin || "checkout_site",
            source: leads[leadIndex].source || "site",
            lp_version: lp_version || leads[leadIndex].lp_version || null,
            updatedAt: now
          };
          saveLeads(leads);
          logLead(`Associated paymentId ${paymentId} with lead ${leads[leadIndex].id} (status: ${leads[leadIndex].status})`);
          triggerLeadIntegrations(leads[leadIndex], "update");
        }
      } catch (assocErr) {
        logError("Error associating paymentId with lead", assocErr, req);
      }

      if (paymentMethod === 'pix') {
        const pixResponse = await asaas.get(`/payments/${paymentId}/pixQrCode`);
        logPayment(`Pagamento PIX criado no Asaas com sucesso. ID: ${paymentId}, Vencimento: ${pixResponse.data.expirationDate}`);
        res.json({
          status: 'pending_pix',
          paymentId,
          pix: {
            encodedImage: pixResponse.data.encodedImage,
            payload: pixResponse.data.payload,
            expirationDate: pixResponse.data.expirationDate
          }
        });
      } else {
        const status = paymentResponse.data.status;
        logPayment(`Pagamento Cartão de Crédito criado no Asaas com sucesso. ID: ${paymentId}, Status: ${status}`);
        if (status === "CONFIRMED" || status === "RECEIVED" || status === "PAYMENT_RECEIVED") {
          registerPurchaseSuccess(paymentId, finalValue, customerData.email, customerData.phone, customerData.name);
        }

        res.json({
          status: paymentResponse.data.status,
          paymentId
        });
      }

    } catch (error: any) {
      logError("Erro ao criar pagamento Asaas", error, req);
      res.status(500).json({ error: "Failed to create payment", details: error.response?.data || error.message });
    }
  });

  // Polling Endpoint
  app.get("/api/payment-status/:id", async (req, res) => {
    try {
      const asaas = getAsaasClient();
      const response = await asaas.get(`/payments/${req.params.id}`);
      // Asaas status can be CONFIRMED, RECEIVED, PENDING, etc.
      res.json({ status: response.data.status });
    } catch (error: any) {
      logError("Error fetching payment status from Asaas API", error, req);
      // Fallback to memory store or PENDING if API call fails
      const fallbackStatus = asaasPaymentsStore.get(req.params.id) || "PENDING";
      res.json({ status: fallbackStatus });
    }
  });

  // --- RECOMPRA COUPON ENDPOINTS ---
  app.post("/api/recompra/generate-coupon", (req, res) => {
    try {
      const coupons = getCoupons();
      let code = "";
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 100) {
        code = generateRandomCode();
        if (!coupons.find((c: any) => c.code === code)) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: "Não foi possível gerar um cupom único." });
      }

      const newCoupon = {
        code,
        type: "percentage",
        value: 10,
        active: true,
        maxUses: 1,
        usedCount: 0,
        status: "generated",
        source: "qr_card_recompra",
        createdAt: new Date().toISOString(),
        usedAt: null,
        paymentId: null,
        orderId: null
      };

      coupons.push(newCoupon);
      saveCoupons(coupons);
      res.json(newCoupon);
    } catch (error) {
      console.error("Error generating recompra coupon:", error);
      res.status(500).json({ error: "Erro ao gerar cupom de recompra." });
    }
  });

  app.get("/api/recompra/coupon/:code", (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const coupons = getCoupons();
      const coupon = coupons.find((c: any) => c.code === code);

      if (!coupon) {
        return res.status(404).json({ error: "Cupom não encontrado." });
      }
      if (!coupon.active) {
        return res.status(400).json({ error: "Cupom inativo." });
      }
      if (coupon.usedCount >= coupon.maxUses || coupon.status === "used") {
        return res.status(400).json({ error: "Cupom já foi utilizado." });
      }

      res.json(coupon);
    } catch (error) {
      console.error("Error fetching recompra coupon:", error);
      res.status(500).json({ error: "Erro ao buscar cupom." });
    }
  });

  // --- COUPON ENDPOINTS ---
  app.post("/api/validate-coupon", (req, res) => {
    const { code, orderValue, planMonths, shippingCost } = req.body;
    if (!code) {
      logCheckout("Erro de validação de cupom: Código não informado.");
      return res.status(400).json({ error: "Código do cupom não informado." });
    }

    const coupons = getCoupons();
    const coupon = coupons.find((c: any) => c.code === code.toUpperCase());

    const validation = validateCouponLogic(coupon, orderValue, planMonths);
    if (!validation.valid) {
      logCheckout(`Cupom rejeitado na validação: ${code.toUpperCase()} - Motivo: ${validation.message} (Valor pedido: ${orderValue})`);
      return res.status(400).json({ error: validation.message });
    }

    const parsedShippingCost = Number(shippingCost) || 0;
    const discountValue = calculateDiscount(orderValue, coupon, parsedShippingCost);

    logCheckout(`Cupom validado com sucesso: ${coupon.code} - Tipo: ${coupon.type}, Desconto calculado: ${discountValue}, Valor final: ${orderValue - discountValue}`);

    if (coupon.type === "free_shipping") {
      return res.json({
        valid: true,
        code: coupon.code,
        type: "free_shipping",
        value: coupon.value,
        discountAmount: parsedShippingCost,
        discountValue: parsedShippingCost,
        originalValue: orderValue,
        finalValue: orderValue - parsedShippingCost,
        message: "Você ganhou frete grátis neste pedido."
      });
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountValue,
      originalValue: orderValue,
      finalValue: orderValue - discountValue,
      type: coupon.type,
      value: coupon.value
    });
  });

  // --- ADMIN AUTH ENDPOINTS ---

  // POST /api/admin/login
  app.post("/api/admin/login", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Check Rate Limit
    const rateLimitCheck = checkLoginRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: `Muitas tentativas de login. Por favor, aguarde ${rateLimitCheck.waitTimeMinutes} minuto(s) antes de tentar novamente.`,
      });
    }

    const creds = getAdminCredentials();
    if (!creds) {
      recordLoginAttempt(ip, false);
      return res.status(500).json({ error: "O login administrativo está desativado devido a falha de configuração de variáveis no servidor de produção." });
    }

    const { username, password } = req.body;

    if (username === creds.user && password === creds.password) {
      recordLoginAttempt(ip, true);
      const token = generateAdminToken(username);

      // Cookie parameters:
      // httpOnly: true, sameSite: "strict", secure: true in production, 24h expiration
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const isProduction = process.env.NODE_ENV === "production";
      const isSecure = isProduction;

      res.setHeader(
        "Set-Cookie",
        [
          `admin_token=${token}; HttpOnly; Path=/; Max-Age=${maxAge / 1000}; SameSite=Strict${isSecure ? "; Secure" : ""}`,
          `admin_logged_in=true; Path=/; Max-Age=${maxAge / 1000}; SameSite=Strict${isSecure ? "; Secure" : ""}`
        ]
      );

      return res.json({ success: true, message: "Login realizado com sucesso." });
    } else {
      recordLoginAttempt(ip, false);
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }
  });

  // POST /api/admin/logout
  app.post("/api/admin/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const isSecure = isProduction;
    // Clear cookie by setting expiration in the past
    res.setHeader(
      "Set-Cookie",
      [
        `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isSecure ? "; Secure" : ""}`,
        `admin_logged_in=; Path=/; Max-Age=0; SameSite=Strict${isSecure ? "; Secure" : ""}`
      ]
    );
    res.json({ success: true, message: "Logout realizado com sucesso." });
  });

  // GET /api/admin/check-auth
  app.get("/api/admin/check-auth", (req, res) => {
    const authenticated = isAuthenticated(req);
    const isProduction = process.env.NODE_ENV === "production";
    const isDebugMode = process.env.DEBUG_MODE === "true";
    res.json({
      authenticated,
      debugMode: !isProduction || isDebugMode,
      hiperTestMode: process.env.HIPER_TEST_MODE === "true",
      appBuildVersion: "v2-hiper-doc-format-2026-06-22"
    });
  });

  // GET /api/admin/system-info
  app.get("/api/admin/system-info", requireAdminAuth, (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const isDebugMode = process.env.DEBUG_MODE === "true";

    if (isProduction && !isDebugMode) {
      return res.status(403).json({ error: "Acesso negado. O modo de depuração (DEBUG_MODE) está desativado em produção." });
    }

    res.json({
      dataDir: activeDataDir,
      isFallback: isDataDirFallback,
      cwd: process.cwd(),
      writePermission: "Sim (Escrita e leitura OK)",
      nodeEnv: process.env.NODE_ENV || "development",
      debugMode: process.env.DEBUG_MODE || "false",
      home: process.env.HOME || "Não definido"
    });
  });

  // --- PROTECTED ADMIN DATA ENDPOINTS ---

  // GET /api/admin/leads
  app.get("/api/admin/leads", requireAdminAuth, (req, res) => {
    try {
      const leads = getLeads();
      // Mask CPF in each lead for privacy
      const sanitizedLeads = leads.map((lead: any) => ({
        ...lead,
        cpf: lead.cpf ? maskCpf(lead.cpf) : null,
      }));
      res.json(sanitizedLeads);
    } catch (error) {
      console.error("Erro ao buscar leads no painel:", error);
      res.status(500).json({ error: "Erro ao buscar leads." });
    }
  });

  // POST /api/admin/leads/:id/archive
  app.post("/api/admin/leads/:id/archive", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const leads = getLeads();
      const index = leads.findIndex((l: any) => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Lead não encontrado." });
      }
      leads[index].archived = true;
      leads[index].archivedAt = new Date().toISOString();
      leads[index].archivedBy = "admin";
      saveLeads(leads);
      res.json({ success: true, lead: leads[index] });
    } catch (error) {
      console.error("Erro ao arquivar lead:", error);
      res.status(500).json({ error: "Erro ao arquivar lead." });
    }
  });

  // POST /api/admin/leads/:id/restore
  app.post("/api/admin/leads/:id/restore", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const leads = getLeads();
      const index = leads.findIndex((l: any) => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Lead não encontrado." });
      }
      leads[index].archived = false;
      leads[index].restoredAt = new Date().toISOString();
      leads[index].restoredBy = "admin";
      saveLeads(leads);
      res.json({ success: true, lead: leads[index] });
    } catch (error) {
      console.error("Erro ao restaurar lead:", error);
      res.status(500).json({ error: "Erro ao restaurar lead." });
    }
  });

  // GET /api/admin/orders
  app.get("/api/admin/orders", requireAdminAuth, (req, res) => {
    try {
      const orders = getOrders();

      // Enrich orders with payment status
      const ordersWithStatus = orders.map((order: any) => {
        let status = "pendente";
        if (order.status) {
          status = normalizeOrderStatus(order.status);
        } else if (order.origin === "asaas_direct") {
          status = "pendente";
        } else if (order.paymentId && asaasPaymentsStore.get(order.paymentId)) {
          const asaasStatus = String(asaasPaymentsStore.get(order.paymentId)).toUpperCase();
          status = (asaasStatus === "CONFIRMED" || asaasStatus === "RECEIVED") ? "pago" : "pendente";
        } else {
          status = "pendente";
        }
        return {
          ...order,
          status
        };
      });

      res.json(ordersWithStatus);
    } catch (error) {
      console.error("Erro ao buscar pedidos no painel:", error);
      res.status(500).json({ error: "Erro ao buscar pedidos." });
    }
  });

  // POST /api/admin/orders/:id/send-to-hiper
  app.post("/api/admin/orders/:id/send-to-hiper", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const orders = getOrders();
      const orderIndex = orders.findIndex((o: any) => o.id === id);
      if (orderIndex === -1) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      const order = orders[orderIndex];

      if (order.origin === "asaas_direct") {
        return res.status(400).json({ error: "Pedidos com origem externa (Asaas) não podem ser enviados ao Hiper." });
      }

      const leads = getLeads();
      const lead = leads.find((l: any) => l.paymentId === order.paymentId);
      const isPaid = (order.status === "pago" || order.status === "paid") || (lead && (lead.status === "paid" || lead.status === "pago"));
      const isTestMode = process.env.HIPER_TEST_MODE === "true";

      if (!isPaid && !isTestMode) {
        return res.status(400).json({ error: "Apenas pedidos com pagamento confirmado podem ser enviados ao Hiper." });
      }

      logHiper(`[ADMIN] Solicitando envio manual do pedido ${order.id} ao Hiper ERP...`);
      const result = await sendOrderToHiper(order, true);

      // Save return values on the order object
      orders[orderIndex].hiperStatus = result.status;
      orders[orderIndex].hiperOrderId = result.hiperOrderId;
      orders[orderIndex].hiperSentAt = result.sentAt;
      orders[orderIndex].hiperError = result.error;
      orders[orderIndex].hiperLastPayload = result.lastPayload;
      orders[orderIndex].hiperLastResponse = result.lastResponse;
      orders[orderIndex].hiperLastAttemptAt = result.sentAt;

      if (isTestMode && !isPaid) {
        orders[orderIndex].hiperTestMode = true;
        orders[orderIndex].hiperTestSentAt = new Date().toISOString();
        if (!orders[orderIndex].logs) {
          orders[orderIndex].logs = [];
        }
        orders[orderIndex].logs.push({
          date: new Date().toISOString(),
          message: "Pedido enviado ao Hiper em modo de teste"
        });
        orders[orderIndex].hiperLog = "Pedido enviado ao Hiper em modo de teste";
      }

      saveOrders(orders);

      if (result.success) {
        logHiper(`[ADMIN] Pedido ${order.id} enviado manualmente ao Hiper com sucesso. Retornado ID: ${result.hiperOrderId}`);
        return res.json({
          success: true,
          message: "Pedido enviado com sucesso ao Hiper ERP.",
          hiperOrderId: result.hiperOrderId,
          status: result.status
        });
      } else {
        logHiper(`[ADMIN] Falha no envio manual do pedido ${order.id} ao Hiper ERP: ${result.error}`);
        if (result.hiperHttpStatus || result.lastResponse) {
          return res.status(400).json({
            success: false,
            status: result.hiperHttpStatus || 500,
            endpoint: result.endpoint || "https://ms-ecommerce.hiper.com.br/api/v1/pedido-de-venda/",
            hiperResponse: result.lastResponse,
            error: result.error || "Erro desconhecido retornado pelo Hiper ERP."
          });
        }

        return res.status(400).json({
          success: false,
          error: result.error || "Falha ao enviar o pedido ao Hiper ERP.",
          status: result.status
        });
      }
    } catch (error: any) {
      logError("Erro no envio manual ao Hiper", error, req);
      res.status(500).json({ error: "Erro interno ao processar o envio manual ao Hiper ERP." });
    }
  });

  // POST /api/admin/orders/:id/preview-hiper
  app.post("/api/admin/orders/:id/preview-hiper", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const orders = getOrders();
      const order = orders.find((o: any) => o.id === id);
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      // Validação: status pago/paid
      const leads = getLeads();
      const lead = leads.find((l: any) => l.paymentId === order.paymentId);
      const isPaid = (order.status === "pago" || order.status === "paid") || (lead && (lead.status === "paid" || lead.status === "pago"));

      // Validação: origin = "checkout_site"
      const origin = order.origin || "checkout_site";
      if (origin !== "checkout_site") {
        return res.status(400).json({ error: "Apenas pedidos com origem no checkout do site ('checkout_site') possuem payload para o Hiper ERP." });
      }

      // Obter lead de fallback
      const leadFallback = lead || findLeadForOrder(order);

      // Gerar payload
      const payload = mapOrderToHiperPayload(order, leadFallback);

      // Validações dos campos obrigatórios
      const errors: string[] = [];

      // 1. produtoId
      const item = payload.itens?.[0];
      if (!item || !item.produtoId || item.produtoId.trim() === "") {
        errors.push("Variável HIPER_PRODUCT_MIX10 não configurada ou produtoId ausente.");
      }

      // 2. cliente CPF/nome/email
      if (!payload.cliente) {
        errors.push("Dados do cliente ausentes.");
      } else {
        if (!payload.cliente.nomeDoCliente || payload.cliente.nomeDoCliente.trim() === "") {
          errors.push("Nome do cliente ausente.");
        }
        if (!payload.cliente.documento || payload.cliente.documento.trim() === "") {
          errors.push("CPF/Documento do cliente ausente.");
        }
        if (!payload.cliente.email || payload.cliente.email.trim() === "") {
          errors.push("Email do cliente ausente.");
        }
      }

      // 3. endereço mínimo (cep, logradouro, número, bairro, cidade, estado)
      if (!payload.enderecoDeEntrega) {
        errors.push("Endereço de entrega ausente.");
      } else {
        const addr = payload.enderecoDeEntrega;
        if (!addr.cep || addr.cep.trim() === "") {
          errors.push("CEP do endereço de entrega ausente.");
        }
        if (!addr.logradouro || addr.logradouro.trim() === "") {
          errors.push("Logradouro do endereço de entrega ausente.");
        }
        if (!addr.numero || String(addr.numero).trim() === "") {
          errors.push("Número do endereço de entrega ausente.");
        }
        if (!addr.bairro || addr.bairro.trim() === "") {
          errors.push("Bairro do endereço de entrega ausente.");
        }

        let leadCity = "";
        let leadState = "";
        if (leadFallback?.cityState) {
          const parts = leadFallback.cityState.split("/");
          leadCity = parts[0]?.trim() || "";
          leadState = parts[1]?.trim() || "";
        }
        const orderCity = order.address?.cidade || leadCity || "";
        const orderState = order.address?.estado || leadState || "";

        if (!orderCity || orderCity.trim() === "") {
          errors.push("Cidade do endereço de entrega ausente.");
        }
        if (!orderState || orderState.trim() === "") {
          errors.push("Estado (UF) do endereço de entrega ausente.");
        }
      }

      // 4. valor do frete
      if (payload.valorDoFrete === undefined || payload.valorDoFrete === null || isNaN(payload.valorDoFrete)) {
        errors.push("Valor do frete ausente ou inválido.");
      }

      // 5. forma de pagamento
      const pmt = payload.meiosDePagamento?.[0];
      if (!pmt || pmt.idMeioDePagamento === undefined || pmt.idMeioDePagamento === null || isNaN(pmt.idMeioDePagamento)) {
        errors.push("Forma de pagamento ausente ou inválida para o Hiper.");
      }

      // 6. Alertas/warnings de Código IBGE
      const warnings: string[] = [];
      const codeIbge = payload.enderecoDeEntrega?.codigoIbge;
      if (!codeIbge || Number(codeIbge) === 0) {
        warnings.push("Código IBGE não informado.");
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validação do payload falhou. Corrija os dados antes do envio.",
          validationErrors: errors,
          warnings,
          isPaid,
          hiperPayloadVersion: "v2-hiper-doc-format-2026-06-22",
          payload
        });
      }

      res.json({
        success: true,
        orderId: order.id,
        isPaid,
        warnings,
        hiperPayloadVersion: "v2-hiper-doc-format-2026-06-22",
        payload
      });
    } catch (error: any) {
      console.error("Erro ao gerar preview do payload do Hiper:", error);
      res.status(500).json({ error: `Erro interno ao gerar preview: ${error.message}` });
    }
  });

  // POST /api/admin/orders/:id/archive
  app.post("/api/admin/orders/:id/archive", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const orders = getOrders();
      const index = orders.findIndex((o: any) => o.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }
      orders[index].archived = true;
      orders[index].archivedAt = new Date().toISOString();
      orders[index].archivedBy = "admin";
      saveOrders(orders);
      res.json({ success: true, order: orders[index] });
    } catch (error) {
      console.error("Erro ao arquivar pedido:", error);
      res.status(500).json({ error: "Erro ao arquivar pedido." });
    }
  });

  // POST /api/admin/orders/:id/restore
  app.post("/api/admin/orders/:id/restore", requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const orders = getOrders();
      const index = orders.findIndex((o: any) => o.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }
      orders[index].archived = false;
      orders[index].restoredAt = new Date().toISOString();
      orders[index].restoredBy = "admin";
      saveOrders(orders);
      res.json({ success: true, order: orders[index] });
    } catch (error) {
      console.error("Erro ao restaurar pedido:", error);
      res.status(500).json({ error: "Erro ao restaurar pedido." });
    }
  });

  // GET /api/admin/hiper/products
  app.get("/api/admin/hiper/products", requireAdminAuth, async (req, res) => {
    let lastUrl = "";
    let lastErrorDetails: any = null;

    try {
      const securityKey = process.env.HIPER_SECURITY_KEY;
      if (!securityKey || securityKey.trim() === "") {
        return res.status(400).json({ error: "HIPER_SECURITY_KEY não configurada no ambiente." });
      }

      logHiper("[ADMIN] Obtendo token para consulta de produtos no Hiper...");
      const token = await getHiperToken(securityKey);

      const apiUrl = process.env.HIPER_API_URL || "https://ms-ecommerce.hiper.com.br/api/v1";

      let response;
      let rawProducts: any[] = [];
      let success = false;

      // 1. Testar primeiro: GET /api/v1/produtos/listagemDeProdutos?pontoDeSincronizacao=0&pagina=1
      lastUrl = `${apiUrl}/produtos/listagemDeProdutos`;
      logHiper(`[ADMIN] Tentando consultar produtos do Hiper em: ${lastUrl}`);
      try {
        response = await axios.get(lastUrl, {
          params: { pontoDeSincronizacao: 0, pagina: 1 },
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        });
        success = true;
      } catch (firstErr: any) {
        lastErrorDetails = {
          status: firstErr.response?.status || 500,
          data: firstErr.response?.data || firstErr.message || "Erro desconhecido",
          endpoint: lastUrl
        };
        logError(`[ADMIN] Erro ao consultar listagemDeProdutos (status ${lastErrorDetails.status})`, lastErrorDetails.data);
      }

      // 2. Se falhar, testar fallback: GET /api/v1/produtos/pontoDeSincronizacao?pontoDeSincronizacao=0
      if (!success) {
        lastUrl = `${apiUrl}/produtos/pontoDeSincronizacao`;
        logHiper(`[ADMIN] Tentando fallback em: ${lastUrl}`);
        try {
          response = await axios.get(lastUrl, {
            params: { pontoDeSincronizacao: 0 },
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            timeout: 15000
          });
          success = true;
        } catch (fallbackErr: any) {
          lastErrorDetails = {
            status: fallbackErr.response?.status || 500,
            data: fallbackErr.response?.data || fallbackErr.message || "Erro desconhecido",
            endpoint: lastUrl
          };
          logError(`[ADMIN] Erro ao consultar pontoDeSincronizacao (status ${lastErrorDetails.status})`, lastErrorDetails.data);
        }
      }

      if (!success || !response) {
        // Retornar o erro detalhado da API do Hiper
        return res.status(400).json({
          error: "Falha na comunicação com a API do Hiper ERP.",
          details: {
            status: lastErrorDetails?.status || 400,
            responseData: lastErrorDetails?.data || "Nenhuma resposta",
            endpointCalled: lastErrorDetails?.endpoint || lastUrl
          }
        });
      }

      const responseData = response.data;
      if (Array.isArray(responseData)) {
        rawProducts = responseData;
      } else if (responseData && Array.isArray(responseData.produtos)) {
        rawProducts = responseData.produtos;
      } else if (responseData && Array.isArray(responseData.data)) {
        rawProducts = responseData.data;
      } else if (responseData && typeof responseData === "object") {
        // Fallback check if it's nested differently
        const possibleArray = Object.values(responseData).find(val => Array.isArray(val));
        if (possibleArray) {
          rawProducts = possibleArray as any[];
        }
      }

      const simplifiedProducts = rawProducts.map((p: any) => {
        return {
          id: p.id || p.produtoId || "-",
          codigo: p.codigo || p.codigoInterno || p.codigoDeBarras || p.sku || "-",
          nome: p.nome || p.nomeProduto || "-",
          estoque: p.estoque !== undefined ? p.estoque : (p.quantidadeEmEstoque !== undefined ? p.quantidadeEmEstoque : "-")
        };
      });

      res.json(simplifiedProducts);
    } catch (err: any) {
      logError("Erro interno ao buscar produtos do Hiper", err);
      res.status(500).json({
        error: "Erro interno no servidor ao processar a consulta de produtos.",
        details: {
          status: 500,
          responseData: err.message || "Erro desconhecido",
          endpointCalled: lastUrl
        }
      });
    }
  });

  // GET /api/admin/customers
  app.get("/api/admin/customers", requireAdminAuth, (req, res) => {
    try {
      const customers = getCustomers();
      // Mask CPF in each customer
      const sanitizedCustomers = customers.map((customer: any) => ({
        ...customer,
        cpf: customer.cpf ? maskCpf(customer.cpf) : null,
      }));
      res.json(sanitizedCustomers);
    } catch (error) {
      console.error("Erro ao buscar clientes no painel:", error);
      res.status(500).json({ error: "Erro ao buscar clientes." });
    }
  });

  // Admin: Get all coupons (protected)
  app.get("/api/admin/coupons", requireAdminAuth, (req, res) => {
    try {
      const coupons = getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Erro ao buscar cupons no painel:", error);
      res.status(500).json({ error: "Erro ao buscar cupons." });
    }
  });

  // Admin: Create coupon (protected)
  app.post("/api/admin/coupons", requireAdminAuth, (req, res) => {
    try {
      const coupons = getCoupons();
      const newCoupon = { ...req.body, usedCount: 0 };
      newCoupon.code = newCoupon.code.toUpperCase();
      if (coupons.find((c: any) => c.code === newCoupon.code)) {
        return res.status(400).json({ error: "Cupom já existe." });
      }
      coupons.push(newCoupon);
      saveCoupons(coupons);
      res.json(newCoupon);
    } catch (error) {
      console.error("Erro ao criar cupom:", error);
      res.status(500).json({ error: "Erro ao criar cupom." });
    }
  });

  // Admin: Create coupon manually with strict validation (protected)
  app.post("/api/admin/coupons/create", requireAdminAuth, (req, res) => {
    try {
      const {
        code,
        type,
        value,
        maxUses,
        minOrderValue,
        appliesToPlans,
        expiresAt,
        active
      } = req.body;

      // 1. code obrigatório e uppercase
      if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ success: false, error: "O código do cupom é obrigatório." });
      }
      const formattedCode = code.trim().toUpperCase();

      // 2. code único
      const coupons = getCoupons();
      if (coupons.some((c: any) => c.code === formattedCode)) {
        return res.status(400).json({ success: false, error: `O cupom com código '${formattedCode}' já existe.` });
      }

      // 3. type: percentage, fixed ou free_shipping
      if (type !== "percentage" && type !== "fixed" && type !== "free_shipping") {
        return res.status(400).json({ success: false, error: "O tipo do cupom deve ser 'percentage' (porcentagem), 'fixed' (valor fixo) ou 'free_shipping' (frete grátis)." });
      }

      // 4. value > 0
      let parsedValue = Number(value);
      if (type === "free_shipping") {
        parsedValue = 100; // valor simbólico
      } else {
        if (isNaN(parsedValue) || parsedValue <= 0) {
          return res.status(400).json({ success: false, error: "O valor do cupom deve ser maior que 0." });
        }
      }

      // 5. se percentage, value <= 100
      if (type === "percentage" && parsedValue > 100) {
        return res.status(400).json({ success: false, error: "O valor do cupom em porcentagem não pode ser maior que 100." });
      }

      // 6. maxUses > 0
      const parsedMaxUses = Number(maxUses);
      if (isNaN(parsedMaxUses) || parsedMaxUses <= 0 || !Number.isInteger(parsedMaxUses)) {
        return res.status(400).json({ success: false, error: "A quantidade máxima de usos deve ser um número inteiro maior que 0." });
      }

      // 7. minOrderValue >= 0
      const parsedMinOrderValue = Number(minOrderValue);
      if (isNaN(parsedMinOrderValue) || parsedMinOrderValue < 0) {
        return res.status(400).json({ success: false, error: "O valor mínimo do pedido deve ser maior ou igual a 0." });
      }

      // 8. appliesToPlans apenas 1, 3, 5
      if (!Array.isArray(appliesToPlans) || appliesToPlans.length === 0) {
        return res.status(400).json({ success: false, error: "É necessário selecionar pelo menos um plano aplicável." });
      }
      const validPlans = [1, 3, 5];
      const hasInvalidPlan = appliesToPlans.some((plan: any) => !validPlans.includes(Number(plan)));
      if (hasInvalidPlan) {
        return res.status(400).json({ success: false, error: "Os planos aplicáveis só podem ser 1, 3 ou 5." });
      }
      const mappedPlans = appliesToPlans.map((plan: any) => Number(plan));

      // 9. expiresAt default 2050-12-31T23:59:59Z
      let finalExpiresAt = "2050-12-31T23:59:59Z";
      if (expiresAt && typeof expiresAt === "string" && expiresAt.trim() !== "") {
        const parsedDate = new Date(expiresAt);
        if (!isNaN(parsedDate.getTime())) {
          finalExpiresAt = parsedDate.toISOString();
        }
      }

      // Construct new coupon object
      const newCoupon = {
        code: formattedCode,
        type,
        value: parsedValue,
        active: active === undefined ? true : !!active,
        expiresAt: finalExpiresAt,
        maxUses: parsedMaxUses,
        usedCount: 0, // usedCount inicial 0
        minOrderValue: parsedMinOrderValue,
        appliesToPlans: mappedPlans,
        status: "generated", // status "generated"
        source: "manual_admin", // source "manual_admin"
        createdAt: new Date().toISOString(), // createdAt data atual
        usedAt: null, // usedAt null
        paymentId: null, // paymentId null
        orderId: null // orderId null
      };

      coupons.push(newCoupon);
      saveCoupons(coupons);

      res.status(201).json({ success: true, coupon: newCoupon });
    } catch (error) {
      console.error("Erro ao criar cupom manual:", error);
      res.status(500).json({ success: false, error: "Erro interno ao criar cupom." });
    }
  });


  // Admin: Update/Edit coupon (protected)
  app.put("/api/admin/coupons/:code", requireAdminAuth, (req, res) => {
    try {
      const codeParam = req.params.code.toUpperCase();
      const coupons = getCoupons();
      const index = coupons.findIndex((c: any) => c.code === codeParam);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Cupom não encontrado." });
      }

      const existingCoupon = coupons[index];

      const {
        active,
        expiresAt,
        maxUses,
        minOrderValue,
        appliesToPlans,
        type,
        value
      } = req.body;

      // Se usedCount > 0, não permitir alterar type, value ou appliesToPlans
      if (existingCoupon.usedCount > 0) {
        if (type !== undefined && type !== existingCoupon.type) {
          return res.status(400).json({ success: false, error: "Este cupom já foi utilizado. O tipo do cupom não pode ser alterado." });
        }
        if (value !== undefined && Number(value) !== existingCoupon.value) {
          return res.status(400).json({ success: false, error: "Este cupom já foi utilizado. O valor do cupom não pode ser alterado." });
        }
        if (appliesToPlans !== undefined) {
          const sortedNew = Array.isArray(appliesToPlans) ? [...appliesToPlans].map(Number).sort().join(",") : "";
          const sortedOld = Array.isArray(existingCoupon.appliesToPlans) ? [...existingCoupon.appliesToPlans].map(Number).sort().join(",") : "";
          if (sortedNew !== sortedOld) {
            return res.status(400).json({ success: false, error: "Este cupom já foi utilizado. Os planos aplicáveis não podem ser alterados." });
          }
        }
      }

      // Validar type se enviado, caso contrário usar o existente
      const finalType = type !== undefined ? type : existingCoupon.type;
      if (finalType !== "percentage" && finalType !== "fixed" && finalType !== "free_shipping") {
        return res.status(400).json({ success: false, error: "O tipo do cupom deve ser 'percentage' (porcentagem), 'fixed' (valor fixo) ou 'free_shipping' (frete grátis)." });
      }

      // Validar value se enviado
      let finalValue = value !== undefined ? Number(value) : existingCoupon.value;
      if (finalType === "free_shipping") {
        finalValue = 100;
      } else {
        if (isNaN(finalValue) || finalValue <= 0) {
          return res.status(400).json({ success: false, error: "O valor do cupom deve ser maior que 0." });
        }
        if (finalType === "percentage" && finalValue > 100) {
          return res.status(400).json({ success: false, error: "O valor do cupom em porcentagem não pode ser maior que 100." });
        }
      }

      // Validar maxUses se enviado
      const finalMaxUses = maxUses !== undefined ? Number(maxUses) : existingCoupon.maxUses;
      if (isNaN(finalMaxUses) || finalMaxUses <= 0 || !Number.isInteger(finalMaxUses)) {
        return res.status(400).json({ success: false, error: "A quantidade máxima de usos deve ser um número inteiro maior que 0." });
      }

      // Validar que maxUses não seja menor que usedCount
      if (finalMaxUses < existingCoupon.usedCount) {
        return res.status(400).json({ success: false, error: "O limite máximo de usos não pode ser menor que a quantidade já utilizada." });
      }

      // Validar minOrderValue se enviado
      const finalMinOrderValue = minOrderValue !== undefined ? Number(minOrderValue) : existingCoupon.minOrderValue;
      if (isNaN(finalMinOrderValue) || finalMinOrderValue < 0) {
        return res.status(400).json({ success: false, error: "O valor mínimo do pedido deve ser maior ou igual a 0." });
      }

      // Validar appliesToPlans se enviado
      let finalPlans = existingCoupon.appliesToPlans;
      if (appliesToPlans !== undefined) {
        if (!Array.isArray(appliesToPlans) || appliesToPlans.length === 0) {
          return res.status(400).json({ success: false, error: "É necessário selecionar pelo menos um plano aplicável." });
        }
        const validPlans = [1, 3, 5];
        const hasInvalidPlan = appliesToPlans.some((plan: any) => !validPlans.includes(Number(plan)));
        if (hasInvalidPlan) {
          return res.status(400).json({ success: false, error: "Os planos aplicáveis só podem ser 1, 3 ou 5." });
        }
        finalPlans = appliesToPlans.map((plan: any) => Number(plan));
      }

      // Validar expiresAt se enviado
      let finalExpiresAt = existingCoupon.expiresAt || "2050-12-31T23:59:59Z";
      if (expiresAt !== undefined) {
        if (expiresAt && typeof expiresAt === "string" && expiresAt.trim() !== "") {
          const parsedDate = new Date(expiresAt);
          if (!isNaN(parsedDate.getTime())) {
            finalExpiresAt = parsedDate.toISOString();
          } else {
            return res.status(400).json({ success: false, error: "Data de expiração inválida." });
          }
        } else {
          finalExpiresAt = "2050-12-31T23:59:59Z";
        }
      }

      // Update coupon properties
      coupons[index] = {
        ...existingCoupon,
        active: active !== undefined ? !!active : existingCoupon.active,
        expiresAt: finalExpiresAt,
        maxUses: finalMaxUses,
        minOrderValue: finalMinOrderValue,
        appliesToPlans: finalPlans,
        type: finalType,
        value: finalValue,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin"
      };

      saveCoupons(coupons);
      res.json({ success: true, coupon: coupons[index] });
    } catch (error) {
      console.error("Erro ao atualizar cupom:", error);
      res.status(500).json({ success: false, error: "Erro interno ao atualizar cupom." });
    }
  });

  // Admin: Archive coupon (protected)
  app.post("/api/admin/coupons/:code/archive", requireAdminAuth, (req, res) => {
    try {
      const codeParam = req.params.code.toUpperCase();
      const coupons = getCoupons();
      const index = coupons.findIndex((c: any) => c.code === codeParam);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Cupom não encontrado." });
      }

      coupons[index] = {
        ...coupons[index],
        active: false,
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: "admin"
      };

      saveCoupons(coupons);
      res.json({ success: true, coupon: coupons[index] });
    } catch (error) {
      console.error("Erro ao arquivar cupom:", error);
      res.status(500).json({ success: false, error: "Erro interno ao arquivar cupom." });
    }
  });

  // Admin: Restore coupon (protected)
  app.post("/api/admin/coupons/:code/restore", requireAdminAuth, (req, res) => {
    try {
      const codeParam = req.params.code.toUpperCase();
      const coupons = getCoupons();
      const index = coupons.findIndex((c: any) => c.code === codeParam);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Cupom não encontrado." });
      }

      coupons[index] = {
        ...coupons[index],
        archived: false,
        active: true,
        restoredAt: new Date().toISOString(),
        restoredBy: "admin"
      };

      saveCoupons(coupons);
      res.json({ success: true, coupon: coupons[index] });
    } catch (error) {
      console.error("Erro ao restaurar cupom:", error);
      res.status(500).json({ success: false, error: "Erro interno ao restaurar cupom." });
    }
  });
  // ------------------------

  // Webhook Endpoint
  app.post("/api/asaas-webhook", async (req, res) => {
    const event = req.body.event;
    const payment = req.body.payment;

    if (payment && payment.id) {
      logPayment(`Webhook recebido: ${event} para o pagamento ${payment.id} (Valor: ${payment.value})`);
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        asaasPaymentsStore.set(payment.id, "CONFIRMED");
        logPayment(`[CONFIRMADO] Pagamento confirmado via webhook para o pagamento ID: ${payment.id}`);

        const orders = getOrders();
        const orderIndex = orders.findIndex((o: any) => o.paymentId === payment.id);

        if (orderIndex > -1) {
          orders[orderIndex].status = "pago";
          orders[orderIndex].updatedAt = new Date().toISOString();
          saveOrders(orders);

          // Emit payment_confirmed event
          try {
            const order = orders[orderIndex];
            const analytics = order.analytics;
            const paymentConfirmedEvent = {
              id: `evt_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
              event: "payment_confirmed",
              visitorId: analytics?.visitorId || "unknown",
              sessionId: analytics?.sessionId || "unknown",
              checkoutSessionId: analytics?.checkoutSessionId || null,
              lpId: analytics?.lpId || "original",
              lpVersion: analytics?.lpVersion || "original",
              path: "/checkout",
              plan: analytics?.plan || (order.planMonths === 3 ? 2 : order.planMonths === 5 ? 3 : 1),
              quantity: analytics?.quantity || 1,
              value: payment.value || order.finalValue,
              currency: "BRL",
              orderId: order.id,
              paymentId: payment.id,
              device: analytics?.device || "desktop",
              createdAt: new Date().toISOString(),
              ...(analytics?.UTMs || {})
            };
            
            const hash = getEventDedupHash(paymentConfirmedEvent);
            if (!hash || !dedupCache.has(hash)) {
              if (hash) dedupCache.add(hash);
              analyticsBuffer.push(paymentConfirmedEvent);
            }

            // Emit checkout_recovery_recovered if recovery was shown
            if (analytics && analytics.checkoutRecoveryShown) {
              const recoveryEvent = {
                id: `evt_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)}`,
                event: "checkout_recovery_recovered",
                visitorId: analytics.visitorId || "unknown",
                sessionId: analytics.sessionId || "unknown",
                checkoutSessionId: analytics.checkoutSessionId || null,
                lpId: analytics.lpId || "original",
                lpVersion: analytics.lpVersion || "original",
                path: "/checkout",
                plan: analytics.plan,
                quantity: analytics.quantity,
                value: payment.value || order.finalValue,
                currency: "BRL",
                orderId: order.id,
                paymentId: payment.id,
                device: analytics.device || "desktop",
                createdAt: new Date().toISOString(),
                recoveryStage: "payment_confirmed",
                recoveryAction: analytics.checkoutRecoveryAction || "continue",
                ...(analytics.UTMs || {})
              };

              const rHash = getEventDedupHash(recoveryEvent);
              if (!rHash || !dedupCache.has(rHash)) {
                if (rHash) dedupCache.add(rHash);
                analyticsBuffer.push(recoveryEvent);
                logCheckout(`[RECUPERADO - PAGAMENTO CONFIRMADO] Evento registrado para o checkoutSessionId: ${analytics.checkoutSessionId}`);
              }
            }
          } catch (e: any) {
            logAnalyticsError(`Failed to emit payment_confirmed event: ${e.message}`);
          }

          // Register purchase success, updating Lead and Customer database files
          registerPurchaseSuccess(
            payment.id,
            payment.value,
            payment.customerEmail || payment.email || undefined,
            payment.customerPhone || payment.phone || undefined,
            payment.customerName || undefined
          );

          // Hiper ERP Integration
          try {
            const order = orders[orderIndex];
            const isProduction = process.env.NODE_ENV === "production";
            const isHiperEnabled = process.env.HIPER_ENABLED === "true";

            if (isHiperEnabled || !isProduction) {
              if (order.hiperStatus !== "sent") {
                const result = await sendOrderToHiper(order);
                orders[orderIndex].hiperStatus = result.status;
                orders[orderIndex].hiperOrderId = result.hiperOrderId;
                orders[orderIndex].hiperSentAt = result.sentAt;
                orders[orderIndex].hiperError = result.error;
                orders[orderIndex].hiperLastPayload = result.lastPayload;
                orders[orderIndex].hiperLastResponse = result.lastResponse;
                orders[orderIndex].hiperLastAttemptAt = result.sentAt;
                saveOrders(orders);
              }
            } else {
              // Production with HIPER_ENABLED !== "true"
              if (order.hiperStatus !== "disabled") {
                orders[orderIndex].hiperStatus = "disabled";
                orders[orderIndex].hiperOrderId = null;
                orders[orderIndex].hiperSentAt = null;
                orders[orderIndex].hiperError = null;
                orders[orderIndex].hiperLastPayload = null;
                orders[orderIndex].hiperLastResponse = null;
                orders[orderIndex].hiperLastAttemptAt = null;
                saveOrders(orders);
              }
            }
          } catch (hiperErr) {
            logError(`Erro na integração com Hiper ERP no webhook para pagamento ${payment.id}`, hiperErr, req);
          }

          // Mark coupon as used
          try {
            const order = orders.find((o: any) => o.paymentId === payment.id);
            if (order && order.couponCode) {
              const coupons = getCoupons();
              const couponIndex = coupons.findIndex((c: any) => c.code === order.couponCode.toUpperCase());
              if (couponIndex > -1) {
                const coupon = coupons[couponIndex];

                if (coupon.paymentId !== payment.id) {
                  coupon.usedCount = (coupon.usedCount || 0) + 1;
                  if (coupon.source === "qr_card_recompra" || coupon.maxUses === 1) {
                    coupon.status = "used";
                    coupon.usedAt = new Date().toISOString();
                    coupon.paymentId = payment.id;
                    coupon.orderId = order.id || payment.id;
                  }
                  saveCoupons(coupons);
                  logPayment(`Webhook: Coupon ${coupon.code} marked as used for payment ${payment.id}`);
                }
              }
            }
          } catch (webhookErr) {
            logError(`Erro ao atualizar cupom no webhook para pagamento ${payment.id}`, webhookErr, req);
          }
        } else {
          // If not found in orders.json:
          // Create external payment record in orders.json
          logPayment(`Webhook direct payment received: payment.id ${payment.id} has no matching order. Creating asaas_direct record.`);
          const now = new Date().toISOString();
          
          // Lookup lead source to preserve lead origin if lead exists
          let leadSource = "asaas";
          let matchedLeadName = null;
          try {
            const leads = getLeads();
            const cleanEmail = payment.customerEmail || payment.email ? String(payment.customerEmail || payment.email).toLowerCase().trim() : null;
            const cleanPhone = payment.customerPhone || payment.phone ? String(payment.customerPhone || payment.phone).replace(/\D/g, "") : null;
            
            let matchedLead = null;
            if (cleanPhone) {
              matchedLead = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, "") === cleanPhone);
            }
            if (!matchedLead && cleanEmail) {
              matchedLead = leads.find((l: any) => l.email && l.email.toLowerCase().trim() === cleanEmail);
            }
            
            if (matchedLead) {
              leadSource = matchedLead.source || matchedLead.origin || "site";
              matchedLeadName = matchedLead.name;
            }
          } catch (e) {
            logError(`Error looking up lead for direct payment for payment ${payment.id}`, e, req);
          }

          let existingCustomerName = null;
          try {
            const customers = getCustomers();
            const cleanEmail = payment.customerEmail || payment.email ? String(payment.customerEmail || payment.email).toLowerCase().trim() : null;
            const cleanPhone = payment.customerPhone || payment.phone ? String(payment.customerPhone || payment.phone).replace(/\D/g, "") : null;
            let matchedCust = null;
            if (cleanPhone) {
              matchedCust = customers.find((c: any) => c.phone && c.phone.replace(/\D/g, "") === cleanPhone);
            }
            if (!matchedCust && cleanEmail) {
              matchedCust = customers.find((c: any) => c.email && c.email.toLowerCase().trim() === cleanEmail);
            }
            if (matchedCust) {
              existingCustomerName = matchedCust.name;
            }
          } catch (e) {
            // ignore
          }

          const resolvedDirectName = resolveBestName(
            matchedLeadName,
            existingCustomerName,
            payment.customerName
          );

          const newDirectOrder = {
            id: `ORD-EXT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            paymentId: payment.id,
            customerId: payment.customer || `CUST-EXT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            checkoutCustomerName: normalizeDisplayName(payment.customerName),
            customerName: resolvedDirectName,
            customer: {
              name: resolvedDirectName,
              email: payment.customerEmail || payment.email || "",
              phone: payment.customerPhone || payment.phone || ""
            },
            originalValue: payment.value,
            discount: payment.discount || 0,
            finalValue: payment.value,
            couponCode: null,
            planMonths: null,
            origin: "asaas_direct",
            source: leadSource,
            closingChannel: "manual",
            needsReview: true,
            status: "paid",
            rawAsaasPayment: {
              id: payment.id,
              customer: payment.customer,
              value: payment.value,
              netValue: payment.netValue,
              billingType: payment.billingType,
              paymentDate: payment.paymentDate,
              clientPaymentDate: payment.clientPaymentDate,
              installment: payment.installment,
              description: payment.description,
              externalReference: payment.externalReference,
              invoiceNumber: payment.invoiceNumber,
              invoiceUrl: payment.invoiceUrl,
              confirmedDate: payment.confirmedDate,
              creditCard: payment.creditCard
            },
            createdAt: now,
            updatedAt: now
          };

          orders.push(newDirectOrder);
          saveOrders(orders);
          logPayment(`Asaas direct payment recorded successfully: ${newDirectOrder.id} para pagamento ${payment.id}`);
        }
      } else if (event === "PAYMENT_BANK_SLIP_VIEWED" || event === "PAYMENT_UPDATED") {
        // Just acknowledging it
        logPayment(`Webhook recebido: Evento secundário ${event} para o pagamento ${payment.id}`);
      } else if (event === "PAYMENT_REFUNDED") {
        asaasPaymentsStore.set(payment.id, "REFUNDED");
        logPayment(`[REEMBOLSADO] Pagamento reembolsado no Asaas. ID: ${payment.id}`);
      } else if (event === "PAYMENT_OVERDUE") {
        asaasPaymentsStore.set(payment.id, "OVERDUE");
        logPayment(`[EXPIRADO] Pagamento vencido/expirado no Asaas. ID: ${payment.id}`);
      } else if (event === "PAYMENT_DELETED") {
        asaasPaymentsStore.set(payment.id, "DELETED");
        logPayment(`[CANCELADO] Pagamento cancelado/excluído no Asaas. ID: ${payment.id}`);
      } else {
        asaasPaymentsStore.set(payment.id, payment.status || "PENDING");
        logPayment(`Status do pagamento ${payment.id} atualizado para ${payment.status || "PENDING"} pelo evento ${event}`);
      }
    }

    res.json({ received: true });
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Intercept direct reload of /admin/system in production
    app.get("/admin/system", (req, res, next) => {
      const isDebugMode = process.env.DEBUG_MODE === "true";
      if (!isDebugMode) {
        return res.status(403).send("Acesso negado. O modo de depuração (DEBUG_MODE) está desativado em produção.");
      }
      next();
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express Error Handler Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logError("Erro não tratado em rota Express", err, req);
    res.status(500).json({ error: "Erro interno do servidor." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    logServer(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
