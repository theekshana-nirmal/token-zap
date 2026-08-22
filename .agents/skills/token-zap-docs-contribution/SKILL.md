---
name: token-zap-docs-contribution
description: Documentation structure and git contribution conventions for token-zap - docs/ guides, README, CHANGELOG format, commit messages, branch naming, and the PR checklist. Use when writing or editing any documentation, updating the README or CHANGELOG, making commits, naming branches, or preparing pull requests.
---

# TokenZap Docs & Contribution

## Documentation map

| File | Covers |
|---|---|
| `README.md` | Condensed overview: install, quick start, features, options table, plugin guide, links into docs/ |
| `docs/options.md` | Complete options reference |
| `docs/examples.md` | Before/after examples |
| `docs/unicode-sanitization.md` | Invisible Unicode removal |
| `docs/strip-decorative.md` | Decorative separator stripping |
| `docs/plugins.md` | Plugin authoring |
| `docs/token-analytics.md` | `report: true` and per-provider tokenizer integration |
| `docs/zap-template.md` | `zap` tagged template |

All documentation is hand-written markdown — there is no doc-generation tooling. The README is deliberately condensed with deep links into `docs/` (restructured in v1.3.0); don't inline full guides into it.

### Documenting a new option or feature

Update all of these:

1. `docs/options.md` — the authoritative options reference
2. The options table in `README.md` — keep the two consistent. Note: the README table intentionally lists only the seven cleaning options; `report` and `tokenizer` are documented in `docs/options.md` and `docs/token-analytics.md` instead. Don't add them to the README table.
3. A dedicated `docs/<feature>.md` guide if the feature is substantial, linked from the README's documentation list
4. A `CHANGELOG.md` entry (format below)

Examples go in `docs/examples.md` — there is no separate `examples/` code directory.

## CHANGELOG conventions

Keep-a-Changelog + SemVer (both stated in the file):

- New work is documented under the upcoming version heading `## [X.Y.Z]`; the release date (`- YYYY-MM-DD`) is added at release time by the `token-zap-release` procedure.
- Sections: `### Added`, `### Changed`, `### Fixed`.
- The `## [X.Y.Z] - date` heading format is load-bearing: `.github/workflows/publish.yml` extracts release notes via awk on `^## \[X.Y.Z\]`. Never alter the heading format.
- Known artifacts you may hit while editing: a duplicated `# Changelog` H1 and stranded "All notable changes…" boilerplate mid-file (leftovers from layered release-prep PRs), and a v1.3.0 install-diff that shows the same package name on both lines. Don't replicate these patterns; cleaning them up is fine as long as version heading formats stay intact.

## Git conventions

- **Branches**: `feat/<issue#>-<slug>` (e.g. `feat/43-zap-tagged-template`); also `fix/...` and `release/vX.Y.Z-...` prep branches. The number is the issue the work belongs to (CONTRIBUTING.md step 2).
- **Commits**: conventional prefixes — `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:` — with the PR number appended by the squash merge (`(#44)`). Match this style.
- **Exception**: release version-bump commits are bare version numbers (`1.6.0`) — see the `token-zap-release` skill.
- **PRs** reference the issue (`Closes #NN` per the template at `.github/pull_request_template.md`, lowercase filename) and must satisfy its checklist:
  - Tests added/updated and passing
  - Documentation updated
  - `CHANGELOG.md` updated
  - No breaking changes to the public `tokenZap()` API without prior discussion

## Community files

- `.github/CODEOWNERS`: `* @theekshana-nirmal` (sole owner — all reviews route to the maintainer)
- `.github/ISSUE_TEMPLATE/`: `bug_report.md` (input/options/expected/actual/version) and `feature_request.md` (includes before/after and a default-vs-opt-in field — new transforms are expected to state which they are)
- `SECURITY.md`: vulnerabilities are reported privately via GitHub security advisory. The zero-network, zero-deps, no-persistence guarantees are security-relevant — keep them intact.
- `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1. `LICENSE`: MIT.
