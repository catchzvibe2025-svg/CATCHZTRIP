import React from "react";
import { StaysView } from "./StaysView";
import { WorkView } from "./WorkView";
import { OpenView } from "./OpenView";

const SEG = [["stays", "住宿"], ["work", "工作日"], ["open", "待定"]] as const;

export function ListsView({ route, go }: { route: string; go: (r: string) => void }) {
  return (
    <div className="page">
      <div className="seg seg-wide" role="tablist" aria-label="清单">
        {SEG.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={route === id} className={route === id ? "on" : ""} onClick={() => go(id)}>{label}</button>
        ))}
      </div>
      {route === "stays" ? <StaysView /> : route === "work" ? <WorkView go={go} /> : <OpenView />}
    </div>
  );
}
