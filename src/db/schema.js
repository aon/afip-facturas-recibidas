import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core"

export const comprobantes = sqliteTable("comprobantes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  type: text("type").notNull(),
  issuerName: text("issuerName").notNull(),
  amount: integer("amount").notNull(),
  // TODO: add some sort of ID
})
