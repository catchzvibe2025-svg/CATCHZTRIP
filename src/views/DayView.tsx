import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import type { Day, ItemKind, Trip } from "../types";
import { md, wd, presence, whereText, isOpen, itemKind, daysBetween, startMin, todayISO, nowMin, fmtGap, legMiles } from "../utils";
import { Icon, NavLink, Pip, StayTag } from "../ui/bits";
import { Scene, sceneAccent } from "../ui/Scene";

/** 没选日期时默认落在哪天：今天在日程里就是今天，否则是最近的一天 */
export function defaultDay(trip: Trip): Day {
  const t = todayISO();
  return trip.days.find(d => d.date === t) ?? (t > trip.days[trip.days.length - 1].date ? trip.days[trip.days.length - 1] : trip.days[0]);
}

function useClock() {
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(id); }, []);
}

export function DayHero({ day, trip, children, tall }: { day: Day; trip: Trip; children?: React.ReactNode; tall?: boolean }) {
  const n = daysBetween(trip.start, day.date) + 1, total = daysBetween(trip.start, trip.end) + 1;
  const [m, d] = md(day.date).split("/");
  return (
    <header className={"hero" + (tall ? " hero-tall" : "")}>
      <Scene spec={day.scene} seed={trip.id + day.date} />
      <div className="hero-scrim" />
      <div className="hero-in">
        <div className="hero-top">
          <span className="daycount"><b>DAY {String(n).padStart(2, "0")}</b> / {total}</span>
          {children}
        </div>
        <div className="hero-main">
          {day.work && <span className="stamp">工作日 · {day.work}</span>}
          <div className="hero-place">{day.place || "—"}</div>
          <div className="hero-date"><span className="num">{m}<i>.</i>{d}</span><span className="wd">{wd(day.date)}</span></div>
          <h1>{day.title || "还没写标题"}</h1>
          <div className="hero-meta">
            <span className="hero-pips">
              {trip.members.map(mm => presence(day, mm) === "with" && <span key={mm.id}><Pip m={mm} />{mm.short}</span>)}
            </span>
            <span>{day.tz}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function DayView() {
  useClock();
  const { trip, state, dispatch } = useStore();
  const today = todayISO();
  const day = trip.days.find(d => d.date === state.day) ?? defaultDay(trip);
  const live = day.date === today;
  const i = trip.days.indexOf(day);
  const go = (k: number) => { const t = trip.days[i + k]; if (t) dispatch({ type: "pickDay", date: t.date }); };
  const accent = sceneAccent(day.scene);

  // 滚动时主画面慢半拍，带一点纵深
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.querySelector<HTMLElement>(".hero-tall .scene");
    if (!el) return;
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const y = Math.min(scrollY, 700); el.style.transform = `translateY(${y * 0.28}px) scale(${1 + y * 0.00025})`; }); };
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); el.style.transform = ""; };
  }, [day.date]);

  useEffect(() => {
    document.querySelector(".strip .on")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [day.date]);

  return (
    <div className="dayview" style={{ "--accent": accent } as React.CSSProperties}>
      <DayHero day={day} trip={trip} tall>
        {live
          ? <span className="live"><i />此刻</span>
          : trip.days.some(d => d.date === today) && <button type="button" className="pill" onClick={() => dispatch({ type: "pickDay", date: null })}>回到今天</button>}
      </DayHero>

      <nav className="strip" aria-label="切换日期">
        <div className="strip-in">
          {trip.days.map(d => (
            <button key={d.date} type="button" className={"chip" + (d.date === day.date ? " on" : "") + (d.work ? " work" : "")}
              onClick={() => dispatch({ type: "pickDay", date: d.date })} aria-pressed={d.date === day.date}>
              <span className="wd">{d.date === today ? "今天" : wd(d.date)}</span>
              <span className="num">{md(d.date).split("/")[1]}</span>
              <span className="sw" style={{ background: sceneAccent(d.scene) }} />
            </button>
          ))}
        </div>
      </nav>

      <div className="daybody">
        <DayBody day={day} trip={trip} live={live} editing={state.editing} />
        <div className="pager">
          <button type="button" className="pager-b" disabled={i === 0} onClick={() => go(-1)}>
            <span className="muted">前一天</span><b>{i > 0 ? trip.days[i - 1].place || md(trip.days[i - 1].date) : "—"}</b>
          </button>
          <button type="button" className="pager-b next" disabled={i === trip.days.length - 1} onClick={() => go(1)}>
            <span className="muted">后一天</span><b>{i < trip.days.length - 1 ? trip.days[i + 1].place || md(trip.days[i + 1].date) : "—"}</b>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DayBody({ day, trip, live, editing }: { day: Day; trip: Trip; live: boolean; editing: boolean }) {
  const { dispatch } = useStore();
  const now = nowMin();
  const timed = day.items.map(it => ({ it, s: startMin(it.t) }));
  const next = live ? timed.find(x => x.s != null && x.s > now) : undefined;
  let current: string | null = null;
  if (live) for (const x of timed) if (x.s != null && x.s <= now) current = x.it.id;

  return (
    <>
      {live && (
        <section className="nextup">
          <span className="k">{next ? "接下来" : "今天"}</span>
          {next
            ? <><div className="nextup-main"><span className="num">{next.it.t.match(/\d{1,2}:\d{2}/)![0]}</span><b>{next.it.title}</b></div>
                <span className="gap">{fmtGap(next.s! - now)}</span></>
            : <div className="nextup-main"><b>有时间点的安排都过了</b></div>}
        </section>
      )}

      <section className="block">
        <h2 className="k">谁在哪</h2>
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
      </section>

      <section className="block">
        <h2 className="k">这一天</h2>
        <ol className="tl">
          {day.items.map(i => {
            const s = startMin(i.t);
            const past = live && s != null && s <= now && i.id !== current;
            return (
              <li key={i.id} className={"k-" + itemKind(i) + (past ? " past" : "") + (i.id === current ? " now" : "")}>
                <span className="t">{i.t}</span>
                <span className="dot" />
                <span className="a">
                  <b>{i.title}</b>
                  {i.note && <span className={"note" + (isOpen(i.note) ? " note-open" : "")}>{i.note}</span>}
                  <NavLink place={i.place} />
                </span>
                {editing && (
                  <button type="button" className="icon-btn del" aria-label={"删除 " + i.title}
                    onClick={() => dispatch({ type: "removeItem", date: day.date, itemId: i.id })}><Icon name="x" /></button>
                )}
              </li>
            );
          })}
          {day.items.length === 0 && <li className="tl-empty"><span /><span /><span className="a muted">这一天还没有安排。</span></li>}
        </ol>
        {editing && <AddItem date={day.date} />}
        {day.tip && <p className="tip"><b>小提示</b>{day.tip}</p>}
      </section>

      <DriveCard day={day} trip={trip} />

      <section className={"stay stay-" + day.stay.status}>
        <div className="stay-top"><h2 className="k">今晚</h2><StayTag status={day.stay.status} /></div>
        <div className="stay-name">{day.stay.name}</div>
        {(day.stay.sub || day.stay.place) && <div className="stay-sub">{day.stay.sub} <NavLink place={day.stay.place} /></div>}
      </section>
    </>
  );
}

const KIND_LABEL: Record<ItemKind, string> = { normal: "普通", work: "工作", meet: "接人", fly: "航班", charge: "充电" };

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

/** 今天开多远、要不要中途充电 */
function DriveCard({ day, trip }: { day: Day; trip: Trip }) {
  const stops = (day.route ?? []).map(id => trip.stops.find(s => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  if (stops.length < 2) return null;
  const legs = stops.slice(1).map((s, i) => ({ to: s, mi: legMiles(stops[i], s) }));
  const total = legs.reduce((n, l) => n + l.mi, 0);
  const v = trip.vehicle, usable = v ? Math.round(v.rangeMi * 0.8) : 0;
  const charges = v?.ev && total > usable ? Math.ceil(total / usable) - 1 : 0;
  const planned = day.items.filter(i => itemKind(i) === "charge").length;
  return (
    <section className="block drive">
      <h2 className="k">今天开车</h2>
      <div className="drive-top">
        <span className="num">{total}<i> mi</i></span>
        <span className="drive-km muted">约 {Math.round(total * 1.609 / 10) * 10} 公里</span>
      </div>
      <div className="drive-bar" role="img" aria-label={`全程约 ${total} 英里，${legs.length} 段`}>
        {legs.map((l, i) => <span key={i} className="seg-leg" style={{ flexGrow: l.mi }} />)}
        {v?.ev && Array.from({ length: charges }, (_, i) => (
          <i key={i} className="bolt" style={{ left: `${((i + 1) * usable / total) * 100}%` }} aria-hidden="true">⚡</i>
        ))}
      </div>
      <div className="drive-stops">
        {stops.map((s, i) => <span key={s.id}>{s.name}{i > 0 && <small> {legs[i - 1].mi} mi</small>}</span>)}
      </div>
      {v?.ev && (
        <p className="small muted">
          {charges > 0
            ? `超过 ${v.name} 按 80% 规划的单次续航（${usable} mi），途中至少充 ${charges} 次。${planned ? `日程里已排 ${planned} 个充电点。` : "日程里还没排充电点。"}`
            : `在 ${v.name} 单次续航内（按 80% 规划 ${usable} mi），不用中途充电。`}
          里程按直线距离估算，实际以导航为准。
        </p>
      )}
    </section>
  );
}
