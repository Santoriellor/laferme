# Technical

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 20 | What CI (`.github/workflows/deploy.yml`) and the Docker builder (`node:20-alpine`) use |
| npm | bundled with Node 20 | `package-lock.json` is lockfileVersion 3 |
| Docker + Compose v2 | any current | Only needed to build or run the container locally |

There is nothing else. No database, no backend, no `.env` file, no external
service to stand up. Everything the site needs is in `front/`.

The application lives entirely in `front/`. The repository root holds only
`README.md`, `docker-compose.yml`, `.github/` and `docs/`.

## Local development

```bash
cd front
npm ci
npm start
```

`npm start` runs `react-scripts start` and serves the site on
<http://localhost:3000> with hot reload.

Use `npm ci`, not `npm install`: `npm ci` installs exactly what
`package-lock.json` pins, which is what CI and the Docker build do. `npm
install` may quietly resolve a newer transitive version and produce a tree that
does not match the one the deploy builds.

To run the site the way production runs it - built bundle, nginx, the real
container:

```bash
docker compose build frontend
docker compose up -d frontend
```

`docker-compose.yml` attaches the container to an **external** network called
`proxy-network`, which exists on the VPS because traefik creates it. Locally
you have to create it once (`docker network create proxy-network`) or the
`up` fails. The container publishes no port to the host - traefik reaches it
over that network - so to look at it locally, either add a `ports:` mapping
temporarily or `docker compose exec frontend wget -qO- http://127.0.0.1:8080/`.

### Tests

```bash
cd front
npx react-scripts test --watchAll=false    # once, the way CI runs it
npm test                                   # interactive watch mode
```

Tests live next to the code they cover, under `front/src/`, and are discovered
by the CRA/Jest default pattern (`*.test.js`). `front/src/setupTests.js` is
loaded before every suite; it registers `@testing-library/jest-dom` and stubs
`IntersectionObserver`, which jsdom does not implement and which four sections
construct on mount.

Two more things about this jsdom environment are worth knowing before writing a
test:

- `window.innerWidth` is **1024**, so `Navbar` renders exactly one of its six
  branches - the `<= 1050 && > 901` one.
- `window.scrollTo` is not implemented by jsdom and must be stubbed before any
  test that triggers navigation.
- `fetch` **is** defined (Node's global reaches the jsdom environment), so an
  unstubbed `Testimonials` mount fires a real request at a relative URL and
  rejects asynchronously. Every test file must stub it.

## Build

```bash
cd front
npm run build
```

`react-scripts build` writes a static site to `front/build`. The directory is
gitignored. See [`architecture.md`](architecture.md) for what ends up in it and
how the Docker image is assembled from it.

### The build-warning trap

`npm run build` currently **succeeds with three warnings**:

```
src\App.js
  Line 9:8:   'BikingTour' is defined but never used   no-unused-vars
  Line 10:8:  'HorseRiding' is defined but never used  no-unused-vars

src\pages\Fundraiser.js
  Line 9:18:  'setRaised' is assigned a value but never used  no-unused-vars
```

Create React App promotes ESLint warnings to **errors** when the `CI`
environment variable is set. `front/Dockerfile` does not set `CI`, and that is
the only reason the production image builds at all. Setting `CI=true` on any
build step today makes the build fail and the deploy stop.

**Do not add `CI=true` to `npm run build`, to the Dockerfile, or to any
workflow step, until those three warnings are gone.** Task 10 of the refactor
cycle removes them. Once it has, enabling `CI` on the build is the right thing
to do - it turns a silent warning into a gate.

Note the asymmetry: the *test* job in `deploy.yml` does set `CI: true`, and
must, because that is what makes Jest run once instead of watching. The build
step is the one that must not.

## CI and the deploy gate

`.github/workflows/deploy.yml` triggers on push to `main` and has two jobs.

**`test`** - checks out, sets up Node 20, runs `npm ci` in `front/`, then:

```yaml
- name: Run tests
  working-directory: front
  env:
    CI: true
  run: npx react-scripts test --watchAll=false
```

**`build-and-deploy`** - declares `needs: test`, and additionally guards
`if: github.ref == 'refs/heads/main'`. It rsyncs `front/` (with `--delete`) and
`docker-compose.yml` to the VPS over SSH, then runs `docker compose build
frontend` and `docker compose up -d frontend` there.

Because `build-and-deploy` declares `needs: test`, **a failing test blocks the
deployment of a live site.** This is not a style rule. A test that is wrong, or
that is flaky for a reason unrelated to the code - wall-clock timing, an
unstubbed `fetch`, an assertion racing an unresolved promise - stops
<https://website.santoriello.ch> from shipping. Every test in this repository
has to be able to fail for exactly one reason: a real regression.

The rsync uses `--delete` deliberately, so that the deployed tree mirrors the
repository. Without it a renamed or deleted file lingers on the server forever
and eventually breaks a build there while the repository looks clean. The
comment in the workflow records that this path holds only source before the
flag was enabled.

Third-party actions are pinned to commit SHAs, not tags.

## Configuration and secrets

**This application reads no environment variables and holds no secrets.**

There is no `.env` file anywhere in the repository, no `REACT_APP_*` variable
in any source file, no API key, and no credential. Nothing needs configuring to
run it. Everything the site displays is either bundled from `front/src/assets/`
or fetched from `front/public/` on the same origin. There is no API to point
at.

This is a property worth preserving. A React bundle is public: anything read
through `process.env.REACT_APP_*` is compiled into the JavaScript that every
visitor downloads. There is no such thing as a secret in this codebase, only a
secret that has not been noticed yet.

The only secrets in play belong to GitHub Actions and exist to reach the VPS:

| Secret | Used for |
|---|---|
| `SSH_PRIVATE_KEY` | The deploy key written to `~/.ssh/id_rsa` in the runner |
| `VPS_HOST` | rsync/ssh target host, and `ssh-keyscan` input |
| `VPS_USER` | rsync/ssh user |
| `VPS_DEPLOY_PATH` | Directory on the VPS holding `front/` and `docker-compose.yml` |

All four are referenced only in `build-and-deploy` and none of them ever
reaches the bundle: they are used by the runner to copy files and run
`docker compose`, after the build inputs are already fixed.

`front/.dockerignore` excludes `.env`, `.env.*`, `**/.env` and `**/.env.*` from
the build context, so even an accidentally created env file cannot be baked
into an image layer. Both the bare and the `**/`-prefixed forms are required,
because `.dockerignore` patterns are anchored at the context root.

## Formatting

There is **no formatter configured in this repository yet**. There is no
`.prettierrc`, no `.editorconfig`, and no standalone ESLint configuration file;
the only lint configuration is the inline `eslintConfig` key in
`front/package.json`, which extends `react-app` and `react-app/jest`. That is
what produces the three build warnings above, and it is all that runs today.

Formatting is consequently inconsistent by file: two-space and four-space
indentation both appear across the stylesheets (compare `pages/Contact.css`
with `pages/AboutUs.css`), and `src/App.css` mixes literal tabs into an
otherwise space-indented block.

Task 13 of the current refactor cycle introduces Prettier and a standalone
`front/.eslintrc.json`, applies the formatter in **one commit containing
formatting and nothing else**, and adds that commit's SHA to
`.git-blame-ignore-revs` so `git blame` skips over it. Until that task lands,
match the style of the file you are editing and do not reformat surrounding
lines.

Once it lands, this section records the commands. Configure your editor to use
the repository's Prettier rather than a global install, so that saving a file
does not produce a diff nobody asked for.

## Verifying a CSS change

*Stub - filled in by Task 5 of the refactor cycle, which adds
`front/scripts/css-digest.js` and records the baseline digest.*

Consolidating stylesheets is invisible when it is correct and invisible when it
is subtly wrong, so it is not verified by looking at the page. It is verified
by reducing the **built** stylesheet - `front/build/static/css/main.*.css`,
after webpack has concatenated all 15 imports and resolved the cascade - to an
order-free, `var()`-resolved list of `selector | property: value` lines, and
diffing that against the digest taken before the change.

The rule every CSS task in this cycle follows:

- a **pure consolidation** must leave the digest **byte-identical**;
- a **deliberate change** must produce a digest diff containing exactly the
  enumerated lines for that change, and nothing else.

"It looks the same" is not a verification. See
[`decisions/0002-one-definition-per-idea-in-css.md`](decisions/0002-one-definition-per-idea-in-css.md).
