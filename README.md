<div align="center">

  EN | [中文](./docs/READMEcn.md)
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

4. 🎛️ **Image Editor** — brightness, contrast, saturation, blur, vignette

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a2e1db98-212e-4801-afa5-3d0d548925df">
</details>

5. 📐 **Resize Image** — custom size, aspect lock, presets

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/169353e7-1916-44e5-bfe0-5075bbf4fa8e">
</details>

6. 🔄 **Rotate & Flip** — quick transform controls

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a1dda108-f6dd-4a7c-9002-6db21ef25d49">
</details>

7. 🗜️ **Compress Image** — reduce size with quality control

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/25a7f82c-8550-4e0e-8d4c-9a4420d646d9">
</details>

8. 🔁 **Convert Format** — PNG / JPG / WEBP

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3d353e7a-b614-4bdc-b549-e8a092a41621">
</details>

9. 🧹 **Remove Metadata** — clean EXIF data

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3b06be04-1020-4b0e-aad8-7aff77e76f58">
</details>

10. 🎯 **Color Palette Extractor** — draggable sampling points

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/da8a8267-428f-4c02-8abb-4029305511d6">
</details>

11. 🏷️ **Add Watermark** — text/image with live preview

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/928bb069-7643-4a0c-b6e5-1056706547f6">
</details>

12. ✂️ **Crop Image** — freeform or preset aspect ratios

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/717edf23-64d5-4673-bffa-21b10fec7ca9">
</details>

13. 🖼️ **Thumbnail Maker** *(Coming Soon)*

14. 🤖 **Chatbot** — Interactive FAQ assistant for quick answers and guided platform help

<details>
  <summary><b>🎥 Click to watch the preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/90083dfb-915a-43f1-a2b3-d9fbefc10bdd">
</details>


### B) Platform & System Capabilities

15. 🛡️ **Turnstile Verification** — bot protection layer  
16. 📊 **Usage Limits** — per-feature daily caps  
17. 🚦 **Rate Limiting** — controlled API flow  
18. ⚙️ **Async Job Queue** — safe background processing  
19. 🔄 **Status Polling** — processing / ready / failed  
20. 💾 **Session Persistence** — IndexedDB + localStorage  
21. 🔁 **Session Restore** — recover after refresh  
22. ⏳ **Expiration Handling** — results & drafts lifecycle  
23. 🧽 **Azure Cleanup** — expired result janitor  
24. 🧹 **DB Cleanup** — usage data maintenance  
25. 🔑 **Signed URLs** — secure upload & access  
26. 🔍 **File Validation** — type, size, spoof detection  
27. 🏷️ **Filename Sanitization** — safe file handling  
28. 🧩 **Workspace System** — reusable UI shell  
29. 📢 **Modal System** — legal & alert handling  
30. 🆚 **Comparison Slider** — before/after preview  
31. 🎬 **Progress UX** — staged loading feedback  

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

1. User uploads image → validated and sanitized  
2. Backend generates signed upload URL (Azure Blob)  
3. File uploaded directly to storage  
4. Job created and queued for processing  
5. AI provider executes task asynchronously  
6. Client polls job status via API  
7. Result stored with signed access URL  
8. Frontend retrieves and displays result  
9. Cleanup system removes expired data
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

<img src="./docs/TECH_STACKS.png" width="45%" alt="Tech Stacks">

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



## ⚙️ Environment Variables

### Backend (root/backend env)

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

### Frontend

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACxEYGPTmGZUjctK
```

> For local testing, keep API base URL at local backend.  
> For deployment, switch to your hosted API endpoint (example: `https://your-domain/app/api`).



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
uvicorn main:app --reload
```

## 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```



## 🔒 Security Notes

- Turnstile check before AI init routes
- Proxy/IP trust strategy to reduce header spoofing risk
- Signed SAS URLs for controlled blob access
- Strict file validation + capped dimensions/size
- Automated cleanup for privacy and storage hygiene



## 🛠 Built With

- **React + Vite** (frontend)
- **FastAPI** (backend)
- **Replicate** (AI model inference)
- **Azure Blob Storage** (upload/result lifecycle)
- **PostgreSQL** (usage limits & retention windows)
- **Cloudflare Turnstile** (bot protection)



## 🤝 Contributing

PRs and improvements are welcome.  
If you’re planning a bigger change, open an issue first to align on scope.



## 📜 License

Licensed under the MIT License. See [LICENSE](./LICENSE) for details.



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