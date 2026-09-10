# Pokedex - Rest

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
pnpm install
```

## Environment Configuration

The application supports multiple environment configurations:

- **Development**: Uses `.env` file (default)
- **Test**: Uses `.env.test` file

### Setting up environment files

1. Copy `env.example` to `.env` for dev environment

### Environment Variables

Key environment variables:

- `NODE_ENV`: Environment name (development, test, production)
- `PORT`: Application port (default: 3007)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SCHEMA`: Database configuration
- `ALLOWED_ORIGINS`: CORS allowed origins
- `JWT_SECRET`: must match the auth service that issues access tokens

## Compile and run the project

```bash
# development (uses .env)
$ pn  start

# watch mode (uses .env)
$ pn  start:dev

# production mode (uses .env.production)
$ pn  start:prod

# test mode (uses .env.test)
$ pn  start:test

# custom environment (uses .env.{ENV})
$ pn  start:env
$ ENV=staging pn  start:env
```

## API Documentation

Interactive Swagger (OpenAPI) docs are available while the server is running:

- Swagger UI: `http://localhost:<PORT>/docs`
- OpenAPI JSON: `http://localhost:<PORT>/docs-json`

Protected endpoints (e.g. `GET /users`) can be tried out by clicking **Authorize** and pasting the `access_token` issued by the auth service.

## Run tests

```bash
# unit tests
$ pn  test

# e2e tests
$ pn  test:e2e

# test coverage
$ pn  test:coverage
```

## Lint and format

Linting and formatting are handled by [Biome](https://biomejs.dev/). The version
is pinned once for the whole monorepo in the `catalog:` block of
`pnpm-workspace.yaml`, and each package keeps its own `biome.json`.

```bash
# check for lint and formatting errors
$ pn  lint

# fix lint and formatting errors
$ pn  lint:fix

# check in CI mode (no writes)
$ pn  lint:check

# format only
$ pn  format
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
npm install -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
