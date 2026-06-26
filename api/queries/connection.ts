import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import mysql from "mysql2/promise";

let cachedConnection: mysql.Connection | null = null;

export async function getDb() {
  if (!cachedConnection) {
    cachedConnection = await mysql.createConnection(env.databaseUrl);
  }
  return drizzle(cachedConnection);
}
