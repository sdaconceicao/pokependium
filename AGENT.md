# Repository Instructions

## Repository

This is a pnpm TypeScript monorepo using workspaces.

- `frontend/*` contains deployable frontend application built in nextjs.
- `backend/*` contains multiple backend apis that support the frontend (auth, REST profiles/groups, GraphQL Pokémon data).

View `docs/ARCHITECTURE.md` for a deeper understanding of the System Architecture

## Standards

For repo standards, read the package level docs in `docs/`:

- `docs/INTERACTION_STANDARDS.md` — General guidance around interactions
- `docs/PURE_FUNCTIONS.md` - Guidance on pure functions
- `docs/TESTING-UNIT-STANDARDS.md` - Guidance on unit testing
- `docs/TESTING-E2E-STANDARDS.md` - Guidance on e2e testing with Playwright
