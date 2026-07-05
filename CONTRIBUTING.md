# Contributing to PixelForge

Thank you for taking the time to improve PixelForge.

PixelForge is an open-source image studio that combines AI-powered cloud processing with fast browser-based image tools. Contributions are welcome, but please keep changes focused, documented, and easy to review.

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
- Improving UI/UX
- Adding or refining image tools
- Improving backend reliability
- Improving documentation
- Adding tests
- Reporting bugs or usability issues
- Suggesting architecture or security improvements

For large changes, please open an issue first so the scope can be discussed before implementation.

---

## Before You Start

Before contributing, please:

1. Check existing issues and pull requests.
2. Keep your changes focused on one concern.
3. Avoid unrelated formatting changes.
4. Do not commit secrets, local `.env` files, generated logs, or private configuration.
5. Make sure your changes work locally before opening a pull request.

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Recommended Checks

Run the checks that apply to your change:

```bash
npm --prefix frontend run lint
```

If backend tests or formatting tools are configured in your local environment, run them before submitting your pull request.

---

## Branch Naming

Use short, descriptive branch names.

Recommended patterns:

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

PixelForge uses Conventional Commit style messages.

Format:

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
| `docs` | Documentation-only changes |
| `style` | Formatting-only changes |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Tests |
| `chore` | Tooling, dependencies, maintenance |
| `ci` | CI/CD changes |
| `build` | Build system changes |

Good commit messages are specific and written in the imperative mood.

Prefer:

```txt
fix(upload): validate MIME type before creating job
```

Avoid:

```txt
fixed stuff
update files
changes
```

---

## Pull Request Guidelines

A good pull request should include:

- A clear title using Conventional Commit style
- A short summary of what changed
- The reason for the change
- Testing notes
- Screenshots or videos for UI changes
- Notes about risks, limitations, or follow-up work

Keep pull requests focused. If a change touches unrelated areas, split it into separate pull requests.

---

## Frontend Guidelines

When changing frontend code:

- Keep page components readable and focused.
- Put reusable UI into `components/`.
- Put reusable workflow logic into `hooks/`.
- Put API calls into `services/`.
- Put constants and content into `data/` or `config.js`.
- Avoid duplicating workspace UI patterns.
- Keep accessibility in mind for buttons, inputs, labels, and keyboard interactions.
- Use meaningful component and hook documentation for non-trivial logic.

For UI changes, include screenshots or short videos in the pull request when possible.

---

## Backend Guidelines

When changing backend code:

- Keep route handlers thin.
- Put business logic in services.
- Put provider-specific logic behind provider abstractions.
- Keep configuration in `core/config.py`.
- Validate file inputs before processing.
- Preserve usage-limit, rate-limit, and cleanup behavior.
- Avoid introducing blocking work into async request paths.
- Add or update docstrings when changing non-trivial modules, classes, or functions.

Backend changes should be safe under failure conditions. Failed jobs should release queue capacity, record failure state when needed, and avoid leaving temporary files behind.

---

## Documentation Guidelines

Documentation should stay aligned across languages when possible.

Primary English docs:

```txt
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
docs/ARCHITECTURE.md
docs/ADDING_AI_FEATURE.md
```

Translated docs:

```txt
docs/translation/landing/README_ID.md
docs/translation/landing/README_CN.md

docs/translation/dev/ADDING_AI_FEATURE_ID.md
docs/translation/dev/ADDING_AI_FEATURE_ZH.md
docs/translation/dev/ARCHITECTURE_ID.md
docs/translation/dev/ARCHITECTURE_ZH.md

docs/translation/community/CONTRIBUTING_ID.md
docs/translation/community/CONTRIBUTING_ZH.md
docs/translation/community/CODE_OF_CONDUCT_ID.md
docs/translation/community/CODE_OF_CONDUCT_ZH.md
docs/translation/community/SECURITY_ID.md
docs/translation/community/SECURITY_ZH.md
```

When updating English documentation, update the Indonesian and Chinese versions if the same content exists there.

Keep community documents under `docs/translation/community/`, developer documents under `docs/translation/dev/`, and landing-page translations under `docs/translation/landing/`.

---
## Security Guidelines

Do not commit:

- `.env` files
- API tokens
- Cloud provider credentials
- Database URLs
- Private keys
- Generated logs
- User-uploaded private images

Security-sensitive changes should be reviewed carefully, especially changes involving:

- File validation
- Signed URLs
- Turnstile verification
- Proxy/IP trust behavior
- Usage limits
- Rate limits
- Storage cleanup
- Provider tokens

If you find a serious security issue, avoid opening a public issue with exploit details. Contact the maintainer privately when possible.

---

## Review Checklist

Before opening a pull request, check:

- [ ] The change is focused and easy to review.
- [ ] The code runs locally.
- [ ] Frontend linting passes when frontend files changed.
- [ ] Documentation was updated when behavior changed.
- [ ] Translated docs were updated when matching translated content exists.
- [ ] No secrets, `.env` files, logs, or generated artifacts are committed.
- [ ] UI changes include screenshots or videos when useful.
- [ ] The pull request title follows Conventional Commit style.

Thank you for helping improve PixelForge.
