import type { Trip } from "./types";
import data from "../data/trip.json";

// 行程数据在 data/trip.json，由策划那边维护；格式见 docs/DATA.md。
export const demoTrip = data as unknown as Trip;
// 安排可以不写 id，这里按「日期-序号」补上
for (const d of demoTrip.days) d.items.forEach((it, i) => { if (!it.id) it.id = `${d.date}-${i}`; });

/** 数据内容的指纹：trip.json 一变它就变，应用据此换掉手机里存的旧版 */
export const DATA_REV = (() => {
  const s = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
})();
