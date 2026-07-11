# Contributing to PixelForge

Thank you for taking the time to improve PixelForge.

PixelForge is an open-source image studio combining AI-powered cloud processing with fast browser-based image tools. Contributions are welcome, but changes should remain focused, documented, secure, and easy to review.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Local Development](#local-development)
- [Branch Naming](#branch-naming)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Frontend Guidelines](#frontend-guidelines)
- [Backend Guidelines](#backend-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Security Guidelines](#security-guidelines)
- [Review Checklist](#review-checklist)

---

## Ways to Contribute

You can contribute by:

- Fixing bugs
- Improving UI/UX and accessibility
- Adding or refining image tools
- Improving backend reliability or performance
- Improving documentation and translations
- Adding tests
- Reporting bugs or usability issues
- Suggesting architecture or security improvements

For large changes, open an issue first so the scope can be discussed before implementation.

---

## Before You Start

1. Check existing issues and pull requests.
2. Keep the change focused on one concern.
3. Avoid unrelated formatting changes.
4. Do not commit secrets, local `.env` files, generated logs, or private configuration.
5. Confirm the change works locally before opening a pull request.

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows
pip install -r requirements.txt
python run.py
```

`backend/run.py` starts Uvicorn with reload enabled and `proxy_headers=False`. The equivalent direct command is:

```bash
uvicorn main:app --reload --no-proxy-headers
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Recommended Checks

Run the checks that apply to the change:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

```bash
cd backend
python -m compileall api app core database domain limiter provider repository services utils
```

See [docs/TESTING.md](docs/TESTING.md) for backend and AI workflow checks.

---

## Branch Naming

Use short, descriptive branch names:

```txt
feat/object-remover
fix/upload-validation
docs/architecture-guide
refactor/job-manager
test/result-viewer
chore/update-deps
```

---

## Commit Message Convention

PixelForge uses Conventional Commit-style messages:

```txt
<type>(optional-scope): <short summary>
```

Examples:

```txt
feat(object-remove): add mask-based object removal workflow
fix(upload): reject unsupported image formats earlier
docs(readme): update localized README links
refactor(job): simplify queue reservation flow
test(result-viewer): add result download render test
chore(deps): update frontend dependencies
```

Common types:

| Type | Use for |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation-only change |
| `style` | Formatting-only change |
| `refactor` | Restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Tests |
| `chore` | Tooling, dependencies, maintenance |
| `ci` | CI/CD change |
| `build` | Build-system change |

Use specific, imperative summaries. Avoid messages such as `fixed stuff`, `update files`, or `changes`.

---

## Pull Request Guidelines

A good pull request includes:

- A clear Conventional Commit-style title
- A concise summary of the change
- The reason for the change
- Testing notes
- Screenshots or videos for UI changes
- Risks, limitations, and follow-up work

Keep pull requests focused. Split unrelated changes into separate pull requests.

---

## Frontend Guidelines

- Keep page components focused and readable.
- Put reusable UI in `components/`.
- Put reusable workflow logic in `hooks/`.
- Put API calls in `services/`.
- Put constants and copy in `content/`, `data/`, or configuration modules.
- Avoid duplicating workspace patterns.
- Preserve keyboard support, labels, focus behavior, and accessible status messages.
- Document non-trivial components and hooks.

---

## Backend Guidelines

- Keep routes thin and delegate business logic to services.
- Keep provider-specific logic behind provider abstractions.
- Keep runtime configuration in `core/config.py`.
- Validate uploaded data before expensive processing.
- Preserve usage-limit, rate-limit, queue, and cleanup behavior.
- Avoid blocking work in async request paths.
- Add or update docstrings for non-trivial code.
- Keep forwarded client-IP headers fail-closed; never trust unrestricted CIDRs.
- Ensure production Turnstile configuration fails closed.

Failed jobs must release queue capacity, record failure state when needed, refund usage where appropriate, and remove temporary files.

---

## Documentation Guidelines

Keep matching English, Indonesian, and Chinese documents aligned.

Primary documents:

```txt
README.md
SETUP.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE

docs/ARCHITECTURE.md
docs/ADDING_AI_FEATURE.md
docs/TESTING.md
```

Translated developer documents:

```txt
docs/translation/dev/SETUP_ID.md
docs/translation/dev/SETUP_ZH.md
docs/translation/dev/ARCHITECTURE_ID.md
docs/translation/dev/ARCHITECTURE_ZH.md
docs/translation/dev/ADDING_AI_FEATURE_ID.md
docs/translation/dev/ADDING_AI_FEATURE_ZH.md
docs/translation/dev/TESTING_ID.md
docs/translation/dev/TESTING_ZH.md
```

Translated community and landing documents live under:

```txt
docs/translation/community/
docs/translation/landing/
```

When behavior, commands, environment variables, or file paths change, update all matching versions in the same change.

---

## Security Guidelines

Never commit:

- `.env` files
- API tokens or cloud credentials
- Database URLs
- Private keys
- Discord webhook URLs
- Generated logs containing sensitive data
- User-uploaded private images

Review changes involving file validation, signed URLs, Turnstile, proxy/IP trust, usage limits, rate limits, storage cleanup, or provider tokens especially carefully. Report serious vulnerabilities privately according to [SECURITY.md](SECURITY.md).

---

## Review Checklist

- [ ] The change is focused and easy to review.
- [ ] The application runs locally.
- [ ] Relevant frontend lint/build checks pass.
- [ ] Relevant backend compile/tests pass.
- [ ] Behavior changes are documented.
- [ ] Matching translations are updated.
- [ ] No secrets, local environment files, logs, or generated artifacts are committed.
- [ ] UI changes include screenshots or videos when useful.
- [ ] The pull request title follows the commit convention.

Thank you for helping improve PixelForge.
