// csv-to-both.cjs
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// 文件路径
const CSV = path.resolve("./resorts.csv");
const JSON_OUT = path.resolve("./public/resorts.json");
const TS_OUT = path.resolve("./src/data/resorts.ts");

// 检查 CSV 是否存在
if (!fs.existsSync(CSV)) {
  console.error(`❌ resorts.csv not found at ${CSV}
Expected header:
id,country,name,lat,lng,difficulty,price,info,ticket_url`);
  process.exit(1);
}

// 读取 CSV
const csvText = fs.readFileSync(CSV, "utf8");
const rows = parse(csvText, {
  columns: true,
  trim: true,
  skip_empty_lines: true,
});

const DIFF = new Set(["Beginner", "Intermediate", "Advanced"]);
let skipped = 0;

// 数据清洗与校验
const resorts = rows
  .map((r, i) => {
    const item = {
      id: Number(r.id),
      country: String(r.country || "").trim(),
      name: String(r.name || "").trim(),
      lat: Number(r.lat),
      lng: Number(r.lng),
      difficulty: String(r.difficulty || "").trim(),
      price: Number(r.price),
      info: String(r.info || "").trim(),
      ticket_url: String(r.ticket_url || "").trim(),
    };

    const ok =
      Number.isFinite(item.id) &&
      item.country &&
      item.name &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng) &&
      DIFF.has(item.difficulty) &&
      Number.isFinite(item.price) &&
      item.ticket_url;

    if (!ok) {
      skipped++;
      console.warn(`⚠️  Skip row ${i + 2}:`, r);
      return null;
    }
    return item;
  })
  .filter(Boolean);

// 写 resorts.json
fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
fs.writeFileSync(JSON_OUT, JSON.stringify(resorts, null, 2), "utf8");

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
};

export const RESORTS: Resort[] = `;
fs.mkdirSync(path.dirname(TS_OUT), { recursive: true });
fs.writeFileSync(
  TS_OUT,
  tsHeader + JSON.stringify(resorts, null, 2) + "\n",
  "utf8"
);

console.log(`✅ Wrote:
- ${path.relative(process.cwd(), JSON_OUT)} (${resorts.length} items)
- ${path.relative(process.cwd(), TS_OUT)}
${skipped ? "ℹ️ Skipped rows: " + skipped : ""}`);