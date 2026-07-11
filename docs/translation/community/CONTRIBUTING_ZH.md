<div align="center">

[EN](../../../CONTRIBUTING.md) | [ID](./CONTRIBUTING_ID.md) | 中文

</div>

# 为 PixelForge 做贡献

感谢你愿意花时间改进 PixelForge。

PixelForge 是一个开源图片工作室，将 AI 云端处理与快速浏览器图像工具结合。欢迎贡献，但改动应保持聚焦、文档完整、安全并易于审查。

---

## 目录

- [贡献方式](#贡献方式)
- [开始之前](#开始之前)
- [本地开发](#本地开发)
- [Branch 命名](#branch-命名)
- [Commit 约定](#commit-约定)
- [Pull Request 指南](#pull-request-指南)
- [前端指南](#前端指南)
- [后端指南](#后端指南)
- [文档指南](#文档指南)
- [安全指南](#安全指南)
- [审查清单](#审查清单)

---

## 贡献方式

- 修复 bug
- 改进 UI/UX 与 accessibility
- 添加或优化图像工具
- 改进后端可靠性或性能
- 改进文档和翻译
- 添加测试
- 报告 bug 或可用性问题
- 提出架构或安全改进建议

较大改动请先创建 issue，以便在实现前确认范围。

---

## 开始之前

1. 检查已有 issue 和 pull request。
2. 每次改动聚焦一个 concern。
3. 避免无关格式化改动。
4. 不要提交 secret、本地 `.env`、生成日志或私有配置。
5. 创建 pull request 前确认改动可在本地运行。

---

## 本地开发

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows
pip install -r requirements.txt
python run.py
```

`backend/run.py` 会启用 Uvicorn reload，并设置 `proxy_headers=False`。等效直接命令：

```bash
uvicorn main:app --reload --no-proxy-headers
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### 推荐检查

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

```bash
cd backend
python -m compileall api app core database domain limiter provider repository services utils
```

后端和 AI 工作流检查请参阅 [TESTING_ZH.md](../dev/TESTING_ZH.md)。

---

## Branch 命名

```txt
feat/object-remover
fix/upload-validation
docs/architecture-guide
refactor/job-manager
test/result-viewer
chore/update-deps
```

---

## Commit 约定

使用 Conventional Commit 格式：

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

常用 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`ci` 和 `build`。

---

## Pull Request 指南

良好的 pull request 应包含：

- 遵循 Conventional Commit 的标题
- 简洁的改动摘要
- 改动原因
- 测试说明
- UI 改动的截图或视频
- 风险、限制与后续工作

不相关的改动应拆分到不同 pull request。

---

## 前端指南

- 保持 page component 聚焦且易读。
- 可复用 UI 放入 `components/`。
- 可复用工作流放入 `hooks/`。
- API 调用放入 `services/`。
- 常量和文案放入 `content/`、`data/` 或配置模块。
- 避免重复 workspace 模式。
- 保持键盘支持、label、focus behavior 和可访问状态消息。
- 为复杂 component 与 hook 编写文档。

---

## 后端指南

- 保持 route 简洁，将业务逻辑委托给 service。
- Provider 专属逻辑放在 provider abstraction 后面。
- Runtime 配置集中在 `core/config.py`。
- 昂贵处理前验证上传数据。
- 保持 usage limit、rate limit、queue 和 cleanup 行为。
- 避免在 async request path 中加入 blocking work。
- 为复杂代码更新 docstring。
- Forwarded client-IP header 必须 fail-closed；不要信任无限制 CIDR。
- Production Turnstile 配置必须安全失败。

失败任务必须释放 queue capacity、在需要时记录 failure state、按条件退还 usage，并清理临时文件。

---

## 文档指南

主要文档：

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

翻译后的开发者文档：

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

翻译后的 community 和 landing 文档位于 `docs/translation/community/` 与 `docs/translation/landing/`。

行为、命令、环境变量或文件路径变化时，应在同一次改动中同步所有对应版本。

---

## 安全指南

不要提交 `.env`、token、cloud credential、database URL、private key、Discord webhook、敏感日志或用户私有图片。

涉及文件验证、signed URL、Turnstile、proxy/IP trust、usage/rate limit、storage cleanup 和 provider token 的改动需要特别仔细审查。严重漏洞请按照 [SECURITY_ZH.md](./SECURITY_ZH.md) 私下报告。

---

## 审查清单

- [ ] 改动聚焦且易于审查。
- [ ] 应用可在本地运行。
- [ ] 相关前端 lint/build 检查通过。
- [ ] 相关后端 compile/test 通过。
- [ ] 行为变化已记录。
- [ ] 对应翻译已更新。
- [ ] 未提交 secret、本地环境文件、日志或生成 artifact。
- [ ] UI 改动在有帮助时提供截图/视频。
- [ ] Pull request 标题遵循 commit 约定。

感谢你帮助改进 PixelForge。
