# CATCHZTRIP：给 AI 助手的项目规则

这份文件给所有在本仓库里干活的 AI 助手看（Codex 读 `AGENTS.md`，Claude Code 通过 `CLAUDE.md` 读到同一份）。三位主人 Haoyu（TZ）、Frida（FRI）、Hank（仔仔）权限相同，谁都可以让自己的助手改这里的任何东西：内容、界面、功能。请按下面的规则做，这样三个人、几种工具改出来的东西才不会互相打架。

## 这是什么

多人同行的行程 app，React + TypeScript 写的 PWA，装在三个人手机主屏幕上。没有后端。推到 `main` 后 GitHub Actions 自动检查、构建并发布到 GitHub Pages：<https://catchzvibe2025-svg.github.io/CATCHZTRIP/>

界面语言是中文，手机竖屏优先（390px 宽要好用）。跟主人说话用中文，讲人话，他们不都是技术背景。

## 常用命令

```bash
npm install
npm run check       # 检查 data/trip.json 的格式和隐私，上线前 CI 也会跑
npm run typecheck   # TypeScript 类型检查
npm run build       # 构建到 dist/
npm run dev         # 构建并本地起服务预览
```

提交前这三样都要过：`npm run check && npm run typecheck && npm run build`。

## 目录

| 位置 | 内容 |
| --- | --- |
| `data/trip.json` | **全部行程内容**，格式见 `docs/DATA.md` |
| `src/types.ts` | 数据结构 |
| `src/store.tsx` | 状态（本机存储；`trip.json` 变了会自动换掉本机旧数据） |
| `src/views/` | 各页面：`DayView` 此刻、`PlanView` 全程、`MapView` 路线、`ListsView` 清单（住宿 / 工作日 / 待定）、`ShareView` 分享、`PublicView` 只读分享页、`TripsView` 全部行程 |
| `src/ui/Scene.tsx` | 每天的生成式风景（canvas） |
| `src/ui/RouteMap.tsx` | 路线图（SVG，按真实经纬度投影） |
| `src/ui/useGeo.ts` | 本机定位（只在设备上用，不上传） |
| `src/styles.css` | 全部样式，颜色和字体都是 `:root` 里的变量 |
| `scripts/check.ts` | 数据检查 |
| `build.mjs` | 构建脚本（esbuild） |

## 隐私红线（仓库和页面都是公开的）

任何文件、提交信息、截图里都**不许出现**：
- 确认号、订单号、任何价格和金额、合同费用
- 电话、邮箱、Airbnb 房源链接、证件或卡号
- 「老板」等内部称呼，开会或合作对象的人名
- 任何人的实时位置、车辆账号或令牌、任何密钥

住宿只写名称或区域加状态（已订 / 待定）。拿不准就不写，并告诉主人。`npm run check` 会拦一部分，但不要指望它兜底。

## 改内容（行程）

- 只改 `data/trip.json`，严格按 `docs/DATA.md`。
- 只写已经确定的；没定的写「待定」，不要编日期、地点、时间。
- 每次都更新顶层 `updated`。
- 提交信息以 `data:` 开头，例如 `data: 11/21 街访地点确定`。

## 改界面和功能

- 提交信息以 `ui:`（外观）或 `feat:` / `fix:`（功能、修复）开头，一句话说清改了什么。
- 设计方向：风景画面是主角，界面本身保持安静（冷灰底、细线、衬线大数字）。新东西要像同一个产品里长出来的。
- 颜色、字体一律用 `styles.css` 里已有的变量；深色和浅色两套都要能看。三个人的代表色固定：TZ 蓝（`--c1`）、FRI 玫红（`--c2`）、仔仔 琥珀（`--c3`）。
- 手机宽度不能出现横向滚动；动效要尊重「减少动态效果」设置。
- 改了数据结构，要同时改 `src/types.ts`、`scripts/check.ts`、`docs/DATA.md`，并保证现有 `trip.json` 仍能通过检查。
- 不要加后端、账号登录、统计脚本或第三方追踪，除非三位主人明确同意。位置共享和车辆数据接入目前决定**先不做**。
- 不要删别人做的功能或大改整体风格而不打招呼：这类改动先跟提需求的主人确认，并在提交说明里写清楚原因。

## 三个人一起改，怎么不撞车

1. 动手前先 `git pull --rebase origin main`，推之前再拉一次。别人随时可能在推（策划内容更新尤其频繁）。
2. 改动小而完整，一件事一个提交，改完就推，不要攒一大堆。
3. **不要强制推送（force push），不要改写 `main` 的历史。**
4. 拉取时遇到冲突：`data/trip.json` 的冲突保留双方已确定的内容；代码冲突看懂两边意图再合。拿不准就停下来问主人，不要直接覆盖别人的改动。
5. 推上去后看一眼 Actions 是否成功。失败了就修到通过，不要留着红的。
6. 大改动（重做某个页面、换数据结构）可以开分支提 PR，让另外两位看过再合；日常小改直接推 `main`。

## 做完告诉主人什么

用一两句中文说：改了什么、在哪能看到、有没有需要他们决定的事。检查没过或没验证的地方照实说。
