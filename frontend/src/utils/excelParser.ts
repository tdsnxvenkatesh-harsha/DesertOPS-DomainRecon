import * as XLSX from 'xlsx'
import type { DomainResult } from '../types/domainResult'

const DOMAIN_HEADERS = ['domain', 'url', 'website', 'site', 'link', 'host', 'fqdn']
const HEADER_SCAN_LIMIT = 20
const IPV4_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

export function normalizeDomainInput(value: string): string {
  let text = value.trim().toLowerCase()
  if (!text) {
    return ''
  }

  text = text.replace(/^mailto:/i, '').replace(/^https?:\/\//i, '').replace(/^\/\//, '')
  text = text.split(/[/?#]/)[0].replace(/\.+$/, '')

  if (!text) {
    return ''
  }

  if (IPV4_PATTERN.test(text)) {
    return ''
  }

  if (!DOMAIN_PATTERN.test(text)) {
    return ''
  }

  return text
}

function detectDomainColumn(headers: string[]): number {
  for (let index = 0; index < headers.length; index += 1) {
    const header = (headers[index] ?? '').toLowerCase()
    if (DOMAIN_HEADERS.some((keyword) => header.includes(keyword))) {
      return index
    }
  }

  return -1
}

function findDomainColumnFromRows(rows: (string | number | null)[][]): {
  headerRowIndex: number
  domainColumnIndex: number
} | null {
  const maxScan = Math.min(rows.length, HEADER_SCAN_LIMIT)
  for (let rowIndex = 0; rowIndex < maxScan; rowIndex += 1) {
    const rawHeaderRow = rows[rowIndex] ?? []
    const headerRow = Array.from({ length: rawHeaderRow.length }, (_, index) => toText(rawHeaderRow[index]))
    const columnIndex = detectDomainColumn(headerRow)
    if (columnIndex >= 0) {
      return {
        headerRowIndex: rowIndex,
        domainColumnIndex: columnIndex,
      }
    }
  }

  return null
}

function extractDomainsFromSheet(rows: (string | number | null)[][]): string[] {
  const columnMatch = findDomainColumnFromRows(rows)
  if (!columnMatch) {
    return []
  }

  return rows
    .slice(columnMatch.headerRowIndex + 1)
    .map((row) => toText(row?.[columnMatch.domainColumnIndex]))
    .map(normalizeDomainInput)
    .filter(Boolean)
}

export function parseExcelDomains(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const buffer = reader.result
        if (!(buffer instanceof ArrayBuffer)) {
          reject(new Error('Failed to read file buffer.'))
          return
        }

        const workbook = XLSX.read(buffer, { type: 'array' })
        if (!workbook.SheetNames.length) {
          reject(new Error('The workbook has no sheets.'))
          return
        }

        const extracted: string[] = []
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
            header: 1,
            blankrows: false,
          })

          if (!rows.length) {
            continue
          }

          extracted.push(...extractDomainsFromSheet(rows))
        }

        resolve([...new Set(extracted)].sort())
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse Excel file.'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read selected file.'))
    reader.readAsArrayBuffer(file)
  })
}

export function exportResultsToWorkbook(results: DomainResult[]): ArrayBuffer {
  const rows = results.map((result) => ({
    Domain: result.domain || result.source_input,
    'Website behind URL?': result.website_behind_url,
    Redirect: result.redirect,
    'Page opens / renders?': result.page_opens_renders,
    'Email functionality?': result.email_functionality,
    'Date of last update found': result.last_update ?? '',
    'Content status': result.content_status,
    'Likely purpose': result.likely_purpose,
    'Fraud-prevention / defensive-registration likelihood': result.defensive_registration_likelihood,
    'Release recommendation': result.release_recommendation,
    Notes: result.notes ?? result.error ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Domain Inventory')

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}
