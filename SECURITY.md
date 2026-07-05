# Security Policy

## Supported Versions

PixelForge is actively maintained from the main branch of the repository.

Security fixes are generally applied to the latest version of the project. Older commits, forks, or private deployments may not receive separate security patches.

## Reporting a Vulnerability

If you believe you found a security vulnerability in PixelForge, please report it privately instead of opening a public issue.

Please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected component, route, page, or file
- Potential impact
- Any relevant screenshots, logs, or proof-of-concept details
- Suggested fix, if you have one

Please avoid sharing exploit details publicly until the issue has been reviewed and addressed.

## What to Report

Please report issues such as:

- Authentication or authorization bypass
- Unsafe file upload behavior
- File type spoofing bypass
- Signed URL exposure or misuse
- Secret, token, or credential leakage
- Cloudflare Turnstile bypass in production
- Proxy/IP trust issues
- Rate-limit or usage-limit bypass
- Path traversal or unsafe filename handling
- Server-side request forgery
- Cross-site scripting
- Data exposure involving uploaded images, result URLs, logs, or environment variables

## What Not to Report

The following usually do not require a private security report:

- General bugs without security impact
- UI layout issues
- Missing documentation
- Dependency update suggestions without a known vulnerability
- Local development misconfiguration that does not affect production

These can be reported through regular GitHub issues.

## Project Security Practices

PixelForge uses several security measures:

- Cloudflare Turnstile verification before AI job initialization
- Rate limiting for API endpoints
- Per-feature usage limits
- Signed Azure Blob URLs for upload and result access
- File validation for type, size, and image structure
- Safe generated filenames
- Temporary storage lifecycle and cleanup
- Backend-only provider tokens and cloud credentials
- Environment validation for sensitive runtime settings

## Secrets and Environment Files

Do not commit:

- `.env` files
- API tokens
- Database URLs
- Azure connection strings
- Replicate tokens
- Cloudflare secrets
- Discord webhook URLs
- Private keys
- Generated logs containing sensitive data

Use example files such as `.env.example` when documenting required variables.

## Responsible Disclosure

After a vulnerability is reported:

1. The maintainer will review the report.
2. The issue will be reproduced and assessed.
3. A fix will be prepared when needed.
4. The fix will be released or merged.
5. Public disclosure can happen after users have had a reasonable chance to update.

Please act in good faith and avoid accessing, modifying, or deleting data that does not belong to you.

Thank you for helping keep PixelForge safe.
