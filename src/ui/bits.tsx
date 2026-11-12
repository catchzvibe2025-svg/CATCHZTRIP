import React from "react";
import type { Member, Place, StayStatus } from "../types";
import { mapsUrl, STAY_LABEL } from "../utils";

export function Pip({ m, dim, size }: { m: Member; dim?: boolean; size?: number }) {
  return <i className={"pip" + (dim ? " dim" : "")} style={{ background: `var(--${m.color})`, width: size, height: size }} />;
}

export function Avatar({ m }: { m: Member }) {
  return <span className="avatar" style={{ background: `var(--${m.color}-bg)`, color: `var(--${m.color})` }}>{m.short.slice(0, 2)}</span>;
}

export function StayTag({ status, onClick }: { status: StayStatus; onClick?: () => void }) {
  const cls = "tag tag-" + status;
  if (onClick)
    return <button type="button" className={cls + " tag-btn"} onClick={onClick} title="点一下切换状态">{STAY_LABEL[status]} ⇄</button>;
  return <span className={cls}>{STAY_LABEL[status]}</span>;
}

export function NavLink({ place }: { place?: Place }) {
  if (!place) return null;
  return <a className="navlink" href={mapsUrl(place)} target="_blank" rel="noopener">导航 ↗</a>;
}

export function SectionHead({ title, aside, children }: { title: string; aside?: string; children?: React.ReactNode }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {aside && <span className="sec-aside">{aside}</span>}
      {children}
    </div>
  );
}

export function Icon({ name }: { name: string }) {
  const p: Record<string, string> = {
    plan: "M4 5h16M4 12h16M4 19h10",
    map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
    stays: "M3 20V9l9-5 9 5v11M9 20v-6h6v6",
    work: "M4 8h16v11H4zM9 8V5h6v3",
    open: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v5m0 3v.5",
    share: "M8 12h8M12 8l4 4-4 4M4 5v14",
    trips: "M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v4H4zM13 15h7v4h-7z",
    edit: "M4 20h4L19 9l-4-4L4 16v4Z",
    plus: "M12 5v14M5 12h14",
    x: "M6 6l12 12M18 6 6 18",
    check: "M5 12l5 5 9-10",
    copy: "M8 8h11v11H8zM5 16V5h11",
  };
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={p[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
