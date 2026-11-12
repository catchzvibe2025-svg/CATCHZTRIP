import React from "react";
import { useStore } from "../store";
import { md, stayRuns, addDays, wd } from "../utils";
import type { StayStatus } from "../types";
import { NavLink, SectionHead, StayTag } from "../ui/bits";

const NEXT: Record<StayStatus, StayStatus> = { tbd: "booked", booked: "tbd", road: "road" };

export function StaysView() {
  const { trip, state, dispatch } = useStore();
  const runs = stayRuns(trip);
  const nights = trip.days.filter(d => d.stay.status !== "road");
  const booked = nights.filter(d => d.stay.status === "booked").length;
  return (
    <div className="stack">
      <SectionHead title="住宿" aside={state.editing ? "编辑中：点状态可切换" : "只显示住处名称和状态"} />
      <div className="card meter-card">
        <div className="meter-top"><b className="mono">{booked}/{nights.length}</b><span>晚已订</span></div>
        <div className="meter" role="img" aria-label={`${nights.length} 晚中已订 ${booked} 晚`}>
          {trip.days.map(d => <span key={d.date} className={"m-" + d.stay.status} title={md(d.date) + " " + d.stay.name} />)}
        </div>
        <div className="meter-key"><span><i className="sw m-booked" />已订</span><span><i className="sw m-tbd" />待定</span><span><i className="sw m-road" />在路上</span></div>
      </div>
      <ul className="runs">
        {runs.map(r => {
          const d = r.days[0];
          return (
            <li key={r.from} className={"card run run-" + d.stay.status}>
              <div className="run-date mono">
                <span>{md(r.from)} {wd(r.from)}</span>
                <span className="muted">{r.nights > 1 ? `→ ${md(addDays(r.from, r.nights))} · ${r.nights} 晚` : d.stay.status === "road" ? "夜间" : "1 晚"}</span>
              </div>
              <div className="run-main">
                <b>{d.stay.name}</b>
                {d.stay.sub && <span className="muted">{d.stay.sub}</span>}
                <NavLink place={d.stay.place} />
              </div>
              <StayTag status={d.stay.status}
                onClick={state.editing && d.stay.status !== "road" ? () => dispatch({ type: "setStay", dates: r.days.map(x => x.date), status: NEXT[d.stay.status] }) : undefined} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
