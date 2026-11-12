import React, { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { md, stats } from "./utils";
import { Avatar, Icon } from "./ui/bits";
import { DayView } from "./views/DayView";
import { PlanView } from "./views/PlanView";
import { MapView } from "./views/MapView";
import { ListsView } from "./views/ListsView";
import { ShareView } from "./views/ShareView";
import { PublicView } from "./views/PublicView";
import { TripsView } from "./views/TripsView";
import { Scene } from "./ui/Scene";
import { defaultDay } from "./views/DayView";

const TABS = [
  { id: "today", label: "此刻", icon: "sun", match: ["today"] },
  { id: "plan", label: "全程", icon: "trips", match: ["plan"] },
  { id: "map", label: "路线", icon: "map", match: ["map"] },
  { id: "stays", label: "清单", icon: "plan", match: ["stays", "work", "open"] },
  { id: "share", label: "分享", icon: "share", match: ["share"] },
];
const ROUTES = ["trips", "public", "today", "plan", "map", "stays", "work", "open", "share"];

function useRoute() {
  const read = () => { const h = location.hash.slice(1); return ROUTES.includes(h) ? h : "today"; };
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo(0, 0); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return [r, (x: string) => { if (location.hash.slice(1) === x) window.scrollTo(0, 0); else location.hash = x; }] as const;
}

const Wordmark = () => <span className="wordmark"><i>Catchz</i><b>TRIP</b></span>;

function Shell() {
  const [route, go] = useRoute();
  const { trip, state, dispatch } = useStore();
  if (route === "public") return <PublicView />;
  const s = stats(trip);
  const lists = ["stays", "work", "open"].includes(route);
  const view = route === "trips" ? <TripsView go={go} /> : route === "today" ? <DayView /> : route === "plan" ? <PlanView go={go} />
    : route === "map" ? <MapView /> : lists ? <ListsView route={route} go={go} /> : <ShareView />;
  const canEdit = route === "today" || route === "stays";
  return (
    <div className={"app r-" + route}>
      <aside className="side">
        <a className="brand" href="#trips"><Wordmark /></a>
        <div className="side-trip">
          <span className="k">当前行程</span>
          <b className="display">{trip.name}</b>
          <span className="num muted">{md(trip.start)} – {md(trip.end)}</span>
          <div className="avatars">{trip.members.map(m => <Avatar key={m.id} m={m} />)}</div>
          {trip.vehicle && <span className="small muted">{trip.vehicle.name}</span>}
        </div>
        <nav className="side-nav" aria-label="行程功能">
          {TABS.map(t => (
            <a key={t.id} href={"#" + t.id} className={"side-link" + (t.match.includes(route) ? " on" : "")}>
              <Icon name={t.icon} />{t.label}
              {t.id === "stays" && <span className="count">{s.open}</span>}
            </a>
          ))}
          <a className={"side-link" + (route === "trips" ? " on" : "")} href="#trips"><Icon name="stays" />全部行程</a>
        </nav>
        <div className="side-foot muted small">演示版 · 修改只存在本机</div>
      </aside>

      <div className="main">
        <header className="top">
          <a className="brand brand-m" href="#trips" aria-label="全部行程"><Wordmark /></a>
          {canEdit && (
            <button type="button" className={"pill" + (state.editing ? " pill-on" : "")} onClick={() => dispatch({ type: "toggleEdit" })} aria-pressed={state.editing}>
              <Icon name={state.editing ? "check" : "edit"} />{state.editing ? "完成" : "编辑"}
            </button>
          )}
        </header>
        <main className="content">{view}</main>
      </div>

      <nav className="tabbar" aria-label="行程功能">
        {TABS.map(t => (
          <a key={t.id} href={"#" + t.id} className={t.match.includes(route) ? "on" : ""} aria-current={t.match.includes(route) ? "page" : undefined}>
            <Icon name={t.icon} /><span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

/** 每次打开 app 的头一屏：今天的画面铺满，名字浮出来，然后退场。减少动态效果时不出现 */
function Intro() {
  const { trip } = useStore();
  const [show, setShow] = useState(() => {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || location.hash === "#public") return false;
      if (sessionStorage.getItem("catchztrip.intro")) return false;
      sessionStorage.setItem("catchztrip.intro", "1");
      return true;
    } catch { return false; }
  });
  useEffect(() => { if (!show) return; const id = setTimeout(() => setShow(false), 2300); return () => clearTimeout(id); }, [show]);
  if (!show) return null;
  const day = defaultDay(trip);
  return (
    <div className="intro" onClick={() => setShow(false)} aria-hidden="true">
      <Scene spec={day.scene} seed={trip.id + day.date} />
      <div className="intro-in">
        <span className="intro-mark"><i>Catchz</i><b>TRIP</b></span>
        <span className="intro-sub">{day.place || trip.name}</span>
      </div>
    </div>
  );
}

export function App() {
  return <StoreProvider><Shell /><Intro /></StoreProvider>;
}
