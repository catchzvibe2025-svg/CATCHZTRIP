import React from "react";
import { useStore } from "../store";
import type { Trip } from "../types";
import { md, wd, presence, daysBetween, todayISO, stats } from "../utils";
import { Pip, StayTag } from "../ui/bits";
import { Scene } from "../ui/Scene";

/** 全程：每天一张海报 */
export function PlanView({ go }: { go: (r: string) => void }) {
  const { trip, dispatch } = useStore();
  const s = stats(trip), today = todayISO();
  return (
    <div className="page">
      <header className="page-head">
        <span className="k">{md(trip.start)} – {md(trip.end)} · {s.days} 天</span>
        <h1 className="display">{trip.name}</h1>
        {trip.tagline && <p className="muted">{trip.tagline}{trip.vehicle ? ` · ${trip.vehicle.name}` : ""}</p>}
        <dl className="figures">
          <div><dd>{s.planned}</dd><dt>天已排</dt></div>
          <div><dd>{s.booked}<i>/{s.nights}</i></dd><dt>晚已订</dt></div>
          <div><dd>{s.work}</dd><dt>个工作日</dt></div>
          <div><dd>{s.open}</dd><dt>项待定</dt></div>
        </dl>
      </header>
      <div className="posters">
        {trip.days.map(d => (
          <button key={d.date} type="button" className="poster" onClick={() => { dispatch({ type: "pickDay", date: d.date }); go("today"); }}>
            <Scene spec={d.scene} seed={trip.id + d.date} />
            <span className="poster-scrim" />
            <span className="poster-top">
              <span className="daycount"><b>{String(daysBetween(trip.start, d.date) + 1).padStart(2, "0")}</b></span>
              {d.date === today ? <span className="live"><i />今天</span> : d.work ? <span className="stamp sm">工作日</span> : null}
            </span>
            <span className="poster-main">
              <span className="num">{md(d.date).replace("/", ".")}</span>
              <span className="wd">{wd(d.date)}</span>
              <span className="poster-place">{d.place}</span>
              <span className="poster-title">{d.title}</span>
              <span className="poster-foot">
                <span className="pips">{trip.members.map(m => presence(d, m) === "with" && <Pip key={m.id} m={m} size={7} />)}</span>
                <span className={"dotstat s-" + d.stay.status}>{d.stay.status === "booked" ? "住宿已订" : d.stay.status === "road" ? "夜里在路上" : "住宿待定"}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <LaterBlock trip={trip} />
    </div>
  );
}

export function LaterBlock({ trip }: { trip: Trip }) {
  return (
    <section className="later" id="later">
      <div className="later-head">
        <span className="num">{md(trip.later.from).replace("/", ".")} <i>→</i> {md(trip.end).replace("/", ".")}</span>
        <StayTag status="tbd" />
      </div>
      <p className="muted">目前只确定下面几个锚点，其余安排还没写定。</p>
      {trip.later.anchors.length > 0 && (
        <ul className="anchors">
          {trip.later.anchors.map(a => (
            <li key={a.date + a.title} className={a.kind === "end" ? "end" : ""}>
              <span className="num">{md(a.date).replace("/", ".")}</span>
              <span><b>{a.title}</b><span className="muted"> {wd(a.date)}{a.note ? ` · ${a.note}` : ""}</span></span>
            </li>
          ))}
        </ul>
      )}
      <div className="people">
        {trip.members.map(m => (
          <div key={m.id} className="person"><span className="nm"><Pip m={m} />{m.short}</span><span>{trip.later.where[m.id] ?? "待定"}</span></div>
        ))}
      </div>
      <div className="bigtbd">其余待定，随时更新</div>
    </section>
  );
}
