# 安全政策

## 支持版本

PixelForge 目前从仓库主分支进行积极维护。

安全修复通常会应用到项目的最新版本。旧提交、fork 或私人部署可能不会单独获得安全补丁。

## 报告漏洞

如果你认为 PixelForge 存在安全漏洞，请私下报告，而不要创建公开 issue。

请尽量提供：

- 漏洞的清晰描述
- 复现步骤
- 受影响的 component、route、page 或 file
- 潜在影响
- 相关截图、日志或 proof-of-concept 细节
- 如果有的话，提供建议修复方案

在问题被审查和修复之前，请避免公开分享漏洞利用细节。

## 应报告的问题

请报告以下类型的问题：

- Authentication 或 authorization 绕过
- 不安全的文件上传行为
- 文件类型伪装检测绕过
- Signed URL 泄露或滥用
- Secret、token 或 credential 泄露
- Production 环境中的 Cloudflare Turnstile 绕过
- Proxy/IP trust 问题
- Rate limit 或 usage limit 绕过
- Path traversal 或不安全的文件名处理
- Server-side request forgery
- Cross-site scripting
- 涉及上传图片、result URL、日志或 environment variable 的数据泄露

## 不需要私下报告的问题

以下问题通常不需要作为私密安全报告提交：

- 没有安全影响的一般 bug
- UI layout 问题
- 缺少文档
- 没有已知漏洞的 dependency update 建议
- 不影响 production 的本地开发配置问题

这些问题可以通过普通 GitHub issue 报告。

## 项目安全实践

PixelForge 使用多项安全措施：

- AI job 初始化前进行 Cloudflare Turnstile 验证
- API endpoint rate limiting
- 按功能划分的 usage limit
- 使用 Signed Azure Blob URL 进行上传和结果访问
- 对文件类型、大小和图片结构进行验证
- 后端生成安全文件名
- 临时 storage 生命周期和 cleanup
- Provider token 和 cloud credential 仅保存在 backend
- 对敏感 runtime setting 进行 environment validation

## Secret 和环境文件

不要提交：

- `.env` 文件
- API token
- Database URL
- Azure connection string
- Replicate token
- Cloudflare secret
- Discord webhook URL
- Private key
- 包含敏感数据的日志

记录所需变量时，请使用 `.env.example` 之类的示例文件。

## Responsible Disclosure

漏洞被报告后：

1. Maintainer 会审查报告。
2. 问题会被复现和评估。
3. 如有必要，会准备修复。
4. 修复会被发布或 merge。
5. 在用户有合理时间更新后，可以进行公开披露。

请以善意行事，并避免访问、修改或删除不属于你的数据。

感谢你帮助维护 PixelForge 的安全。
