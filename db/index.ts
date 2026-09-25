import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";

import * as schema from "./schema";
import { getBooleanEnv, getEnv, getOptionalEnv } from "@/lib/env";

type GlobalDb = typeof globalThis & { __mix10MysqlPool?: Pool };

function getPool() {
  const globalDb = globalThis as GlobalDb;
  if (!globalDb.__mix10MysqlPool) {
    globalDb.__mix10MysqlPool = mysql.createPool({
      host: getEnv("DATABASE_HOST"),
      port: Number(getOptionalEnv("DATABASE_PORT") || 3306),
      database: getEnv("DATABASE_NAME"),
      user: getEnv("DATABASE_USER"),
      password: getEnv("DATABASE_PASSWORD"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "Z",
      ssl: getBooleanEnv("DATABASE_SSL") ? {} : undefined,
    });
  }
  return globalDb.__mix10MysqlPool;
}

export function getDb() {
  return drizzle({ client: getPool(), schema, mode: "default" });
}
