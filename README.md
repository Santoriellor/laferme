[![Deploy](https://github.com/Santoriellor/laferme/actions/workflows/deploy.yml/badge.svg)](https://github.com/Santoriellor/laferme/actions/workflows/deploy.yml)

# laferme

A single-page React marketing and fundraising site for La Ferme, a **fictional**
Tuscan farm guesthouse - a portfolio piece, not a real business. It is a static
Create React App bundle in three languages, served by unprivileged nginx behind
traefik.

Live at <https://website.santoriello.ch> (not `laferme.santoriello.ch` - see
[`docs/runbook.md`](docs/runbook.md)).

## Running it locally

```bash
cd front
npm ci
npm start
```

Serves the site on <http://localhost:3000> with hot reload. Node 20; nothing
else to install, no database, no environment variables. See
[`docs/technical.md`](docs/technical.md) for running it the way production runs
it, in Docker.

## Tests

```bash
cd front
npx react-scripts test --watchAll=false
```

Tests live beside the code they cover, under `front/src/`, and are discovered
by the `*.test.js` pattern. `front/src/setupTests.js` registers
`@testing-library/jest-dom` and stubs `IntersectionObserver`, which jsdom does
not provide and which four sections construct on mount.

The same command runs in CI, and `build-and-deploy` declares `needs: test` - so
a failing test stops the live site from shipping.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) - components, why there is no
  router, the four content-loading paths, build and deployment topology.
- [`docs/design.md`](docs/design.md) - what the site is, its information
  architecture, the three-language content model, what is placeholder content.
- [`docs/technical.md`](docs/technical.md) - prerequisites, local development,
  build, the CI deploy gate, configuration and secrets, formatting.
- [`docs/runbook.md`](docs/runbook.md) - logs, redeploying, what to check when
  the site is down, and the hostname that looks like an outage and is not.
- [`docs/decisions/`](docs/decisions/) - architecture decision records,
  including problems found and deliberately not fixed.

## Deployment

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
the tests first, then an rsync of `front/` and `docker-compose.yml` to the VPS
and a `docker compose build && up -d` there. traefik terminates TLS. The
container runs nginx unprivileged as uid 101 on port 8080.
