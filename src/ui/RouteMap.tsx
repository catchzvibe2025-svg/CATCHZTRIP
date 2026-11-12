import React, { useMemo } from "react";
import type { Member, Stop } from "../types";

interface Props {
  stops: Stop[];
  guides?: { lng: number; label: string }[];
  members: Member[];
  region: string;
  selected?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
  regions?: { id: string; name: string }[];
  onRegion?: (id: string) => void;
  me?: { lat: number; lng: number } | null;
}

const W = 360;

/** 按真实经纬度投影的路线图。不加载外部底图，只画经纬网、州界参考线、路线和站点。 */
export function RouteMap({ stops, guides = [], members, region, selected, onSelect, compact, regions = [], onRegion, me }: Props) {
  // 全程视图里，同一区域的站点合并成一个点，点开再看局部
  const shown = useMemo(() => {
    if (region !== "all") return stops.filter(s => s.region === region);
    const out: Stop[] = [];
    for (const s of stops) {
      if (!s.region) { out.push(s); continue; }
      if (out.some(o => o.id === "region:" + s.region)) continue;
      const g = stops.filter(x => x.region === s.region);
      out.push({
        id: "region:" + s.region, name: regions.find(r => r.id === s.region)?.name ?? s.region,
        label: `${g.length} 站 · ${g[0].label.split(" ")[0]} 起`,
        lat: g.reduce((a, x) => a + x.lat, 0) / g.length, lng: g.reduce((a, x) => a + x.lng, 0) / g.length,
      });
    }
    return out;
  }, [stops, region, regions]);

  const geo = useMemo(() => {
    if (!shown.length) return null;
    let minLat = Math.min(...shown.map(s => s.lat)), maxLat = Math.max(...shown.map(s => s.lat));
    let minLng = Math.min(...shown.map(s => s.lng)), maxLng = Math.max(...shown.map(s => s.lng));
    const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    let spanX = Math.max((maxLng - minLng) * k, 0.2), spanY = Math.max(maxLat - minLat, 0.2);
    // 留边，并把高宽比限制在 0.55–1.1 之间
    const minRatio = compact ? 0.5 : 0.62, maxRatio = 1.1;
    if (spanY / spanX < minRatio) spanY = spanX * minRatio;
    if (spanY / spanX > maxRatio) spanX = spanY / maxRatio;
    const cLat = (minLat + maxLat) / 2, cLngK = ((minLng + maxLng) / 2) * k;
    const padX = spanX * 0.16, padY = spanY * 0.2;
    const x0 = cLngK - spanX / 2 - padX, x1 = cLngK + spanX / 2 + padX;
    const y0 = cLat - spanY / 2 - padY, y1 = cLat + spanY / 2 + padY;
    const H = Math.round(W * (y1 - y0) / (x1 - x0));
    const px = (lng: number) => ((lng * k - x0) / (x1 - x0)) * W;
    const py = (lat: number) => ((y1 - lat) / (y1 - y0)) * H;
    const lngMin = x0 / k, lngMax = x1 / k;
    return { H, px, py, lngMin, lngMax, latMin: y0, latMax: y1 };
  }, [shown, compact]);

  if (!geo) {
    return (
      <div className="map-empty">
        <b>还没有站点</b>
        <span>在日程里加上地点后，路线会画在这里。</span>
      </div>
    );
  }
  const { H, px, py } = geo;

  const step = geo.lngMax - geo.lngMin > 6 ? 2 : geo.lngMax - geo.lngMin > 2 ? 0.5 : 0.25;
  const grid: React.ReactNode[] = [];
  for (let g = Math.ceil(geo.lngMin / step) * step; g < geo.lngMax; g += step)
    grid.push(<line key={"x" + g} x1={px(g)} x2={px(g)} y1={0} y2={H} />);
  for (let g = Math.ceil(geo.latMin / step) * step; g < geo.latMax; g += step)
    grid.push(<line key={"y" + g} y1={py(g)} y2={py(g)} x1={0} x2={W} />);

  const pick = (id: string) => (id.startsWith("region:") && onRegion ? onRegion(id.slice(7)) : onSelect?.(id));
  const pts = shown.map(s => ({ s, x: px(s.lng), y: py(s.lat) }));
  const MARK: Record<string, string> = { c1: "#6bb6df", c2: "#ef8ca5", c3: "#e8b54a", c4: "#6fcf9c", c5: "#79cdc6" };
  const color = (s: Stop) => MARK[members.find(m => m.id === s.mark)?.color ?? ""] ?? "#fff";

  // 标签避让：依次尝试右、左、上、下，选第一个不与已放标签和点重叠的位置
  const boxes: { x: number; y: number; w: number; h: number }[] = pts.map(p => ({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 }));
  const hit = (b: { x: number; y: number; w: number; h: number }) =>
    b.x < 2 || b.x + b.w > W - 2 || b.y < 2 || b.y + b.h > H - 2 ||
    boxes.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
  const textW = (t: string, f: number) => [...t].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? f : f * 0.58), 0);
  const labels = pts.map(p => {
    const w = Math.max(textW(p.s.name, 11), compact ? 0 : textW(p.s.label, 9)) + 2;
    const h = compact ? 13 : 25;
    const cands = [
      { x: p.x + 10, y: p.y - 9, a: "start" },
      { x: p.x - 10 - w, y: p.y - 9, a: "end" },
      { x: p.x - w / 2, y: p.y - 12 - h, a: "middle" },
      { x: p.x - w / 2, y: p.y + 11, a: "middle" },
      { x: p.x + 10, y: p.y - h - 4, a: "start" },
      { x: p.x - 10 - w, y: p.y + 4, a: "end" },
    ];
    const c = cands.find(c => !hit({ x: c.x, y: c.y, w, h })) ?? cands[0];
    boxes.push({ x: c.x, y: c.y, w, h });
    const tx = c.a === "start" ? c.x : c.a === "end" ? c.x + w : c.x + w / 2;
    return { id: p.s.id, tx, ty: c.y + 10, a: c.a, name: p.s.name, label: p.s.label };
  });

  // 平滑路线（Catmull-Rom 转贝塞尔）
  const d = pts.map((p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] ?? p, t = 0.18;
    return `C${(p1.x + (p.x - p0.x) * t).toFixed(1)},${(p1.y + (p.y - p0.y) * t).toFixed(1)} ${(p.x - (p3.x - p1.x) * t).toFixed(1)},${(p.y - (p3.y - p1.y) * t).toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
  const uid = "rm" + region.replace(/\W/g, "") + (compact ? "c" : "");
  const stars = useMemo(() => Array.from({ length: 46 }, (_, i) => {
    const r = (n: number) => { const x = Math.sin((i + 1) * n) * 43758.5453; return x - Math.floor(x); };
    return { x: r(12.9898) * W, y: r(78.233), o: 0.15 + r(39.425) * 0.5 };
  }), []);

  return (
    <svg className="routemap" viewBox={`0 0 ${W} ${H}`} role="img" key={region}
      aria-label={"路线：" + shown.map(s => s.name).join(" → ")}>
      <defs>
        <linearGradient id={uid + "bg"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a1c" /><stop offset="1" stopColor="#151a3a" />
        </linearGradient>
        <linearGradient id={uid + "rt"} gradientUnits="userSpaceOnUse" x1={pts[0].x} y1="0" x2={pts[pts.length - 1].x + 0.01} y2="0">
          <stop offset="0" stopColor="#8ea2ff" /><stop offset=".55" stopColor="#ee5f86" /><stop offset="1" stopColor="#ffb36b" />
        </linearGradient>
        <filter id={uid + "gl"} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}bg)`} />
      {stars.map((st, i) => <rect key={i} className="map-star" x={st.x} y={st.y * H} width="1" height="1" fill="#fff" opacity={st.o} style={{ animationDelay: `${(i % 7) * 0.6}s` }} />)}
      <g stroke="#ffffff" strokeOpacity=".05" strokeWidth="1">{grid}</g>
      {region === "all" && guides.filter(g => g.lng > geo.lngMin && g.lng < geo.lngMax).map((g, gi) => (
        <g key={g.lng}>
          <line x1={px(g.lng)} x2={px(g.lng)} y1={0} y2={H} stroke="#ffffff" strokeOpacity=".16" strokeWidth="1" strokeDasharray="2 5" />
          <text x={px(g.lng) + 4} y={H - 8 - (gi % 2) * 11} className="map-guide-t">{g.label}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke={`url(#${uid}rt)`} strokeWidth="7" strokeLinecap="round" opacity=".55" filter={`url(#${uid}gl)`} />
      <path className="route-line" d={d} pathLength={1} fill="none" stroke={`url(#${uid}rt)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(p => {
        const on = selected === p.s.id, reg = p.s.id.startsWith("region:"), c = p.s.mark ? color(p.s) : "#fff";
        return (
          <g key={p.s.id} className={"stop" + (on ? " on" : "")}
            onClick={onSelect ? () => pick(p.s.id) : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={onSelect ? e => { if (e.key === "Enter") pick(p.s.id); } : undefined}>
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
            {reg
              ? <><circle className="stop-ring" cx={p.x} cy={p.y} r="10" fill="none" stroke="#ffb36b" strokeWidth="1.2" strokeDasharray="2 3" />
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffb36b" /></>
              : <><circle cx={p.x} cy={p.y} r={on ? 11 : 7} fill={c} opacity=".22" />
                  <circle cx={p.x} cy={p.y} r={on ? 4.5 : 3.2} fill={c} stroke="#070a1c" strokeWidth="1" /></>}
          </g>
        );
      })}
      {me && (() => {
        const x = px(me.lng), y = py(me.lat);
        if (x < 4 || x > W - 4 || y < 4 || y > H - 4) return null;
        return (
          <g className="me">
            <circle className="me-pulse" cx={x} cy={y} r="9" fill="#4da3ff" opacity=".3" />
            <circle cx={x} cy={y} r="4.2" fill="#4da3ff" stroke="#fff" strokeWidth="1.6" />
          </g>
        );
      })()}
      {labels.map(l => (
        <text key={l.id} x={l.tx} y={l.ty} textAnchor={l.a as "start"} className="stop-t">
          <tspan fontWeight="700">{l.name}</tspan>
          {!compact && <tspan x={l.tx} dy="12" className="stop-sub">{l.label}</tspan>}
        </text>
      ))}
    </svg>
  );
}
