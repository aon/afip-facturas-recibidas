import AdmZip from "adm-zip"
import { chromium } from "playwright"

/**
 * @param {{user: string; password: string}} options
 */
export async function getComprobantes({ user, password }) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()

  await login(page, user, password)

  // Mis Comprobantes opens a new page, so we need to wait for the event first
  const pagePromise = context.waitForEvent("page")
  await openMisComprobantes(page)
  const misComprobantesPage = await pagePromise
  await misComprobantesPage.waitForLoadState()

  const zippedCsvPath = await downloadCSV(misComprobantesPage)
  const csv = unzip(zippedCsvPath)

  // Close browser after we're done
  await browser.close()

  // Parse CSV into helpful data
  const comprobantes = parseCsv(csv)

  return comprobantes
}

/**
 * @param {import("playwright").Page} page
 * @param {string} user
 * @param {string} password
 */
async function login(page, user, password) {
  await page.goto("https://auth.afip.gob.ar/contribuyente_/login.xhtml")
  await page.fill('input[name="F1:username"]', user)
  await page.click('input[name="F1:btnSiguiente"]')
  await page.fill('input[name="F1:password"]', password)
  await page.click('input[name="F1:btnIngresar"]')
}

/**
 * @param {import("playwright").Page} page
 */
async function openMisComprobantes(page) {
  await page.fill("input#buscadorInput", "Mis Comprobantes")
  await page.click("li#rbt-menu-item-0")
}

/**
 * @param {import("playwright").Page} page
 */
async function downloadCSV(page) {
  await page.click("a#btnRecibidos")
  await page.click("input#fechaEmision")
  await page.click('li[data-range-key="Este Mes"]')
  await page.click("button#buscarComprobantes")

  const downloadPromise = page.waitForEvent("download")
  await page.click('button[title="Exportar como CSV"]')
  const download = await downloadPromise
  return await download.path()
}

/**
 * @param {string} path
 */
function unzip(path) {
  const zip = new AdmZip(path)
  const zipEntries = zip.getEntries()
  if (zipEntries.length !== 1) {
    throw new Error("Expected a single file inside the zip")
  }

  const csvEntry = zipEntries[0]
  const csv = csvEntry.getData().toString("utf8")
  return csv
}

/**
 * @typedef {Object} Comprobante
 * @property {Date} fechaDeEmision
 * @property {string} tipo
 * @property {string} puntoDeVenta
 * @property {string} numeroDesde
 * @property {string} numeroHasta
 * @property {string} codigoAutorizacion
 * @property {string} tipoDocEmisor
 * @property {string} nroDocEmisor
 * @property {string} denominacionEmisor
 * @property {number} tipoCambio
 * @property {string} moneda
 * @property {number} impNetoGravado
 * @property {number} impNetoNoGravado
 * @property {number} impOpExentas
 * @property {number} otrosTributos
 * @property {number} iva
 * @property {number} impTotal
 */

/**
 * @param {string} csv
 * @returns {Comprobante[]}
 */
function parseCsv(csv) {
  const lines = csv.trim().split("\n")
  const comprobantes = lines.slice(1).map((line) => {
    const values = line.split(";")
    const tipo = mapTipoComprobante[values[1]] ?? values[1]
    const impTotal = parseFloat(values[16])
    const comprobante = {
      fechaDeEmision: new Date(values[0]),
      tipo,
      puntoDeVenta: values[2],
      numeroDesde: values[3],
      numeroHasta: values[4],
      codigoAutorizacion: values[5],
      tipoDocEmisor: values[6],
      nroDocEmisor: values[7],
      denominacionEmisor: values[8],
      tipoCambio: parseFloat(values[9]),
      moneda: values[10],
      impNetoGravado: parseFloat(values[11]),
      impNetoNoGravado: parseFloat(values[12]),
      impOpExentas: parseFloat(values[13]),
      otrosTributos: parseFloat(values[14]),
      iva: parseFloat(values[15]),
      impTotal: isNota(tipo) ? -impTotal : impTotal,
    }
    return comprobante
  })
  return comprobantes
}

/** @type {{[index: string]: string}} */
const mapTipoComprobante = {
  1: "Factura A",
  2: "Nota de Débito A",
  3: "Nota de Crédito A",
  4: "Recibo A",
  6: "Factura B",
  7: "Nota de Débito B",
  8: "Nota de Crédito B",
  9: "Recibo B",
  11: "Factura C",
  12: "Nota de Débito C",
  13: "Nota de Crédito C",
  15: "Recibo C",
  19: "Factura de Exportación",
  20: "Nota de Débito por Operaciones con el Exterior",
  21: "Nota de Crédito por Operaciones con el Exterior",
  51: "Factura M",
  52: "Nota de Débito M",
  53: "Nota de Crédito M",
  54: "Recibo M",
  109: "Tique C",
  114: "Tique Nota de Crédito C",
  195: "Factura T",
  196: "Nota de Débito T",
  197: "Nota de Crédito T",
  201: "Factura de Crédito electrónica MiPyMEs (FCE) A",
  202: "Nota de Débito electrónica MiPyMEs (FCE) A",
  203: "Nota de Crédito electrónica MiPyMEs (FCE) A",
  206: "Factura de Crédito electrónica MiPyMEs (FCE) B",
  207: "Nota de Débito electrónica MiPyMEs (FCE) B",
  208: "Nota de Crédito electrónica MiPyMEs (FCE) B",
  211: "Factura de Crédito electrónica MiPyMEs (FCE) C",
  212: "Nota de Débito electrónica MiPyMEs (FCE) C",
  213: "Nota de Crédito electrónica MiPyMEs (FCE) C",
}

/**
 * @param {string} tipo
 */
const isNota = (tipo) => tipo.includes("Nota")
