import React from "react";
import { useStore } from "../store";
import { privacyScan, PRIVACY_RULES, md } from "../utils";
import { Icon, SectionHead } from "../ui/bits";

export function ShareView() {
  const { trip } = useStore();
  const { checked, hits } = privacyScan(trip);
  const ok = hits.length === 0;
  return (
    <div className="stack">
      <SectionHead title="分享给同行的人" aside="只读页面 · 不需要登录" />
      <div className={"card scan " + (ok ? "scan-ok" : "scan-bad")}>
        <div className="scan-top">
          <span className="scan-ico"><Icon name={ok ? "check" : "open"} /></span>
          <div>
            <b>{ok ? "隐私检查通过" : `发现 ${hits.length} 处需要先处理`}</b>
            <span className="muted small">已检查 {checked} 段文字</span>
          </div>
        </div>
        <ul className="rules">
          {PRIVACY_RULES.map(r => {
            const n = hits.filter(h => h.rule.id === r.id).length;
            return <li key={r.id} className={n ? "bad" : ""}><Icon name={n ? "x" : "check"} />{r.label}{n ? ` · ${n} 处` : ""}</li>;
          })}
        </ul>
        {!ok && (
          <ul className="hits">
            {hits.map((h, i) => <li key={i}><span className="mono">{h.where}</span><span>{h.text}</span></li>)}
          </ul>
        )}
      </div>
      <div className="card share-how">
        <h3>怎么分享</h3>
        <p>在本页链接末尾加上 <code>#public</code> 发出去，对方打开看到的是只读行程页：没有编辑按钮，也没有其他行程。</p>
        <a className={"btn btn-primary" + (ok ? "" : " disabled")} href={ok ? "#public" : undefined} aria-disabled={!ok}>
          {ok ? "预览公开页" : "先处理上面的问题"}
        </a>
        <p className="muted small">公开页从 {md(trip.start)} 显示到 {md(trip.end)}，只放住处名称和状态，不放价格、确认号、电话、邮箱和房源链接。</p>
      </div>
    </div>
  );
}
