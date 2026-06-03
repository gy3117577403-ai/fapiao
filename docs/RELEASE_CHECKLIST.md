# 发布前检查清单

## 1. 构建检查

- [ ] 在 `frontend` 目录执行 `npm ci`。
- [ ] 在 `frontend` 目录执行 `npm run build`。
- [ ] 确认构建产物目录为 `frontend/dist`。
- [ ] 检查 `frontend/dist/index.html` 中静态资源路径与当前部署 base path 一致。

## 2. 浏览器检查

- [ ] 执行 `npm run preview`。
- [ ] 打开 `/#/`，确认总览驾驶舱正常。
- [ ] 打开 `/#/reports`，确认报销单工作台正常。
- [ ] 打开 `/#/reports/new`，确认新建报销单页面正常。
- [ ] 打开 `/#/settings`，确认基础设置页面正常。
- [ ] 如存在真实报销单 ID，检查 `/#/reports/:id/edit` 和 `/#/reports/:id/print`。
- [ ] 控制台错误数为 0。
- [ ] 页面无 `NaN`、`undefined`、`[object Object]`。

## 3. 响应式检查

- [ ] 1366px 无横向溢出。
- [ ] 1440px 无横向溢出，双栏页面视觉稳定。
- [ ] 1920px 内容不会无限拉伸。
- [ ] 表格区域可以在窄屏内横向滚动。
- [ ] 右侧费用汇总 sticky 区域不遮挡底部按钮。

## 4. 业务链路检查

- [ ] 新建报销单成功。
- [ ] 新建后能在列表看到报销单。
- [ ] 列表行点击能打开详情抽屉。
- [ ] 编辑入口能进入编辑页。
- [ ] 编辑页字段能正确回填。
- [ ] 修改字段后保存成功。
- [ ] 打印入口能打开打印预览页。
- [ ] 删除按钮有确认弹窗。
- [ ] 删除后列表状态正确，分页不越界。
- [ ] 测试报销单已删除，数据库无测试数据残留。

## 5. API 配置检查

- [ ] 本地开发时 `VITE_API_BASE_URL` 指向本地后端。
- [ ] 生产部署时 `VITE_API_BASE_URL` 指向真实后端，或使用 `VITE_STATIC_MODE=true` 做纯前端演示。
- [ ] README 和 workflow 中没有真实密钥、token、私有 API 地址。
- [ ] 没有提交 `.env.local`。
- [ ] GitHub Pages 没有被当作后端服务使用。

## 6. GitHub Pages 检查

- [ ] GitHub 仓库 `Settings -> Pages -> Source` 设置为 `GitHub Actions`。
- [ ] workflow 名称为 `Deploy frontend to GitHub Pages`。
- [ ] workflow artifact path 为 `frontend/dist`。
- [ ] 如果部署到项目站点，`VITE_BASE_PATH` 与仓库路径一致，例如 `/fapiao/`。
- [ ] 如果部署到用户站点或自定义域名根路径，`VITE_BASE_PATH` 可设置为 `/`。
- [ ] 线上访问路径包含 HashRouter 的 `#`，例如 `/#/reports`。

## 7. 回滚方式

- [ ] 可以通过 `git revert <commit>` 回滚最近提交。
- [ ] 可以在 GitHub Actions 中重新部署上一个稳定 commit。
- [ ] 本次发布不修改数据库结构，回滚只涉及前端代码和静态构建产物。
- [ ] 如后端单独部署，后端回滚应按后端部署流程单独执行。
