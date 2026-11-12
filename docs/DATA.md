# 行程数据怎么写（给负责策划的 session）

应用里显示的全部行程内容都来自一个文件：**`data/trip.json`**。改这个文件并提交到 `main`，GitHub 会自动检查并发布，几分钟后三个人手机上的 app 就是新内容。应用的代码和界面不用碰。

## 铁律

1. **只写已经确定的**。没定的写「待定」，不要编日期、地点、时间。
2. **这是公开仓库和公开页面**。不写：确认号、订单号、价格、金额、房价、合同费用、电话、邮箱、Airbnb 房源链接、内部称呼（如「老板」）、开会对象的人名。住宿只写名称/区域和状态。
3. 只改 `data/trip.json`，不改其他文件。
4. 每次修改都更新顶层的 `updated`（如 `"2026-11-12 09:00 PT"`）。
5. 提交前跑 `npm run check`，不通过不要提交。提交信息写清楚改了什么，例如 `data: 11/18 住处确定`。

## 结构

```jsonc
{
  "id": "us-west-2026",            // 不要改
  "name": "…", "tagline": "…",
  "start": "2026-11-11", "end": "2027-01-14",
  "vehicle": { "name": "2022 Model Y 长续航", "rangeMi": 330, "ev": true },
  "updated": "2026-11-11 23:30 CT",
  "members": [ { "id": "tz", "short": "TZ", "name": "Haoyu", "color": "c1", "span": "全程" } ],  // id 和 color 不要改
  "regions": [ … ], "guides": [ … ],   // 地图用，一般不动
  "stops":   [ … ],                    // 路线上的站点，按先后顺序
  "days":    [ … ],                    // 已经排好的每一天，按日期从早到晚
  "later":   { … }                     // 还没排的那一段
}
```

### days 里的一天

```json
{
  "date": "2026-11-21",
  "scene": { "type": "city", "tod": "day" },
  "place": "Los Angeles",
  "title": "LA 街访全天",
  "tz": "太平洋时间 PT",
  "work": "全天街访",
  "where": { "tz": "洛杉矶", "fri": "@在达拉斯", "hank": "与 TZ 同行" },
  "items": [
    { "t": "09:00–18:00", "title": "LA 街访", "note": "地点待定", "kind": "work" },
    { "t": "晚上", "title": "回住处", "place": { "q": "Culver City, CA", "dir": true } }
  ],
  "tip": "可选的一句提醒",
  "stay": { "name": "西 LA / Culver City / Palms", "sub": "具体住处待定", "status": "tbd" }
}
```

| 字段 | 说明 |
| --- | --- |
| `date` | `YYYY-MM-DD`，当地日期 |
| `scene.type` | 当天画面，只能选：`road` 夜路公路、`dunes` 沙丘、`saguaro` 仙人掌沙漠、`city` 城市棕榈、`coast` 海岸、`camp` 海边夜宿、`studio` 片场/拍摄、`hills` 山丘（通用） |
| `scene.tod` | 画面时段，只能选：`night`、`dawn`、`day`、`golden`、`dusk` |
| `place` | 画面上的大字，当天所在地，英文地名最好看，尽量短 |
| `title` | 当天一句话标题 |
| `route` | 可选。当天开车依次经过的站点 id（来自 `stops`），如 `["lor", "sag", "sb"]`。应用用它算当天里程和要不要充电；当天不开长途就不写 |
| `tz` | 时区说明文字 |
| `work` | 可选。只有固定的工作日才写，写成短语，如 `14:00 开会`、`全天拍摄` |
| `where` | 每个成员当天在哪，三个成员都要写。`null` = 还没会合；以 `@` 开头 = 已不在行程中（如 `@在达拉斯`） |
| `items[].t` | 时间。能写具体就写 `14:30` 或 `14:30–17:30`（应用靠它算「接下来」和倒计时）；不确定就写 `上午`、`晚上`、`待定` |
| `items[].title` / `note` | 安排和备注。没定的在 note 里写「待定」，应用会自动收进待定清单 |
| `items[].kind` | 可选：`work` 工作、`fly` 航班、`meet` 接人、`charge` 充电。不写就是普通 |
| `items[].place` | 可选，导航用。`q` 是 Google Maps 搜索词或地址；加 `"dir": true` 表示直接导航到该地址 |
| `stay.status` | `booked` 已订、`tbd` 待定、`road` 夜里在路上不住店 |

### stops（路线图）

新增一段路时在对应位置加一个站点：`{ "id": "唯一短id", "name": "显示名", "label": "11/21", "lat": 34.05, "lng": -118.24, "region": "socal" }`。南加州范围内的站点写 `"region": "socal"`，其他地方不写 region。经纬度写到小数点后两位即可。

### later（还没排的那一段）

- 把某一天排进 `days` 之后，把 `later.from` 改成 `days` 最后一天的次日，并从 `later.anchors` 里删掉已经排进去的锚点。
- `anchors[].kind`：`work` 固定工作日，`end` 结束类节点。
- `later.where`：每个成员在这一段的一句话状态。

## 自查清单

- [ ] 只动了 `data/trip.json`
- [ ] 新增/修改的内容都是已确定的，没定的写了「待定」
- [ ] 没有任何确认号、金额、电话、邮箱、房源链接、内部称呼、与会人名
- [ ] `days` 按日期排序，`later.from` 接在最后一天之后
- [ ] `updated` 改了
- [ ] `npm run check` 通过
