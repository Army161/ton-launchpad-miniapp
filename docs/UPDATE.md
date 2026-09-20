# UPDATE.md — Release Notes Process

## Versioning

- **Frontend:** semver in `package.json`
- **Contracts:** immutable deploys — new address per version

## Release checklist

1. Update `docs/BUILDV1.md` acceptance checkboxes
2. Run `npm run build` + contract tests
3. Tag release: `git tag v1.x.x`
4. Deploy Vercel production
5. Update `docs/SMARTCONTRACT.md` if new addresses

## TODO

- [ ] Add CHANGELOG.md when V1 ships
