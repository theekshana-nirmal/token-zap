# Contributing to TokenZap

Thanks for your interest in contributing.

## Development Setup

```bash
npm install
npm run build
npm test
```

## Workflow

1. Check open issues or open a new one describing your proposed change
2. Create a branch: `git checkout -b feat/XX-description` (XX = issue number)
3. Make your changes, following the existing code style (small pure functions, one transform per file in `utils/`)
4. Add or update tests in `test/` - every new rule needs test coverage with exact-output assertions
5. Update relevant docs in `docs/` and `README.md` if you add or change an option
6. Add a CHANGELOG.md entry under `[Unreleased]` or the next version section
7. Run `npm test` and confirm everything passes
8. Push your branch and open a pull request referencing the issue number

## Code Style

- Pure, deterministic, rule-based functions only - no AI/LLM calls, no external NLP dependencies
- Keep functions small and single-purpose
- Reuse existing utilities (check `utils/`) before writing new ones
- New transforms should be zone-aware if they touch whitespace or structure (see `utils/extractZones.ts`)

## Pull Request Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes to the public `tokenZap()` API without prior discussion
