import type { Day, Member, Place, Trip } from "./types";

const WD = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
export function md(s: string) {
  const d = parseISO(s);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
export function wd(s: string) {
  return WD[parseISO(s).getUTCDay()];
}
export function addDays(s: string, n: number) {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}
export function daysBetween(a: string, b: string) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

export function mapsUrl(p: Place) {
  return p.dir
    ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(p.q)
    : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.q);
}

/** 当天某人的状态：with 在行程中 / away 不在（已离开）/ none 尚未会合 */
export type Presence = "with" | "away" | "none";
export function presence(day: Day, m: Member): Presence {
  const v = day.where[m.id];
  if (v == null || v === "") return "none";
  if (v.startsWith("@")) return "away";
  return "with";
}
export function whereText(day: Day, m: Member) {
  const v = day.where[m.id];
  if (v == null || v === "") return "尚未会合";
  return v.startsWith("@") ? v.slice(1) : v;
}

export const STAY_LABEL = { booked: "已订", tbd: "待定", road: "在路上" } as const;

export function isOpen(text?: string) {
  return !!text && /待定|未预约|以最终.*为准|占位/.test(text);
}

export interface OpenItem { date: string; where: string; text: string; kind: "stay" | "item" | "later" }
export function openItems(trip: Trip): OpenItem[] {
  const out: OpenItem[] = [];
  for (const d of trip.days) {
    for (const it of d.items) {
      const t = [it.title, it.note].filter(Boolean).join(" · ");
      if (isOpen(t)) out.push({ date: d.date, where: it.t, text: t, kind: "item" });
    }
    if (d.stay.status === "tbd") out.push({ date: d.date, where: "今晚住", text: `${d.stay.name} · ${d.stay.sub}`, kind: "stay" });
  }
  out.push({ date: trip.later.from, where: "之后", text: `${md(trip.later.from)} – ${md(trip.end)} 除已知锚点外其余安排`, kind: "later" });
  return out;
}

/** 把连续住同一处的夜晚合并 */
export interface StayRun { from: string; nights: number; days: Day[] }
export function stayRuns(trip: Trip): StayRun[] {
  const runs: StayRun[] = [];
  for (const d of trip.days) {
    const last = runs[runs.length - 1];
    const prev = last?.days[last.days.length - 1];
    if (prev && prev.stay.name === d.stay.name && prev.stay.status === d.stay.status) {
      last.days.push(d); last.nights++;
    } else runs.push({ from: d.date, nights: 1, days: [d] });
  }
  return runs;
}

/* ---------- 分享前隐私检查 ---------- */
export interface PrivacyRule { id: string; label: string; re: RegExp }
export const PRIVACY_RULES: PrivacyRule[] = [
  { id: "phone", label: "电话号码", re: /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/ },
  { id: "email", label: "邮箱", re: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { id: "money", label: "价格或金额", re: /[$¥￥€]\s?\d|\d+(\.\d+)?\s?(元|美元|美金|刀|USD|RMB)|价格|房价|费用|合同/i },
  { id: "code", label: "确认号或订单号", re: /确认号|订单号|confirmation|\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{7,}\b/i },
  { id: "airbnb", label: "Airbnb 房源链接", re: /airbnb\.(com|cn)/i },
  { id: "title", label: "内部称呼", re: /老板/ },
];

export interface PrivacyHit { rule: PrivacyRule; where: string; text: string }
export function privacyScan(trip: Trip): { checked: number; hits: PrivacyHit[] } {
  const fields: { where: string; text: string }[] = [];
  const push = (where: string, text?: string) => { if (text) fields.push({ where, text }); };
  push("行程名", trip.name); push("副标题", trip.tagline);
  for (const d of trip.days) {
    const w = md(d.date);
    push(`${w} 标题`, d.title); push(`${w} 提示`, d.tip);
    for (const k in d.where) push(`${w} 位置`, d.where[k] ?? undefined);
    for (const it of d.items) { push(`${w} ${it.t}`, it.title); push(`${w} ${it.t} 备注`, it.note); push(`${w} ${it.t} 导航`, it.place?.q); }
    push(`${w} 住宿`, d.stay.name); push(`${w} 住宿说明`, d.stay.sub); push(`${w} 住宿导航`, d.stay.place?.q);
  }
  for (const a of trip.later.anchors) { push(`${md(a.date)} 锚点`, a.title); push(`${md(a.date)} 锚点说明`, a.note); }
  const hits: PrivacyHit[] = [];
  for (const f of fields) for (const r of PRIVACY_RULES) if (r.re.test(f.text)) hits.push({ rule: r, ...f });
  return { checked: fields.length, hits };
}

/* ---------- 新建行程 ---------- */
const COLORS = ["c1", "c2", "c3", "c4", "c5"];
export function newTrip(name: string, start: string, end: string, people: string[]): Trip {
  const members: Member[] = people.slice(0, 5).map((p, i) => ({
    id: "m" + i, short: p.slice(0, 4), name: p, color: COLORS[i], span: "全程",
  }));
  const len = Math.max(0, Math.min(daysBetween(start, end), 13));
  const days: Day[] = [];
  for (let i = 0; i <= len; i++) {
    const date = addDays(start, i);
    days.push({
      date, title: "", tz: "当地时间", place: "",
      scene: { type: (["hills", "coast", "city", "dunes"] as const)[i % 4], tod: (["dawn", "day", "golden", "dusk", "night"] as const)[i % 5] },
      where: Object.fromEntries(members.map(m => [m.id, "待定"])),
      items: [], stay: { name: "住处待定", sub: "", status: "tbd" },
    });
  }
  const after = addDays(start, len + 1);
  return {
    id: "t" + Date.now().toString(36), name, tagline: "", start, end, cover: "c4",
    members, stops: [], regions: [{ id: "all", name: "全程" }], guides: [], days,
    later: { from: after, anchors: [], where: Object.fromEntries(members.map(m => [m.id, "待定"])) },
    updated: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
}

export function stats(trip: Trip) {
  const nights = trip.days.filter(d => d.stay.status !== "road");
  return {
    days: daysBetween(trip.start, trip.end) + 1,
    planned: trip.days.length,
    booked: nights.filter(d => d.stay.status === "booked").length,
    nights: nights.length,
    open: openItems(trip).length,
    work: trip.days.filter(d => d.work).length + trip.later.anchors.filter(a => a.kind === "work").length,
  };
}

export function itemKind(i: { kind?: string; title: string; note?: string }) {
  if (i.kind) return i.kind;
  return /充电|补电|补能|超充|满电/.test(i.title + (i.note ?? "")) ? "charge" : "normal";
}

/** 两站之间的行驶里程估算：直线距离 × 1.15，取整到 10 英里 */
export function legMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(h)) * 1.15;
  return Math.max(10, Math.round(d / 10) * 10);
}

/** 把 "14:30–17:30" / "18:15 出发" 这类时间解析成当天的分钟数；解析不了返回 null */
export function startMin(t: string): number | null {
  if (/次日/.test(t)) return null;
  const m = t.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
export function fmtGap(min: number) {
  if (min < 60) return `${min} 分钟后`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} 小时 ${m} 分后` : `${h} 小时后`;
}
