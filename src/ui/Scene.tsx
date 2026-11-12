import React, { useEffect, useRef } from "react";
import type { SceneSpec } from "../types";

/* 生成式风景：每天一张，按场景类型和时段用 canvas 画出来。同一天永远画出同一张。 */

type Tod = SceneSpec["tod"];
const TOD: Record<Tod, { sky: [string, string, string]; sun: number | null; sunC: string; haze: string; accent: string }> = {
  night: { sky: ["#05081a", "#111943", "#2a2a5e"], sun: null, sunC: "#e9ecff", haze: "#34386f", accent: "#8ea2ff" },
  dawn: { sky: ["#25336a", "#c98499", "#ffd3a1"], sun: 0.6, sunC: "#fff1cf", haze: "#eeb3a0", accent: "#ef8d7c" },
  day: { sky: ["#2f7fc0", "#8fc7e2", "#f0f1df"], sun: 0.2, sunC: "#fffbe8", haze: "#cfe2e2", accent: "#3a9bd1" },
  golden: { sky: ["#35528f", "#ee935a", "#ffd9a0"], sun: 0.5, sunC: "#fff0c2", haze: "#f5b377", accent: "#f0973f" },
  dusk: { sky: ["#191540", "#a33a6e", "#f58c5a"], sun: 0.63, sunC: "#ffd08a", haze: "#c7577a", accent: "#ee5f86" },
};
export const sceneAccent = (s: SceneSpec) => (s.type === "studio" ? "#a58bff" : TOD[s.tod].accent);

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function mix(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function ridge(ctx: CanvasRenderingContext2D, w: number, h: number, base: number, amp: number, freq: number, r: () => number, fill: string | CanvasGradient) {
  const p = [r() * 6.28, r() * 6.28, r() * 6.28];
  const y = (x: number) => base - amp * (0.55 * Math.sin((x / w) * freq + p[0]) + 0.3 * Math.sin((x / w) * freq * 2.3 + p[1]) + 0.15 * Math.sin((x / w) * freq * 5.1 + p[2]));
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 3) ctx.lineTo(x, y(x));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  return y;
}

function cactus(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number) {
  const t = s * 0.16;
  ctx.lineCap = "round"; ctx.lineWidth = t;
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.1); ctx.lineTo(x, y - s); ctx.stroke();
  for (const d of [-1, 1]) {
    if (r() < 0.2) continue;
    const ay = y - s * (0.3 + r() * 0.3), ax = x + d * s * (0.22 + r() * 0.1), top = ay - s * (0.2 + r() * 0.3);
    ctx.lineWidth = t * 0.8;
    ctx.beginPath(); ctx.moveTo(x, ay); ctx.quadraticCurveTo(ax, ay, ax, ay - s * 0.12); ctx.lineTo(ax, top); ctx.stroke();
  }
}

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number) {
  const lean = (r() - 0.5) * s * 0.25, tx = x + lean, ty = y - s;
  ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - s * 0.5, tx, ty); ctx.stroke();
  ctx.lineWidth = Math.max(1, s * 0.03);
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.05 + (i / 8) * 0.9) + (r() - 0.5) * 0.2, l = s * (0.2 + r() * 0.1);
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * l * 0.7, ty + Math.sin(a) * l * 0.9, tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.4 + l * 0.35);
    ctx.stroke();
  }
}

let grain: HTMLCanvasElement | null = null;
function grainTile() {
  if (grain) return grain;
  grain = document.createElement("canvas"); grain.width = grain.height = 160;
  const g = grain.getContext("2d")!, d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 20; }
  g.putImageData(d, 0, 0);
  return grain;
}

export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, spec: SceneSpec, seed: string) {
  const r = rng(seed + spec.type), T = TOD[spec.tod], dark = spec.tod === "night";
  ctx.clearRect(0, 0, w, h);

  if (spec.type === "studio") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0d0a1c"); g.addColorStop(0.7, "#2a1f55"); g.addColorStop(1, "#15102c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const floor = h * 0.74;
    for (const [cx, c] of [[0.22, "#8f7bff"], [0.55, "#ffb07a"], [0.82, "#ff7aa8"]] as [number, string][]) {
      const x = w * cx, cg = ctx.createLinearGradient(x, 0, x, floor);
      cg.addColorStop(0, c + "66"); cg.addColorStop(1, c + "00");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x - w * 0.015, 0); ctx.lineTo(x + w * 0.015, 0); ctx.lineTo(x + w * 0.2, floor); ctx.lineTo(x - w * 0.2, floor); ctx.fill();
      const eg = ctx.createRadialGradient(x, floor, 0, x, floor, w * 0.22);
      eg.addColorStop(0, c + "55"); eg.addColorStop(1, c + "00");
      ctx.save(); ctx.translate(0, floor); ctx.scale(1, 0.22); ctx.translate(0, -floor); ctx.fillStyle = eg; ctx.fillRect(0, floor - w, w, w * 2); ctx.restore();
    }
    ctx.strokeStyle = "#ffffff22"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, floor); ctx.lineTo(w, floor); ctx.stroke();
    // 三脚架上的摄影机剪影
    const cx = w * 0.5, cy = floor - h * 0.17, u = h * 0.045;
    ctx.fillStyle = ctx.strokeStyle = "#0a0716"; ctx.lineWidth = Math.max(1.5, u * 0.16);
    ctx.fillRect(cx - u * 1.3, cy - u * 0.7, u * 2.2, u * 1.4); ctx.fillRect(cx + u * 0.9, cy - u * 0.35, u * 0.9, u * 0.7);
    ctx.beginPath(); ctx.arc(cx - u * 0.7, cy - u * 1.1, u * 0.6, 0, 7); ctx.arc(cx + u * 0.4, cy - u * 1.1, u * 0.6, 0, 7); ctx.fill();
    for (const dx of [-1.6, 0, 1.6]) { ctx.beginPath(); ctx.moveTo(cx, cy + u * 0.7); ctx.lineTo(cx + dx * u, floor + u * 0.3); ctx.stroke(); }
  } else {
    const horizon = h * (spec.type === "road" ? 0.6 : spec.type === "coast" || spec.type === "camp" ? 0.56 : 0.64);
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, T.sky[0]); g.addColorStop(0.62, T.sky[1]); g.addColorStop(1, T.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    if (dark || spec.tod === "dusk") {
      const n = dark ? 150 : 40;
      for (let i = 0; i < n; i++) {
        const x = r() * w, y = r() * horizon * (dark ? 0.95 : 0.5), s = r();
        ctx.fillStyle = `rgba(255,255,255,${0.25 + s * 0.7})`; ctx.fillRect(x, y, s > 0.92 ? 2 : 1, s > 0.92 ? 2 : 1);
      }
    }
    // 日 / 月
    const sx = w * (0.58 + r() * 0.2), sy = T.sun == null ? h * 0.16 : horizon * (T.sun + 0.36), sr = h * (T.sun == null ? 0.035 : 0.06);
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 7);
    glow.addColorStop(0, T.sunC + (dark ? "44" : "cc")); glow.addColorStop(0.25, T.sunC + (dark ? "18" : "55")); glow.addColorStop(1, T.sunC + "00");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = T.sunC; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
    if (dark) { ctx.fillStyle = T.sky[0]; ctx.beginPath(); ctx.arc(sx + sr * 0.45, sy - sr * 0.2, sr * 0.92, 0, 7); ctx.fill(); }

    const fgBy: Record<string, string> = { hills: "#16121f", dunes: dark ? "#3c3a5a" : "#7a5568", saguaro: "#1d0f0d", city: "#150d1c", coast: "#0f1a22", camp: "#070a12", road: "#05060c" };
    const fg = fgBy[spec.type];
    const hz = spec.type === "dunes" ? mix(T.haze, "#fff4ee", 0.55) : T.haze;

    if (spec.type === "coast" || spec.type === "camp") {
      ridge(ctx, w, h, horizon + h * 0.004, h * 0.035, 5, r, mix(hz, fg, 0.35)); // 远处岬角
      const sea = ctx.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, mix(T.sky[2], "#1c5a78", dark ? 0.85 : 0.45)); sea.addColorStop(1, mix(T.sky[0], "#06202c", 0.6));
      ctx.fillStyle = sea; ctx.fillRect(0, horizon, w, h - horizon);
      for (let i = 0; i < 46; i++) { // 水面反光
        const t = r(), y = horizon + t * t * (h - horizon) * 0.8, lw = w * (0.012 + t * 0.07) * (0.4 + r());
        ctx.fillStyle = T.sunC + (dark ? "30" : "88"); ctx.fillRect(sx - lw / 2 + (r() - 0.5) * w * 0.05 * (1 + t * 3), y, lw, Math.max(1, h * 0.004));
      }
      const top = ridge(ctx, w, h, h * 0.9, h * 0.07, 3.2, r, fg); // 近处崖
      if (spec.type === "camp") {
        const x = w * 0.3, y = top(x) - h * 0.012, u = h * 0.03; // 崖上的车和一点暖光
        const lg = ctx.createRadialGradient(x, y, 0, x, y, u * 6); lg.addColorStop(0, "#ffc27a88"); lg.addColorStop(1, "#ffc27a00");
        ctx.fillStyle = lg; ctx.fillRect(x - u * 6, y - u * 6, u * 12, u * 12);
        ctx.fillStyle = "#04060b"; ctx.beginPath(); ctx.roundRect(x - u * 1.6, y - u * 0.7, u * 3.2, u * 0.8, u * 0.3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x - u, y - u * 1.25, u * 2, u * 0.8, u * 0.4); ctx.fill();
        ctx.fillStyle = "#ffcf8f"; ctx.fillRect(x - u * 0.7, y - u * 1.05, u * 1.3, u * 0.32);
      } else {
        ctx.strokeStyle = fg; palm(ctx, w * 0.12, top(w * 0.12) + 4, h * 0.3, r); palm(ctx, w * 0.2, top(w * 0.2) + 4, h * 0.22, r);
      }
    } else if (spec.type === "road") {
      ridge(ctx, w, h, horizon, h * 0.03, 6, r, mix(hz, fg, 0.5));
      ridge(ctx, w, h, horizon + h * 0.012, h * 0.012, 9, r, mix(hz, fg, 0.85));
      ctx.fillStyle = fg; ctx.fillRect(0, horizon + h * 0.012, w, h);
      const vx = w * 0.5, vy = horizon + h * 0.012;
      const hl = ctx.createRadialGradient(vx, h * 1.05, 0, vx, h * 1.05, h * 0.6);
      hl.addColorStop(0, "#ffe9b855"); hl.addColorStop(1, "#ffe9b800");
      ctx.fillStyle = "#0d0f18"; ctx.beginPath(); ctx.moveTo(vx - 1, vy); ctx.lineTo(vx + 1, vy); ctx.lineTo(w * 0.86, h); ctx.lineTo(w * 0.14, h); ctx.fill();
      ctx.fillStyle = hl; ctx.fillRect(0, vy, w, h - vy);
      for (let i = 0; i < 9; i++) { // 中线
        const a = (i / 9) ** 2.2, b = ((i + 0.45) / 9) ** 2.2, y0 = vy + a * (h - vy), y1 = vy + b * (h - vy);
        ctx.fillStyle = `rgba(255,214,120,${0.35 + a * 0.6})`;
        ctx.beginPath(); ctx.moveTo(vx - a * w * 0.012, y0); ctx.lineTo(vx + a * w * 0.012, y0); ctx.lineTo(vx + b * w * 0.012, y1); ctx.lineTo(vx - b * w * 0.012, y1); ctx.fill();
      }
      ctx.fillStyle = "#ff5a4d"; ctx.fillRect(vx + w * 0.02, vy + h * 0.02, 2, 2); ctx.fillRect(vx + w * 0.028, vy + h * 0.02, 2, 2);
    } else {
      const n = spec.type === "dunes" ? 5 : 4;
      if (spec.type === "city") { // 远处天际线
        ctx.fillStyle = mix(hz, fg, 0.25);
        for (let x = w * 0.3; x < w * 0.75; ) { const bw = w * (0.012 + r() * 0.02), bh = h * (0.03 + r() * r() * 0.17); ctx.fillRect(x, horizon - bh, bw, bh + 4); x += bw + r() * w * 0.006; }
      }
      let last: (x: number) => number = () => h;
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n, base = horizon + (h - horizon) * (i / n) * 0.82;
        const amp = h * (spec.type === "dunes" ? 0.035 : spec.type === "city" ? 0.02 : 0.075) * (1 - t * 0.35);
        const freq = spec.type === "dunes" ? 3 + i * 0.8 : 5 + i * 1.7;
        const col = mix(hz, fg, spec.type === "dunes" ? t * 0.75 : Math.pow(t, 0.8));
        const lg = ctx.createLinearGradient(0, base - amp, 0, base + h * 0.2);
        lg.addColorStop(0, col); lg.addColorStop(1, mix(hz, fg, Math.min(1, t + 0.25)));
        last = ridge(ctx, w, h, base, amp, freq, r, lg);
        if (spec.type === "saguaro" && i >= 1) {
          ctx.strokeStyle = mix(hz, fg, Math.pow(t, 0.8));
          for (let k = 0; k < 2 + i * 2; k++) { const x = r() * w; cactus(ctx, x, last(x), h * (0.035 + i * 0.03) * (0.7 + r() * 0.6), r); }
        }
      }
      if (spec.type === "city") { ctx.strokeStyle = fg; for (let k = 0; k < 7; k++) { const x = w * (0.04 + r() * 0.92); palm(ctx, x, last(x) + 6, h * (0.2 + r() * 0.22), r); } }
      if (spec.type === "saguaro") { ctx.strokeStyle = fg; cactus(ctx, w * 0.16, h * 1.02, h * 0.42, r); }
    }
  }
  ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = ctx.createPattern(grainTile(), "repeat")!; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

export function Scene({ spec, seed, className }: { spec: SceneSpec; seed: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
      if (!w || !h) return;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, w, h, spec, seed);
    };
    paint();
    const ro = new ResizeObserver(paint); ro.observe(c);
    return () => ro.disconnect();
  }, [spec.type, spec.tod, seed]);
  return <canvas ref={ref} className={"scene " + (className ?? "")} aria-hidden="true" />;
}
