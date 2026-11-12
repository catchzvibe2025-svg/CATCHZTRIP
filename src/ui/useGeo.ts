import { useEffect, useState } from "react";

/* 本机定位：只在这台设备上用来算距离和画点，不上传、不写进任何文件。 */
export interface Geo { status: "off" | "asking" | "on" | "denied" | "unsupported"; lat?: number; lng?: number; acc?: number; at?: number }

const KEY = "catchztrip.geo";
let state: Geo = { status: "off" };
let watch: number | null = null;
const subs = new Set<(g: Geo) => void>();
const set = (g: Geo) => { state = g; subs.forEach(f => f(g)); };

export function startGeo() {
  if (!("geolocation" in navigator)) return set({ status: "unsupported" });
  if (watch != null) return;
  set({ ...state, status: state.status === "on" ? "on" : "asking" });
  watch = navigator.geolocation.watchPosition(
    p => { try { localStorage.setItem(KEY, "1"); } catch { /* 忽略 */ } set({ status: "on", lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, at: p.timestamp }); },
    e => { if (watch != null) navigator.geolocation.clearWatch(watch); watch = null; set({ status: e.code === 1 ? "denied" : "off" }); },
    { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 },
  );
}
export function stopGeo() {
  if (watch != null) navigator.geolocation.clearWatch(watch);
  watch = null;
  try { localStorage.removeItem(KEY); } catch { /* 忽略 */ }
  set({ status: "off" });
}

export function useGeo(): Geo {
  const [g, setG] = useState(state);
  useEffect(() => {
    subs.add(setG);
    // 之前在这台设备上开过，就自动继续
    try { if (state.status === "off" && localStorage.getItem(KEY)) startGeo(); } catch { /* 忽略 */ }
    return () => { subs.delete(setG); };
  }, []);
  return g;
}
