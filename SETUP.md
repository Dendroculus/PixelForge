# PixelForge Setup Guide

A visual, step-by-step setup guide for configuring the external services required by PixelForge.

PixelForge uses:

| Service | Used for | Environment variable |
|---|---|---|
| Azure Blob Storage | Temporary uploads and generated results | `AZURE_CONNECTION_STRING` |
| Replicate | AI model inference | `REPLICATE_API_TOKEN` |
| Cloudflare Turnstile | Bot protection | `VITE_TURNSTILE_SITE_KEY` (frontend), `CLOUDFLARE_TURNSTILE_SECRET_KEY` (backend) |
| PostgreSQL | Usage tracking and backend data | `DATABASE_URL` |
| Discord Webhook | Feedback notifications | `DISCORD_WEBHOOK_URL` |

> [!IMPORTANT]
> Never commit real secrets, tokens, connection strings, database URLs, or webhook URLs to Git.

---

## Table of Contents

- [1. Azure Blob Storage Setup](#1-azure-blob-storage-setup)
- [2. Replicate Setup](#2-replicate-setup)
- [3. Cloudflare Turnstile Setup](#3-cloudflare-turnstile-setup)
- [4. Database Setup](#4-database-setup)
- [5. Discord Webhook Setup](#5-discord-webhook-setup)
- [6. Backend Environment Variables](#6-backend-environment-variables)
- [7. Frontend Environment Variables](#7-frontend-environment-variables)
- [8. Run PixelForge Locally](#8-run-pixelforge-locally)
- [9. Final Setup Checklist](#9-final-setup-checklist)
- [10. Common Issues](#10-common-issues)
- [11. Official References](#11-official-references)

---

## 1. Azure Blob Storage Setup

PixelForge uses Azure Blob Storage for temporary user uploads and generated result files.

Recommended containers:

```txt
uploads
results
```

Both containers should use **Private** access.

---

### 1.1 Open Azure Blob Storage

Create an Azure Storage Account if you do not already have one.

![Choose Azure Blob Storage](./docs/assets/setup/azure/AZURE_1.png)

---

### 1.2 Create a Storage Account

Fill in the recommended values below. You may adjust the region or resource group based on your deployment.

![Create Azure Storage Account](./docs/assets/setup/azure/AZURE_2.png)

| Field | Recommended value | Notes |
|---|---|---|
| Subscription | Your Azure subscription | `Azure for Students` works fine |
| Resource group | Existing or new | Create one if needed |
| Storage account name | `pixelforgexxxx` | Must be globally unique, lowercase, and without spaces |
| Region | Closest to your backend | Example: `Southeast Asia` |
| Performance | `Standard` | Enough for most PixelForge use cases |
| Redundancy | `Locally-redundant storage (LRS)` | Recommended for personal projects and lower cost |

> [!TIP]
> **Why LRS?**  
> PixelForge stores temporary uploads and generated images. Geo-redundant storage is usually unnecessary for this use case and may increase cost.

After filling in the form, click:

```txt
Review + create
```

Then click **Create** and wait for deployment to finish.

---

### 1.3 Create the `uploads` and `results` Containers

After the storage account is created:

1. Open your Storage Account.
2. Go to **Data storage**.
3. Open **Containers**.
4. Create these containers:

```txt
uploads
results
```

5. Set both containers to:

```txt
Private
```

![Create Azure containers](./docs/assets/setup/azure/AZURE_3.png)

> [!IMPORTANT]
> The container names must match the names expected by your backend. If your backend expects `uploads` and `results`, use exactly those names.

---

### 1.4 Configure Lifecycle Cleanup

PixelForge only needs temporary upload and result files. A lifecycle rule keeps Azure storage clean and helps reduce costs.

1. Open your Storage Account.
2. Go to **Data management**.
3. Open **Lifecycle management**.
4. Click **Add rule**.

![Configure Azure lifecycle management](./docs/assets/setup/azure/AZURE_4.png)

You can configure the rule manually, or open the **Code view** tab and paste this JSON:

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
> Make sure `prefixMatch` matches your container names.  
> For containers named `uploads` and `results`, use:
>
> ```txt
> uploads/
> results/
> ```

---

### 1.5 Get the Azure Connection String

The backend needs the Azure connection string to generate signed upload URLs and manage result files.

1. Open your Storage Account.
2. Go to **Security + networking**.
3. Open **Access keys**.
4. Click **Show**.
5. Copy the **Connection string**.

![Copy Azure connection string](./docs/assets/setup/azure/AZURE_5.png)

Paste it into `backend/.env`:

```env
AZURE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_storage_account;AccountKey=your_secret_key;EndpointSuffix=core.windows.net
```

> [!CAUTION]
> The Azure connection string is a secret. Never put it in `frontend/.env`, screenshots, public issues, README files, or committed code. If it is exposed, regenerate the storage account key immediately.

---

### 1.6 Configure Azure Blob CORS

Because the browser uploads files directly to Azure Blob Storage using signed URLs, Azure Blob CORS must allow your frontend origin.

1. Open your Storage Account.
2. Go to **Settings**.
3. Open **Resource sharing (CORS)**.
4. Select the **Blob service** tab.
5. Add a CORS rule.

![Configure Azure Blob CORS](./docs/assets/setup/azure/AZURE_6.png)

Recommended local development values:

| Field | Value |
|---|---|
| Allowed origins | `http://localhost:5173`, `http://127.0.0.1:5173` |
| Allowed methods | `GET`, `PUT`, `HEAD`, `OPTIONS` |
| Allowed headers | `*` |
| Exposed headers | `*` |
| Max age | `86400` |

Production example:

```txt
https://your-frontend-domain.com
```

> [!IMPORTANT]
> For Azure Blob CORS, add the **frontend origin** because the browser sends the request to Azure. The backend talks to Azure server-to-server and is not blocked by browser CORS.

Do not include a trailing slash.

Correct:

```txt
https://your-frontend-domain.com
```

Wrong:

```txt
https://your-frontend-domain.com/
```

---

## 2. Replicate Setup

PixelForge uses Replicate to run AI image models.

### 2.1 Create or Copy a Replicate API Token

1. Open Replicate.
2. Go to your account settings.
3. Open **API Tokens**.
4. Create or copy a token.
5. Paste it into `backend/.env`.

![Copy Replicate API token](./docs/assets/setup/replicate/REPL_1.png)

Backend environment variable:

```env
REPLICATE_API_TOKEN=your_replicate_api_token
```

> [!CAUTION]
> The Replicate API token is a backend secret. Never put it in `frontend/.env` or expose it publicly.

---

## 3. Cloudflare Turnstile Setup

PixelForge uses Cloudflare Turnstile to protect AI job initialization and feedback requests from bots.

You need two keys:

| Key | Used in | Secret? |
|---|---|---|
| Site key | Frontend only | No, public-safe |
| Secret key | Backend only | Yes, private |

---

### 3.1 Create a Turnstile Widget

1. Open Cloudflare.
2. Go to **Turnstile**.
3. Create a new widget.
4. Set the widget mode to:

```txt
Invisible
```

![Create Cloudflare Turnstile widget](./docs/assets/setup/cloudflare/CLOUDFLARE_1.png)

---

### 3.2 Copy the Site Key and Secret Key

After creating the widget:

1. Click the three-dot menu on the widget.
2. Choose **Edit**.
3. Copy the **Site key**.
4. Copy the **Secret key**.

Backend:

```env
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

Frontend:

```env
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> [!CAUTION]
> The Turnstile secret key must stay backend-only. Never expose it in frontend code.

> [!NOTE]
> PixelForge requests and verifies a fresh Turnstile token for every AI job initialization and every feedback submission. Tokens are not reused; the frontend resets the widget after success, cancellation, or failure. Outside local/development environments, a missing secret fails closed.

---

### 3.3 Configure Hostname Management

Add the hostnames where the Turnstile widget is rendered.

Recommended local hostnames:

```txt
localhost
127.0.0.1
```

Recommended production hostname:

```txt
your-frontend-domain.com
```

Only add the backend domain if you also render Turnstile on a backend-hosted page.

![Configure Cloudflare Turnstile hostnames](./docs/assets/setup/cloudflare/CLOUDFLARE_2.png)

---

## 4. Database Setup

PixelForge uses PostgreSQL for usage tracking and backend data.

You can use:

- Local PostgreSQL
- DigitalOcean Managed PostgreSQL
- Railway PostgreSQL
- Neon
- Supabase
- Any PostgreSQL-compatible host

Get your database connection string and paste it into `backend/.env`.

Local example:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pixelforge
```

Hosted example:

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

> [!CAUTION]
> The database URL is a secret because it usually contains the username and password. Do not expose it publicly.

---

## 5. Discord Webhook Setup

PixelForge can send feedback notifications to a Discord channel using a webhook.

### 5.1 Create a Discord Webhook

1. Open Discord.
2. Right-click your server icon.
3. Open **Server Settings**.
4. Open **Integrations**.
5. Open **Webhooks**.
6. Click **Create Webhook**.
7. Choose the channel that should receive notifications.
8. Copy the webhook URL.

Paste it into `backend/.env`:

```env
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

> [!CAUTION]
> A Discord webhook URL is a secret. Anyone with the URL can send messages to that webhook. If it is exposed, delete or regenerate it immediately.

---

## 6. Backend Environment Variables

Create this file:

```txt
backend/.env
```

Start from the committed example:

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Core template:

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

### Safe local and direct-origin defaults

```env
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_CIDRS=
CLOUDFLARE_SUBNETS=
REQUIRE_CLOUDFLARE_PROXY=false
```

With these values, PixelForge ignores `CF-Connecting-IP`, `X-Forwarded-For`, and `X-Real-IP` and uses the direct peer reported by the ASGI server. This is the safest default when the backend is directly reachable or the proxy topology has not been verified.

### Trusted proxy mode

Only enable forwarded headers when you know which proxy connects directly to Uvicorn/FastAPI:

```env
TRUST_PROXY_HEADERS=true
TRUSTED_PROXY_CIDRS=your_immediate_proxy_cidrs
CLOUDFLARE_SUBNETS=official_cloudflare_ipv4_and_ipv6_cidrs
REQUIRE_CLOUDFLARE_PROXY=true
```

- `TRUSTED_PROXY_CIDRS` must contain the CIDRs of the proxy that directly connects to the application.
- `CLOUDFLARE_SUBNETS` contains Cloudflare edge networks and is used to validate Cloudflare hops.
- `REQUIRE_CLOUDFLARE_PROXY=true` prevents forwarded values from being accepted unless the validated chain contains Cloudflare.
- Never use `0.0.0.0/0` or `::/0`; doing so trusts every client.
- Refresh Cloudflare ranges from `https://www.cloudflare.com/ips-v4/` and `https://www.cloudflare.com/ips-v6/`.
- This application check does **not** firewall the origin. Block direct origin access separately when Cloudflare-only traffic is required.

If a managed hosting platform sits between Cloudflare and the application, use that platform's documented ingress CIDRs in `TRUSTED_PROXY_CIDRS`. Do not guess private ranges or enable trust until the platform's `X-Forwarded-For` behavior is confirmed.

---

## 7. Frontend Environment Variables

Create this file:

```txt
frontend/.env
```

Template:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=
VITE_DEBUG_API=true
```

For deployment:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
VITE_DEBUG_API=false
```

> [!IMPORTANT]
> Vite variables prefixed with `VITE_` are exposed to the browser. Only put public-safe values in `frontend/.env`.

`VITE_DEBUG_API` is effective only in Vite development mode. Use `true` for local troubleshooting and `false` in production.

---

## 8. Run PixelForge Locally

### Backend

```bash
cd backend
python -m venv venv
```

macOS/Linux:

```bash
source venv/bin/activate
```

Windows PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend through the project runner:

```bash
python run.py
```

`backend/run.py` starts Uvicorn with reload enabled and `proxy_headers=False`, so the application-level client-IP resolver receives the direct socket peer.

Default backend URL:

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

Default frontend URL:

```txt
http://localhost:5173
```

---

## 9. Final Setup Checklist

Before running PixelForge locally, confirm:

- [ ] `backend/.env` exists
- [ ] `frontend/.env` exists
- [ ] `AZURE_CONNECTION_STRING` is configured
- [ ] Azure containers `uploads` and `results` exist
- [ ] Azure containers are private
- [ ] Azure lifecycle cleanup is configured
- [ ] Azure Blob CORS allows `http://localhost:5173`
- [ ] `REPLICATE_API_TOKEN` is configured
- [ ] Cloudflare Turnstile site key is configured
- [ ] Cloudflare Turnstile secret key is configured
- [ ] `DATABASE_URL` is configured
- [ ] `DISCORD_WEBHOOK_URL` is configured if feedback notifications are enabled
- [ ] `VITE_API_BASE_URL` points to the backend API
- [ ] `VITE_TURNSTILE_SITE_KEY` matches the Turnstile site key

---

## 10. Common Issues

### Frontend cannot reach the backend

Check:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Also confirm `ALLOWED_ORIGINS` contains:

```txt
http://localhost:5173
http://127.0.0.1:5173
```

---

### Upload to Azure fails

Check Azure Blob CORS.

For local development, allowed origins should include:

```txt
http://localhost:5173
http://127.0.0.1:5173
```

Allowed methods should include:

```txt
GET, PUT, HEAD, OPTIONS
```

---

### Turnstile fails locally

For local development, use valid Turnstile keys or enable local bypass if supported by the backend:

```env
ALLOW_TURNSTILE_TEST_BYPASS=true
ENVIRONMENT=development
```

Never enable bypass in production.

---

### Replicate request fails

Check:

```env
REPLICATE_API_TOKEN=
```

Also confirm the model version configured in the backend is still valid.

---

### Database connection fails

Check:

```env
DATABASE_URL=
```

Make sure:

- The database exists
- The username and password are correct
- The host and port are reachable
- Hosted database firewall rules allow the backend connection
- SSL settings match your database provider requirements

---

## 11. Official References

- Azure Blob Storage containers: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal
- Azure Storage CORS: https://learn.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services
- Replicate HTTP API authentication: https://replicate.com/docs/reference/http
- Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/get-started/
- Vite environment variables: https://vite.dev/guide/env-and-mode

---

## 12. Security Reminders

Never commit or expose:

- `.env` files
- Azure connection strings
- Replicate API tokens
- Cloudflare Turnstile secret keys
- Database URLs
- Discord webhook URLs
- Private keys
- Generated logs containing secrets or signed URLs

If any secret is exposed, rotate or regenerate it immediately.
