import { getComprobantes } from "./afip.js"
import { db } from "./db/index.js"
import { comprobantes as comprobantesSchema } from "./db/schema.js"
import { sendEmail } from "./email.js"
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
  const parsedComprobantes = comprobantes.map((comprobante) => ({
    amount: comprobante.impTotal,
    date: comprobante.fechaDeEmision,
    issuerName: comprobante.denominacionEmisor,
    type: comprobante.tipo,
  }))
  const newComprobantes = parsedComprobantes.filter((comprobante) => {
    return !storedComprobantes.some(
      (storedComprobante) =>
        storedComprobante.amount === comprobante.amount &&
        storedComprobante.date.getTime() === comprobante.date.getTime() &&
        storedComprobante.issuerName === comprobante.issuerName &&
        storedComprobante.type === comprobante.type,
    )
  })

  // Store new comprobantes if any
  if (newComprobantes.length > 0) {
    await db.insert(comprobantesSchema).values(newComprobantes)
  }

  await sendEmailReport({
    storedComprobantes,
    newComprobantes,
  })
}

/**
 * @param {{
 *  storedComprobantes: comprobantesSchema["$inferSelect"][];
 *  newComprobantes: comprobantesSchema["$inferInsert"][]
 * }} options
 */
async function sendEmailReport({ storedComprobantes, newComprobantes }) {
  /** @param {comprobantesSchema["$inferInsert"][]} comprobantes */
  const getTable = (comprobantes) => `
  <table width="600px" style="border:1px solid #333">
    <tr>
      <th style="text-align:left">Fecha</th>
      <th style="text-align:left">Tipo</th>
      <th style="text-align:left">Nombre</th>
      <th style="text-align:right">Monto</th>
    </tr>
    ${comprobantes
      .map(
        (c) => `
        <tr>
          <td style="text-align:left">${c.date.toLocaleDateString(undefined, { timeZone: "UTC" })}</td>
          <td style="text-align:left">${c.type}</td>
          <td style="text-align:left">${c.issuerName}</td>
          <td style="text-align:right">${new Intl.NumberFormat().format(c.amount)}</td>
        </tr>
      `,
      )
      .join("")}
  </table>`

  const html = `
    <h1>Comprobantes del mes</h1>
    <h2>Comprobantes nuevos</h2>
    ${newComprobantes.length === 0 ? "No hay comprobantes nuevos." : getTable(newComprobantes)}
    <h2>Comprobantes almacenados</h2>
    ${getTable(storedComprobantes)}
    <h2>Total</h2>
    <p>${new Intl.NumberFormat().format(
      storedComprobantes.reduce(
        (acc, comprobante) => acc + comprobante.amount,
        0,
      ) +
        newComprobantes.reduce(
          (acc, comprobante) => acc + comprobante.amount,
          0,
        ),
    )}</p>
  `

  await sendEmail({
    to: env.NOTIFICATION_TO_EMAIL,
    subject: "Comprobantes del mes",
    html,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
