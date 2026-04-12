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
### 一个把云端 AI 能力和浏览器专业编辑结合起来的开源图片工作室
</div>

## 🚀 为什么做 PixelForge

<div style="max-width: 720px; line-height: 1.6;">
PixelForge 是一个现代化的全栈图片处理平台，目标就是：**好用、够快、不折腾**。  
它把 <b>Replicate 驱动的 AI 处理</b>（超分、抠图、上色）和 <b>本地浏览器编辑工具</b>（压缩、格式转换、缩放、变换、元数据清理、取色、水印）放在一起，一站式搞定。
</div>

<br>

- ⚡ 该上 AI 的地方上 AI，该本地秒处理的地方就本地处理  
- 🔐 安全优先（Turnstile、人机验证、签名 URL、上传校验、防伪造代理策略）  
- 🧠 架构稳定（异步任务、配额限制、自动清理、会话恢复）  
- 🎨 交互体验顺手（前后对比、阶段进度反馈）  
- 🛠️ 开源且可扩展（目前接 Replicate，后面也能接别的 Provider）  



## 🎯 功能列表

### A) 核心图片工具

1. 🔍 **AI 超分（Upscale）** — 基于 Real-ESRGAN 提升分辨率  
2. 🧍 **AI 抠图（Remove Background）** — 自动分离主体，输出透明背景  
3. 🎨 **AI 上色（Restore Color）** — 为黑白/褪色照片智能上色  
4. 🎛️ **图片编辑** — 亮度、对比度、饱和度、色温、模糊、暗角、褪色  
5. 📐 **图片缩放** — 自定义尺寸、比例锁定、常用预设  
6. 🔄 **旋转与翻转** — 旋转、镜像变换  
7. 🗜️ **图片压缩** — 可调压缩强度，平衡质量与体积  
8. 🔁 **格式转换** — PNG / JPG / WEBP 互转  
9. 🧹 **元数据清理** — 读取并移除 EXIF 信息  
10. 🎯 **调色板提取** — 拖拽采样点获取主色  
11. 🏷️ **添加水印** — 文本/图片水印，支持实时预览  
12. ✂️ **图片裁剪** *(即将上线)*  
13. 🖼️ **缩略图生成器** *(即将上线)*  

### B) 平台 / 安全 / 工作流能力

14. 🛡️ **Turnstile 人机验证** — 防止滥用与机器人请求  
15. 📊 **使用配额控制** — 按功能维度限制每日使用量  
16. 🚦 **API 限流机制** — 控制 init / start / poll 请求频率  
17. ⚙️ **异步任务队列** — 后台处理 + 并发保护  
18. 🔄 **状态轮询机制** — processing / ready / failed  
19. 💾 **会话持久化** — IndexedDB + localStorage  
20. 🔁 **会话恢复** — 刷新或重开后自动恢复  
21. ⏳ **过期机制** — 结果与草稿生命周期管理  
22. 🧽 **Azure 清理任务** — 自动删除过期资源  
23. 🧹 **数据库清理** — 使用记录定期维护  
24. 🔑 **签名 URL** — 安全上传与下载（Azure SAS）  
25. 🔍 **文件校验** — 类型、大小、结构 + 伪装检测  
26. 🏷️ **文件名清洗** — 防止非法或危险命名  
27. 🧩 **工作区系统** — 可复用布局与交互结构  
28. 📢 **弹窗系统** — 法务与状态提示统一管理  
29. 🆚 **对比滑块** — 前后效果直观展示  
30. 🎬 **进度反馈** — 分阶段展示长耗时任务进度  



## 🏗️ 架构 & 技术栈

<img src="./TECH_STACKS.png" width="35%" alt="Tech Stacks">

<div style="max-width: 760px; line-height: 1.65;">

PixelForge 是前后端分离架构：

- **前端（React + Vite + Tailwind）**  
  负责工具 UI、图片预览、本地编辑、会话持久化（IndexedDB/localStorage）和交互流程。

- **后端（FastAPI + asyncpg + aiohttp）**  
  负责 AI 调度、Turnstile 验证、配额/限流、签名 URL 下发以及轮询状态接口。

- **AI 推理层（Replicate Python SDK）**  
  通过 provider 抽象层调用模型（`BaseAIProvider` / `ReplicateProvider`），后续扩展会更方便。

- **存储与数据（Azure Blob + PostgreSQL）**  
  Azure Blob 管上传/结果生命周期；PostgreSQL 管使用计数和保留窗口。

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

> 本地开发时，`VITE_API_BASE_URL` 指向本地后端就行。  
> 部署后把它换成你线上 API 地址（比如：`https://your-domain/app/api`）。



## 🚀 本地运行

## 1) 克隆仓库

```bash
git clone https://github.com/Dendroculus/PixelForge.git
cd PixelForge
```

## 2) 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## 3) 启动前端

```bash
cd frontend
npm install
npm run dev
```



## 🔒 安全说明

- AI 任务初始化前必须通过 Turnstile 校验  
- 代理/IP 信任策略用于降低 Header 伪造风险  
- 通过 SAS 签名 URL 控制 Azure Blob 访问  
- 严格文件校验（尺寸/类型/结构）+ 安全清洗  
- 自动清理机制保障隐私与存储健康



## 🛠 Built With

- **React + Vite**（前端）
- **FastAPI**（后端）
- **Replicate**（AI 推理）
- **Azure Blob Storage**（上传/结果存储）
- **PostgreSQL**（配额统计与保留窗口）
- **Cloudflare Turnstile**（人机验证）



## 🤝 贡献

欢迎提 PR 一起完善！  
如果你准备做比较大的改动，建议先开一个 issue 对齐方向和范围。



## 📜 许可证

基于 MIT License。详情见 [LICENSE](../LICENSE)。



## 🙏 致谢

- Real-ESRGAN 生态
- Replicate 平台
- FastAPI、React 以及各位开源贡献者