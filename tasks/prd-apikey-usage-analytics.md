# PRD: API Key Usage Analytics (v2)

## 1. Introduction/Overview

在 9Router 的使用量和分析模块中，新增按 API Key 维度的独立分析页面。当前 Usage 页面只支持按 Provider/Model 维度查看用量，但多用户团队场景下，每个 API Key 对应一个人或一个项目，需要独立查看各自的请求数、token 消耗和费用，以便做成本归属和用量优化。

后端 `usageHistory` 表和 `usageRepo.js` 已经在采集和聚合 `byApiKey` 数据，但前端完全没有按此维度展示的入口。本功能的核心是把已有数据呈现出来，不修改任何现有表结构和定义。

## 2. Goals

- 在侧边栏新增 "API Keys" 分析页面，与 Usage 并列
- 展示每个 API Key 的基础统计：请求数、输入 token、输出 token、费用
- 支持按时间段筛选（24h / 7d / 30d / 60d），复用现有时间段组件
- 显示用户定义的 API Key 名称，方便识别归属
- 支持按请求数/token/费用排序
- 支持 CSV 导出
- 所有 UI 文案支持 i18n（中文/英文）

## 3. User Stories

### US-001: API Keys 分析页面入口
**Description:** 作为团队管理者，我需要在侧边栏看到 "API Keys" 入口，点击进入独立的分析页面，以便快速查看各 key 的用量。

**Acceptance Criteria:**
- [ ] 侧边栏 "Usage" 下方新增 "API Keys" 菜单项
- [ ] 点击进入 `/dashboard/apikey-analytics` 页面
- [ ] 页面包含时间段选择器（24h / 7d / 30d / 60d）
- [ ] 页面加载时显示所有 API Key 的汇总统计
- [ ] 无 API Key 数据时显示空状态提示（i18n key: `apikeyAnalytics.emptyState`）
- [ ] Typecheck/lint passes

### US-002: API Key 用量卡片列表
**Description:** 作为团队管理者，我需要看到每个 API Key 的请求数、token 数和费用的卡片概览，以便快速了解各 key 的消耗情况。

**Acceptance Criteria:**
- [ ] 页面顶部展示汇总卡片：Total Requests / Total Input Tokens / Total Output Tokens / Est. Cost（标签走 i18n）
- [ ] 下方展示每个 API Key 的独立卡片，包含 name、请求数、输入 token、输出 token、费用
- [ ] API Key 名称显示用户定义的 name 字段
- [ ] 无 name 的 key 显示 key 前 8 位 + "..." 作为回退
- [ ] 费用显示为 `~$X.XX` 格式，标注 "Estimated"（i18n key: `common.estimated`）
- [ ] Token 数量用 K/M 简写格式
- [ ] Typecheck/lint passes

### US-003: API Key 用量表格与排序
**Description:** 作为团队管理者，我需要以表格形式查看所有 API Key 的用量详情，并按不同维度排序，以便找出消耗最大的 key。

**Acceptance Criteria:**
- [ ] 表格列：API Key Name、Requests、Input Tokens、Output Tokens、Est. Cost（列头走 i18n）
- [ ] 点击列头可排序（升序/降序切换）
- [ ] 默认按请求数降序排列
- [ ] 表格底部有汇总行，显示所有 key 的合计值（标签走 i18n: `common.total`）
- [ ] 行数超过 10 行时分页，每页 10 行
- [ ] Typecheck/lint passes
- [ ] Verify in browser using browser_vision

### US-004: API Key 详情展开
**Description:** 作为团队管理者，我需要点击某个 API Key 查看其按 Provider/Model 的用量拆分，以便了解该 key 的用量构成。

**Acceptance Criteria:**
- [ ] 点击 API Key 行展开详情面板
- [ ] 详情面板显示该 key 按 Provider 的用量拆分表格（列头走 i18n）
- [ ] 详情面板显示该 key 按 Model 的用量拆分表格（前 10 个 model）
- [ ] 展开时收起其他已展开的行（手风琴模式）
- [ ] Typecheck/lint passes
- [ ] Verify in browser using browser_vision

### US-005: CSV 导出
**Description:** 作为团队管理者，我需要将 API Key 用量数据导出为 CSV，以便在 Excel 中做进一步分析或汇报。

**Acceptance Criteria:**
- [ ] 页面右上角有 "Export CSV" 按钮（i18n key: `apikeyAnalytics.exportCsv`）
- [ ] 点击后下载 CSV 文件，文件名格式 `apikey-usage-YYYY-MM-DD.csv`
- [ ] CSV 包含所有 API Key 数据（含汇总行），不受分页影响
- [ ] CSV 列：API Key Name, Requests, Input Tokens, Output Tokens, Est. Cost
- [ ] 当前时间段有数据时才可导出，无数据时按钮 disabled
- [ ] Typecheck/lint passes

### US-006: API Key 用量后端 API
**Description:** 作为开发者，我需要新的后端 API 返回按 API Key 维度的统计数据，以便前端页面展示。

**Acceptance Criteria:**
- [ ] 新增 `GET /api/usage/apikey-stats` 接口，接受 `period` 参数
- [ ] 返回格式包含：每个 apiKey 的 name、requests、promptTokens、completionTokens、cost
- [ ] 返回格式包含：每个 apiKey 的 byProvider 和 byModel 拆分
- [ ] 返回汇总数据：totalRequests、totalPromptTokens、totalCompletionTokens、totalCost
- [ ] 无数据时返回空数组而非 404
- [ ] period 参数校验：只接受 24h/7d/30d/60d
- [ ] 不修改现有表结构、schema、migration
- [ ] Typecheck/lint passes

### US-007: i18n 国际化支持
**Description:** 作为用户，我需要在中文和英文环境下都能正常使用 API Keys 分析页面，所有 UI 文案跟随系统语言切换。

**Acceptance Criteria:**
- [ ] 新增 i18n 资源文件，包含 `apikeyAnalytics.*` 命名空间的 key
- [ ] 侧边栏菜单项标签支持 i18n
- [ ] 页面标题、汇总卡片标签、表格列头、空状态文案、按钮文案全部走 i18n
- [ ] 展开/收起、排序指示器等交互文案走 i18n
- [ ] CSV 导出的列头使用当前语言
- [ ] 切换语言后页面文案立即更新
- [ ] Typecheck/lint passes

## 4. Functional Requirements

- FR-1: 系统须在侧边栏 "Usage" 下方新增 "API Keys" 菜单项，路由为 `/dashboard/apikey-analytics`
- FR-2: 系统须在 API Keys 页面顶部展示 4 个汇总卡片（Total Requests / Input Tokens / Output Tokens / Est. Cost）
- FR-3: 系统须展示每个 API Key 的独立用量统计，显示 name 字段
- FR-4: 系统须提供表格视图，支持按 Requests / Input Tokens / Output Tokens / Cost 排序
- FR-5: 系统须支持点击 API Key 行展开按 Provider/Model 的用量拆分
- FR-6: 系统须支持时间段选择器（24h / 7d / 30d / 60d）
- FR-7: 系统须新增 `GET /api/usage/apikey-stats?period=7d` 接口
- FR-8: 接口须从 `usageDaily` 的 `byApiKey` 聚合数据中提取统计，不修改现有表结构
- FR-9: 接口须通过 `apiKeys` 表的 name 字段关联显示 key 名称
- FR-10: 无 name 的 key 须回退显示 key 前 8 位 + "..."
- FR-11: 系统须提供 "Export CSV" 按钮，下载当前时间段的所有 API Key 用量数据
- FR-12: CSV 文件名格式为 `apikey-usage-YYYY-MM-DD.csv`
- FR-13: CSV 须包含汇总行，列头随当前语言变化
- FR-14: 所有 UI 文案须通过 i18n 资源文件管理，支持中文和英文
- FR-15: i18n key 须使用 `apikeyAnalytics.*` 命名空间

## 5. Non-Goals (Out of Scope)

- 不做配额限制或告警功能
- 不做按 API Key 维度的趋势图（后续可扩展）
- 不做 API Key 的 CRUD 操作（已有 providers 页面管理）
- 不做按 API Key 过滤请求日志
- 不做按 API Key 维度的实时 SSE 推送
- 不做多 key 对比视图
- 不修改现有数据库表结构、schema 或 migration

## 6. Design Considerations

- 复用现有 `SegmentedControl` 组件做时间段选择
- 复用现有 `Card` / `Badge` / `Pagination` 组件
- 复用 `OverviewCards` 的布局模式做汇总卡片
- API Key 卡片布局参考 `ProviderLimits/ProviderLimitCard` 的样式
- 展开详情面板参考 `RequestDetailsTab` 的手风琴交互模式
- CSV 导出在前端完成（从已获取的 API 数据生成），不新增后端导出接口
- 页面样式与现有 Usage 页面保持一致（暗色主题、Tailwind CSS）
- i18n 资源文件遵循项目现有结构（`i18n/` 目录）

## 7. Technical Considerations

- `usageRepo.js` 的 `aggregateEntryToDay()` 已在做 `byApiKey` 聚合，key 格式为 `apiKeyValue|model|provider`
- `usageDaily` 表存储每日聚合 JSON，`data.byApiKey` 已包含数据，无需修改表结构
- 新增 API 需要从 `byApiKey` 中提取，按 apiKey 分组汇总，解析时用 `|` split 取第一段作为 apiKey 标识
- apiKey 名称需通过 `apiKeysRepo.getApiKeys()` 获取映射（只读操作，不修改表）
- `apiKey` 字段值可能是实际 key 值或 "local-no-key"，需做脱敏处理（不展示完整 key）
- 数据查询路径：`usageDaily` → 解析 JSON → 聚合 byApiKey → 关联 apiKeys 表 name
- i18n 资源文件位置：检查 `src/i18n/` 目录结构，在现有 en/zh JSON 文件中追加 `apikeyAnalytics` 命名空间
- CSV 生成使用浏览器端 `Blob` + `URL.createObjectURL`，不依赖后端

## 8. Success Metrics

- 用户可在 2 次点击内查看任意 API Key 的用量
- 页面加载时间 < 1s（7d 周期）
- 数据与 Usage 页面的汇总数据一致
- 切换语言后所有文案即时更新，无遗漏硬编码
- CSV 导出的数据与页面显示一致

## 9. Open Questions

- ~~`byApiKey` 的 key 格式是 `apiKeyValue|model|provider`，是否需要在存储时就只存 apiKeyValue 以简化查询？~~ → 不修改现有表结构，在查询时解析
- ~~是否需要支持导出 CSV？~~ → 已纳入需求
