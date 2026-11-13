import path from "path";
import fs from "fs";

// Determine DATA_DIR dynamically matching process.env or local fallback
const rawDataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const dataDir = path.resolve(rawDataDir);
const logsDir = path.join(dataDir, "logs");

// Ensure logs directory exists
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  console.error("Failed to create logs directory:", e);
}

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Rotates the log file if it exceeds the maximum size limit of 10MB
 */
function rotateLogIfNeeded(filename: string, filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return;

    const stats = fs.statSync(filePath);
    if (stats.size >= MAX_LOG_SIZE) {
      const ext = path.extname(filename); // .log
      const base = path.basename(filename, ext); // e.g. server
      
      const now = new Date();
      const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      
      const rotatedFilename = `${base}_${timestampStr}${ext}`;
      const rotatedPath = path.join(logsDir, rotatedFilename);
      
      // Rename current file to rotated filename
      fs.renameSync(filePath, rotatedPath);
      
      // Clean up old files, keeping only the last 30 rotated files for this category
      cleanOldLogs(base, ext);
    }
  } catch (err) {
    console.error(`Error during log rotation for ${filename}:`, err);
  }
}

/**
 * Deletes older rotated logs keeping only the 30 most recent ones
 */
function cleanOldLogs(categoryBase: string, ext: string) {
  try {
    const files = fs.readdirSync(logsDir);
    const escapedExt = ext.replace(".", "\\.");
    const logPattern = new RegExp(`^${categoryBase}_\\d{4}-\\d{2}-\\d{2}_\\d{4}${escapedExt}$`);
    
    const matchedFiles = files
      .filter(file => logPattern.test(file))
      .map(file => {
        const filePath = path.join(logsDir, file);
        let mtime = 0;
        try {
          mtime = fs.statSync(filePath).mtime.getTime();
        } catch (e) {}
        return { file, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (matchedFiles.length > 30) {
      const filesToDelete = matchedFiles.slice(30);
      for (const fileObj of filesToDelete) {
        try {
          fs.unlinkSync(path.join(logsDir, fileObj.file));
        } catch (err) {
          console.error(`Failed to delete old log file ${fileObj.file}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`Error cleaning old log files for ${categoryBase}:`, err);
  }
}

function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function writeLog(filename: string, category: string, message: string) {
  const timestamp = formatTimestamp();
  const logMessage = `[${timestamp}]\n[${category}]\n${message}\n\n`;

  // Always write output to local console for developer visibility
  console.log(`[${category}] ${message}`);

  const filePath = path.join(logsDir, filename);

  try {
    // Perform rotation check before appending
    rotateLogIfNeeded(filename, filePath);
    fs.appendFileSync(filePath, logMessage, "utf-8");
  } catch (err) {
    console.error(`Failed to write log to ${filename}:`, err);
  }
}

export const logServer = (message: string) => {
  writeLog("server.log", "SERVER", message);
};

export const logLead = (message: string) => {
  writeLog("lead.log", "LEAD", message);
};

export const logCheckout = (message: string) => {
  writeLog("checkout.log", "CHECKOUT", message);
};

export const logHiper = (message: string) => {
  writeLog("hiper.log", "HIPER", message);
};

export const logPayment = (message: string) => {
  writeLog("payment.log", "PAYMENT", message);
};

export const logError = (message: string, error?: any, req?: any) => {
  let details = message;
  if (req) {
    details += `\nRoute: ${req.method} ${req.originalUrl || req.url}`;
    if (req.ip) {
      details += `\nIP: ${req.ip}`;
    }
  }
  if (error) {
    if (error.stack) {
      details += `\nStack: ${error.stack}`;
    } else {
      details += `\nError: ${typeof error === "object" ? JSON.stringify(error) : String(error)}`;
    }
  }
  writeLog("error.log", "ERROR", details);
};
