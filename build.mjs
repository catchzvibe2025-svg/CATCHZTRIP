// 用法：node build.mjs pwa  → dist/（部署到 GitHub Pages 的 PWA）
//       node build.mjs artifact → artifact/tuce.html（单文件预览，React 从 cdnjs 加载）
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2] || "pwa";
const css = fs.readFileSync("src/styles.css", "utf8");
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;900&family=DM+Mono:wght@500&display=swap">`;

const shim = {
  name: "react-globals",
  setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: path.resolve("src/shims/react.js") }));
    b.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: path.resolve("src/shims/react-dom-client.js") }));
  },
};

const res = await build({
  entryPoints: ["src/main.tsx"], bundle: true, minify: true, write: false, format: "iife", target: "es2020",
  define: { __PWA__: String(mode === "pwa"), "process.env.NODE_ENV": '"production"' },
  plugins: mode === "artifact" ? [shim] : [],
});
const js = res.outputFiles[0].text;

if (mode === "artifact") {
  fs.mkdirSync("artifact", { recursive: true });
  const html = `<title>CATCHZTRIP</title>
<meta name="claude:viewport-fit-sides" content="cover">
${FONTS}
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script>
`;
  fs.writeFileSync("artifact/tuce.html", html);
  console.log("artifact/tuce.html", (html.length / 1024).toFixed(1) + " KB");
} else {
  fs.rmSync("dist", { recursive: true, force: true });
  fs.mkdirSync("dist");
  for (const f of fs.readdirSync("public")) fs.copyFileSync(path.join("public", f), path.join("dist", f));
  const stamp = Date.now().toString(36);
  fs.writeFileSync("dist/sw.js", fs.readFileSync("dist/sw.js", "utf8").replace("__BUILD__", stamp));
  fs.writeFileSync("dist/app.js", js);
  fs.writeFileSync("dist/styles.css", css);
  fs.writeFileSync("dist/index.html", `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>CATCHZTRIP</title>
<meta name="description" content="多人同行的行程本：每日日程、路线、住宿、工作日和待定事项。">
<meta name="theme-color" content="#1f5f73">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="CATCHZTRIP">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">
${FONTS}
<link rel="stylesheet" href="styles.css">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:0}</style>
</head>
<body>
<div id="root"></div>
<script src="app.js"></script>
</body>
</html>
`);
  console.log("dist/ built", stamp, (js.length / 1024).toFixed(1) + " KB js");
}
