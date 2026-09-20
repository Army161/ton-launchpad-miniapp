# CODE.md — Coding Conventions

## TypeScript / React

- Functional components + hooks
- CSS modules for page-specific styles; global tokens in `index.css`
- No `any` unless interfacing with Telegram WebApp SDK

## Naming

- Components: PascalCase
- Hooks: `use*` prefix
- API routes: kebab-case paths

## TON amounts

- Store as `bigint` nanotons internally
- Display with 4 decimal TON max in UI

## Commits

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` tooling / CI

## TODO

- [ ] Add Prettier config if team grows
