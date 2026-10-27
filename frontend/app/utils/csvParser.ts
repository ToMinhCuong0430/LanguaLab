/**
 * Bộ đọc và phân tích file CSV thuần (Vanilla TS/JS)
 * - Xử lý RFC 4180: Dấu ngoặc kép "", dấu phẩy, ký tự xuống dòng bên trong ô giá trị
 * - Tự động loại bỏ BOM UTF-8 (\uFEFF)
 * - Tương thích tiếng Việt có dấu và ký tự CJK (Trung/Nhật)
 * - Hỗ trợ xuất mảng đối tượng ra chuỗi CSV chuẩn
 */

export interface CsvParseOptions {
  delimiter?: string
  skipEmptyLines?: boolean
  trimValues?: boolean
}

/**
 * Phân tích chuỗi CSV thành mảng các mảng chuỗi (rows & columns)
 */
export function parseCsvRaw(csvText: string, options: CsvParseOptions = {}): string[][] {
  const delimiter = options.delimiter || ','
  const skipEmptyLines = options.skipEmptyLines !== false
  const trimValues = options.trimValues === true

  // Loại bỏ BOM nếu có
  let text = csvText
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        // Kiểm tra escaped quote: ""
        if (i + 1 < len && text[i + 1] === '"') {
          currentCell += '"'
          i += 2
          continue
        } else {
          // Kết thúc quote
          inQuotes = false
          i++
          continue
        }
      } else {
        currentCell += char
        i++
        continue
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      }

      if (char === delimiter) {
        currentRow.push(trimValues ? currentCell.trim() : currentCell)
        currentCell = ''
        i++
        continue
      }

      if (char === '\r') {
        if (i + 1 < len && text[i + 1] === '\n') {
          i++
        }
        currentRow.push(trimValues ? currentCell.trim() : currentCell)
        currentCell = ''
        if (!skipEmptyLines || currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        i++
        continue
      }

      if (char === '\n') {
        currentRow.push(trimValues ? currentCell.trim() : currentCell)
        currentCell = ''
        if (!skipEmptyLines || currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        i++
        continue
      }

      currentCell += char
      i++
    }
  }

  // Đẩy ô cuối cùng
  currentRow.push(trimValues ? currentCell.trim() : currentCell)
  if (!skipEmptyLines || currentRow.some(cell => cell.length > 0)) {
    rows.push(currentRow)
  }

  return rows
}

/**
 * Phân tích chuỗi CSV thành mảng đối tượng JSON dựa vào dòng header đầu tiên
 */
export function parseCsv<T = Record<string, string>>(csvText: string, options: CsvParseOptions = {}): T[] {
  const rows = parseCsvRaw(csvText, options)
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim().replace(/^[\uFEFF\s]+|[\s]+$/g, ''))
  const result: T[] = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    // Bỏ qua dòng trống
    if (row.length === 1 && !row[0]) continue

    const obj: Record<string, any> = {}
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c]
      if (!headerKey) continue
      obj[headerKey] = row[c] !== undefined ? row[c] : ''
    }
    result.push(obj as T)
  }

  return result
}

/**
 * Chuyển mảng đối tượng thành chuỗi CSV chuẩn kèm BOM UTF-8
 */
export function stringifyCsv(data: Record<string, any>[], columns?: string[]): string {
  if (!data || data.length === 0) return ''

  const cols = columns && columns.length > 0 ? columns : Object.keys(data[0])

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return ''
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines: string[] = []
  lines.push(cols.map(c => escapeCell(c)).join(','))

  for (const item of data) {
    const line = cols.map(c => escapeCell(item[c])).join(',')
    lines.push(line)
  }

  // Thêm BOM UTF-8 để Excel hiển thị tốt tiếng Việt
  return '\uFEFF' + lines.join('\r\n')
}
