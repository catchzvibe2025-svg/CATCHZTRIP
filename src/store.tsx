import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { Item, StayStatus, Trip } from "./types";
import { demoTrip } from "./demoTrip";

interface State { trips: Trip[]; activeId: string; editing: boolean }

type Action =
  | { type: "select"; id: string }
  | { type: "toggleEdit" }
  | { type: "create"; trip: Trip }
  | { type: "delete"; id: string }
  | { type: "resetDemo" }
  | { type: "addItem"; date: string; item: Item }
  | { type: "removeItem"; date: string; itemId: string }
  | { type: "setStay"; dates: string[]; status: StayStatus };

const KEY = "catchztrip.workspace.v1";
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const stamp = () => new Date().toLocaleString("zh-CN", { hour12: false }).slice(0, 16) + " · 本机修改";

function load(): State {
  const base: State = { trips: [clone(demoTrip)], activeId: demoTrip.id, editing: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as State;
    if (!Array.isArray(s.trips) || !s.trips.length) return base;
    return { ...s, editing: false };
  } catch { return base; }
}

function patchTrip(s: State, fn: (t: Trip) => Trip): State {
  return { ...s, trips: s.trips.map(t => (t.id === s.activeId ? { ...fn(t), updated: stamp() } : t)) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "select": return { ...s, activeId: a.id };
    case "toggleEdit": return { ...s, editing: !s.editing };
    case "create": return { ...s, trips: [...s.trips, a.trip], activeId: a.trip.id, editing: true };
    case "delete": {
      const trips = s.trips.filter(t => t.id !== a.id);
      if (!trips.length) trips.push(clone(demoTrip));
      return { ...s, trips, activeId: s.activeId === a.id ? trips[0].id : s.activeId };
    }
    case "resetDemo": {
      const trips = s.trips.map(t => (t.id === demoTrip.id ? clone(demoTrip) : t));
      if (!trips.some(t => t.id === demoTrip.id)) trips.unshift(clone(demoTrip));
      return { ...s, trips };
    }
    case "addItem":
      return patchTrip(s, t => ({ ...t, days: t.days.map(d => (d.date === a.date ? { ...d, items: [...d.items, a.item] } : d)) }));
    case "removeItem":
      return patchTrip(s, t => ({ ...t, days: t.days.map(d => (d.date === a.date ? { ...d, items: d.items.filter(i => i.id !== a.itemId) } : d)) }));
    case "setStay":
      return patchTrip(s, t => ({ ...t, days: t.days.map(d => (a.dates.includes(d.date) ? { ...d, stay: { ...d.stay, status: a.status } } : d)) }));
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action>; trip: Trip } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, editing: false })); } catch { /* 本机存储不可用时照常运行 */ }
  }, [state]);
  const trip = state.trips.find(t => t.id === state.activeId) ?? state.trips[0];
  return <Ctx.Provider value={{ state, dispatch, trip }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore 需要在 StoreProvider 内使用");
  return v;
}
