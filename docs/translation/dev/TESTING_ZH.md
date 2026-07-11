# PixelForge 测试

本指南列出后端 API、AI pipeline、使用限制、前端构建以及文档相关工作流的本地验证命令。

`scripts/testing/` 下的 PowerShell 脚本用于 Windows 本地开发。脚本假设后端在本地运行，并在需要时启用本地 Turnstile bypass：

```env
ENVIRONMENT=development
ALLOW_TURNSTILE_TEST_BYPASS=true
```

Production 中绝不能启用手动 bypass。

---

## 启动应用

从仓库根目录运行：

```powershell
.\scripts\start_app.bat
```

也可以分别手动启动：

```powershell
Push-Location .\backend
.\venv\Scripts\python.exe run.py
Pop-Location
```

```powershell
Push-Location .\frontend
npm run dev
Pop-Location
```

---

## 后端 API 检查

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

验证 `/api/limits`、`/api/usage`、feature limit 结构以及 runtime limit 一致性。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

验证结构化后端错误响应。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

验证无效图像数据会以结构化错误安全失败。

---

## Usage Limit 检查

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

脚本会临时写入本地 usage table、调用 init endpoint、验证结构化 `RATE_LIMITED` 响应，并恢复当前小时之前的状态。

覆盖功能：

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

当前 quota identity 基于 IP，因此这些检查只能验证后端行为，不能消除 shared NAT/shared proxy 的已知限制。

---

## AI 成功流程检查

Upscale:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature upscale
```

Remove Background：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature rembg `
  -FilePath ".\frontend\public\demo\rem_bg_before.jpg"
```

Restore Color：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature colorrestore `
  -FilePath ".\frontend\public\demo\res_color_before.jpg"
```

Object Remove 需要源图像以及相同尺寸的 mask：

- 黑色像素：保留区域
- 白色像素：移除区域

需要时生成一个简单中心 mask：

```powershell
@'
from pathlib import Path
from PIL import Image, ImageDraw

src = Path("frontend/public/demo/object_remove_before.png")
mask = Path("frontend/public/demo/object_remove_test_mask.png")

if not src.exists():
    raise SystemExit(f"Missing source image: {src}")

with Image.open(src) as img:
    width, height = img.size

out = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(out)
box_width = int(width * 0.28)
box_height = int(height * 0.28)
left = (width - box_width) // 2
top = (height - box_height) // 2
draw.ellipse(
    (left, top, left + box_width, top + box_height),
    fill=255,
)

mask.parent.mkdir(parents=True, exist_ok=True)
out.save(mask)
print(f"Created mask: {mask} ({width}x{height})")
'@ | .\backend\venv\Scripts\python.exe
```

然后使用 `check_ai_feature_success.ps1` 支持的 source 和 mask 参数运行 object-removal 成功流程脚本。

---

## Turnstile 流程检查

每个 AI 任务：

1. 确认前端收到 Turnstile token。
2. 确认 `POST /api/{feature}/init` 对其进行验证。
3. 完成任务或使任务失败。
4. 启动另一个任务并确认请求了新 token。

另外提交一次反馈并确认它执行独立验证。在非 development 环境中，临时移除 secret 必须让验证 fail-closed，而不是绕过保护。

---

## 前端检查

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

## 后端编译检查

```powershell
Push-Location .\backend
python -m compileall api app core database domain limiter provider repository services utils
Pop-Location
```

---

## 手动 UI 检查

1. 向 AI 工具上传超过公开像素限制的图像。
2. 确认上传前进行了 resize，并显示 resize alert。
3. 确认预览仍然正确。
4. 确认 AI 任务达到 ready 结果。
5. 运行第二个任务并确认 Turnstile 获取新 token。
6. 检查 proxy/IP 行为时从两个网络测试；不要假设托管平台的 direct peer 就是访客 IP。

---

## 最终仓库检查

```powershell
git diff --check
git status --short
```

搜索文档中的旧命令或个人绝对路径：

```powershell
Get-ChildItem -Recurse -File -Include *.md,*.bat,*.ps1 |
  Where-Object { $_.Name -notlike 'TESTING*.md' -and $_.Name -ne 'PACKAGE_NOTES.md' } |
  Select-String -Pattern 'python -m venv \.venv|uvicorn main:app --reload$|E:\\GitHub\\pixelforge'
```

该命令不应返回过时文档匹配。
