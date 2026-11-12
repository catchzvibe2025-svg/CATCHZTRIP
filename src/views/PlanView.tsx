import React, { useState } from "react";
import { useStore } from "../store";
import type { Day, ItemKind, Trip } from "../types";
import { md, wd, presence, whereText, isOpen, itemKind } from "../utils";
import { Icon, NavLink, Pip, SectionHead, StayTag } from "../ui/bits";

export function PlanView() {
  const { trip, state } = useStore();
  const [who, setWho] = useState<string | null>(null);
  const days = who ? trip.days.filter(d => presence(d, trip.members.find(m => m.id === who)!) === "with") : trip.days;

  return (
    <div className="stack">
      <DateStrip trip={trip} />
      <div className="filter" role="group" aria-label="按成员筛选">
        <button type="button" className={"fchip" + (who ? "" : " on")} onClick={() => setWho(null)}>全部成员</button>
        {trip.members.map(m => (
          <button type="button" key={m.id} className={"fchip" + (who === m.id ? " on" : "")} onClick={() => setWho(who === m.id ? null : m.id)}>
            <Pip m={m} /> {m.short} 的日程
          </button>
        ))}
      </div>
      <SectionHead title={`每日行程 ${md(trip.days[0]?.date ?? trip.start)}–${md(trip.days[trip.days.length - 1]?.date ?? trip.end)}`} aside="当地时间 · 车程为规划预估" />
      {days.length === 0 && <div className="empty">这段时间里没有该成员的安排。</div>}
      {days.map(d => <DayCard key={d.date} day={d} trip={trip} editing={state.editing} />)}
      <LaterBlock trip={trip} />
    </div>
  );
}

function DateStrip({ trip }: { trip: Trip }) {
  return (
    <nav className="strip" aria-label="按日期跳转">
      <div className="strip-in">
        {trip.days.map(d => (
          <a key={d.date} className={"chip" + (d.work ? " work" : "")} href={"#plan"} onClick={e => { e.preventDefault(); document.getElementById("d" + d.date)?.scrollIntoView({ block: "start" }); }}>
            <span className="mono">{md(d.date)}</span>
            <span className="pips">{trip.members.filter(m => presence(d, m) === "with").map(m => <Pip key={m.id} m={m} size={6} />)}</span>
          </a>
        ))}
        <a className="chip" href="#plan" onClick={e => { e.preventDefault(); document.getElementById("later")?.scrollIntoView({ block: "start" }); }}>
          <span className="mono">{md(trip.later.from)}+</span><span className="chip-tbd">待定</span>
        </a>
      </div>
    </nav>
  );
}

const KIND_LABEL: Record<ItemKind, string> = { normal: "普通", work: "工作", meet: "接人", fly: "航班", charge: "充电" };

export function DayCard({ day, trip, editing }: { day: Day; trip: Trip; editing: boolean }) {
  const { dispatch } = useStore();
  return (
    <article className="day card" id={"d" + day.date}>
      <header className="day-head">
        <div className="date"><div className="mono md">{md(day.date)}</div><div className="wd">{wd(day.date)}</div></div>
        <div className="head-main">
          {day.work && <span className="work-flag">工作日 · {day.work}</span>}
          <h3>{day.title || <span className="muted">还没写标题</span>}</h3>
          <span className="tzlabel">{day.tz}</span>
        </div>
      </header>
      <div className="people">
        {trip.members.map(m => {
          const p = presence(day, m);
          return (
            <div key={m.id} className={"person" + (p !== "with" ? " off" : "")}>
              <span className="nm"><Pip m={m} dim={p !== "with"} />{m.short}</span>
              <span>{whereText(day, m)}</span>
            </div>
          );
        })}
      </div>
      <ol className="tl">
        {day.items.map(i => (
          <li key={i.id} className={"k-" + itemKind(i)}>
            <span className="t mono">{i.t}</span>
            <span className="a">
              <b>{i.title}</b> <NavLink place={i.place} />
              {i.note && <span className={"note" + (isOpen(i.note) ? " note-open" : "")}>{i.note}</span>}
            </span>
            {editing && (
              <button type="button" className="icon-btn del" aria-label={"删除 " + i.title}
                onClick={() => dispatch({ type: "removeItem", date: day.date, itemId: i.id })}><Icon name="x" /></button>
            )}
          </li>
        ))}
        {day.items.length === 0 && <li className="tl-empty"><span /><span className="a muted">这一天还没有安排。</span></li>}
      </ol>
      {editing && <AddItem date={day.date} />}
      {day.tip && <div className="tip"><b>小提示</b>{day.tip}</div>}
      <div className="stay">
        <span className="lbl">今晚住这里</span>
        <div className="row"><span className="nm">{day.stay.name}</span><StayTag status={day.stay.status} /></div>
        {(day.stay.sub || day.stay.place) && <span className="sub">{day.stay.sub} <NavLink place={day.stay.place} /></span>}
      </div>
    </article>
  );
}

function AddItem({ date }: { date: string }) {
  const { dispatch } = useStore();
  const [t, setT] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<ItemKind>("normal");
  const [place, setPlace] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch({
      type: "addItem", date,
      item: { id: "n" + Date.now().toString(36), t: t.trim() || "待定", title: title.trim(), note: note.trim() || undefined, kind, place: place.trim() ? { q: place.trim() } : undefined },
    });
    setT(""); setTitle(""); setNote(""); setPlace(""); setKind("normal");
  };
  return (
    <form className="add" onSubmit={submit}>
      <div className="add-row">
        <input id={"t-" + date} className="in in-t" placeholder="时间" value={t} onChange={e => setT(e.target.value)} aria-label="时间" />
        <input id={"title-" + date} className="in" placeholder="安排，例如：Getty Center" value={title} onChange={e => setTitle(e.target.value)} aria-label="安排" required />
      </div>
      <div className="add-row">
        <input id={"note-" + date} className="in" placeholder="备注（可选）" value={note} onChange={e => setNote(e.target.value)} aria-label="备注" />
        <input id={"place-" + date} className="in" placeholder="导航地点（可选）" value={place} onChange={e => setPlace(e.target.value)} aria-label="导航地点" />
      </div>
      <div className="add-row">
        <select id={"kind-" + date} className="in in-kind" value={kind} onChange={e => setKind(e.target.value as ItemKind)} aria-label="类型">
          {(Object.keys(KIND_LABEL) as ItemKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <button type="submit" className="btn btn-primary"><Icon name="plus" />加到 {md(date)}</button>
      </div>
    </form>
  );
}

export function LaterBlock({ trip }: { trip: Trip }) {
  return (
    <section className="later card" id="later">
      <div className="sec-head"><h3>{md(trip.later.from)} – {md(trip.end)}</h3><StayTag status="tbd" /></div>
      <p className="muted">目前只确定下面几个锚点，其余安排还没写定。</p>
      {trip.later.anchors.length > 0 && (
        <ul className="anchors">
          {trip.later.anchors.map(a => (
            <li key={a.date + a.title} className={a.kind === "end" ? "end" : ""}>
              <span className="mono">{md(a.date)} {wd(a.date)}</span>
              <span><b>{a.title}</b>{a.note && <span className="muted"> · {a.note}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="people flat">
        {trip.members.map(m => (
          <div key={m.id} className="person"><span className="nm"><Pip m={m} />{m.short}</span><span>{trip.later.where[m.id] ?? "待定"}</span></div>
        ))}
      </div>
      <div className="bigtbd">其余待定，随时更新</div>
    </section>
  );
}
