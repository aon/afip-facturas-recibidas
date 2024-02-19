import { db } from "./index.js"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"

export function migrateDb() {
  migrate(db, { migrationsFolder: "drizzle" })
}
