---
name: token-zap-release
description: Release and npm publishing workflow for token-zap - manual SemVer versioning, CHANGELOG finalization, vX.Y.Z tags, and the automated GitHub Actions publish pipeline (OIDC trusted publishing, provenance). Use for anything involving version bumps, releases, tags, npm publish, or changes to the CI/publish workflows.
---

# TokenZap Release & Publishing

Releasing is fully manual up to the tag; automation does the rest. There is no semantic-release, release-it, or changesets.

## Release procedure

Follow the project's exact historical sequence (see git history: release commits are bare version numbers like `1.6.0`, `1.5.0`):

1. Ensure all features for the release are merged and `CHANGELOG.md` has the entry under `## [X.Y.Z] - YYYY-MM-DD`. The entry and date land with the feature PR or a separate `docs:` prep commit (e.g. "docs: set release date for v1.4.0 (#37)") — format in the `token-zap-docs-contribution` skill.
2. Bump `version` in `package.json` and `package-lock.json` together — `npm version <newversion> --no-git-tag-version` updates both.
3. Commit ONLY those two files with a **bare version-number message**: `1.6.0`. No conventional prefix, no description — historical release commits (`1.6.0`, `1.5.0`, …) touch exactly `package.json` and `package-lock.json`.
4. Create and push the tag: `git tag v1.6.0 && git push origin v1.6.0`.
5. The tag triggers `.github/workflows/publish.yml`, which does everything else.

## What publish.yml does (and requires)

- Triggers on tags matching `v*`; runs on Node 24.x. Node 24 is required for npm Trusted Publishing — the split between CI on Node 22 and publish on Node 24 is intentional; don't "fix" it.
- **Fails hard if the `package.json` version ≠ tag version.** Never push a tag without the matching version bump already committed on main.
- Runs `npm ci` → `npm run build` → `npm test` — builds and tests gate every release.
- Extracts release notes from `CHANGELOG.md` with awk matching `^## \[X.Y.Z\]` headings. The Keep-a-Changelog heading format is load-bearing — never change it. (If an entry is missing, the release notes fall back to "Release version X.Y.Z".)
- Creates a GitHub Release (`softprops/action-gh-release@v1`, not draft, not prerelease) with those notes.
- Publishes with `npm publish --provenance --access public` via OIDC trusted publishing (`id-token: write` permission). There is no `NODE_AUTH_TOKEN` — token-based publishing was deliberately removed in favor of trusted publishing.

## Rules

- **Never run `npm publish` manually.** Publishing is tag-driven with provenance attestations; a local publish would bypass the CI gates and the trusted-publisher linkage.
- **Never delete and re-push a tag** — every `v*` tag push attempts a real npm publish.
- SemVer per project history: minor (`1.x.0`) for new features/transforms (they ship opt-in and non-breaking), patch for fixes, major only for breaking public-API changes (which require prior discussion per CONTRIBUTING.md).
- `prepublishOnly: npm run build` in `package.json` exists as a local safety net only — it is not the release path.
- If a publish run fails, check the version-match guard first — it's the only step that hard-fails. A missing CHANGELOG entry only logs a warning and falls back to generic release notes.
