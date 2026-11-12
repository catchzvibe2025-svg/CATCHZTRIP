import React from "react";
import { useStore } from "../store";
import { md, openItems } from "../utils";
import { SectionHead } from "../ui/bits";

const KIND = { stay: "住宿", item: "安排", later: "整段" } as const;

export function OpenView() {
  const { trip } = useStore();
  const items = openItems(trip);
  return (
    <div className="stack">
      <SectionHead title="待定清单" aside={`${items.length} 项 · 从日程自动汇总`} />
      <p className="muted small">日程里写着「待定」「未预约」「占位」或住宿状态为待定的条目，会自动收进这里。定下来以后改掉原文，这里就会消失。</p>
      <ul className="open card">
        {items.map((o, i) => (
          <li key={i}>
            <span className="mono">{md(o.date)}</span>
            <span className={"okind k-" + o.kind}>{KIND[o.kind]}</span>
            <span className="otext"><span className="muted">{o.where} · </span>{o.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
