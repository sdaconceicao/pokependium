# Auth

Generic login, email verification, and password set/reset. This service does not
own product profiles, avatars, or domain data — consuming APIs verify the JWT
it issues (`userId` + `email`) with the same `JWT_SECRET`.

## Project setup

```bash
pnpm install
cp .env.example .env
```

Postgres: for Pokependium, start the database from `backend/pokedex-rest`
(`pn docker:up`). A standalone deploy can point `DB_*` at any Postgres.

## Scripts

```bash
pn start:dev
pn test
pn lint
pn migration:run
```

Swagger: `http://localhost:<PORT>/docs`.

Protected `POST /auth/change-password` needs the `access_token` from login,
email verification, or password-reset confirm.
