import React from "react";
import { useStore } from "../store";
import { md, wd } from "../utils";
import { SectionHead } from "../ui/bits";

export function WorkView() {
  const { trip } = useStore();
  const fromDays = trip.days.filter(d => d.work).map(d => {
    const it = d.items.find(i => i.kind === "work");
    return { date: d.date, when: d.work!, title: it?.title.replace(/^开会：/, "开会 · ") ?? d.title, note: it?.note ?? "", jump: "d" + d.date };
  });
  const fromLater = trip.later.anchors.filter(a => a.kind === "work").map(a => ({ date: a.date, when: "全天", title: a.title, note: a.note ?? "", jump: "later" }));
  const all = [...fromDays, ...fromLater].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="stack">
      <SectionHead title="重要工作日" aside="固定，不能动" />
      {all.length === 0 && <div className="empty">还没有标记工作日。编辑某一天的安排，把类型设为「工作」即可出现在这里。</div>}
      <div className="works">
        {all.map(w => (
          <a key={w.date + w.title} className="wk" href="#plan" onClick={() => setTimeout(() => document.getElementById(w.jump)?.scrollIntoView({ block: "start" }), 60)}>
            <span className="mono">{md(w.date)} {wd(w.date)} · {w.when}</span>
            <b>{w.title}</b>
            {w.note && <small>{w.note}</small>}
          </a>
        ))}
      </div>
      <p className="muted small">工作日在日程、日期条和分享页里都会用紫色虚线框标出，方便同行的人提前避开。</p>
    </div>
  );
}
