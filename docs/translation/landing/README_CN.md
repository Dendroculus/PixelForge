<div align="center">

  [EN](../../../README.md) | 中文 | [ID](./README_ID.md)
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
### 将云端 AI 能力与专业级浏览器编辑结合的开源图片工作室
</div>

## 🚀 为什么选择 PixelForge

<div style="max-width: 720px;">

PixelForge 最初是一个单一用途的 AI 超分辨率工具，后来逐步演进为完整的全栈图像处理平台。
它将 **AI 驱动的云端处理能力**（超分、背景移除、照片修复）与快速的 **浏览器端编辑工具**（尺寸调整、压缩、变换、元数据清理）结合在一起。
系统围绕真实场景中的限制进行设计，例如接口限流、长时间运行的 AI 任务，以及通过异步队列架构管理存储生命周期。</div>

<br>

- ⚡ 在真正需要 AI 的地方使用云端处理，在更快的场景中使用即时浏览器工具  
- 🔐 安全优先的处理管线（Turnstile、签名 URL、验证、防伪造代理策略）  
- 🧠 可靠的架构（异步任务、使用限制、清理任务、会话恢复）  
- 🎨 精美的用户体验，支持前后对比与分阶段进度反馈  
- 🛠️ 开源且可扩展的 Provider 架构  



## 🎯 功能特性

### A) 核心图像工具

1. 🔍 **图像超分（AI）** — Real-ESRGAN 画质增强

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/61cff1c1-69f2-4707-9cef-025cee09298f">
</details>

2. 🧍 **移除背景（AI）** — 干净提取主体

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/d22a42c6-ad5d-41b6-8f83-419aba47d09f">
</details>

3. 🎨 **恢复颜色（AI）** — 修复灰度与褪色照片

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/68491a17-057d-49cf-b1a2-03cbc2f5f9ca">
</details>

4. 🎨 **Object Remover（AI）** — 涂抹不需要的物体并将其干净移除

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3c68ed8b-dad1-4f88-b1d7-873455ecd3ee">
</details>

5. 🎛️ **图像编辑器** — 亮度、对比度、饱和度、模糊、暗角

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a2e1db98-212e-4801-afa5-3d0d548925df">
</details>

6. 📐 **调整图像尺寸** — 自定义尺寸、锁定比例、预设尺寸

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/169353e7-1916-44e5-bfe0-5075bbf4fa8e">
</details>

7. 🔄 **旋转与翻转** — 快速变换控制

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a1dda108-f6dd-4a7c-9002-6db21ef25d49">
</details>

8. 🗜️ **压缩图像** — 通过质量控制减小文件体积

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/25a7f82c-8550-4e0e-8d4c-9a4420d646d9">
</details>

9. 🔁 **格式转换** — PNG / JPG / WEBP

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3d353e7a-b614-4bdc-b549-e8a092a41621">
</details>

10. 🧹 **移除元数据** — 清理 EXIF 数据

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3b06be04-1020-4b0e-aad8-7aff77e76f58">
</details>

11. 🎯 **调色板提取器** — 可拖拽的取样点

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/da8a8267-428f-4c02-8abb-4029305511d6">
</details>

12. 🏷️ **添加水印** — 文本/图片水印与实时预览

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/928bb069-7643-4a0c-b6e5-1056706547f6">
</details>

13. ✂️ **裁剪图像** — 自由裁剪或使用预设比例

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/717edf23-64d5-4673-bffa-21b10fec7ca9">
</details>

14. 🤖 **聊天机器人** — 交互式 FAQ 助手，可快速解答问题并提供平台使用引导

<details>
  <summary><b>🎥 点击查看预览</b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/90083dfb-915a-43f1-a2b3-d9fbefc10bdd">
</details>

15. 📝 **反馈系统** — 收集用户建议、改进意见与问题报告


### B) 平台与系统能力

16. 🛡️ **Turnstile 验证** — 机器人防护层  
17. 📊 **使用限制** — 按功能设置每日配额  
18. 🚦 **速率限制** — 控制 API 请求流量  
19. ⚙️ **异步任务队列** — 安全的后台处理  
20. 🔄 **状态轮询** — processing / ready / failed  
21. 💾 **会话持久化** — IndexedDB + localStorage  
22. 🔁 **会话恢复** — 刷新后恢复处理状态  
23. ⏳ **过期处理** — 结果与草稿生命周期管理  
24. 🧽 **Azure 清理** — 过期结果清理任务  
25. 🧹 **数据库清理** — 使用数据维护  
26. 🔑 **签名 URL** — 安全上传与访问  
27. 🔍 **文件验证** — 类型、大小、防伪装检测  
28. 🏷️ **文件名清洗** — 安全文件处理  
29. 🧩 **Workspace 系统** — 可复用 UI 外壳  
30. 📢 **模态框系统** — 法务与提示统一管理  
31. 🆚 **对比滑块** — 前后效果预览  
32. 🎬 **进度体验** — 分阶段加载反馈  

## 🧠 架构亮点
PixelForge 的设计目标是在使用具有严格速率与并发限制的外部 AI API 时，平衡性能、成本与可靠性。关键架构决策包括：

- 基于队列的 AI 处理系统，用于处理长时间运行的任务  
- 解耦的上传 → 处理 → 结果管线  
- 并发控制，防止系统过载与 API 滥用  
- 无状态 API 与客户端任务跟踪  
- 混合处理模型（云端 AI + 浏览器即时工具）  
- 存储生命周期管理与自动清理
- 可插拔 AI Provider 层，便于未来集成更多模型

## 💡 设计考量

- AI 任务执行时间较长且受外部 API 限制，因此使用异步处理  
- 为了简化实现并提高可靠性，使用轮询而不是 WebSocket  
- 签名 URL 可降低后端负载并提升上传/下载性能  
- 速率限制和使用配额可防止滥用并控制成本

## 🔧 处理模型
PixelForge 使用混合处理模型来平衡性能与成本：
AI 密集型任务在后端异步处理，轻量操作则直接在浏览器中即时执行。

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### 🔄 AI 处理流程（异步）
系统会根据工作负载类型分离处理路径，从而优化性能与成本：

1. 用户上传图像 → 验证并清洗文件  
2. 后端生成签名上传 URL（Azure Blob）  
3. 文件直接上传到存储  
4. 创建任务并加入处理队列  
5. AI Provider 异步执行任务  
6. 客户端通过 API 轮询任务状态  
7. 结果通过签名访问 URL 存储  
8. 前端获取并展示结果  
9. 清理系统移除过期数据
</div>

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### ⚡ 浏览器端处理流程（即时）
前端直接在浏览器中处理所有轻量图像变换，以提供即时反馈并避免后端负载：

1. 用户上传图像  
2. 图像直接在浏览器中处理（调整大小、压缩、变换等）  
3. 不需要后端交互  
4. 立即生成结果  
5. 用户下载处理后的文件
</div>

## 🏗️ 架构与技术栈

<img src="../../assets/TECH_STACKS.png" width="45%" alt="Tech Stacks">

<div style="max-width: 760px; line-height: 1.65;">

PixelForge 使用前后端分离架构：

- **前端（React + Vite + Tailwind）**  
  负责工具界面、预览、浏览器端变换、会话持久化（IndexedDB/localStorage）以及交互流程。

- **后端（FastAPI + asyncpg + aiohttp）**  
  负责安全的 AI 调度、Turnstile 验证、使用/速率限制、签名上传/结果 URL，以及轮询端点。

- **AI 推理（Replicate Python SDK）**  
  模型调用通过 Provider 抽象层（`BaseAIProvider` / `ReplicateProvider`）进行，使 AI 层保持模块化和可扩展。

- **存储与数据（Azure Blob + PostgreSQL）**  
  Azure Blob 管理上传/结果生命周期；PostgreSQL 存储使用量桶与基于保留时间的状态。

</div>

更多细节请查看 [架构文档](../dev/ARCHITECTURE_ZH.md)。


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

> 本地测试时，请保持 API base URL 指向本地后端。  
> 部署时，请切换为托管后的 API 端点（例如：`https://your-domain/app/api`）。

需要配置外部服务？请查看 [SETUP.md](../dev/SETUP_ZH.md)，其中提供了 Azure Blob Storage、Replicate、Cloudflare Turnstile、PostgreSQL、Discord Webhook 和环境变量的分步配置说明。

## 🚀 本地开发

## 1) 克隆

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

- AI init 路由前进行 Turnstile 校验
- 代理/IP 信任策略降低 header spoofing 风险
- 使用签名 SAS URL 控制 Blob 访问
- 严格文件验证 + 尺寸/大小上限
- 自动清理保障隐私与存储卫生



## 🛠 技术栈

- **React + Vite**（前端）
- **FastAPI**（后端）
- **Replicate**（AI 模型推理）
- **Azure Blob Storage**（上传/结果生命周期）
- **PostgreSQL**（使用限制与保留窗口）
- **Cloudflare Turnstile**（机器人防护）



## 🤝 贡献

欢迎提交 PR 和改进建议。  
如果你计划进行较大改动，请先创建 issue 以便对齐范围。

贡献指南请参阅 [CONTRIBUTING_ZH.md](../community/CONTRIBUTING_ZH.md)。  
请遵守我们的 [行为准则](../community/CODE_OF_CONDUCT_ZH.md)。  
如需报告安全问题，请参阅我们的 [安全政策](../community/SECURITY_ZH.md)。

## 📜 许可证

基于 MIT License 授权。详情请查看 [LICENSE](../../../LICENSE)。


## 📝 开发者文档

如何为 PixelForge 添加新的 AI 功能
- [添加新的 AI 功能](../dev/ADDING_AI_FEATURE_ZH.md)

## 🙏 致谢

- Real-ESRGAN ecosystem
- Replicate platform
- FastAPI、React 以及开源贡献者

## 👤 贡献者
由 PixelForge 团队用 ❤️ 制作：

<table>
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/Dendroculus">
        <img src="https://github.com/Dendroculus.png?size=96" width="96" alt="Hans avatar" style="border-radius: 50%;"><br/>
        <b>Hans</b><br/>
      </a>
        <sub><b>主开发者</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Serthonss">
        <img src="https://github.com/Serthonss.png?size=96" width="96" alt="Wellson avatar" style="border-radius: 50%;"><br/>
        <b>Wellson</b><br/>
      </a>
        <sub><b>项目协调员</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/vincentlawi">
        <img src="https://github.com/vincentlawi.png?size=96" width="96" alt="Lawi avatar" style="border-radius: 50%;"><br/>
        <b>Lawi</b><br/>
      </a>
        <sub><b>UI/UX 设计师</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Jensenix">
        <img src="https://github.com/Jensenix.png?size=96" width="96" alt="Jensen avatar" style="border-radius: 50%;"><br/>
        <b>Jensen</b><br/>
      </a>
        <sub><b>QA 负责人 & 干系人</b></sub>
    </td>
  </tr>
</table>
