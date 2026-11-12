import React from "react";
import { useStore } from "../store";
import { md } from "../utils";
import { RouteMap } from "../ui/RouteMap";
import { Pip } from "../ui/bits";
import { DayCard, LaterBlock } from "./PlanView";
import { WorkView } from "./WorkView";

/** 公开分享页：只读，没有应用外壳 */
export function PublicView() {
  const { trip } = useStore();
  const y0 = trip.start.slice(0, 4), y1 = trip.end.slice(0, 4);
  return (
    <div className="public">
      <header className="hero card">
        <div className="eyebrow">{y0 === y1 ? y0 : `${y0}–${y1}`} · 行程分享</div>
        <h1>{trip.name}</h1>
        <div className="range"><span className="mono">{md(trip.start)} – {md(trip.end)}</span><span className="muted">{trip.tagline}{trip.vehicle ? ` · ${trip.vehicle.name}` : ""}</span></div>
        <div className="legend">
          {trip.members.map(m => (
            <div key={m.id} className="who" style={{ background: `var(--${m.color}-bg)` }}>
              <b><Pip m={m} />{m.short}</b><small>{m.name} · {m.span}</small>
            </div>
          ))}
        </div>
        {trip.stops.length > 0 && <div className="map-card inset"><RouteMap stops={trip.stops} guides={trip.guides} members={trip.members} region="all" compact regions={trip.regions} /></div>}
      </header>
      {trip.days.map(d => <DayCard key={d.date} day={d} trip={trip} editing={false} />)}
      <WorkView />
      <LaterBlock trip={trip} />
      <footer className="pub-foot">最后更新：{trip.updated}<br />用 <b>CATCHZTRIP</b> 制作</footer>
    </div>
  );
}
