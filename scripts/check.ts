// 上线前检查 data/trip.json：格式对不对、有没有不该公开的内容。用法：npm run check
declare const process: { exit(code: number): never };
import raw from "../data/trip.json";
import type { Trip } from "../src/types";
import { privacyScan, md } from "../src/utils";

const t = raw as unknown as Trip;
const errs: string[] = [];
const bad = (m: string) => errs.push(m);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const SCENES = ["hills", "dunes", "saguaro", "city", "coast", "camp", "road", "studio"];
const TODS = ["night", "dawn", "day", "golden", "dusk"];
const KINDS = ["normal", "work", "fly", "meet", "charge"];
const STATUS = ["booked", "tbd", "road"];

for (const k of ["id", "name", "start", "end", "updated"] as const) if (!t[k]) bad(`缺少顶层字段 ${k}`);
if (!ISO.test(t.start) || !ISO.test(t.end)) bad("start / end 要写成 2026-11-11 这种格式");
if (!Array.isArray(t.members) || !t.members.length) bad("members 不能为空");
const ids = new Set((t.members ?? []).map(m => m.id));
for (const s of t.stops ?? []) {
  if (typeof s.lat !== "number" || typeof s.lng !== "number") bad(`站点「${s.name}」缺经纬度`);
  if (s.mark && !ids.has(s.mark)) bad(`站点「${s.name}」的 mark 不是成员 id`);
}
let prev = "";
for (const d of t.days ?? []) {
  const w = ISO.test(d.date ?? "") ? md(d.date) : String(d.date);
  if (!ISO.test(d.date ?? "")) { bad(`有一天的 date 格式不对：${d.date}`); continue; }
  if (d.date <= prev) bad(`${w}：日期要从早到晚排，且不能重复`);
  prev = d.date;
  if (d.date < t.start || d.date > t.end) bad(`${w}：不在 start–end 范围内`);
  if (typeof d.title !== "string") bad(`${w}：缺 title`);
  if (!d.scene || !SCENES.includes(d.scene.type) || !TODS.includes(d.scene.tod)) bad(`${w}：scene 要从固定选项里选（见 docs/DATA.md）`);
  if (!d.stay || !STATUS.includes(d.stay.status) || !d.stay.name) bad(`${w}：stay 要有 name，status 只能是 booked / tbd / road`);
  for (const k of Object.keys(d.where ?? {})) if (!ids.has(k)) bad(`${w}：where 里的「${k}」不是成员 id`);
  for (const m of ids) if (!(m in (d.where ?? {}))) bad(`${w}：where 里少了成员 ${m}`);
  for (const r of d.route ?? []) if (!(t.stops ?? []).some(s => s.id === r)) bad(`${w}：route 里的「${r}」不是 stops 里的站点 id`);
  for (const it of d.items ?? []) {
    if (!it.t || !it.title) bad(`${w}：有一条安排缺 t 或 title`);
    if (it.kind && !KINDS.includes(it.kind)) bad(`${w}「${it.title}」：kind 只能是 ${KINDS.join(" / ")}`);
  }
}
if (!t.later || !ISO.test(t.later.from ?? "")) bad("later.from 要写日期");
for (const a of t.later?.anchors ?? []) if (!ISO.test(a.date) || !a.title || !["work", "end"].includes(a.kind)) bad(`later 锚点「${a.title}」格式不对`);

if (!errs.length) for (const h of privacyScan(t).hits) bad(`隐私：${h.where} 含有${h.rule.label} →「${h.text}」`);

if (errs.length) { console.error(`trip.json 有 ${errs.length} 处问题：\n- ` + errs.join("\n- ")); process.exit(1); }
console.log(`trip.json 检查通过：${t.days.length} 天，${t.days.reduce((n, d) => n + d.items.length, 0)} 条安排，隐私检查通过。`);
