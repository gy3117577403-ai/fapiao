# 出差旅费报销管理工具

这是一个用于企业内部差旅报销录入、统计、筛选、打印和归档的前端工作台。应用支持本地后端模式，也支持以静态前端形式发布到 GitHub Pages；GitHub Pages 只能承载前端静态资源，后端服务需要本地运行或单独部署。

## 功能亮点

1. 总览驾驶舱：展示本月金额、单据数量、待确认发票、趋势和状态分布。
2. 报销单工作台：支持搜索、日期筛选、状态筛选、分页、抽屉详情和删除确认。
3. 新建 / 编辑报销单：共用表单流程，保留现有保存、编辑、打印和返回逻辑。
4. 实时费用汇总：根据行程、补贴标准、预借金额和已确认发票实时计算。
5. 行程时间线：以内联编辑卡管理行程，删除行程前有确认。
6. 发票附件状态：展示未上传、待确认、已确认等状态，不伪造 OCR 成功结果。
7. 打印页：支持报销单打印预览、打开和下载。
8. 基础设置：维护默认部门、出差人和途中补贴标准。
9. 响应式布局：已检查 1366px、1440px、1920px 无横向溢出。
10. 高级浅色视觉系统：玻璃卡片、状态 pill、空状态、数字动效和工作台布局。

## 页面路径

本项目使用 HashRouter。线上和本地访问路径都应包含 `#`：

- `/#/`
- `/#/reports`
- `/#/reports/new`
- `/#/reports/:id/edit`
- `/#/reports/:id/print`
- `/#/settings`

## 本地开发

前端命令在 `frontend` 目录执行：

```powershell
cd frontend
npm ci
npm run dev
npm run build
npm run preview
```

如果只是首次安装且没有使用 lockfile，也可以执行 `npm install`。当前仓库已有 `frontend/package-lock.json`，推荐使用 `npm ci`。

后端需要单独运行。可使用项目脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

开发默认 API 地址为：

```text
http://127.0.0.1:8000
```

## 环境变量

示例文件在 [frontend/.env.example](frontend/.env.example)。

- `VITE_API_BASE_URL`：真实后端 API 地址。本地开发可使用 `http://127.0.0.1:8000`。
- `VITE_BASE_PATH`：静态资源 base path。本地通常为 `/`，GitHub Pages 项目站点通常为 `/repo-name/`。
- `VITE_STATIC_MODE`：设置为 `true` 时使用浏览器 localStorage 模拟数据，适合 GitHub Pages 前端演示。

不要提交 `.env.local`，不要把真实 token、密钥、私有 API 地址写入 README 或 workflow。

## 部署到 GitHub Pages

仓库包含 GitHub Pages workflow：[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)。

1. 在 GitHub 仓库 `Settings -> Pages` 中，将 Source 选择为 `GitHub Actions`。
2. push 到 `main` 后会自动构建并部署前端。
3. 当前默认 Pages 项目路径为 `/fapiao/`，对应 `https://<owner>.github.io/fapiao/`。
4. 如果仓库名不同，请在 GitHub repository variables 中设置 `VITE_BASE_PATH`，例如 `/Reimbursement-Tool/`。
5. Pages workflow 默认设置 `VITE_STATIC_MODE=true`，用于静态前端演示。
6. 如果要连接真实后端，请单独部署后端，并设置 repository variable `VITE_API_BASE_URL` 指向真实后端地址。
7. 本项目使用 HashRouter，线上访问路径应类似 `https://<owner>.github.io/fapiao/#/reports`。

构建产物目录：

```text
frontend/dist
```

GitHub Pages artifact path：

```text
frontend/dist
```

## 发布前检查清单

- `npm run build` 成功。
- `npm run preview` 可打开。
- 浏览器控制台错误数为 0。
- 1366px / 1440px / 1920px 无横向溢出。
- 新建 -> 列表 -> 详情 -> 编辑 -> 打印 -> 删除链路通过。
- 页面无 `NaN`、`undefined`、`[object Object]`。
- 无测试报销单残留。
- API 地址不是无意写死的 localhost，除非只做本地演示。
- GitHub Pages Source 已设置为 GitHub Actions。
- 如果是项目站点，Vite base path 与仓库路径一致。

更完整的发布清单见 [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)。

## 截图

当前仓库保留截图占位说明，见 [docs/screenshots/README.md](docs/screenshots/README.md)。如果后续生成截图，请避免包含本地绝对路径、数据库路径、私有 API 地址或敏感用户信息。

建议截图文件名：

- `dashboard.png`
- `reports.png`
- `report-new.png`
- `report-edit.png`
- `report-print.png`

## 已知限制

1. GitHub Pages 只能发布前端静态资源，不能承载 FastAPI 后端。
2. 后端需要本地运行或单独部署。
3. 发票 OCR 能力取决于后端解析能力，当前 UI 不伪造“识别成功”结果。
4. 费用金额来自已确认发票，不独立写入后端不存在的金额字段。
5. 前端构建存在 Vite chunk 大小提示，后续可通过代码分割优化。

## 数据位置

本地模式下：

- SQLite 数据库：`data/expense.db`
- 发票上传目录：`backend/uploads/`
- 报销单模板：`backend/templates/reimbursement_template.pdf`
- 填表域模板：`backend/templates/reimbursement_form_fields.pdf`

备份时请按自己的部署环境处理数据文件，不要把本地数据库提交到仓库。
