<div align="center">

[EN](../../../SECURITY.md) | [ID](./SECURITY_ID.md) | 中文

</div>

# 安全策略

## 支持版本

PixelForge 主要维护仓库的 `master` branch。安全修复通常应用于最新版本；旧 commit、fork 或私有部署可能不会获得单独补丁。

## 报告漏洞

疑似漏洞请私下报告，不要创建包含 exploit 细节的公开 issue。

请提供清晰描述、复现步骤、受影响组件、潜在影响、相关证据以及可用的修复建议。在问题审查和修复前，请避免公开披露。

## 应报告的问题

- Authentication 或 authorization bypass
- 不安全上传或文件验证绕过
- Signed URL 泄露或滥用
- Secret、token 或 credential 泄露
- Production Cloudflare Turnstile bypass
- Production 缺少 Turnstile 配置但仍接受请求
- Proxy/IP trust 问题或可伪造 forwarded header
- Rate limit 或 usage limit bypass
- Path traversal、unsafe filename、SSRF 或 XSS
- 上传图片、结果 URL、日志或环境变量泄露

没有安全影响的一般 bug、布局问题、文档缺失和仅本地存在的配置错误可通过普通 issue 报告。

## 项目安全实践

PixelForge 使用：

- 每次 AI 任务初始化和反馈提交都进行新的 Turnstile 验证
- Production 缺少 Turnstile secret 时 fail-closed
- 仅 development 可显式启用的手动 bypass
- Endpoint rate limit 与按功能滚动 usage limit
- Fail-closed 客户端 IP 解析：仅在启用 proxy trust 且直接代理属于明确 CIDR 时接受 forwarded header
- 短生命周期 Signed Azure Blob URL
- 文件类型、字节大小、分辨率和结构验证
- 安全生成文件名和临时 storage cleanup
- Provider credential 与 cloud secret 仅保存在 backend

应用级 Cloudflare 检查不会对 origin 进行防火墙限制。要求 Cloudflare-only 的部署还必须在 network/hosting 层阻止直接 origin traffic。

当前 daily usage identity 基于 IP。位于同一 NAT、carrier network 或 managed reverse proxy 后的用户可能共享 quota；这是已记录的限制，并不是 authentication 保证。

## Secret 和环境文件

不要提交 `.env`、token、database URL、Azure connection string、Cloudflare secret、Discord webhook、private key、包含敏感信息或 signed URL 的日志，以及用户私有图片。

`.env.example` 只能包含变量名和安全 placeholder。Secret 暴露后应立即轮换。

## Responsible Disclosure

1. Maintainer 审查并复现问题。
2. 评估影响与受影响版本。
3. 准备聚焦的修复和验证步骤。
4. Merge 或发布修复。
5. 用户有合理更新时间后可进行公开披露。

请以善意行事，不要访问、修改或删除不属于你的数据。

感谢你帮助维护 PixelForge 的安全。
