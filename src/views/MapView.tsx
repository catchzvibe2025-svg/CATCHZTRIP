import React, { useState } from "react";
import { useStore } from "../store";
import { RouteMap } from "../ui/RouteMap";
import { SectionHead } from "../ui/bits";
import { legMiles } from "../utils";

export function MapView() {
  const { trip } = useStore();
  const [region, setRegion] = useState(trip.regions[0]?.id ?? "all");
  const [sel, setSel] = useState<string | null>(null);
  const list = region === "all" ? trip.stops : trip.stops.filter(s => s.region === region);
  const v = trip.vehicle;
  const usable = v ? Math.round(v.rangeMi * 0.8) : 0; // 按 80% 可用续航规划（高速、冬季、留余量）
  return (
    <div className="stack">
      <SectionHead title="路线" aside="按真实经纬度绘制 · 点站点看详情">
        {trip.regions.length > 1 && (
          <div className="seg" role="tablist" aria-label="地图范围">
            {trip.regions.map(r => (
              <button key={r.id} type="button" role="tab" aria-selected={region === r.id}
                className={region === r.id ? "on" : ""} onClick={() => { setRegion(r.id); setSel(null); }}>{r.name}</button>
            ))}
          </div>
        )}
      </SectionHead>
      <div className="card map-card">
        <RouteMap stops={trip.stops} guides={trip.guides} members={trip.members} region={region} selected={sel} onSelect={setSel}
          regions={trip.regions} onRegion={r => { setRegion(r); setSel(null); }} />
        <div className="map-legend">
          {trip.members.map(m => {
            const s = trip.stops.find(s => s.mark === m.id);
            return s ? <span key={m.id}><i className="pip" style={{ background: `var(--${m.color})` }} />{m.short} · {s.name}</span> : null;
          })}
        </div>
      </div>
      {list.length > 0 && (
        <ol className="stops card">
          {list.map((s, i) => {
            const prev = i > 0 ? list[i - 1] : null;
            const mi = prev ? legMiles(prev, s) : 0;
            const charge = v?.ev && mi > usable;
            return (
              <li key={s.id} className={sel === s.id ? "on" : ""}>
                {prev && (
                  <div className={"leg" + (charge ? " leg-charge" : "")}>
                    ↓ 约 {mi} 英里{charge ? ` · 超过单次可用续航，途中至少充 ${Math.ceil(mi / usable) - 1} 次` : ""}
                  </div>
                )}
                <button type="button" onClick={() => setSel(s.id)}>
                  <span className="mono n">{trip.stops.indexOf(s) + 1}</span>
                  <b>{s.name}</b>
                  <span className="muted">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {v && (
        <div className="card vehicle">
          <div className="veh-top"><span className="veh-ico" aria-hidden="true">⚡</span><div><b>{v.name}</b><span className="muted small">全程同一辆车 · 电车</span></div></div>
          <dl className="kv kv3">
            <div><dt>标称续航</dt><dd className="mono">{v.rangeMi} mi</dd></div>
            <div><dt>按 80% 规划</dt><dd className="mono">{usable} mi</dd></div>
            <div><dt>日程里的充电点</dt><dd className="mono">{trip.days.reduce((n, d) => n + d.items.filter(i => /充电|补电|补能|超充|满电/.test(i.title + (i.note ?? ""))).length, 0)}</dd></div>
          </dl>
          <p className="muted small">每段里程是按直线距离乘 1.15 估算的，只用来判断要不要中途充电，实际以导航为准。冬季高速续航会更短，长段建议在 20% 电量前进超充站。</p>
        </div>
      )}
    </div>
  );
}
