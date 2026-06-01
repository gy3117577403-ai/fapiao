# 出差旅费报销管理工具

本项目是一个单机本地运行的出差旅费报销工具，用于录入报销单、管理行程、上传发票、汇总金额，并按提供的报销单模板生成可打印 PDF。

## 功能

- 报销单新增、编辑、删除、状态流转
- 行程录入、排序、车船费发票关联
- XML / PDF / OFD / 图片发票上传
- 发票金额确认后自动计入汇总
- 自动计算补贴天数、补贴金额、报销总额、补领不足、归还多余
- 总览看板、状态统计、最近报销单
- 基础设置：部门、出差人、每日补贴
- 报销单模板 PDF 预览、打开、下载

## 环境要求

- Windows 10/11
- Python 3.12
- Node.js 20 或更高版本

不要使用 Python 3.14 创建环境；当前 FastAPI/Pydantic 依赖在 Python 3.14 下可能需要本地编译工具链。

## 一键准备环境

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

脚本会创建 `.venv`、安装后端依赖，并安装前端依赖。

## 启动

方式一：一键启动两个服务：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

方式二：分两个终端启动。

后端：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

前端：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-frontend.ps1
```

打开浏览器访问：

```text
http://127.0.0.1:5173
```

如果 5173 已被占用，Vite 会在终端里提示新的端口，例如 `http://127.0.0.1:5174`。

后端 API：

```text
http://127.0.0.1:8000
```

## 分享网站

这个仓库包含 GitHub Pages 自动部署配置。推送到 `main` 后，GitHub Actions 会构建静态网站版本。

静态网站访问地址：

```text
https://gy3117577403-ai.github.io/fapiao/
```

静态网站不需要后端服务，数据会保存在访问者自己的浏览器里。

## 使用流程

1. 进入“基础设置”，填写部门、出差人、每日补贴。
2. 进入“报销单管理”，新增报销单。
3. 填写基本信息、行程、预支金额。
4. 在行程或费用项中上传发票。
5. 查看发票并确认金额，确认后的金额会进入汇总。
6. 保存报销单，进入“打印”生成模板 PDF。
7. 确认无误后下载或打开 PDF 打印。

## 数据位置

- SQLite 数据库：`data/expense.db`
- 发票上传目录：`backend/uploads/`
- 报销单模板：`backend/templates/reimbursement_template.pdf`
- 填表域定位模板：`backend/templates/reimbursement_form_fields.pdf`

备份时复制整个项目目录即可。

## 测试和构建

运行后端测试：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

构建前端：

```powershell
cd frontend
npm run build
```

## 注意

- 当前 PDF 模板最多显示 7 行行程；超过 7 行时，PDF 只会填入前 7 行。
- 已报销状态为只读，不允许继续修改报销单或发票。
- 图片发票无法自动解析金额，需要手动确认金额。
