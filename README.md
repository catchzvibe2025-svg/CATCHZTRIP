# CATCHZTRIP

多人同行的行程本，做成可以装到手机主屏幕的 PWA。示例数据是 Haoyu · Frida · Hank 2026–2027 在美两个月的行程。

**在线地址**：https://catchzvibe2025-svg.github.io/CATCHZTRIP/

## 装到手机上

- **iPhone**：用 Safari 打开上面的地址 → 底部「分享」按钮 → 「添加到主屏幕」。
- **安卓**：用 Chrome 打开 → 右上角菜单 → 「安装应用」或「添加到主屏幕」。

装好后从图标打开是全屏的，没网时也能看上次打开过的内容。

## 功能

| 标签 | 做什么 |
| --- | --- |
| 此刻 | 打开就是今天：一张按当地风景生成的画面、接下来的安排和倒计时、谁在哪、今晚住哪。点「编辑」能加删安排 |
| 全程 | 每天一张海报，点开看那一天 |
| 路线 | 按真实经纬度画路线，南加州可展开；按车辆续航估算每段要不要中途充电 |
| 清单 · 住宿 | 连住合并显示，已订 / 待定一目了然；编辑时点状态切换 |
| 清单 · 工作日 | 固定不能动的工作安排 |
| 清单 · 待定 | 从日程里自动汇总写着「待定」「未预约」「占位」的条目 |
| 分享 | 发出去前自动做隐私检查（电话、邮箱、价格、确认号、Airbnb 链接、内部称呼）；`#public` 是只读分享页 |

## 开发

```bash
npm install
npm run typecheck
npm run build        # 输出到 dist/
npm run dev          # 构建并在本地起一个静态服务
```

推到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages（`.github/workflows/pages.yml`）。

- 代码在 `src/`：`types.ts` 数据结构，`demoTrip.ts` 读入 `data/trip.json`，`store.tsx` 状态，`views/` 各标签页，`ui/RouteMap.tsx` 路线图，`ui/Scene.tsx` 每天的生成式风景。
- **行程数据只在 `data/trip.json`**，格式和规则见 [`docs/DATA.md`](docs/DATA.md)。提交到 `main` 后自动检查（`npm run check`：格式 + 隐私）并发布；检查不过不会上线。这是公开仓库：不要写确认号、价格、电话、邮箱、房源链接和内部称呼。
- `scripts/icons.cjs` 用 Playwright 重新生成 `public/` 里的图标。

## 现在的限制

- 编辑只存在当前手机的浏览器里，三个人之间不同步。要多人实时同步需要加一个后端（比如 Supabase），是下一步。
- 设计上参考了开源行程规划项目 TREK、TRIP、AdventureLog 的功能划分，没有使用它们的代码。
