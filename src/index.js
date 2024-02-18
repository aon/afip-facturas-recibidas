import { getComprobantes } from "./afip.js"
import { db } from "./db/index.js"
import { comprobantes as comprobantesSchema } from "./db/schema.js"
import { env } from "./env.js"
import dayjs from "dayjs"
import { and, asc, gte, lte } from "drizzle-orm"

async function main() {
  // Get monthly comprobantes
  const comprobantes = await getComprobantes({
    user: env.AFIP_USERNAME,
    password: env.AFIP_PASSWORD,
  })
  comprobantes.sort(
    (a, b) => a.fechaDeEmision.getTime() - b.fechaDeEmision.getTime(),
  )

  console.log({ comprobantes })

  // Get stored comprobantes and compare
  const storedComprobantes = await db.query.comprobantes.findMany({
    where: and(
      gte(comprobantesSchema.date, dayjs().startOf("month").toDate()),
      lte(comprobantesSchema.date, dayjs().endOf("month").toDate()),
    ),
    orderBy: [asc(comprobantesSchema.date)],
  })

  console.log({ storedComprobantes })

  // Compare
  const newComprobantes = comprobantes.filter((comprobante) => {
    return !storedComprobantes.some((storedComprobante) => {
      return (
        storedComprobante.type === comprobante.tipo &&
        storedComprobante.amount === comprobante.impTotal &&
        storedComprobante.issuerName === comprobante.denominacionEmisor
      )
    })
  })

  console.log({ newComprobantes })

  // Store new comprobantes if any
  if (newComprobantes.length === 0) {
    console.log("No new comprobantes")
    return
  }

  await db.insert(comprobantesSchema).values(
    newComprobantes.map((comprobante) => ({
      amount: comprobante.impTotal,
      date: comprobante.fechaDeEmision,
      issuerName: comprobante.denominacionEmisor,
      type: comprobante.tipo,
    })),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
