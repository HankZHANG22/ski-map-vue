import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname, relative } from 'path'
import { parse } from 'csv-parse/sync'

// 文件路径
const CSV = resolve('./resorts.csv')
const JSON_OUT = resolve('./public/resorts.json')
const TS_OUT = resolve('./src/data/resorts.ts')

// 检查 CSV 是否存在
if (!existsSync(CSV)) {
  console.error(`❌ resorts.csv not found at ${CSV}
Expected header:
id,country,name,lat,lng,difficulty,price,info,ticket_url,green,red,black`)
  process.exit(1)
}

// 读取 CSV
const csvText = readFileSync(CSV, 'utf8')
const rows = parse(csvText, {
  columns: true,
  trim: true,
  skip_empty_lines: true,
})

const DIFF = new Set(['Beginner', 'Intermediate', 'Advanced'])
let skipped = 0

// 数据清洗与校验
const resorts = rows
  .map((r, i) => {
    // Parse trails data (optional, default to 0)
    const trails = { green: 0, red: 0, black: 0 }
    if (r.green && Number.isFinite(Number(r.green)) && Number(r.green) >= 0) {
      trails.green = Number(r.green)
    }
    if (r.red && Number.isFinite(Number(r.red)) && Number(r.red) >= 0) {
      trails.red = Number(r.red)
    }
    if (r.black && Number.isFinite(Number(r.black)) && Number(r.black) >= 0) {
      trails.black = Number(r.black)
    }

    const item = {
      id: Number(r.id),
      country: String(r.country || '').trim(),
      name: String(r.name || '').trim(),
      lat: Number(r.lat),
      lng: Number(r.lng),
      difficulty: String(r.difficulty || '').trim(),
      price: Number(r.price),
      info: String(r.info || '').trim(),
      ticket_url: String(r.ticket_url || '').trim(),
      trails,
    }

    const ok =
      Number.isFinite(item.id) &&
      item.country &&
      item.name &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng) &&
      DIFF.has(item.difficulty) &&
      Number.isFinite(item.price) &&
      item.ticket_url

    if (!ok) {
      skipped++
      console.warn(`⚠️ Skip row ${i + 2}:`, r)
      return null
    }

    return item
  })
  .filter(Boolean)

// 写 resorts.json
mkdirSync(dirname(JSON_OUT), { recursive: true })
writeFileSync(JSON_OUT, JSON.stringify(resorts, null, 2), 'utf8')

// 写 resorts.ts
const tsHeader = `export type Resort = {
  id: number;
  country: string;
  name: string;
  lat: number;
  lng: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  info: string;
  ticket_url: string;
  trails?: { green?: number; red?: number; black?: number };
};
export const RESORTS: Resort[] = `
mkdirSync(dirname(TS_OUT), { recursive: true })
writeFileSync(TS_OUT, tsHeader + JSON.stringify(resorts, null, 2) + '\n', 'utf8')

console.log(`✅ Wrote:
- ${relative(process.cwd(), JSON_OUT)} (${resorts.length} items)
- ${relative(process.cwd(), TS_OUT)}
${skipped ? 'ℹ️ Skipped rows: ' + skipped : ''}`)
