import React from "react";
import { useStore } from "../store";
import { md, wd } from "../utils";
import { SectionHead } from "../ui/bits";

export function WorkView({ go }: { go?: (r: string) => void }) {
  const { trip, dispatch } = useStore();
  const fromDays = trip.days.filter(d => d.work).map(d => {
    const it = d.items.find(i => i.kind === "work");
    return { date: d.date, when: d.work!, title: it?.title.replace(/^开会：/, "开会 · ") ?? d.title, note: it?.note ?? "", planned: true };
  });
  const fromLater = trip.later.anchors.filter(a => a.kind === "work").map(a => ({ date: a.date, when: "", title: a.title, note: a.note ?? "", planned: false }));
  const all = [...fromDays, ...fromLater].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="stack">
      <SectionHead title="重要工作日" aside="固定，不能动" />
      {all.length === 0 && <div className="empty">还没有标记工作日。把某条安排的类型设为「工作」就会出现在这里。</div>}
      <ol className="works">
        {all.map(w => (
          <li key={w.date + w.title}>
            <button type="button" className="wk" disabled={!go || !w.planned}
              onClick={() => { dispatch({ type: "pickDay", date: w.date }); go?.("today"); }}>
              <span className="num">{md(w.date).replace("/", ".")}</span>
              <span className="wk-main"><b>{w.title}</b><small>{[wd(w.date), w.when, w.note].filter(Boolean).join(" · ")}</small></span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
