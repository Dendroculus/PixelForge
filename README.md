<div align="center">

  EN | [中文](./docs/translation/landing/README_CN.md) | [ID](./docs/translation/landing/README_ID.md)
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
### The open-source image studio that blends AI cloud power with pro-grade browser editing
</div>

## 🚀 Why PixelForge

<div style="max-width: 720px;">

PixelForge started as a single-purpose AI upscaler and evolved into a full-stack image processing platform.
It combines **AI-powered cloud processing** (upscale, background removal, restoration) with fast **client-side editing tools** (resize, compress, transform, metadata cleaning).
The system is designed to handle real-world constraints such as rate limits, long-running AI jobs, and storage lifecycle management through an async queue-based architecture.</div>

<br>

- ⚡ AI where it matters, instant client-side tools where it’s faster  
- 🔐 Security-first pipeline (Turnstile, signed URLs, validation, anti-spoof proxy strategy)  
- 🧠 Reliable architecture (async jobs, usage limits, janitor cleanup, session recovery)  
- 🎨 Beautiful UX with before/after comparisons and staged progress feedback  
- 🛠️ Open-source and extensible provider architecture  



## 🎯 Features

### A) Core Image Tools

1. 🔍 **Upscale Image (AI)** — Real-ESRGAN enhancement

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/61cff1c1-69f2-4707-9cef-025cee09298f">
</details>

2. 🧍 **Remove Background (AI)** — clean subject extraction

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/d22a42c6-ad5d-41b6-8f83-419aba47d09f">
</details>

3. 🎨 **Restore Color (AI)** — revive grayscale & faded photos

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/68491a17-057d-49cf-b1a2-03cbc2f5f9ca">
</details>

4. 🎨 **Object Remover (AI)** — brush over unwanted objects and erase them cleanly

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3c68ed8b-dad1-4f88-b1d7-873455ecd3ee">
</details>


5. 🎛️ **Image Editor** — brightness, contrast, saturation, blur, vignette

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a2e1db98-212e-4801-afa5-3d0d548925df">
</details>

6. 📐 **Resize Image** — custom size, aspect lock, presets

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/169353e7-1916-44e5-bfe0-5075bbf4fa8e">
</details>

7. 🔄 **Rotate & Flip** — quick transform controls

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a1dda108-f6dd-4a7c-9002-6db21ef25d49">
</details>

8. 🗜️ **Compress Image** — reduce size with quality control

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/25a7f82c-8550-4e0e-8d4c-9a4420d646d9">
</details>

9. 🔁 **Convert Format** — PNG / JPG / WEBP

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3d353e7a-b614-4bdc-b549-e8a092a41621">
</details>

10. 🧹 **Remove Metadata** — clean EXIF data

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3b06be04-1020-4b0e-aad8-7aff77e76f58">
</details>

11. 🎯 **Color Palette Extractor** — draggable sampling points

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/da8a8267-428f-4c02-8abb-4029305511d6">
</details>

12. 🏷️ **Add Watermark** — text/image with live preview

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/928bb069-7643-4a0c-b6e5-1056706547f6">
</details>

13. ✂️ **Crop Image** — freeform or preset aspect ratios

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/717edf23-64d5-4673-bffa-21b10fec7ca9">
</details>

14. 🤖 **Chatbot** — Interactive FAQ assistant for quick answers and guided platform help

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/90083dfb-915a-43f1-a2b3-d9fbefc10bdd">
</details>

15. 📝 **Feedback System** — user input for improvements and bug reports


### B) Platform & System Capabilities

16. 🛡️ **Turnstile Verification** — bot protection layer  
17. 📊 **Usage Limits** — per-feature daily caps  
18. 🚦 **Rate Limiting** — controlled API flow  
19. ⚙️ **Async Job Queue** — safe background processing  
20. 🔄 **Status Polling** — processing / ready / failed  
21. 💾 **Session Persistence** — IndexedDB + localStorage  
22. 🔁 **Session Restore** — recover after refresh  
23. ⏳ **Expiration Handling** — results & drafts lifecycle  
24. 🧽 **Azure Cleanup** — expired result janitor  
25. 🧹 **DB Cleanup** — usage data maintenance  
26. 🔑 **Signed URLs** — secure upload & access  
27. 🔍 **File Validation** — type, size, spoof detection, and resolution safety  
28. 📉 **Auto-Resize for Oversized Images** — browser-side downscaling for images above the public pixel limit  
29. 🏷️ **Filename Sanitization** — safe file handling  
30. 🧩 **Workspace System** — reusable UI shell  
31. 📢 **Modal System** — legal & alert handling  
32. 🆚 **Comparison Slider** — before/after preview  
33. 🎬 **Progress UX** — staged loading feedback  

## 🧠 Architecture Highlights
PixelForge is designed to balance performance, cost, and reliability while working with external AI APIs that have strict rate and concurrency limits. Key architectural decisions include:

- Queue-based AI processing system to handle long-running jobs  
- Decoupled upload → process → result pipeline  
- Concurrency control to prevent overload and API abuse  
- Stateless API with client-side job tracking  
- Hybrid processing model (AI in cloud, instant tools in browser)  
- Storage lifecycle management with automatic cleanup
- Pluggable AI provider layer for future model integrations

## 💡 Design Considerations

- AI jobs are handled asynchronously due to long execution times and external API limits  
- Polling is used instead of WebSockets for simplicity and reliability  
- Signed URLs reduce backend load and improve upload/download performance  
- Rate limiting and usage caps prevent abuse and control costs

## 🔧 Processing Models
PixelForge uses a hybrid processing model to balance performance and cost:
AI-intensive tasks are handled asynchronously on the backend, while lightweight operations are executed instantly in the browser.

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### 🔄 AI Processing Flow (Asynchronous)
The system separates processing paths based on workload type to optimize performance and cost :

1. User selects an image  
2. Frontend validates type, size, and resolution  
3. Oversized but safe images are resized in the browser before upload  
4. Backend verifies Turnstile and checks usage quota  
5. Backend generates signed upload URL metadata  
6. File uploads directly to Azure Blob Storage  
7. Backend reserves queue capacity and increments usage when processing starts  
8. AI provider executes the task asynchronously  
9. Client polls job status via API  
10. Result is stored with a signed access URL  
11. Cleanup system removes expired data
</div>

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### ⚡ Client-Side Processing Flow (Instant)
The frontend handles all lightweight transformations directly in the browser for instant feedback and zero backend load to provide a seamless user experience:

1. User uploads image  
2. Image processed directly in browser (resize, compress, transform, etc.)  
3. No backend interaction required  
4. Result generated instantly  
5. User downloads processed file
</div>

## 🏗️ Architecture & Stack

<img src="./docs/assets/TECH_STACKS.png" width="45%" alt="Tech Stacks">

<div style="max-width: 760px; line-height: 1.65;">

PixelForge uses a split architecture:

- **Frontend (React + Vite + Tailwind)**  
  Handles tool UI, previews, client-side transforms, session persistence (IndexedDB/localStorage), and interaction flow.

- **Backend (FastAPI + asyncpg + aiohttp)**  
  Handles secure AI orchestration, Turnstile verification, usage/rate limits, signed upload/result URLs, and polling endpoints.

- **AI Inference (Replicate Python SDK)**  
  Model calls go through a provider abstraction (`BaseAIProvider` / `ReplicateProvider`) so the AI layer is modular and extensible.

- **Storage + Data (Azure Blob + PostgreSQL)**  
  Azure Blob manages upload/result lifecycle; PostgreSQL stores usage buckets and retention-driven state.

</div>

For more details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).


## ⚙️ Environment Variables

PixelForge separates backend secrets from browser-visible frontend configuration. Create local environment files from the included examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> Windows PowerShell: use `Copy-Item backend/.env.example backend/.env` and `Copy-Item frontend/.env.example frontend/.env`.

### Backend (`backend/.env`)

```env
ENVIRONMENT=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pixelforge
AZURE_CONNECTION_STRING=
REPLICATE_API_TOKEN=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
DISCORD_WEBHOOK_URL=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOW_TURNSTILE_TEST_BYPASS=false

TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_CIDRS=
CLOUDFLARE_SUBNETS=
REQUIRE_CLOUDFLARE_PROXY=false

LOG_LEVEL=INFO
LOG_TO_FILE=false
LOG_DIR=logs
LOG_FILE_NAME=pixelforge.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=
VITE_DEBUG_API=false # true in development, false in production
```

- Keep `DATABASE_URL`, Azure credentials, Replicate tokens, the Turnstile secret, and `DISCORD_WEBHOOK_URL` only in the backend environment.
- All `VITE_*` values are bundled into browser code and must be safe to expose publicly.
- `LOG_TO_FILE=false` is suitable when the hosting platform already captures stdout. Set it to `true` for local rotating file logs when needed.
- Forwarded IP headers are ignored by default. Enable `TRUST_PROXY_HEADERS` only with explicit proxy CIDRs; never use `0.0.0.0/0` or `::/0`.
- `CLOUDFLARE_SUBNETS` is required only for verified Cloudflare proxy mode. `REQUIRE_CLOUDFLARE_PROXY` validates the proxy chain but does not firewall the origin.
- For deployment, replace local origins and URLs with the hosted frontend and backend addresses.

Need help setting up external services? See [SETUP.md](./SETUP.md) for step-by-step instructions on configuring Azure Blob Storage, Replicate, Cloudflare Turnstile, PostgreSQL, Discord webhooks, and environment variables.

## 🚀 Local Development

## 1) Clone

```bash
git clone https://github.com/Dendroculus/PixelForge.git
cd PixelForge
```

## 2) Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload --no-proxy-headers
```

## 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔒 Security Notes

- Turnstile check before AI init routes
- Forwarded client-IP headers accepted only from configured trusted proxy CIDRs
- Signed SAS URLs for controlled blob access
- Strict file validation + capped dimensions/size
- Public AI uploads use a lower browser-side pixel limit for user experience
- Backend validation remains the security boundary with a higher hard pixel safety cap
- Oversized images may be resized before upload, while oversized files are still rejected by byte-size limits
- Automated cleanup for privacy and storage hygiene


## 🤝 Contributing

PRs and improvements are welcome.  
If you’re planning a bigger change, open an issue first to align on scope.

For contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).  
Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).  
For security issues, please see our [Security Policy](SECURITY.md).

## 📜 License

Licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## 📝 Developer Docs

How to add a new AI feature to PixelForge:
- [Adding a New AI Feature](docs/ADDING_AI_FEATURE.md)

Backend and AI test scripts:
- [Testing PixelForge](docs/TESTING.md) ([ID](docs/translation/dev/TESTING_ID.md), [ZH](docs/translation/dev/TESTING_ZH.md))

Developer helper scripts:
- [Total Line Counter](scripts/dev/get_total_lines.ps1) — interactive Windows PowerShell script for counting project lines by folder, extension, and section.

> Local PowerShell scripts and `.bat` helper files are intended for Windows development environments.

## 🙏 Acknowledgements

- Real-ESRGAN ecosystem
- Replicate platform
- FastAPI, React, and open-source contributors

## 👤 Contributors
Made with ❤️ by the PixelForge team:

<table>
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/Dendroculus">
        <img src="https://github.com/Dendroculus.png?size=96" width="96" alt="Hans avatar" style="border-radius: 50%;"><br/>
        <b>Hans</b><br/>
      </a>
        <sub><b>Lead Developer</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Serthonss">
        <img src="https://github.com/Serthonss.png?size=96" width="96" alt="Wellson avatar" style="border-radius: 50%;"><br/>
        <b>Wellson</b><br/>
      </a>
        <sub><b>Project Coordinator</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/vincentlawi">
        <img src="https://github.com/vincentlawi.png?size=96" width="96" alt="Lawi avatar" style="border-radius: 50%;"><br/>
        <b>Lawi</b><br/>
      </a>
        <sub><b>UI/UX Designer</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Jensenix">
        <img src="https://github.com/Jensenix.png?size=96" width="96" alt="Jensen avatar" style="border-radius: 50%;"><br/>
        <b>Jensen</b><br/>
      </a>
        <sub><b>QA Lead & Stakeholder</b></sub>
    </td>
  </tr>
</table>