import React, { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { md, stats } from "./utils";
import { Avatar, Icon } from "./ui/bits";
import { PlanView } from "./views/PlanView";
import { MapView } from "./views/MapView";
import { StaysView } from "./views/StaysView";
import { WorkView } from "./views/WorkView";
import { OpenView } from "./views/OpenView";
import { ShareView } from "./views/ShareView";
import { PublicView } from "./views/PublicView";
import { TripsView } from "./views/TripsView";

const TABS = [
  { id: "plan", label: "日程", icon: "plan" },
  { id: "map", label: "路线", icon: "map" },
  { id: "stays", label: "住宿", icon: "stays" },
  { id: "work", label: "工作日", icon: "work" },
  { id: "open", label: "待定", icon: "open" },
  { id: "share", label: "分享", icon: "share" },
] as const;
const ROUTES = ["trips", "public", ...TABS.map(t => t.id)];

function useRoute() {
  const read = () => { const h = location.hash.slice(1); return ROUTES.includes(h) ? h : "plan"; };
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo(0, 0); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return [r, (x: string) => { location.hash = x; }] as const;
}

function Shell() {
  const [route, go] = useRoute();
  const { trip, state, dispatch } = useStore();
  if (route === "public") return <PublicView />;
  const s = stats(trip);
  const view = {
    trips: <TripsView go={go} />, plan: <PlanView />, map: <MapView />, stays: <StaysView />,
    work: <WorkView />, open: <OpenView />, share: <ShareView />,
  }[route]!;
  const inTrip = route !== "trips";
  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href="#trips"><span className="logo" aria-hidden="true">途</span><span>CATCHZTRIP</span></a>
        <a className={"side-link" + (route === "trips" ? " on" : "")} href="#trips"><Icon name="trips" />全部行程</a>
        <div className="side-trip">
          <span className="side-k">当前行程</span>
          <b>{trip.name}</b>
          <span className="mono muted">{md(trip.start)} – {md(trip.end)}</span>
          <div className="avatars">{trip.members.map(m => <Avatar key={m.id} m={m} />)}</div>
          {trip.vehicle && <span className="small muted">{trip.vehicle.ev ? "⚡ " : ""}{trip.vehicle.name}</span>}
        </div>
        <nav className="side-nav" aria-label="行程功能">
          {TABS.map(t => (
            <a key={t.id} href={"#" + t.id} className={"side-link" + (route === t.id ? " on" : "")}>
              <Icon name={t.icon} />{t.label}
              {t.id === "open" && <span className="count">{s.open}</span>}
            </a>
          ))}
        </nav>
        <div className="side-foot muted small">演示版 · 数据存在本机</div>
      </aside>

      <div className="main">
        <header className="top">
          <a className="brand brand-m" href="#trips"><span className="logo" aria-hidden="true">途</span></a>
          <div className="top-title">
            {inTrip ? <><b>{trip.name}</b><span className="mono muted">{md(trip.start)} – {md(trip.end)} · {s.days} 天</span></> : <b>工作室行程</b>}
          </div>
          {inTrip && route !== "share" && (
            <button type="button" className={"btn " + (state.editing ? "btn-primary" : "btn-ghost")} onClick={() => dispatch({ type: "toggleEdit" })} aria-pressed={state.editing}>
              <Icon name={state.editing ? "check" : "edit"} />{state.editing ? "完成" : "编辑"}
            </button>
          )}
        </header>
        {inTrip && route === "plan" && (
          <div className="summary">
            <div><span>成员</span><b className="mono">{trip.members.length}</b></div>
            <div><span>住宿已订</span><b className="mono">{s.booked}/{s.nights}</b></div>
            <div><span>工作日</span><b className="mono">{s.work}</b></div>
            <a href="#open"><span>待定</span><b className="mono">{s.open}</b></a>
          </div>
        )}
        <main className="content">{view}</main>
      </div>

      <nav className="tabbar" aria-label="行程功能">
        {TABS.map(t => (
          <a key={t.id} href={"#" + t.id} className={route === t.id ? "on" : ""} aria-current={route === t.id ? "page" : undefined}>
            <Icon name={t.icon} /><span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
