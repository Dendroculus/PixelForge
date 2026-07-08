# PixelForge 测试

本文档记录 PixelForge 后端、AI 流程、使用额度限制以及构建检查的本地验证脚本。

这些脚本用于本地开发环境。运行前请确保后端已在本地启动，并在需要时启用了本地测试绕过配置。

> **仅限 Windows 的说明：** `scripts/testing/*.ps1` 中的 PowerShell 脚本以及本地 `.bat` 辅助文件面向 Windows 开发环境。macOS/Linux 用户需要将命令改写为 Bash，或手动执行等效的 API 检查。

---

## 后端 API 检查

从仓库根目录运行。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

验证内容：

- `/api/limits`
- `/api/usage`
- 功能额度结构
- 运行时额度响应的一致性

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

验证后端结构化错误响应。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

验证无效图片上传数据会以结构化错误安全失败。

---

## 使用额度检查

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

验证所有 AI 功能在使用额度耗尽时都会返回结构化的 `RATE_LIMITED` 响应。

该脚本会临时写入本地 usage 表，调用 init endpoint，验证响应，然后恢复之前的当前小时 usage 状态。

覆盖的功能：

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

---

## AI 成功流程检查

Upscale：

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

Object Remove 需要同时提供原图和 mask 图片：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature objectremove `
  -FilePath ".\frontend\public\demo\object_remove_before.png" `
  -MaskPath ".\frontend\public\demo\object_remove_test_mask.png"
```

---

## 前端构建检查

```powershell
cd E:\GitHub\pixelforge\frontend
npm run build
```

构建成功表示 production 前端 bundle 可以正常编译。

---

## 后端编译检查

```powershell
cd E:\GitHub\pixelforge\backend
python -m compileall .
```

为了减少输出噪音，可以排除虚拟环境：

```powershell
python -m compileall api app core database domain limiter provider repository services utils
```

---

## 手动 UI 检查

完成后端和前端改动后，请手动验证：

1. 将超过 public pixel limit 的图片上传到 AI 工具
2. 确认图片在上传前被 resize
3. 确认 resize alert 会显示
4. 确认 preview 仍然正常
5. 确认 AI job 最终能达到 ready 状态

该检查用于验证浏览器端 auto-resize 流程；直接调用 API 的 PowerShell 脚本不会覆盖这个浏览器端流程。
