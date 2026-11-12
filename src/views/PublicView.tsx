import React from "react";
import { useStore } from "../store";
import { md } from "../utils";
import { RouteMap } from "../ui/RouteMap";
import { Pip } from "../ui/bits";
import { DayBody, DayHero } from "./DayView";
import { LaterBlock } from "./PlanView";
import { WorkView } from "./WorkView";
import { sceneAccent } from "../ui/Scene";

/** 公开分享页：只读，没有应用外壳 */
export function PublicView() {
  const { trip } = useStore();
  return (
    <div className="public">
      <header className="page-head">
        <span className="k">行程分享 · {md(trip.start)} – {md(trip.end)}</span>
        <h1 className="display">{trip.name}</h1>
        <p className="muted">{trip.tagline}{trip.vehicle ? ` · ${trip.vehicle.name}` : ""}</p>
        <div className="legend">
          {trip.members.map(m => <span key={m.id}><Pip m={m} /><b>{m.short}</b> {m.name} · {m.span}</span>)}
        </div>
      </header>
      {trip.stops.length > 0 && <div className="map-card"><RouteMap stops={trip.stops} guides={trip.guides} members={trip.members} region="all" compact regions={trip.regions} /></div>}
      {trip.days.map(d => (
        <article key={d.date} className="pubday" style={{ "--accent": sceneAccent(d.scene) } as React.CSSProperties}>
          <DayHero day={d} trip={trip} />
          <div className="daybody"><DayBody day={d} trip={trip} live={false} editing={false} /></div>
        </article>
      ))}
      <WorkView />
      <LaterBlock trip={trip} />
      <footer className="pub-foot">最后更新：{trip.updated}<br />用 <b>CATCHZTRIP</b> 制作</footer>
    </div>
  );
}
