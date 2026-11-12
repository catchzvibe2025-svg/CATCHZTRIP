import React, { useState } from "react";
import { useStore } from "../store";
import { md, newTrip, stats, addDays } from "../utils";
import { Scene } from "../ui/Scene";
import { Avatar, Icon, SectionHead } from "../ui/bits";

export function TripsView({ go }: { go: (r: string) => void }) {
  const { state, dispatch } = useStore();
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  return (
    <div className="page">
      <SectionHead title="全部行程" aside={`${state.trips.length} 个`}>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(c => !c)}><Icon name="plus" />新建行程</button>
      </SectionHead>
      {creating && <NewTrip onDone={() => { setCreating(false); go("plan"); }} />}
      <div className="trips">
        {state.trips.map(t => {
          const s = stats(t);
          return (
            <article key={t.id} className={"card trip" + (t.id === state.activeId ? " current" : "")}>
              <button type="button" className="trip-open" onClick={() => { dispatch({ type: "select", id: t.id }); go("plan"); }}>
                <div className="trip-map">
                  <Scene spec={t.days[Math.min(1, t.days.length - 1)].scene} seed={t.id + "cover"} />
                </div>
                <div className="trip-body">
                  <div className="trip-top">
                    {t.demo && <span className="tag tag-demo">自动同步</span>}
                    <span className="mono muted">{md(t.start)} – {md(t.end)} · {s.days} 天</span>
                  </div>
                  <h3 className="display">{t.name}</h3>
                  <div className="avatars">{t.members.map(m => <Avatar key={m.id} m={m} />)}</div>
                  <dl className="kv">
                    <div><dt>已排</dt><dd className="mono">{s.planned} 天</dd></div>
                    <div><dt>住宿已订</dt><dd className="mono">{s.booked}/{s.nights}</dd></div>
                    <div><dt>工作日</dt><dd className="mono">{s.work}</dd></div>
                    <div><dt>待定</dt><dd className="mono">{s.open}</dd></div>
                  </dl>
                </div>
              </button>
              <div className="trip-actions">
                {t.demo
                  ? <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "resetDemo" })}>恢复到同步版本</button>
                  : confirmDel === t.id
                    ? <><span className="muted small">删除后不能恢复</span><button type="button" className="btn btn-danger" onClick={() => { dispatch({ type: "delete", id: t.id }); setConfirmDel(null); }}>确认删除</button><button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(null)}>取消</button></>
                    : <button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(t.id)}>删除</button>}
              </div>
            </article>
          );
        })}
      </div>
      <p className="muted small">演示版：修改只保存在这台设备的浏览器里，别人看不到。</p>
    </div>
  );
}

function NewTrip({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addDays(today, 6));
  const [people, setPeople] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ps = people.split(/[,，、\s]+/).filter(Boolean);
    if (!name.trim()) return setErr("给行程起个名字。");
    if (end < start) return setErr("结束日期要在开始日期之后。");
    if (!ps.length) return setErr("至少写一位成员。");
    dispatch({ type: "create", trip: newTrip(name.trim(), start, end, ps) });
    onDone();
  };
  return (
    <form className="card newtrip" onSubmit={submit}>
      <h3>新建行程</h3>
      <label htmlFor="nt-name">行程名<input id="nt-name" className="in" value={name} onChange={e => setName(e.target.value)} placeholder="例如：东京拍摄周" /></label>
      <div className="add-row">
        <label htmlFor="nt-start">开始<input id="nt-start" type="date" className="in" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label htmlFor="nt-end">结束<input id="nt-end" type="date" className="in" value={end} onChange={e => setEnd(e.target.value)} /></label>
      </div>
      <label htmlFor="nt-people">成员（用逗号隔开，最多 5 位）<input id="nt-people" className="in" value={people} onChange={e => setPeople(e.target.value)} placeholder="例如：TZ，仔仔" /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="add-row"><button type="submit" className="btn btn-primary">创建并开始排日程</button></div>
      <p className="muted small">会先生成前两周的空白日程（超出部分归入「之后待定」），每晚住处默认待定。</p>
    </form>
  );
}
