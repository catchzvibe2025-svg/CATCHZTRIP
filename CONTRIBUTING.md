# 三个人怎么一起改 CATCHZTRIP

这个项目是 Haoyu、Frida、Hank 三个人共有的，权限一样。谁都可以改行程内容，也可以改界面和功能。用 Claude 还是 Codex 都行，两边读的是同一份规则（[`AGENTS.md`](AGENTS.md)）。

## 第一次加入

1. 需要一个 GitHub 账号，把用户名发给 Haoyu。
2. Haoyu 在仓库的 **Settings → Collaborators → Add people** 里把你加进来。
3. 你会收到一封 GitHub 邀请邮件，点 **Accept invitation**。之后你就有和 Haoyu 一样的修改权限。
4. 让你的 AI 助手连上这个仓库：
   - **Codex**：在 Codex 里连接 GitHub，选 `catchzvibe2025-svg/CATCHZTRIP` 这个仓库。
   - **Claude**：在 Claude 里连接 GitHub 并选这个仓库（Claude Code 网页版或桌面版都可以）。

## 平时怎么用

直接用大白话跟你的助手说想改什么，例如：

- 「把 11/22 晚饭改成 19:00 的 Sun Nong Dan，已经订好了」
- 「此刻那一页的字再大一点」
- 「给清单加一栏行李清单」

助手会按 `AGENTS.md` 的规则改、检查、推上去。几分钟后三个人手机上的 app 自动更新，关掉重开一两次就能看到。

## 三条要记住的

1. **这是公开的。** 不要让助手写进去：价格、确认号、电话、邮箱、房源链接、别人的名字、实时位置。
2. **行程只写定了的。** 没定的写「待定」。
3. **改之前先同步。** 让助手动手前先拉最新版本（它读了规则会自己做）。如果它说和别人的改动冲突了、拿不准，就在三人群里问一声再继续。

## 出问题了

- **app 没更新**：到仓库的 [Actions](https://github.com/catchzvibe2025-svg/CATCHZTRIP/actions) 页面看最新一次是不是绿色对勾。红叉就把那一页的链接丢给你的助手，让它修。
- **改坏了想退回去**：告诉助手「把刚才那次改动撤回」，它会用一次新的提交撤销，不会动别人的改动。

技术细节看 [`README.md`](README.md)，行程数据格式看 [`docs/DATA.md`](docs/DATA.md)。
