<div align="center">

  [EN](../README.md) | 中文
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Azure-0078D4?logo=microsoft-azure&logoColor=white" alt="Microsoft Azure">
  <img src="https://img.shields.io/badge/Cloudflare-Turnstile-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Turnstile">
</p>

<p align="center" style="margin-top: -12px;">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?logo=opensourceinitiative&logoColor=white" alt="MIT">
  <img src="https://img.shields.io/badge/Replicate-111111?logo=replicate&logoColor=white" alt="Replicate">
</p>

<div align="center">

# ✨ PixelForge
### 一个将云端 AI 能力与专业级浏览器编辑深度融合的开源图片工作室
</div>

## 🚀 为什么选择 PixelForge

<div style="max-width: 720px;">

PixelForge 最初是一个单一用途的 AI 超分工具，后续演进为完整的全栈图像处理平台。  
它将 **AI 驱动的云端处理能力**（超分、抠图、上色修复）与高性能的 **浏览器端编辑工具**（缩放、压缩、变换、元数据清理）结合在同一工作流中。  
系统围绕真实生产场景设计：配额限制、长耗时 AI 任务、存储生命周期管理，并通过异步队列架构确保整体稳定性与可扩展性。</div>

<br>

- ⚡ 该用 AI 的环节交给云端，能秒级完成的操作直接本地处理  
- 🔐 安全优���的处理链路（Turnstile、签名 URL、文件校验、防伪造代理策略）  
- 🧠 稳定可靠的系统设计（异步任务、配额限制、清理任务、会话恢复）  
- 🎨 优秀交互体验（前后对比、分阶段进度反馈）  
- 🛠️ 开源且可扩展的 Provider 架构  

## 🎯 功能特性

### A) 核心图像工具

1. ���� **图像超分（AI）** — 基于 Real-ESRGAN 增强画质  
2. 🧍 **背景移除（AI）** — 干净提取主体  
3. 🎨 **照片上色修复（AI）** — 还原黑白与褪色照片  
4. 🎛️ **图像编辑器** — 亮度、对比度、饱和度、模糊、暗角  
5. 📐 **图像缩放** — 自定义尺寸、比例锁定、常用预设  
6. 🔄 **旋转与翻转** — 快速变换控制  
7. 🗜️ **图像压缩** — 可控质量下减小体积  
8. 🔁 **格式转换** — PNG / JPG / WEBP  
9. 🧹 **移除元数据** — 清理 EXIF 信息  
10. 🎯 **调色板提取器** — 支持拖拽采样点  
11. 🏷️ **添加水印** — 文本/图片水印与实时预览  
12. ✂️ **图像裁剪** — 自由裁剪或预设比例裁剪  
13. 🖼️ **缩略图生成器** *(即将上线)*  

### B) 平台与系统能力

14. 🛡️ **Turnstile 验证** — 机器人防护层  
15. 📊 **使用配额限制** — 按功能维度每日限额  
16. 🚦 **API 限流机制** — 稳定控制接口流量  
17. ⚙️ **异步任务队列** — 安全处理后台任务  
18. 🔄 **状态轮询机制** — processing / ready / failed  
19. 💾 **会话持久化** — IndexedDB + localStorage  
20. 🔁 **会话恢复** — 刷新后自动恢复处理状态  
21. ⏳ **过期管理机制** — 结果与草稿生命周期控制  
22. 🧽 **Azure 清理任务** — 自动清理过期结果  
23. 🧹 **数据库清理任务** — 使用数据定期维护  
24. 🔑 **签名 URL** — 安全上传与访问  
25. 🔍 **文件校验** — 类型、大小、伪装检测  
26. 🏷️ **文件名清洗** — 安全文件命名处理  
27. 🧩 **Workspace 工作区系统** — 可复用 UI 外壳  
28. 📢 **模态框系统** — 法务与告警提示统一管理  
29. 🆚 **对比滑块** — 前后效果直观对照  
30. 🎬 **进度体验优化** — 分阶段加载反馈  

## 🧠 架构亮点
PixelForge 的核心目标是在性能、成本与可靠性之间取得平衡，尤其针对外部 AI API 的并发与速率限制做了专门设计。关键架构决策包括：

- 基于队列的 AI 处理系统，用于承载长耗时任务  
- 解耦上传 → 处理 → 结果的处理流水线  
- 并发控制机制，避免过载与接口滥用  
- 无状态 API + 客户端任务跟踪模型  
- 混合处理架构（云端 AI + 浏览器即时处理）  
- 存储生命周期管理与自动清理机制  
- 可插拔 AI Provider 层，便于后续模型接入

## 💡 设计考量

- AI 任务因执行耗时长且受外部 API 限制，采用异步处理  
- 使用轮询而非 WebSocket，以降低复杂度并提升稳定性  
- 签名 URL 可降低后端负载并优化上传/下载性能  
- 限流与配额机制用于防滥用并控制成本

## 🔧 处理模型
PixelForge 采用混合处理模型来平衡性能与成本：  
AI 密集任务在后端异步执行，轻量操作在浏览器端即时完成。

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### 🔄 AI 处理流程（异步）
系统会根据任务负载分离处理路径，以优化性能与成本：

1. 用户上传图片 → 后端进行校验与文件名清洗  
2. 后端生成 Azure Blob 的签名上传 URL  
3. 文件直传至对象存储  
4. 创建任务并进入处理队列  
5. AI Provider 异步执行任务  
6. 客户端通过 API 轮询任务状态  
7. 结果入库并生成签名访问 URL  
8. 前端拉取并展示处理结果  
9. 清理系统定期移除过期数据
</div>

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### ⚡ 浏览器端处理流程（即时）
轻量级图像变换全部在浏览器中执行，带来即时反馈且无需后端参与：

1. 用户上传图片  
2. 浏览器端直接处理（缩放、压缩、变换等）  
3. 无需后端交互  
4. 即时生成结果  
5. 用户下载处理后的文件
</div>

## 🏗️ 架构与技术栈

<img src="./TECH_STACKS.png" width="45%" alt="Tech Stacks">

<div style="max-width: 760px; line-height: 1.65;">

PixelForge 采用前后端分离架构：

- **前端（React + Vite + Tailwind）**  
  负责工具界面、预览、浏览器端变换、会话持久化（IndexedDB/localStorage）及交互流程。

- **后端（FastAPI + asyncpg + aiohttp）**  
  负责安全 AI 调度、Turnstile 校验、配额/限流、签名上传/结果 URL 下发及轮询接口。

- **AI 推理层（Replicate Python SDK）**  
  通过 provider 抽象层（`BaseAIProvider` / `ReplicateProvider`）调用模型，保持 AI 层模块化与可扩展性。

- **存储与数据（Azure Blob + PostgreSQL）**  
  Azure Blob 负责上传/结果的生命周期；PostgreSQL 负责配额桶与保留窗口状态管理。

</div>


## ⚙️ 环境变量

### 后端（root/backend env）

```env
AZURE_CONNECTION_STRING=
REPLICATE_API_TOKEN=
ALLOWED_ORIGINS=
CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
DATABASE_URL=
CLOUDFLARE_SUBNETS=
ENVIRONMENT=
ALLOW_TURNSTILE_TEST_BYPASS=
TRUST_PROXY_HEADERS=
REQUIRE_CLOUDFLARE_PROXY=
STRICT_ENV_VALIDATION=
```

### 前端

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACxEYGPTmGZUjctK
```

> 本地测试时，`VITE_API_BASE_URL` 保持指向本地后端。  
> 部署时，替换为你的线上 API 地址（例如：`https://your-domain/app/api`）。

## 🚀 本地开发

## 1) 克隆仓库

```bash
git clone https://github.com/Dendroculus/PixelForge.git
cd PixelForge
```

## 2) 运行后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## 3) 运行前端

```bash
cd frontend
npm install
npm run dev
```

## 🔒 安全说明

- AI 初始化路由前进行 Turnstile 校验  
- 代理/IP 信任策略用于降低 Header 伪造风险  
- 使用签名 SAS URL 控制 Blob 访问  
- 严格文件校验并限制尺寸/体积  
- 自动清理机制保障隐私与存储健康

## 🛠 Built With

- **React + Vite**（前端）
- **FastAPI**（后端）
- **Replicate**（AI 模型推理）
- **Azure Blob Storage**（上传/结果生命周期）
- **PostgreSQL**（配额统计与保留窗口）
- **Cloudflare Turnstile**（机器人防护）

## 🤝 贡献

欢迎提交 PR 或改进建议。  
如果你计划进行较大改动，建议先开 issue 对齐范围。


## 📜 许可证

项目基于 MIT License。详见 [LICENSE](../LICENSE)。


## 🙏 致谢

- Real-ESRGAN ecosystem
- Replicate platform
- FastAPI、React 与开源社区贡献者

## 👤 贡献者

<table>
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/Dendroculus">
        <img src="https://github.com/Dendroculus.png?size=96" width="96" alt="Hans avatar" style="border-radius: 50%;"><br/>
        <b>Hans</b><br/>
      </a>
        <sub><b>主开发</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Serthonss">
        <img src="https://github.com/Serthonss.png?size=96" width="96" alt="Wellson avatar" style="border-radius: 50%;"><br/>
        <b>Wellson</b><br/>
      </a>
        <sub><b>项目经理</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/vincentlawi">
        <img src="https://github.com/vincentlawi.png?size=96" width="96" alt="Lawi avatar" style="border-radius: 50%;"><br/>
        <b>Lawi</b><br/>
      </a>
        <sub><b>UI/UX 设计</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Jensenix">
        <img src="https://github.com/Jensenix.png?size=96" width="96" alt="Jensen avatar" style="border-radius: 50%;"><br/>
        <b>Jensen</b><br/>
      </a>
        <sub><b>测试负责人 / 主要干系人</b></sub>
    </td>
  </tr>
</table>