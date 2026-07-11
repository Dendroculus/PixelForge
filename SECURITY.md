# Security Policy

## Supported Versions

PixelForge is actively maintained from the repository's `master` branch. Security fixes are generally applied to the latest version; older commits, forks, or private deployments may not receive separate patches.

## Reporting a Vulnerability

Report suspected vulnerabilities privately instead of opening a public issue with exploit details.

Include:

- A clear description
- Reproduction steps
- Affected component, route, page, or file
- Potential impact
- Relevant screenshots, logs, or proof-of-concept details
- A suggested fix, when available

Avoid public disclosure until the issue has been reviewed and addressed.

## What to Report

Examples include:

- Authentication or authorization bypass
- Unsafe upload or file-type validation bypass
- Signed URL exposure or misuse
- Secret, token, or credential leakage
- Cloudflare Turnstile bypass in production
- Missing production Turnstile configuration being accepted
- Proxy/IP trust issues or spoofable forwarded headers
- Rate-limit or usage-limit bypass
- Path traversal, unsafe filenames, SSRF, or XSS
- Exposure of uploaded images, result URLs, logs, or environment values

## What Not to Report

General bugs without security impact, UI layout issues, missing documentation, dependency suggestions without a known vulnerability, and local-only misconfiguration can be reported through regular GitHub issues.

## Project Security Practices

PixelForge uses:

- Fresh Cloudflare Turnstile verification for every AI job initialization and feedback submission
- Production fail-closed behavior when the Turnstile secret is missing
- A development-only manual bypass that must be explicitly enabled
- SlowAPI endpoint rate limits and per-feature rolling usage limits
- Fail-closed client-IP resolution: forwarded headers are ignored unless proxy trust is enabled and the direct proxy belongs to an explicit CIDR
- Signed, short-lived Azure Blob URLs for upload and result access
- File validation for type, byte size, resolution, and image structure
- Safe generated filenames and controlled temporary-storage cleanup
- Backend-only provider credentials and cloud secrets

The application-level Cloudflare check does not firewall the origin. Deployments requiring Cloudflare-only access must also restrict direct origin traffic at the network or hosting layer.

Current daily usage identity is IP-based. Users behind the same NAT, carrier network, or managed reverse proxy may share a quota; this is a documented limitation rather than an authentication guarantee.

## Secrets and Environment Files

Never commit:

- `.env` files
- API or provider tokens
- Database URLs
- Azure connection strings
- Cloudflare secrets
- Discord webhook URLs
- Private keys
- Generated logs containing sensitive data or signed URLs
- User-uploaded private images

Use `.env.example` for names and safe placeholders only. Rotate any secret immediately if exposed.

## Responsible Disclosure

After a report is received:

1. The maintainer reviews and reproduces the issue.
2. Impact and affected versions are assessed.
3. A focused fix and verification steps are prepared.
4. The fix is merged or released.
5. Public disclosure may occur after users have had a reasonable opportunity to update.

Act in good faith and do not access, modify, or delete data that does not belong to you.

Thank you for helping keep PixelForge safe.
