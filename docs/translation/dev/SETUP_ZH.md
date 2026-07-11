# PixelForge 配置指南

这是一份可视化的分步配置指南，用于配置 PixelForge 所需的外部服务。

PixelForge 使用：

| 服务 | 用途 | 环境变量 |
|---|---|---|
| Azure Blob Storage | 临时上传与生成结果存储 | `AZURE_CONNECTION_STRING` |
| Replicate | AI 模型推理 | `REPLICATE_API_TOKEN` |
| Cloudflare Turnstile | Bot 防护 | `VITE_TURNSTILE_SITE_KEY`（frontend）、`CLOUDFLARE_TURNSTILE_SECRET_KEY`（backend） |
| PostgreSQL | Usage 统计与后端数据 | `DATABASE_URL` |
| Discord Webhook | Feedback 通知 | `DISCORD_WEBHOOK_URL` |

> [!IMPORTANT]
> 不要把真实 secret、token、connection string、database URL 或 webhook URL 提交到 Git。

---

## 目录

- [1. Azure Blob Storage 配置](#1-azure-blob-storage-配置)
- [2. Replicate 配置](#2-replicate-配置)
- [3. Cloudflare Turnstile 配置](#3-cloudflare-turnstile-配置)
- [4. Database 配置](#4-database-配置)
- [5. Discord Webhook 配置](#5-discord-webhook-配置)
- [6. Backend 环境变量](#6-backend-环境变量)
- [7. Frontend 环境变量](#7-frontend-环境变量)
- [8. 本地运行 PixelForge](#8-本地运行-pixelforge)
- [9. 最终配置检查清单](#9-最终配置检查清单)
- [10. 常见问题](#10-常见问题)
- [11. 官方参考](#11-官方参考)

---

## 1. Azure Blob Storage 配置

PixelForge 使用 Azure Blob Storage 存储临时上传图片和生成后的结果文件。

推荐容器：

```txt
uploads
results
```

两个容器都建议使用 **Private** 访问级别。

---

### 1.1 打开 Azure Blob Storage

如果你还没有 Azure Storage Account，请先创建一个。

![选择 Azure Blob Storage](../../assets/setup/azure/AZURE_1.png)

---

### 1.2 创建 Storage Account

填写下面推荐的配置。你可以根据自己的部署位置调整 region 或 resource group。

![创建 Azure Storage Account](../../assets/setup/azure/AZURE_2.png)

| 字段 | 推荐值 | 说明 |
|---|---|---|
| Subscription | 你的 Azure subscription | `Azure for Students` 也可以使用 |
| Resource group | 现有或新建 | 需要时可以新建 |
| Storage account name | `pixelforgexxxx` | 必须全局唯一、小写、不能有空格 |
| Region | 靠近 backend 的区域 | 例如：`Southeast Asia` |
| Performance | `Standard` | 足够满足大多数 PixelForge 场景 |
| Redundancy | `Locally-redundant storage (LRS)` | 适合个人项目，成本较低 |

> [!TIP]
> **为什么选择 LRS？**  
> PixelForge 只保存临时上传和生成结果。对于这种场景，Geo-redundant storage 通常不必要，而且可能增加成本。

填写完成后点击：

```txt
Review + create
```

然后点击 **Create**，等待部署完成。

---

### 1.3 创建 `uploads` 和 `results` 容器

Storage Account 创建完成后：

1. 打开你的 Storage Account。
2. 进入 **Data storage**。
3. 打开 **Containers**。
4. 创建以下容器：

```txt
uploads
results
```

5. 将两个容器的访问级别设置为：

```txt
Private
```

![创建 Azure containers](../../assets/setup/azure/AZURE_3.png)

> [!IMPORTANT]
> 容器名称必须和 backend 期望的名称一致。如果 backend 使用 `uploads` 和 `results`，请使用完全相同的名称。

---

### 1.4 配置 Lifecycle Cleanup

PixelForge 只需要临时 upload 和 result 文件。Lifecycle rule 可以帮助保持 storage 干净并降低成本。

1. 打开你的 Storage Account。
2. 进入 **Data management**。
3. 打开 **Lifecycle management**。
4. 点击 **Add rule**。

![配置 Azure lifecycle management](../../assets/setup/azure/AZURE_4.png)

你可以手动配置规则，也可以打开 **Code view** 标签页并粘贴下面的 JSON：

```json
{
  "rules": [
    {
      "enabled": true,
      "name": "cleanup",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 1
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "uploads/",
            "results/"
          ]
        }
      }
    }
  ]
}
```

> [!WARNING]
> 确保 `prefixMatch` 与容器名称匹配。  
> 如果容器名称是 `uploads` 和 `results`，请使用：
>
> ```txt
> uploads/
> results/
> ```

---

### 1.5 获取 Azure Connection String

Backend 需要 Azure connection string 来生成 signed upload URL 并管理结果文件。

1. 打开你的 Storage Account。
2. 进入 **Security + networking**。
3. 打开 **Access keys**。
4. 点击 **Show**。
5. 复制 **Connection string**。

![复制 Azure connection string](../../assets/setup/azure/AZURE_5.png)

粘贴到 `backend/.env`：

```env
AZURE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_storage_account;AccountKey=your_secret_key;EndpointSuffix=core.windows.net
```

> [!CAUTION]
> Azure connection string 是 secret。不要放进 `frontend/.env`、截图、public issue、README 或提交到代码中。如果泄露，请立刻 regenerate storage account key。

---

### 1.6 配置 Azure Blob CORS

因为浏览器会通过 signed URL 直接上传文件到 Azure Blob Storage，所以 Azure Blob CORS 必须允许 frontend origin。

1. 打开你的 Storage Account。
2. 进入 **Settings**。
3. 打开 **Resource sharing (CORS)**。
4. 选择 **Blob service** 标签页。
5. 添加 CORS rule。

![配置 Azure Blob CORS](../../assets/setup/azure/AZURE_6.png)

本地开发推荐值：

| 字段 | 值 |
|---|---|
| Allowed origins | `http://localhost:5173`, `http://127.0.0.1:5173` |
| Allowed methods | `GET`, `PUT`, `HEAD`, `OPTIONS` |
| Allowed headers | `*` |
| Exposed headers | `*` |
| Max age | `86400` |

Production 示例：

```txt
https://your-frontend-domain.com
```

> [!IMPORTANT]
> Azure Blob CORS 应添加 **frontend origin**，因为浏览器会直接请求 Azure。Backend 与 Azure 是 server-to-server 通信，不会受到浏览器 CORS 限制。

不要包含 trailing slash。

正确：

```txt
https://your-frontend-domain.com
```

错误：

```txt
https://your-frontend-domain.com/
```

---

## 2. Replicate 配置

PixelForge 使用 Replicate 运行 AI 图像模型。

### 2.1 创建或复制 Replicate API Token

1. 打开 Replicate。
2. 进入 account settings。
3. 打开 **API Tokens**。
4. 创建或复制 token。
5. 粘贴到 `backend/.env`。

![复制 Replicate API token](../../assets/setup/replicate/REPL_1.png)

Backend 环境变量：

```env
REPLICATE_API_TOKEN=your_replicate_api_token
```

> [!CAUTION]
> Replicate API token 是 backend secret。不要放进 `frontend/.env`，也不要公开暴露。

---

## 3. Cloudflare Turnstile 配置

PixelForge 使用 Cloudflare Turnstile 保护 AI job 初始化和 feedback request，减少 bot 滥用。

你需要两个 key：

| Key | 使用位置 | Secret? |
|---|---|---|
| Site key | 仅 Frontend | 否，可公开 |
| Secret key | Backend only | 是，private |

---

### 3.1 创建 Turnstile Widget

1. 打开 Cloudflare。
2. 进入 **Turnstile**。
3. 创建新的 widget。
4. 将 widget mode 设置为：

```txt
Invisible
```

![创建 Cloudflare Turnstile widget](../../assets/setup/cloudflare/CLOUDFLARE_1.png)

---

### 3.2 复制 Site Key 和 Secret Key

创建 widget 后：

1. 点击 widget 右侧的三点菜单。
2. 选择 **Edit**。
3. 复制 **Site key**。
4. 复制 **Secret key**。

Backend：

```env
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

Frontend：

```env
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> [!CAUTION]
> Turnstile secret key 必须只保存在 backend。不要暴露在 frontend 代码中。

---

### 3.3 配置 Hostname Management

添加 Turnstile widget 被渲染的 hostname。

推荐的本地 hostname：

```txt
localhost
127.0.0.1
```

推荐的 production hostname：

```txt
your-frontend-domain.com
```

只有当你也在 backend-hosted 页面中渲染 Turnstile 时，才需要添加 backend domain。

![配置 Cloudflare Turnstile hostnames](../../assets/setup/cloudflare/CLOUDFLARE_2.png)

---

## 4. Database 配置

PixelForge 使用 PostgreSQL 进行 usage tracking 和 backend data 存储。

你可以使用：

- 本地 PostgreSQL
- DigitalOcean Managed PostgreSQL
- Railway PostgreSQL
- Neon
- Supabase
- 任何兼容 PostgreSQL 的 host

获取 database connection string，并粘贴到 `backend/.env`。

本地示例：

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pixelforge
```

Hosted 示例：

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

> [!CAUTION]
> Database URL 是 secret，因为通常包含 username 和 password。不要公开暴露。

---

## 5. Discord Webhook 配置

PixelForge 可以通过 Discord webhook 将 feedback notification 发送到指定频道。

### 5.1 创建 Discord Webhook

1. 打开 Discord。
2. 右键点击服务器图标。
3. 打开 **Server Settings**。
4. 打开 **Integrations**。
5. 打开 **Webhooks**。
6. 点击 **Create Webhook**。
7. 选择接收通知的频道。
8. 复制 webhook URL。

粘贴到 `backend/.env`：

```env
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

> [!CAUTION]
> Discord webhook URL 是 secret。任何拥有该 URL 的人都可以向 webhook 发送消息。如果泄露，请立即删除或 regenerate。

---

## 6. Backend 环境变量

创建以下文件：

```txt
backend/.env
```

从已提交的示例文件开始：

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell：

```powershell
Copy-Item backend/.env.example backend/.env
```

核心模板：

```env
ENVIRONMENT=development

DATABASE_URL=
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

### 本地和直接访问 origin 的安全默认值

```env
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_CIDRS=
REQUIRE_CLOUDFLARE_PROXY=false
```

使用这些值时，PixelForge 会忽略 `CF-Connecting-IP`、`X-Forwarded-For` 和 `X-Real-IP`，并使用 ASGI server 报告的直接连接地址。当 backend 可以被直接访问，或代理拓扑尚未验证时，这是最安全的默认配置。

### 可信代理模式

只有在明确知道哪个代理直接连接到 Uvicorn/FastAPI 时，才能启用 forwarded header：

```env
TRUST_PROXY_HEADERS=true
TRUSTED_PROXY_CIDRS=直接代理的_cidr
CLOUDFLARE_SUBNETS=cloudflare_官方_ipv4_和_ipv6_cidr
REQUIRE_CLOUDFLARE_PROXY=true
```

- `TRUSTED_PROXY_CIDRS` 必须包含直接连接应用的代理 CIDR。
- `CLOUDFLARE_SUBNETS` 包含 Cloudflare edge 网络，用于验证 Cloudflare hop。
- `REQUIRE_CLOUDFLARE_PROXY=true` 会在验证链中没有 Cloudflare 时拒绝信任 forwarded value。
- 不要使用 `0.0.0.0/0` 或 `::/0`，否则所有客户端都会被信任。
- 请从 `https://www.cloudflare.com/ips-v4/` 和 `https://www.cloudflare.com/ips-v6/` 更新 Cloudflare IP range。
- 此应用层检查**不会**自动通过 firewall 阻止直接 origin 访问。若只允许 Cloudflare 流量，仍需单独限制 origin。

如果 Cloudflare 与应用之间还有托管平台代理，请将该平台官方公布的 ingress CIDR 配置到 `TRUSTED_PROXY_CIDRS`。在确认平台的 `X-Forwarded-For` 行为之前，不要猜测 private range，也不要启用信任。

---

## 7. Frontend 环境变量

创建文件：

```txt
frontend/.env
```

模板：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=
```

Deployment 示例：

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> [!IMPORTANT]
> 以 `VITE_` 开头的 Vite 变量会暴露到浏览器中。`frontend/.env` 中只能放对外公开也安全的值。

---

## 8. 本地运行 PixelForge

### Backend

```bash
cd backend
python -m venv .venv
```

macOS/Linux：

```bash
source .venv/bin/activate
```

Windows PowerShell：

```powershell
.venv\Scripts\Activate.ps1
```

安装依赖：

```bash
pip install -r requirements.txt
```

运行 backend：

```bash
uvicorn main:app --reload --no-proxy-headers
```

默认 backend URL：

```txt
http://127.0.0.1:8000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

默认 frontend URL：

```txt
http://localhost:5173
```

---

## 9. 最终配置检查清单

本地运行 PixelForge 前，请确认：

- [ ] `backend/.env` 已创建
- [ ] `frontend/.env` 已创建
- [ ] `AZURE_CONNECTION_STRING` 已配置
- [ ] Azure container `uploads` 和 `results` 已创建
- [ ] Azure container 使用 private access
- [ ] Azure lifecycle cleanup 已配置
- [ ] Azure Blob CORS 允许 `http://localhost:5173`
- [ ] `REPLICATE_API_TOKEN` 已配置
- [ ] Cloudflare Turnstile site key 已配置
- [ ] Cloudflare Turnstile secret key 已配置
- [ ] `DATABASE_URL` 已配置
- [ ] 如果启用 feedback notification，`DISCORD_WEBHOOK_URL` 已配置
- [ ] `VITE_API_BASE_URL` 指向 backend API
- [ ] `VITE_TURNSTILE_SITE_KEY` 与 Turnstile site key 一致

---

## 10. 常见问题

### Frontend 无法访问 backend

检查：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

同时确认 `ALLOWED_ORIGINS` 包含：

```txt
http://localhost:5173
http://127.0.0.1:5173
```

---

### 上传到 Azure 失败

检查 Azure Blob CORS。

本地开发时，allowed origins 应包含：

```txt
http://localhost:5173
http://127.0.0.1:5173
```

Allowed methods 建议包含：

```txt
GET, PUT, HEAD, OPTIONS
```

---

### Turnstile 本地失败

本地开发时，可以使用有效的 Turnstile keys，或者在 backend 支持的情况下开启 local bypass：

```env
ALLOW_TURNSTILE_TEST_BYPASS=true
ENVIRONMENT=development
```

不要在 production 中开启 bypass。

---

### Replicate request 失败

检查：

```env
REPLICATE_API_TOKEN=
```

同时确认 backend 中配置的 model version 仍然有效。

---

### Database 连接失败

检查：

```env
DATABASE_URL=
```

确认：

- Database 已存在
- Username 和 password 正确
- Host 和 port 可访问
- Hosted database firewall 允许 backend 连接
- SSL 设置符合 database provider 要求

---

## 11. 官方参考

- Azure Blob Storage containers: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal
- Azure Storage CORS: https://learn.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services
- Replicate HTTP API authentication: https://replicate.com/docs/reference/http
- Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/get-started/
- Vite environment variables: https://vite.dev/guide/env-and-mode

---

## 12. 安全提醒

不要 commit 或暴露：

- `.env` 文件
- Azure connection string
- Replicate API token
- Cloudflare Turnstile secret key
- Database URL
- Discord webhook URL
- Private key
- 包含 secret 或 signed URL 的 generated logs

如果任何 secret 泄露，请立即 rotate 或 regenerate。
