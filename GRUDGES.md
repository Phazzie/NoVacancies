# GRUDGES — things that failed silently or lied

Check this list before every deploy.

1. **`main` CI was red for months and nobody noticed.** A missing comma in `lessonsCatalog.ts` broke the build. The lockfile was out of sync, and the type check and unit runner had both been failing. Before deploying, run every gate locally; don't assume green.
2. **The Sprint 9 rate limiter shrank its own scope.** A refactor left story/image/builder AI routes unthrottled and keyed on spoofable `x-forwarded-for`. Its tests still passed because they only covered `/api/ai`. The test now covers a builder route too.
3. **Vercel previews fail in about 2 seconds with no build log.** Every deploy, including a redeploy of the live production build, reports "Resource provisioning failed". The git status check just says failed, and `list_deployment_events` returns nothing. Don't trust a "deployed" claim on this project until a URL actually loads.
4. **Undefined CSS variables rendered as invisible text.** Diagnostics panels and home buttons referenced `--text-main` and others that were never defined. Nothing errored; the text just vanished.
5. **The builder's E2E happy path could pass on fallback output.** The fixture returned scene JSON, so "draft generated" passed with the AI path broken. The assertions now check `source: 'ai'` and fixture-specific text.
6. **Section headers went blank on paper.** `.bu-paper h2` outranked `.bu-section-head`, so the headers drew black-on-black. Caught only by looking at screenshots, never by tests.
7. **Sourcery "blocking security" on PR #102** flags FSL-1.1-MIT `@sentry/cli` packages that were already dependencies. The lockfile sync made them visible. This is not new risk, but the check stays red until the owner decides.
