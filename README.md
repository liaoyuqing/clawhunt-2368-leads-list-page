# 线索列表页（会员空间平台 · 销售工作台）

订单编号 2368 的交付工程：`/sales/leads` 线索列表页，覆盖筛选区、表格、回收倒计时、主管批量转派、URL 双向同步与三态处理。
数据全部来自仓库内的 MSW mock（68 条虚构企业），不连接任何真实环境、不含任何真实客户或个人资料。

## 技术栈

- React 18.3 + TypeScript 5（strict）
- TDesign React 1.19（表格 / 筛选 / 弹窗 / 分页组件）
- Vite 5 构建，Vitest 2 + Testing Library + jsdom 组件测试
- MSW 2 负责 mock：浏览器用 service worker，测试用 node 拦截

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173 ，首屏即 /sales/leads 页面
npm test           # 17 条组件测试
npm run typecheck  # tsc --noEmit
npm run build      # 产物在 dist/
npm run preview    # 预览构建产物，http://localhost:4173
```

> Node 22.4 及以上自带一个实验性全局 `localStorage`，未传 `--localstorage-file` 时读出来是 `undefined`，会遮蔽 jsdom 的实现。
> `vitest.setup.ts` 开头已把 jsdom 自己的 Storage 回填到 `window.localStorage`，因此高版本 Node 下测试同样可跑。

## 视角与权限

视角差异集中在 `src/features/sales/leads/roleMatrix.ts`，表格列、筛选项、工具栏按钮全部从它派生，不存在「列藏了按钮还在」的半套权限。

| 能力 | 顾问 advisor | 主管 supervisor / manager |
| --- | --- | --- |
| 表格「负责人」列 | 不渲染 | 渲染 |
| 筛选区「负责人」下拉 | 不渲染 | 渲染 |
| 行勾选列 / 「批量转派」按钮 | 不渲染 | 渲染 |
| 排序、分页、其余筛选 | 有 | 有 |

演示时用页面右上角的「视角」下拉切换（写入 `localStorage` 的 `leads-demo-role`），真实环境由 S2-IAM 下发 `/api/me` 的 role 决定。

## 表格列

数据列共 9 个（提案里「顾问七列 / 主管八列」是按未含「意向工位数」的旧稿估计，以实现与本文为准）：
企业名（点击进入详情，副行显示联系人）、行业、来源、阶段（彩色标签）、报备时间、最近跟进时间、距回收天数、负责人（仅主管及以上）、意向工位数。
主管及以上在数据列左侧多一个勾选列。

## 回收倒计时口径

唯一实现在 `src/features/sales/leads/countdown.ts`，表格渲染与测试断言共用：

- 公海（`public_pool`）与合同及以后（`contract`）：没有回收这回事，显示「—」，不着色
- `daysLeft <= 2`：红色（`#d54941`），0 天显示「今天到期」
- `3 <= daysLeft <= 4`：橙色（`#e37318`）
- 负数（已过回收日）：不着色，交由后端过滤，界面不制造「已过期还红着」的假象

## 筛选条件与 URL

地址栏是筛选状态的唯一来源：`parseQuery` 把 query 解析成 `LeadFilters`，任何改动都先 `history.pushState` / `replaceState` 再重渲染，刷新页面后条件原样恢复。
非法值（未知阶段、坏日期、`page=0`、`size=999`）一律回落默认，不抛错也不白屏。

| 界面 | URL query | 接口参数（GET /api/sales/leads） |
| --- | --- | --- |
| 阶段（多选） | `stage=qualified,negotiating` | `stage=qualified,negotiating` |
| 来源渠道 | `source=referral` | `source` |
| 意向空间类型 | `spaceType=office` | `space_type` |
| 报备时间区间 | `reportedFrom` / `reportedTo` | `reported_from` / `reported_to` |
| 最近跟进区间 | `followedFrom` / `followedTo` | `followed_from` / `followed_to` |
| 即将回收（3 天内） | `recycle=soon` | `recycle=soon` |
| 关键词 | `keyword` | `keyword`（同时匹配企业名与联系人） |
| 负责人 | `owner=u-1003` | `owner_id` |
| 排序 | `sort=reportedAt:desc` | `sort` |
| 分页 | `page` / `size`（20/50/100） | `page` / `size` |

默认值不写进地址栏，因此「无筛选」时 URL 干净。

### 演示用 query 示例

```text
/?stage=qualified,negotiating&source=referral&recycle=soon&size=50&sort=followedAt:asc
/?stage=contacted&keyword=科技&sort=followedAt:desc
/?page=2&size=20
```

## 接口约定（mock 已按此实现）

```text
GET   /api/me                         -> { id, name, role: 'advisor' | 'supervisor' | 'manager' }
GET   /api/users?role=advisor         -> [{ id, name, siteIds }]
GET   /api/sales/leads?...            -> { items, total, page, size, serverDate }
PATCH /api/sales/leads/{id}/owner     -> { id, ownerId, ownerName }   body: { ownerId }
```

`GET /api/sales/leads` 与 `PATCH /api/sales/leads/{id}/owner` 的真实后端未就绪，本工程用 MSW 顶替；对接时把 `src/mocks/handlers.ts` 换成真实网关即可，`src/api/client.ts` 无需改动。

## 批量转派

主管视角勾选若干行 → 「批量转派」→ 弹窗内选目标顾问 → 逐条串行调用 `PATCH /api/sales/leads/{id}/owner`。
结束后展示「成功 X 条，失败 Y 条」，失败行逐条列出企业名与后端返回的原因（例如「该线索已被他人转派」「目标顾问无该会所权限」），并提供「仅重试失败 N 条」。
关闭弹窗时，成功行从选中集移除、失败行保留勾选，便于继续处理。

## 三态

- 加载：骨架屏（`data-testid="leads-skeleton"`），首屏数据到达后消失
- 空：`leads-empty`，附「清空筛选」
- 接口错误：`leads-error`（红色标题 + 后端 message + 「重试」），错误时隐藏分页与批量入口

复现接口错误：页面右上角点「模拟接口错误」（写 `localStorage` 的 `leads-demo-fail=1` 后刷新），或在 DevTools 里手动 `localStorage.setItem('leads-demo-fail','1')` 再刷新。

## 测试

| 文件 | 覆盖 |
| --- | --- |
| `src/__tests__/ac1-role-matrix-columns.test.tsx` | 顾问/主管的列与按钮差异、权限矩阵单一来源 |
| `src/__tests__/ac2-countdown-levels.test.tsx` | 倒计时分级口径、边界值 0/2/3/4、公海与合同显示「—」 |
| `src/__tests__/ac3-filters-from-url.test.tsx` | query → 请求参数与控件回填、卸载重挂载后保持一致、分页、非法值回落 |
| `src/__tests__/ac4-bulk-partial-failure.test.tsx` | 9 条中 2 条失败逐条展示原因、仅重试失败、全成功无失败明细 |
| `src/__tests__/states-loading-empty-error.test.tsx` | 骨架、空态、503 错误态与重试、排序写回 URL |

测试断言不只查界面文字，`src/__tests__/apiCapture.ts` 会记录组件真实发出的请求，用来证明「条件真的进了请求参数」。

## 截图

`docs/screens/` 下 8 张，均为 `vite preview` 产物页面的真实截图（1680×1000 视口，2 倍像素密度）：

- `01-advisor-view.png` 顾问视角：表头 8 列，无「负责人」列、无勾选列、无「批量转派」
- `02-supervisor-view.png` 主管视角：勾选列 + 「负责人」列 + 右上角「批量转派」按钮
- `03-countdown-levels.png` 倒计时特写：1 天 / 2 天 / 今天到期为红，3 天 / 4 天为橙，10 天为常规色
- `04-filters-from-url.png` 带 query 打开：筛选控件、筛选摘要、列表结果、分页一致
- `04b-filters-after-reload.png` 同上页面 `page.reload()` 之后，画面与 04 逐像素相同即为条件未丢
- `05-bulk-transfer-partial-failure.png` 批量转派部分失败：成功 7 条失败 2 条，两条失败原因逐条列出
- `06-empty-state.png` 空状态
- `07-error-state.png` 接口错误态

## 目录

```text
src/
  api/          类型与请求封装（ApiError 保留后端 code/status）
  components/   BulkTransferDialog
  features/sales/leads/   filters（URL 编解码）、countdown、roleMatrix、useUrlFilters、useSession、demoSession
  mocks/        handlers（含 409/403 失败分支）、68 条虚构线索
  pages/sales/leads/      FilterBar、LeadsTable、页面骨架与三态
  __tests__/    5 个测试文件 + 渲染与请求捕获辅助
docs/screens/   截图
```

## 虚构数据说明

企业名、联系人、顾问姓名、会所编号全部为虚构；`serverDate` 固定为 2026-11-27，倒计时按它换算，避免本地时钟影响口径。
