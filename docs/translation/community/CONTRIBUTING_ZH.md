# 为 PixelForge 贡献

感谢你愿意花时间改进 PixelForge。

PixelForge 是一个开源图片工作室，将云端 AI 图像处理能力与快速的浏览器端图片工具结合在一起。我们欢迎贡献，但请尽量保持改动聚焦、文档清晰，并便于审查。

---

## 目录

- [贡献方式](#贡献方式)
- [开始之前](#开始之前)
- [本地开发](#本地开发)
- [Branch 命名](#branch-命名)
- [Commit Message 规范](#commit-message-规范)
- [Pull Request 指南](#pull-request-指南)
- [Frontend 指南](#frontend-指南)
- [Backend 指南](#backend-指南)
- [文档指南](#文档指南)
- [安全指南](#安全指南)
- [Review Checklist](#review-checklist)

---

## 贡献方式

你可以通过以下方式贡献：

- 修复 bug
- 改善 UI/UX
- 添加或完善图片工具
- 提升 backend 的可靠性
- 改进文档
- 添加测试
- 报告 bug 或可用性问题
- 提出架构或安全方面的改进建议

如果你计划进行较大的改动，请先创建 issue 讨论范围，再开始实现。

---

## 开始之前

在贡献之前，请先：

1. 查看已有 issue 和 pull request。
2. 保持改动只聚焦在一个目标上。
3. 避免无关的格式化改动。
4. 不要提交 secret、本地 `.env` 文件、生成的日志或私有配置。
5. 在创建 pull request 前，确保改动可以在本地正常运行。

---

## 本地开发

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

### 推荐检查

根据你的改动运行对应检查：

```bash
npm --prefix frontend run lint
```

如果你的本地环境配置了 backend 测试或格式化工具，请在提交 pull request 前运行它们。

---

## Branch 命名

请使用简短且具有描述性的 branch 名称。

推荐格式：

```txt
feat/object-remover
fix/upload-validation
docs/architecture-guide
refactor/job-manager
test/result-viewer
chore/update-deps
```

---

## Commit Message 规范

PixelForge 使用 Conventional Commit 风格。

格式：

```txt
<type>(optional-scope): <short summary>
```

示例：

```txt
feat(object-remove): add mask-based object removal workflow
fix(upload): reject unsupported image formats earlier
docs(readme): update localized README links
refactor(job): simplify queue reservation flow
test(result-viewer): add result download render test
chore(deps): update frontend dependencies
```

常用类型：

| 类型 | 用途 |
|---|---|
| `feat` | 新的用户可见功能 |
| `fix` | Bug 修复 |
| `docs` | 仅文档改动 |
| `style` | 仅格式改动 |
| `refactor` | 不改变行为的代码重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 工具、依赖、维护 |
| `ci` | CI/CD 改动 |
| `build` | 构建系统改动 |

好的 commit message 应该具体，并尽量使用祈使语气。

推荐：

```txt
fix(upload): validate MIME type before creating job
```

避免：

```txt
fixed stuff
update files
changes
```

---

## Pull Request 指南

一个好的 pull request 应该包含：

- 使用 Conventional Commit 风格的清晰标题
- 简短说明改动内容
- 说明为什么需要这个改动
- 测试说明
- UI 改动的截图或视频
- 风险、限制或后续工作的说明

请保持 pull request 聚焦。如果改动涉及多个无关领域，请拆分成多个 pull request。

---

## Frontend 指南

修改 frontend 代码时：

- 保持 page component 清晰且职责聚焦。
- 将可复用 UI 放在 `components/`。
- 将可复用 workflow logic 放在 `hooks/`。
- 将 API call 放在 `services/`。
- 将 UI 内容放在 `content/`，导航配置放在 `content/navigation/`，runtime 配置放在 `config.js`。
- 避免重复 workspace UI pattern。
- 注意 button、input、label 与键盘交互的可访问性。
- 对非简单逻辑添加有意义的 component 或 hook 文档。

如果是 UI 改动，尽可能在 pull request 中附上截图或简短视频。

---

## Backend 指南

修改 backend 代码时：

- 保持 route handler 精简。
- 将 business logic 放在 service。
- 将 provider-specific logic 放在 provider abstraction 后面。
- 将配置集中在 `core/config.py`。
- 在处理前验证文件输入。
- 保持 usage limit、rate limit 和 cleanup 行为。
- 避免在 async request path 中加入阻塞操作。
- 修改非简单 module、class 或 function 时，添加或更新 docstring。

Backend 改动需要在失败情况下保持安全。失败的 job 应释放 queue capacity，在需要时记录失败状态，并避免留下临时文件。

---

## 文档指南

文档应尽可能在不同语言之间保持同步。

主要英文文档：

```txt
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
docs/ARCHITECTURE.md
docs/ADDING_AI_FEATURE.md
```

翻译文档：

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

当你更新英文文档时，如果对应翻译文档存在，也请同步更新印尼文和中文版本。

社区文档应放在 `docs/translation/community/`，开发者文档应放在 `docs/translation/dev/`，landing page 翻译应放在 `docs/translation/landing/`。

---
## 安全指南

不要提交：

- `.env` 文件
- API token
- Cloud provider credentials
- Database URL
- Private key
- 生成的日志
- 用户上传的私有图片

安全相关改动应谨慎审查，尤其是涉及以下内容的改动：

- 文件验证
- Signed URL
- Turnstile 验证
- Proxy/IP trust 行为
- Usage limit
- Rate limit
- Storage cleanup
- Provider token

如果你发现严重安全问题，请避免创建包含利用细节的公开 issue。请尽可能私下联系 maintainer。

---

## Review Checklist

创建 pull request 前，请确认：

- [ ] 改动聚焦且易于审查。
- [ ] 代码可以在本地运行。
- [ ] 如果修改了 frontend 文件，frontend linting 已通过。
- [ ] 如果行为发生变化，文档已更新。
- [ ] 如果存在对应翻译内容，翻译文档已更新。
- [ ] 没有提交 secret、`.env` 文件、日志或 generated artifact。
- [ ] UI 改动在有帮助时包含截图或视频。
- [ ] Pull request 标题遵循 Conventional Commit 风格。

感谢你帮助改进 PixelForge。
