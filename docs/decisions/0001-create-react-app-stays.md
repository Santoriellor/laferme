# 1. Create React App stays

Date: 2026-08-22
Status: accepted

## Context

The build tool is `react-scripts@5.0.1` (`front/package.json`), and it is
unmaintained. Its last release predates React 19 entirely, so the version of
React this site actually runs on was never a supported target of the toolchain
compiling it. It pins an old webpack, an old Babel and Jest 27, none of which
can be upgraded independently without ejecting.

The symptom is already visible in this repository. `front/package.json` ends
with:

```json
"overrides": {
  "typescript": "4.9.5"
}
```

That entry exists because `react-scripts@5.0.1` depends on tooling that will
not resolve against a current TypeScript, and this is a plain JavaScript
project with no TypeScript source at all. An `overrides` block pinning a
compiler the project does not use is the shape of the problem: the dependency
tree has to be held in place by hand for an abandoned build tool.

`npm audit` reports transitive advisories in that tree, and will continue to.

The obvious response is to migrate to Vite. That is also the response this
cycle refuses.

## Decision

**`react-scripts` stays. Create React App is not migrated in this cycle.**

Estate spec D1: no project in this estate changes its build tool during this
refactor cycle. No CRA-to-Vite migration, no JavaScript-to-TypeScript
conversion, no framework replacement. `react-scripts` being unmaintained is
recorded as an ADR in each affected repository - this file - and not acted on.

The reason is scope, not preference. This cycle's purpose is to document the
site, pin its behaviour with tests, and consolidate its code against those
tests. A build-tool migration changes the compiler, the dev server, the test
runner, the module resolution and the asset pipeline all at once. Mixed into a
refactor, every subsequent failure has two possible causes and the tests stop
being able to tell you which.

## Consequences

- **`npm audit` findings in this tree are not incidents.** They are advisories
  in build-time-only dependencies - webpack loaders, Jest internals, dev-server
  middleware. None of it is shipped to a visitor: the artefact is a static
  bundle of application code, and nothing in `react-scripts` runs in a browser
  or on the server. A finding here is triaged against that fact, not patched
  reflexively.

- **`overrides.typescript` stays, and is the visible symptom of this deferral.**
  It is not stray configuration to tidy out of `package.json`: it is there to
  keep `react-scripts`' dependency resolution working, and removing it changes
  the resolved tree that `package-lock.json` pins. It is the marker for the
  problem being deferred, and it comes out with `react-scripts`, not before.

- **The version stays pinned as it is.** `5.0.1` is the last published
  `react-scripts`, so upgrading within CRA is not an available mitigation.

- **A migration to Vite is a separate, single-purpose change with its own
  plan.** When it happens it stands alone: no refactoring, no restructuring, no
  feature work in the same branch. The characterization suite this cycle builds
  (Tasks 2-4) is exactly what makes that migration verifiable later, because it
  pins what the page renders independently of what compiles it. Doing the
  migration first would have meant doing it with one smoke test as the only
  safety net.

- **Two other consequences of CRA are documented rather than fixed.** ESLint
  warnings become errors when `CI` is set, which is why the Dockerfile must not
  set it ([`../technical.md`](../technical.md)), and CRA's inline `eslintConfig`
  key is the only lint configuration until Task 13 moves it out.
