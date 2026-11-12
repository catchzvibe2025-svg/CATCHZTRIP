import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

declare const __PWA__: boolean;

createRoot(document.getElementById("root")!).render(<App />);

// 装到主屏幕后离线可用：只在独立部署（PWA）版本里注册
if (__PWA__ && "serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
