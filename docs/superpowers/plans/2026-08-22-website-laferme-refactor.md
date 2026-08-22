# website-laferme Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document website-laferme to the estate standard, replace its single smoke test with a characterization suite that pins what the page actually renders, then collapse 18 stylesheets down to a set that has one definition per idea, lift hard-coded content out of JSX, and bring the page to a baseline of accessibility — all without changing the stack.

**Architecture:** A single-page React marketing site with no router. `App.js` stacks seven section components inside one `<main>`; navigation is `document.getElementById` plus `window.scrollTo`, not URL routing. Copy for three languages comes from `LanguageContext`, which statically imports `src/assets/locales/{en,fr,de}.json`; team and news content arrive through per-language dynamic `import()`; testimonials arrive through a runtime `fetch` of a file in `public/`. The build is Create React App, the artefact is a static bundle, and nginx serves it unprivileged on port 8080 behind traefik. Work proceeds in four phases — document, characterize, refactor, verify — and the characterization suite is what makes the refactor phase safe, because the same suite gates the deploy.

**Tech Stack:** React 19, react-scripts 5 (webpack, Babel, Jest 27, jsdom), plain JavaScript, `@testing-library/react` 16, `@testing-library/jest-dom` 6, Font Awesome SVG icons, Docker, nginx, traefik, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-22-estate-refactor-design.md` (committed by Task 1)

## Global Constraints

- **The stack does not change.** Create React App stays. No Vite migration, no TypeScript conversion, no router introduction. `react-scripts` being unmaintained is recorded as an ADR and deliberately not acted on. (Spec D1)
- **`.github/workflows/deploy.yml` gates the deploy on the test job.** `build-and-deploy` declares `needs: test`, so a red or flaky suite stops a live public site from shipping. Never commit a test that can fail for a reason other than a real regression. In particular: never assert on wall-clock timing, never leave a `fetch` unstubbed, and never let an assertion depend on an unresolved promise.
- **Characterization tests assert current behaviour, never desired behaviour.** (Spec D3)
- **Security and accessibility defects are the exception:** they are fixed TDD-style against the corrected behaviour and are never pinned by a characterization test, because pinning a defect makes the deploy gate defend it. (Spec D8, extended to the accessibility findings by the same argument)
- **Documentation file set is fixed and named exactly:** `README.md`, `docs/architecture.md`, `docs/design.md`, `docs/technical.md`, `docs/runbook.md`, `docs/decisions/NNNN-*.md`. No `CLAUDE.md`. `front/README.md` — the untouched Create React App boilerplate — is deleted, because two READMEs means neither is the entry point. (Spec D2)
- **CSS changes are proved, not asserted.** Task 5 installs `front/scripts/css-digest.js`, which reduces the built stylesheet to an order-free, `var()`-resolved list of `selector | property: value`. Every CSS task states what that digest must do: stay byte-identical, or change by an exactly enumerated set of lines. "It looks the same" is not a verification.
- **The formatter sweep is one commit containing formatting only**, and its SHA is appended to `.git-blame-ignore-revs`. It is the last task in Phase C, because running it earlier would mix reformatting into every review diff above it. This repository has no Prettier and no ESLint configuration beyond the inline `eslintConfig` key in `front/package.json`; both are being introduced here. (Spec D4)
- **Security-motivated dependency removal is in scope** and is a task, not a side effect. (Spec D5)
- **Branch:** all work happens on `refactor/website-laferme`. The executor does not merge and does not open a pull request; the reviewing session reads the diff, re-runs the suite, and merges. (Spec D6)
- **This repository is served at `website.santoriello.ch`.** It is not served at `laferme.santoriello.ch`. Do not "fix" that anywhere.

---

## File Structure

**Created — documentation**

| File | Responsibility |
|---|---|
| `docs/architecture.md` | Components, section composition, content-loading paths, build and deployment topology |
| `docs/design.md` | What the site is for, its information architecture, the three-language content model |
| `docs/technical.md` | Build, run, CI, the deploy gate, formatting tooling, the CSS digest check |
| `docs/runbook.md` | Logs, redeploy, common incidents — including the `laferme.santoriello.ch` false alarm |
| `docs/decisions/0001-create-react-app-stays.md` | Records that `react-scripts` is unmaintained and that this cycle deliberately does not migrate |
| `docs/decisions/0002-one-definition-per-idea-in-css.md` | Why the stylesheets are consolidated and how the change is proved safe |
| `docs/decisions/0003-contact-form-has-no-destination.md` | The contact form submits nowhere; fixing it needs a destination this repository does not have |
| `docs/decisions/0004-deferred-findings.md` | Everything found and deliberately not fixed |
| `docs/superpowers/specs/2026-08-22-estate-refactor-design.md` | The estate design document this plan argues from |

**Created — tests**

| File | Responsibility |
|---|---|
| `front/src/App.test.js` | Replaces the smoke test: landmarks, sections, default copy, fundraiser progress |
| `front/src/components/Navbar.test.js` | Menu at each rendered breakpoint, scroll-to-section, hamburger, language switching |
| `front/src/pages/Content.test.js` | Team list, news cards and modal, testimonials slider, carousel |
| `front/src/Accessibility.test.js` | Created in Task 11 against corrected behaviour: one `h1`, real buttons, accessible names |

**Created — production code and configuration**

| File | Responsibility |
|---|---|
| `front/scripts/css-digest.js` | Reduces a built stylesheet to an order-free, `var()`-resolved digest. The CSS verification tool. |
| `front/src/assets/css/tokens.css` | The `:root` custom properties and the web-font `@import`, moved out of `App.css` |
| `front/src/assets/css/animations.css` | The one definition of each `@keyframes`, replacing six copies across four files |
| `front/src/assets/css/sections.css` | The section-shell and section-title declarations shared by five pages |
| `front/src/assets/data/carouselSlides.js` | The carousel's images and the locale keys naming their alternative text |
| `front/.prettierrc`, `front/.prettierignore` | Prettier configuration |
| `front/.eslintrc.json` | ESLint configuration, moved out of `package.json` and extended with `prettier` |
| `.git-blame-ignore-revs` | Lists the formatting sweep commit so `git blame` skips it |

**Modified**

| File | Change |
|---|---|
| `README.md` | Rewritten as an entry point; the "There are none yet" tests section becomes true |
| `front/src/index.js` | Imports `tokens.css`, `animations.css` and `sections.css` before `App` |
| `front/src/App.css` | Loses `:root`, the `@import`, and the dead `.App` selector |
| `front/src/App.js` | Drops the two unused imports that produce build warnings |
| `front/src/components/Carousel.js` | Reads its slides from the data module and its copy from `LanguageContext` |
| `front/src/components/CarouselImage.js`, `front/src/components/CarouselImage.css` | Dead bottom-caption markup and rules removed |
| `front/src/components/Navbar.js`, `front/src/components/Navbar.css` | Hamburger becomes a real button |
| `front/src/components/Header.js` | Language `<select>` gains an accessible name; `<h1>` stays the page's only `h1` |
| `front/src/pages/Fundraiser.js`, `.css` | `class` → `className`; `h1` → `h2`; call-to-action colours reach WCAG AA |
| `front/src/pages/AboutUs.js`, `.css` | `h1` → `h2`; social links gain accessible names |
| `front/src/pages/Blog.js` | Cards become buttons; the modal gains a dialog role and an Escape key |
| `front/src/pages/Contact.js`, `.css` | Inputs gain names and accessible names; send button reaches WCAG AA |
| `front/src/pages/Testimonial.js` | `h1` → `h2` |
| `front/src/pages/Showcase.css`, `Blog.css`, `Contact.css`, `AboutUs.css`, `Testimonials.css` | Shared declarations and duplicated keyframes removed |
| `front/src/assets/locales/{en,fr,de}.json` | Three dead `_old` keys removed; six new keys for the accessible names |
| `front/package.json`, `front/package-lock.json` | `react-fontawesome` and `cra-template` removed; `fontawesome-svg-core` pinned; Prettier added; `eslintConfig` moved out |

**Deleted**

| File | Reason |
|---|---|
| `front/README.md` | Create React App boilerplate; `README.md` at the repository root is the entry point (Spec D2) |
| `front/src/assets/css/global.css` | 951 lines, imported by nothing |
| `front/src/styles.css` | 22 lines, imported by nothing |
| `front/src/pages/test.css` | 6 lines, imported by nothing |
| `front/src/components/TourCard.js` | Imported by nothing; the only importer of `react-router-dom` |
| `front/src/logo.svg` | Create React App boilerplate, referenced by nothing |
| `front/src/assets/images/{bike-horse-logo.png,biking-tour.jpg,home-banner.jpg,horse-riding.jpg}` | Referenced by no stylesheet, component or data file |

---

## Survey findings this plan is built on

Read this section before starting. Every number below was measured on the working tree at commit `12ca2271`, and several steps expect you to reproduce them.

**Security.** Three of the four classes the spec asks for are **absent**, and that is stated here so nobody re-derives it:

- No `dangerouslySetInnerHTML` anywhere in `front/src`.
- No `target="_blank"` anywhere in `front/src` or `front/public`, therefore no missing `rel="noopener noreferrer"`.
- No secrets, API keys or credentials in the repository or the bundle. There is no `.env` file, no key material, and `front/.dockerignore` already excludes `.env`, `.env.*`, `**/.env` and `**/.env.*` from the build context. Every name in `front/public/testimonials/testimonials.json` and `front/src/assets/locales/about_us_*.json` is placeholder content ("Alice Smith", "CEO of TechCorp", `linkedin.com/in/emmafarmlife`), not personal data.

The fourth class is **present but is not exploitable**: `front/src/pages/Contact.js:33` is a `<form className="contact-form">` with no `action`, no `method` and no `onSubmit` handler, and its three inputs (`Contact.js:34-36`) carry no `name` attribute. Submitting it does not post anywhere; the browser performs a same-URL GET and the visitor's message is discarded. Nothing leaks — it simply does not work. Fixing it requires a destination (a mail relay or form endpoint) that does not exist in this repository, so Task 1 records it in `docs/decisions/0003-contact-form-has-no-destination.md` rather than inventing one.

One dependency finding does fall under Spec D5, in Task 12.

**Stylesheets: 18 files, 2,139 lines.**

- **Three are dead — 979 lines, 45.8% of all CSS.** `front/src/assets/css/global.css` (951 lines), `front/src/styles.css` (22), `front/src/pages/test.css` (6). No `.js` file imports any of them; `grep -rn "\.css'" front/src --include=*.js` lists 15 imports and none of these three. `test.css` in particular is a discarded experiment: it restyles `#fundraiser` with `color: #af1a1a` and `height: 800px`, values that appear nowhere else.
- **Six `@keyframes` definitions collapse to four names, and this changes what runs.** `slideInLeft` is defined four times — `Fundraiser.css:159`, `AboutUs.css:151`, `Blog.css:151` (all `translateX(-100px)`) and `Contact.css:86` (`translateX(-100%)`). `slideInRight` is defined twice — `Fundraiser.css:169` (`100px`) and `Contact.css:98` (`100%`). In the built bundle only **one** of each survives, and it is Contact's: `grep -c "translateX(-100px)" front/build/static/css/main.*.css` returns `0`. So `.about-title`, `.blog-title` and `.fundraiser-content h1` are all written against a 100-pixel slide and all actually animate across their full width. Task 7 makes the surviving definition the only definition.
- **Colour is written four ways.** White appears as a literal 19 times outside the token declaration — `#fff` 12 times, `white` 6 times, `#ffffff` once — across 8 files, while `var(--colorwhite)` is used 10 times. `rgba(0, 0, 0, α)` appears 17 times with 7 distinct alphas; `rgba(0, 0, 0, 0.1)` alone appears 4 times (`Footer.css:12`, `Header.css:12`, `Blog.css:33`, `Testimonials.css:50`).
- **Two declared tokens are never used:** `--color4: #EEE6D8` and `--color5: #e5e7e6` (`App.css:8-9`), 0 uses each.
- **The section shell is written five times.** `position: relative; width: 100%; min-height: fit-content; background: var(--colorwhite); margin: 0; padding: 0` appears identically on `#about-us`, `#blog`, `#contact`, `#showcase` and `#testimonials`. `#about-us` and `#contact` are identical for **twelve** consecutive declarations, differing only by `#contact`'s `height: 600px`.
- **The section title is written four times.** `margin: 15px 0; padding: 0; font-size: 3rem; text-align: center` on `.about-title`, `.blog-title`, `.contact-title`, `.testimonials-title`. `.about-title` and `.blog-title` are byte-identical apart from the selector.
- **Five rule blocks in live stylesheets are unreachable:** `.App` (`App.css:16` — the markup uses `.content`), `.carousel-bottom-text` and `.carousel-bottom-text .text` (`CarouselImage.css:41-56` — the markup is commented out at `CarouselImage.js:9-11`), `.learn-btn` (`Fundraiser.css:74, 93-102` — commented out at `Fundraiser.js:56`), `.showcase-span` (`Showcase.css:15-18` — never used).
- **A page stylesheet carries a site-wide rule.** `Contact.css:80` declares `a { color: inherit; text-decoration: none; }`, which strips the underline from every link on the site, including the ones in `AboutUs.js`.

**Content.** Four different mechanisms deliver copy, and one of them is hard-coded JSX:

1. `LanguageContext.js` statically imports `locales/{en,fr,de}.json` — 28 keys each, in exact parity, of which three (`headerTitle_old`, `fundraiserTitle_old`, `fundraiserText_old`) are dead.
2. `AboutUs.js:16` and `Blog.js:15` each resolve a per-language dynamic `import()` of `about_us_${language}.json` / `news_${language}.json`.
3. `Testimonial.js:12` runs `fetch('/testimonials/testimonials.json')` at runtime against a file in `public/`. It is not translated and it is placeholder content.
4. `Carousel.js:10-15` hard-codes three slides in the component, with English alternative text (`alt: 'Image 1'`) and three English caption strings that nothing renders. Task 10 moves these out.

**Dependencies.** `front/package.json` lists both `react-fontawesome@^1.7.1` and `@fortawesome/react-fontawesome@^0.2.2`. Only the second is imported (`AboutUs.js:2`); `grep -rn "react-fontawesome" front/src` returns exactly that one line. `react-fontawesome@1.7.1` is a 2018 package unrelated to the Font Awesome 6 SVG API, and it ships its own `prop-types` subtree — dead weight, removed in Task 12. `cra-template@1.2.0` is scaffolding only needed by `create-react-app` itself and is also unimported. `react-router-dom@7.1.1` has exactly one importer, `TourCard.js`, which nothing imports.

**Accessibility baseline.** Landmarks are good: `<header>`, `<nav>`, `<main>`, `<footer>` all exist. Everything else needs work:

| Finding | Location |
|---|---|
| Five `<h1>` elements on one page | `Header.js:14`, `Fundraiser.js:43`, `AboutUs.js:40`, `Contact.js:31`, `Testimonial.js:23` |
| Heading level skipped, `h1` → `h3` | `AboutUs.js:40` then `AboutUs.js:47` |
| Hamburger control is a `<div onClick>` — not focusable, no role, no `aria-expanded` | `Navbar.js:153` |
| Carousel indicators are `<span onClick>` | `Carousel.js:87-91` |
| Whole news card is a `<div onClick>` | `Blog.js:42` |
| Modal has no `role="dialog"`, no `aria-modal`, no Escape key | `Blog.js:54` |
| Language `<select>` has no label and no `aria-label` | `Header.js:17-25` |
| Form inputs have a placeholder but no label, no `aria-label` and no `name` | `Contact.js:34-36` |
| Carousel `alt` text is `"Image 1"`, `"Image 2"`, `"Image 3"` | `Carousel.js:11-13` |
| Social links have no accessible name — `FontAwesomeIcon` renders `aria-hidden="true"` on the `<svg>`, so each `<a>` is nameless | `AboutUs.js:53-55` |
| `class=` instead of `className=` — React 19 passes the attribute through so the styling works, but every render logs `Invalid DOM property 'class'` | `Fundraiser.js:59` |

Colour contrast against white text, computed with the WCAG relative-luminance formula. Three of the site's call-to-action buttons fail AA (4.5:1) for normal-size text:

| Element | Colour | Ratio | Verdict |
|---|---|---|---|
| `.donate-btn` (`Fundraiser.css:85`) | `#ff5733` | **3.15:1** | fails |
| `.contact-form button` (`Contact.css:67`, `var(--color2)`) | `rgb(182,115,50)` | **3.83:1** | fails |
| `.fixed-donate-btn` (`Fundraiser.css:120`) | `#e63946` | **4.17:1** | fails |
| `.blog-info p` (`Blog.css:66`) | `#666` on `#fff` | 5.74:1 | passes |
| `.menu button:hover` (`Navbar.css:35`, `var(--color1)`) | `#93441A` | 6.81:1 | passes |
| mobile menu, black on `var(--color2)` | `rgb(182,115,50)` | 5.49:1 | passes |

**Test environment facts you will rely on.** `window.innerWidth` in this jsdom is **1024**, so `Navbar` renders exactly one branch — the `<= 1050 && > 901` one at `Navbar.js:73`, giving Home / About Us / Contact / News plus a "More ▼" dropdown. `IntersectionObserver` exists only because `setupTests.js` stubs it. `fetch` **is** defined (Node's global leaks into the jsdom environment), so an unstubbed `Testimonial` mount fires a real request against a relative URL and rejects asynchronously — every test file must stub it. `window.scrollTo` is not implemented by jsdom and must be stubbed before any navigation test.

---

## Phase A — Document

### Task 1: Documentation set and ADRs

**Files:**
- Create: `docs/architecture.md`, `docs/design.md`, `docs/technical.md`, `docs/runbook.md`
- Create: `docs/decisions/0001-create-react-app-stays.md`, `docs/decisions/0002-one-definition-per-idea-in-css.md`, `docs/decisions/0003-contact-form-has-no-destination.md`, `docs/decisions/0004-deferred-findings.md`
- Create: `docs/superpowers/specs/2026-08-22-estate-refactor-design.md`
- Modify: `README.md`
- Delete: `front/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `docs/decisions/0004-deferred-findings.md`, appended to by Tasks 6, 10, 11, 12 and 14.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b refactor/website-laferme
```

- [ ] **Step 2: Copy the estate spec into the repository**

```bash
mkdir -p docs/superpowers/specs
cp "C:/Users/Maria/AppData/Local/Temp/claude/C--Users-Maria-Desktop-Dev-space-multi/1814e037-1eae-4438-a5b2-96a101fd483d/scratchpad/2026-08-22-estate-refactor-design.md" \
   docs/superpowers/specs/
```

That path is a session scratchpad and is not durable. If the file is gone, ask for the estate design document before continuing — every constraint in this plan derives from it, and guessing at them is worse than waiting.

- [ ] **Step 3: Write `docs/architecture.md`**

Required sections, in this order: Overview; Components; Content loading; Build; Deployment topology.

Facts that must appear, all verified during the survey:

- There is **no router**. `react-router-dom` is a dependency but `App.js` renders seven section components stacked inside one `<main>`, and `Navbar.js` navigates with `document.getElementById(id)` plus `window.scrollTo({ top, behavior: 'smooth' })` and a `-110px` offset that clears the fixed 100px header.
- Rendered sections, in DOM order: `#fundraiser`, `#about-us`, `#contact`, `#blog`, `#showcase`, `#testimonials`. `BikingTour` and `HorseRiding` exist as components but their JSX is commented out at `App.js:30-31`.
- Content arrives four different ways. List all four exactly as the survey section above lists them, and say which one each component uses.
- `Navbar.js` renders five mutually exclusive menu layouts chosen from `window.innerWidth`, at breakpoints 1151, 1051, 901, 675 and below. State that this is layout logic in JavaScript rather than in media queries, and that `Navbar.css` carries a sixth breakpoint at 674px.
- The build is `react-scripts build` into `front/build`, copied into `nginxinc/nginx-unprivileged:1.29-alpine`. nginx listens on **8080**, not 80, because the image runs as uid 101; `docker-compose.yml` carries the matching `loadbalancer.server.port=8080` label.
- `front/nginx.conf` uses `try_files $uri $uri/ /index.html`. The site has no client-side routes today, so this only matters if one is ever added.
- traefik terminates TLS and attaches `security-headers@file` and `gzip-compress@file` from its own file provider. The router rule is `Host(`website.santoriello.ch`)`.

- [ ] **Step 4: Write `docs/design.md`**

Required sections: What the site is; Information architecture; The three-language content model; Known placeholder content.

The content model section must state that `LanguageContext` holds `language`, `texts` and `toggleLanguage`; that `texts` is swapped wholesale from `locales/<lang>.json`; that the language is **not persisted** (a reload returns to English) and **not reflected in the URL or in `<html lang>`**, which stays `"en"` in `front/public/index.html:2` whatever the visitor picks.

The placeholder section must name what is not real yet: every testimonial in `front/public/testimonials/testimonials.json`, every team member in `about_us_*.json`, every news item in `news_*.json`, and the fundraiser's `raised = 1500` against `goal = 10000`, both hard-coded at `Fundraiser.js:9-10`.

- [ ] **Step 5: Write `docs/technical.md`**

Required sections: Prerequisites; Local development; Build; CI and the deploy gate; Configuration and secrets; Formatting; Verifying a CSS change.

The CI section must state that `.github/workflows/deploy.yml` runs `npx react-scripts test --watchAll=false` with `CI: true` in a `test` job, that `build-and-deploy` declares `needs: test`, and that therefore **a failing test blocks the deployment of a live site**.

The configuration section must state the truth: this application reads no environment variables and holds no secrets. The only secrets in play are the GitHub Actions secrets used to reach the VPS — `SSH_PRIVATE_KEY`, `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_PATH` — and they never enter the bundle.

Also record the build-warning trap: `npm run build` currently succeeds with three `no-unused-vars` warnings, but Create React App treats warnings as errors when `CI` is set. The Dockerfile does not set `CI`, which is the only reason the image builds. Task 10 removes the warnings; until then, do not add `CI=true` to any build step.

Leave the "Verifying a CSS change" section as a stub pointing at Task 5, and fill it in there.

- [ ] **Step 6: Write `docs/runbook.md`**

Required sections: Where the logs are; Redeploying; The site is down; **Hostnames**.

The hostnames section is the reason this file exists. It must record, in these words or clearer:

> This repository is served at **`website.santoriello.ch`**. It is **not** served at `laferme.santoriello.ch`.
>
> `laferme.santoriello.ch` resolves to the VPS but has no traefik router behind it. A request to it fails with `curl` exit code 60 and HTTP status `000`. That looks exactly like an expired or invalid certificate and it is not: it is a hostname with nothing serving it, so traefik answers with its default certificate. This has already caused one false outage alarm. Before touching certificates, check that the hostname you tested is the one in `docker-compose.yml`.

Give the two commands and their expected results:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://website.santoriello.ch/   # expect 200
curl -sS -o /dev/null -w '%{http_code}\n' https://laferme.santoriello.ch/   # expect 000, exit 60 — this is normal
```

- [ ] **Step 7: Write `docs/decisions/0001-create-react-app-stays.md`**

Context: `react-scripts@5.0.1` is unmaintained; its last release predates React 19, it pins an old webpack and Jest 27, and `front/package.json` already carries an `overrides` entry forcing `typescript@4.9.5` to keep its dependency resolution working.

Decision: it stays. Per Spec D1 no project in this estate changes its build tool during this cycle.

Consequences: `npm audit` will continue to report transitive advisories in build-time-only dependencies; those are not shipped to visitors. A migration to Vite is a separate, single-purpose change with its own plan. Record `overrides.typescript` as the visible symptom of the problem being deferred.

- [ ] **Step 8: Write `docs/decisions/0002-one-definition-per-idea-in-css.md`**

Context: the four numbers from the survey — 979 dead lines across three unimported files, four definitions of `@keyframes slideInLeft` of which only Contact's survives the build, 19 literal white values in three spellings alongside a `--colorwhite` token, and a section shell written out five times.

Decision: one definition per idea, in `tokens.css`, `animations.css` and `sections.css`, imported once from `index.js`.

Consequences: the change is invisible if it is correct, so it is verified mechanically by `front/scripts/css-digest.js` rather than by eye. State the rule the tasks follow: for a pure consolidation the digest must be byte-identical; for a deliberate change the digest diff must contain exactly the enumerated lines and nothing else.

- [ ] **Step 9: Write `docs/decisions/0003-contact-form-has-no-destination.md`**

Context: `Contact.js:33-38` renders a form with no `action`, no `method`, no `onSubmit`, and three inputs with no `name`. A visitor who fills it in and presses "Send Message" causes a same-URL GET; the message is discarded and no error is shown.

Decision: not fixed in this cycle. Making it work needs a destination — a mail relay, a form service, or a backend — and this repository is a static bundle behind nginx with no server side of its own. Choosing that destination is a product decision, not a refactor.

Consequences: the form stays visibly present and silently useless until a destination exists. Record explicitly that no characterization test pins this behaviour, because pinning it would make the deploy gate defend a broken form.

- [ ] **Step 10: Start `docs/decisions/0004-deferred-findings.md`**

Seed it with the findings this cycle will not fix, each with a one-line reason:

- `<html lang="en">` is hard-coded in `front/public/index.html:2` and never updated when the visitor switches language. Fixing it means writing to `document.documentElement.lang` from `LanguageContext`; deferred as a behaviour change outside this cycle's scope.
- The language choice is not persisted and not in the URL, so a reload silently reverts to English.
- `de.json` is partly untranslated (`"menuAboutUs": "About Us"`) and has typos: `"Wilkommen"`, `"Kontact"`, `"Was die Leute über us sagen"`. Copy, not code.
- `Fundraiser.js:9-10` hard-codes `raised = 1500` and `goal = 10000`, and `setRaised` is never called. A fundraising total that only a redeploy can change is a content problem needing a data source.
- `front/public/testimonials/testimonials.json` is fetched at runtime while every other content file is bundled from `src/assets/`. Unifying it is deliberately deferred: it holds placeholder content that must be replaced with real testimonials anyway, and moving placeholder data between two locations is churn.
- `Testimonial.js:12-16` has no loading and no error state; a failed fetch logs to the console and leaves an empty section.
- `Navbar.js` chooses between five layouts from `window.innerWidth` in JavaScript rather than in media queries, so the menu does not respond until a `resize` event fires. Restructuring it is a rewrite, not a refactor.
- `BikingTour` and `HorseRiding` remain in the tree with their JSX commented out at `App.js:30-31` and `Navbar.js:44-45`. They are kept, not deleted, because the comments record an intent to re-enable them; Task 10 only removes the unused imports.
- `--font2` names `"Quintessential"`, whose `@import` is commented out at `App.css:2`, so `.carousel-top-text` silently falls back to `sans-serif`. The element it styles is empty in the markup.
- `App.css:1` loads Poppins from `fonts.googleapis.com`, a third-party request on every page view. Self-hosting it is a privacy improvement outside this cycle.
- `Header.js:13` uses `src="laferme.png"` — a document-relative URL that only works because the site is served from `/`.
- `Blog.js:54` has no focus trap and does not restore focus on close; Task 11 adds a dialog role and an Escape key but not a full focus trap.

- [ ] **Step 11: Rewrite `README.md` as an entry point**

Keep the CI badge. State what the site is in two sentences, give the shortest path to running it locally, and link to each of the four `docs/` files and to `docs/decisions/`. Replace the "There are none yet" tests section with the command and where the tests live — the sentence becomes true in Phase B, and this task is the one that stops the README from lying about it.

Detail lives in `docs/`, not in the README.

- [ ] **Step 12: Delete the Create React App boilerplate README**

```bash
git rm front/README.md
```

Spec D2 fixes the documentation set, and two READMEs means neither is the entry point.

- [ ] **Step 13: Verify no production code changed**

Run: `git status --porcelain`

Expected: only files under `docs/`, plus `README.md` and the deleted `front/README.md`. If anything under `front/src` or `front/package.json` appears, revert it — this phase changes no code.

- [ ] **Step 14: Commit**

```bash
git add docs README.md
git commit -m "docs: document architecture, design, technical detail and runbook"
```

---

## Phase B — Characterize

Today's entire suite is `front/src/App.test.js`, which renders `<App />` and asserts the container is not empty. That is enough to catch a crash and nothing else. These three tasks replace it with a suite that pins what the page renders, so Phase C can be shown not to have changed it.

Every test file in this phase stubs `global.fetch` and `window.scrollTo`, and every test awaits the three asynchronous content loads. That is not ceremony: without the stub, `Testimonial` fires a real request; without the awaits, React logs "not wrapped in act" and assertions race the promises. Both make a suite that the deploy gate depends on flaky.

### Task 2: Characterize the page shell

**Files:**
- Modify: `front/src/App.test.js`
- Test: the file above

**Interfaces:**
- Consumes: `front/src/setupTests.js`, which already stubs `IntersectionObserver`. Do not modify it — four components construct one in a `useEffect` and every render depends on that stub.
- Produces: the `renderApp()` helper pattern, repeated verbatim in Tasks 3 and 4 so each test file stands alone.

- [ ] **Step 1: Record the baseline**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: `Test Suites: 1 passed`, `Tests: 1 passed`. Write both numbers down. Note also that the run prints console errors — `Invalid DOM property 'class'` and two "not wrapped in act" warnings. Those are findings, not failures, and the suite you are about to write eliminates the act warnings.

- [ ] **Step 2: Replace `front/src/App.test.js`**

```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

// Characterization tests: these assert what the page renders today, so that the
// refactor can be shown not to have changed it. Where a test would otherwise
// pin a defect, it does not — the defect is fixed in Phase C against a test
// asserting the corrected behaviour instead.

// Testimonial.js calls fetch('/testimonials/testimonials.json') on mount. This
// jsdom exposes Node's global fetch, which would attempt a real request against
// a relative URL and reject asynchronously, so every test supplies a stub.
const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
  {
    name: 'Bob Johnson',
    role: 'Marketing Director',
    message: 'An incredible experience from start to finish. Outstanding team!',
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Renders the app and waits until every asynchronous content load has settled:
 * AboutUs and Blog each resolve a dynamic import(), Testimonial resolves the
 * fetch stubbed above. Waiting for one item from each keeps those state updates
 * inside act() and makes the assertions deterministic.
 */
async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the page shell', () => {
  it('renders the four document landmarks', async () => {
    await renderApp();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders every section the navigation scrolls to', async () => {
    const { container } = await renderApp();
    ['fundraiser', 'about-us', 'contact', 'blog', 'showcase', 'testimonials'].forEach((id) => {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it('does not render the two sections whose markup is commented out', async () => {
    const { container } = await renderApp();
    expect(container.querySelector('#biking-tour')).toBeNull();
    expect(container.querySelector('#horse-riding')).toBeNull();
  });

  it('shows the English copy by default', async () => {
    await renderApp();
    expect(screen.getByText('Welcome to La Ferme')).toBeInTheDocument();
    expect(screen.getByText('Help Us Save La Ferme')).toBeInTheDocument();
    expect(screen.getByText(/Guesthouse La Ferme/)).toBeInTheDocument();
    expect(screen.getByText(/All Rights Reserved/)).toBeInTheDocument();
  });

  it('shows the fundraiser progress against its goal', async () => {
    await renderApp();
    const goal = screen.getByText(/raised of/);
    expect(goal).toHaveTextContent('1,500');
    expect(goal).toHaveTextContent('10,000');
  });

  it('offers both donate buttons', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Donate Now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Donate' })).toBeInTheDocument();
  });
});
```

Note what this file deliberately does **not** assert: how many `<h1>` elements the page has (five today, one after Task 11), that the hamburger is a `<div>`, or that the carousel images are called "Image 1". Each of those is a defect, and pinning it would make the deploy gate defend it.

- [ ] **Step 3: Run it**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 1 suite, 6 tests, all pass, and **no "not wrapped in act" warnings** — the `renderApp()` awaits are what remove them. The `Invalid DOM property 'class'` warning still appears; Task 11 removes it.

If `offers both donate buttons` fails as ambiguous, read the failure: `getByRole('button', { name: 'Donate' })` must match only the fixed button. It does, because the other is named "Donate Now" and accessible-name matching is exact by default. If your run disagrees, the locale file has changed — assert what `en.json` actually holds.

- [ ] **Step 4: Commit**

```bash
git add front/src/App.test.js
git commit -m "test: characterize the page shell"
```

### Task 3: Characterize navigation and language switching

**Files:**
- Create: `front/src/components/Navbar.test.js`
- Test: the file above

**Interfaces:**
- Consumes: `renderApp()`, repeated here rather than shared.
- Produces: the `.toggle` / `.menu.open` assertions that Task 11 must keep green after the hamburger becomes a real button.

- [ ] **Step 1: Confirm the viewport the tests will run at**

`window.innerWidth` is **1024** in this environment. `Navbar.js:73` is therefore the only branch rendered: `windowWidth <= 1050 && windowWidth > 901`, giving Home, About Us, Contact, News and a "More ▼" dropdown holding Gallery and Testimonials. Every assertion below depends on that. If a test surprises you, print `window.innerWidth` first.

- [ ] **Step 2: Write the test**

Create `front/src/components/Navbar.test.js`:

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
];

const ORIGINAL_WIDTH = window.innerWidth;

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  window.innerWidth = ORIGINAL_WIDTH;
});

async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the navigation at the default 1024px viewport', () => {
  it('shows the four primary destinations and a More dropdown', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About Us' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'News' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More ▼' })).toBeInTheDocument();
  });

  it('keeps Gallery and Testimonials inside the dropdown until it is opened', async () => {
    await renderApp();
    expect(screen.queryByRole('button', { name: 'Gallery' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'More ▼' }));

    expect(screen.getByRole('button', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Testimonials' })).toBeInTheDocument();
  });

  it('scrolls smoothly to the section a menu item names', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'About Us' }));

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' }),
    );
  });
});

describe('the navigation on a narrow viewport', () => {
  beforeEach(() => {
    window.innerWidth = 500;
  });

  it('renders a toggle and keeps the menu closed until it is activated', async () => {
    const { container } = await renderApp();

    const toggle = container.querySelector('.toggle');
    expect(toggle).not.toBeNull();
    expect(container.querySelector('.menu')).not.toHaveClass('open');

    fireEvent.click(toggle);
    expect(container.querySelector('.menu')).toHaveClass('open');

    fireEvent.click(toggle);
    expect(container.querySelector('.menu')).not.toHaveClass('open');
  });

  it('closes the menu once a destination is chosen', async () => {
    const { container } = await renderApp();

    fireEvent.click(container.querySelector('.toggle'));
    expect(container.querySelector('.menu')).toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(container.querySelector('.menu')).not.toHaveClass('open');
  });
});

describe('language switching', () => {
  it('replaces the header, the menu and the team copy when French is chosen', async () => {
    await renderApp();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fr' } });

    expect(await screen.findByText('Bienvenue à la Ferme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeInTheDocument();
    expect(await screen.findByText('Propriétaire & Hôte')).toBeInTheDocument();
    expect(await screen.findByText('Nouveaux sentiers de randonnée ouverts !')).toBeInTheDocument();
  });

  it('replaces the header when German is chosen', async () => {
    await renderApp();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'de' } });

    expect(await screen.findByText('Wilkommen zur La Ferme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Startseite' })).toBeInTheDocument();
  });
});
```

The narrow-viewport tests assert `.menu.open`, not the presence of the buttons. That is deliberate and it is what the component does: at 674px and below every menu button stays in the DOM and `clip-path` hides it (`Navbar.css:74-94`). A test asserting the buttons disappear would be asserting something untrue.

`"Wilkommen zur La Ferme"` is misspelled in `de.json`. It is asserted verbatim because that is what the site says today; the typo is recorded in `docs/decisions/0004-deferred-findings.md`.

- [ ] **Step 3: Run it**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 2 suites, 13 tests, all pass.

If `scrolls smoothly to the section a menu item names` fails with `toHaveBeenCalledTimes(0)`, `document.getElementById('about-us')` returned null — meaning `renderApp()` returned before AboutUs mounted. Check the awaits before changing the assertion.

- [ ] **Step 4: Commit**

```bash
git add front/src/components/Navbar.test.js
git commit -m "test: characterize navigation, the mobile menu and language switching"
```

### Task 4: Characterize the content sections

**Files:**
- Create: `front/src/pages/Content.test.js`
- Test: the file above

**Interfaces:**
- Consumes: `renderApp()`, repeated a third time.
- Produces: the counts (4 team members, 3 news items, 3 carousel images, 4 renders per testimonial) that Task 10 must preserve.

- [ ] **Step 1: Write the test**

Create `front/src/pages/Content.test.js`:

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
  {
    name: 'Bob Johnson',
    role: 'Marketing Director',
    message: 'An incredible experience from start to finish. Outstanding team!',
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the team section', () => {
  it('renders every member of the English team file', async () => {
    await renderApp();
    ['Emma Carter', 'Liam Brooks', 'Sophia Reynolds', 'Noah Bennett'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('gives every portrait the person it shows as its alternative text', async () => {
    await renderApp();
    expect(screen.getByAltText('Emma Carter')).toHaveAttribute(
      'src',
      '/images/aboutus/user2.jpg',
    );
  });

  it('links each member to three social profiles', async () => {
    const { container } = await renderApp();
    const links = container.querySelectorAll('.social-links a');
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAttribute('href', 'https://twitter.com/emmafarmlife');
  });
});

describe('the news section', () => {
  it('renders every item of the English news file', async () => {
    await renderApp();
    expect(screen.getByText('New Hiking Trails Open!')).toBeInTheDocument();
    expect(screen.getByText('Community Cleanup Success')).toBeInTheDocument();
    expect(screen.getByText('Last Winter Storm')).toBeInTheDocument();
  });

  it('opens a modal holding the full article when an item is chosen', async () => {
    await renderApp();

    fireEvent.click(screen.getByText('New Hiking Trails Open!'));

    // The title now appears twice: once on the card, once in the modal.
    expect(screen.getAllByText('New Hiking Trails Open!')).toHaveLength(2);
    expect(
      screen.getByText('Discover the new scenic hiking trails now open to the public...'),
    ).toBeInTheDocument();
  });

  it('closes the modal again', async () => {
    await renderApp();

    fireEvent.click(screen.getByText('Community Cleanup Success'));
    expect(screen.getAllByText('Community Cleanup Success')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '✖' }));
    expect(screen.getAllByText('Community Cleanup Success')).toHaveLength(1);
  });
});

describe('the testimonials section', () => {
  it('renders each testimonial four times — the list is doubled, then shown in two sliders', async () => {
    await renderApp();
    expect(screen.getAllByText('- Alice Smith, CEO of TechCorp')).toHaveLength(4);
    expect(screen.getAllByText('- Bob Johnson, Marketing Director')).toHaveLength(4);
  });

  it('requests the testimonials from the public folder', async () => {
    await renderApp();
    expect(global.fetch).toHaveBeenCalledWith('/testimonials/testimonials.json');
  });
});

describe('the showcase carousel', () => {
  it('renders three slides with exactly one active', async () => {
    const { container } = await renderApp();
    expect(container.querySelectorAll('.carousel-image')).toHaveLength(3);
    expect(container.querySelectorAll('.carousel-image-wrapper.active')).toHaveLength(1);
    expect(container.querySelectorAll('.indicator')).toHaveLength(3);
  });
});
```

`renders each testimonial four times` looks like an odd thing to assert until you read `Testimonial.js:19`: the array is concatenated with itself for a seamless loop, and the doubled array is then rendered by both the top and the bottom slider. Two stubbed entries therefore produce eight cards. That multiplication is the behaviour being pinned.

The carousel test uses `container.querySelectorAll`, not `getByAltText`. The alternative text is `"Image 1"`, `"Image 2"`, `"Image 3"` today; Task 11 replaces it, and pinning it here would make the deploy gate defend meaningless alt text.

- [ ] **Step 2: Run the whole suite**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 3 suites, 22 tests, all pass. Write the counts down — Task 14 compares against them.

If `links each member to three social profiles` reports a length other than 12, read `about_us_en.json`: four people times three links. If the file has changed, assert what it holds.

- [ ] **Step 3: Confirm the deploy gate runs exactly this command**

Run: `grep -n "react-scripts test" .github/workflows/deploy.yml`

Expected: `run: npx react-scripts test --watchAll=false`, inside a job whose `env` sets `CI: true`. The suite you just wrote is now what stands between a push to `main` and a live deployment. Do not proceed to Phase C until it is green.

- [ ] **Step 4: Commit**

```bash
git add front/src/pages/Content.test.js
git commit -m "test: characterize the team, news, testimonial and carousel sections"
```

---

## Phase C — Refactor

**Do not start this phase until Tasks 2 to 4 are committed and `CI=true npx react-scripts test --watchAll=false` reports 3 suites and 22 tests passing.**

Task order here is a dependency order. The digest tool comes first because five later tasks are verified with it. The formatter sweep comes last because running it earlier would mix reformatting into every review diff above it.

### Task 5: Add the CSS digest tool and record the baseline

**Files:**
- Create: `front/scripts/css-digest.js`
- Modify: `docs/technical.md`

**Interfaces:**
- Consumes: `postcss`, already present in `front/node_modules` as a `react-scripts` dependency. Nothing new is installed.
- Produces: `node scripts/css-digest.js build/static/css`, printing one sorted line per declaration. Tasks 6, 7, 8, 9, 11 and 13 all use it.

- [ ] **Step 1: Create the script**

Create `front/scripts/css-digest.js`:

```js
// Reduces a built stylesheet to an order-free digest: one sorted line per
// declaration, as "<at-rule context>|<selector>|<property>:<value>".
//
// Two things are normalised away on purpose:
//   * order, so moving a rule between files is invisible here;
//   * custom properties, which are resolved from :root into their use sites,
//     so replacing a literal with the token holding the same value is a no-op.
//
// Run it against front/build/static/css before and after a CSS change. A pure
// consolidation must produce an identical digest. A deliberate change must
// produce a diff containing exactly the lines you meant to change.
//
// Usage: cd front && node scripts/css-digest.js build/static/css
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const dir = process.argv[2] || 'build/static/css';
const file = fs.readdirSync(dir).find((f) => f.endsWith('.css'));
if (!file) {
  throw new Error(`no .css file in ${dir} — run "npm run build" first`);
}
const root = postcss.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

const tokens = new Map();
root.walkRules(':root', (rule) => {
  rule.walkDecls(/^--/, (decl) => tokens.set(decl.prop, decl.value.trim()));
});

function resolve(value) {
  let out = value;
  for (let i = 0; i < 10 && out.includes('var('); i += 1) {
    out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,[^()]*)?\)/g, (match, name) =>
      tokens.has(name) ? tokens.get(name) : match,
    );
  }
  return out;
}

const lines = [];
root.walkDecls((decl) => {
  if (decl.prop.startsWith('--')) return;
  const rule = decl.parent;
  if (rule.type !== 'rule' && rule.type !== 'atrule') return;

  const context = [];
  for (let parent = rule.parent; parent && parent.type === 'atrule'; parent = parent.parent) {
    context.unshift(`@${parent.name} ${parent.params}`);
  }
  const selector = rule.type === 'rule' ? rule.selector : `@${rule.name} ${rule.params}`;
  const value = resolve(decl.value).replace(/\s+/g, ' ').trim();

  selector
    .split(',')
    .map((s) => s.trim())
    .forEach((sel) => {
      lines.push(
        `${context.join(' >> ')}|${sel}|${decl.prop}:${value}${decl.important ? ' !important' : ''}`,
      );
    });
});

lines.sort();
console.log(lines.join('\n'));
```

- [ ] **Step 2: Build and record the baseline**

```bash
cd front
npm run build
node scripts/css-digest.js build/static/css > /tmp/css-baseline.txt
wc -l /tmp/css-baseline.txt
```

Expected: the build succeeds with three `no-unused-vars` warnings, and the digest is **655 lines**.

If the count differs, do not adjust anything — record the number you actually got and use that as your baseline. The count is a property of the working tree, and every later check is a diff against *your* baseline, not against this one.

- [ ] **Step 3: Prove the tool detects a real change**

```bash
cd front
node -e "
const fs=require('fs'),p='src/pages/Showcase.css';
fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace('padding: 0;','padding: 1px;'));
"
npm run build
node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - | head
git checkout -- src/pages/Showcase.css
```

Expected: the diff shows exactly `#showcase|padding:0` replaced by `#showcase|padding:1px`. If the diff is empty the tool is not doing its job — stop and fix it before relying on it.

Then rebuild the clean tree and confirm the baseline is restored:

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "BASELINE RESTORED"
```

- [ ] **Step 4: Document the check**

Fill in the "Verifying a CSS change" section of `docs/technical.md` with the three commands — build, digest, diff against a baseline captured before the change — and the rule: a consolidation must produce an empty diff; a deliberate change must produce a diff you can enumerate in advance.

- [ ] **Step 5: Commit**

```bash
git add front/scripts/css-digest.js docs/technical.md
git commit -m "build: add a CSS digest tool so stylesheet changes can be proved safe"
```

### Task 6: Delete the dead stylesheets and dead rules

**Files:**
- Delete: `front/src/assets/css/global.css`, `front/src/styles.css`, `front/src/pages/test.css`
- Modify: `front/src/App.css`, `front/src/components/CarouselImage.css`, `front/src/components/CarouselImage.js`, `front/src/pages/Fundraiser.css`, `front/src/pages/Showcase.css`
- Modify: `docs/decisions/0004-deferred-findings.md`

**Interfaces:**
- Consumes: `front/scripts/css-digest.js` and the baseline from Task 5.
- Produces: a smaller stylesheet surface for Tasks 7, 8 and 9 to work on.

- [ ] **Step 1: Prove the three files are unreachable**

```bash
cd front && grep -rn "global.css\|styles.css\|test.css" src public
```

Expected: **no output**. Nothing imports them, nothing links them. Cross-check against the list of imports that do exist:

```bash
cd front && grep -rn "\.css'" src --include=*.js | wc -l
```

Expected: `15`.

- [ ] **Step 2: Delete them**

```bash
git rm front/src/assets/css/global.css front/src/styles.css front/src/pages/test.css
```

That is 979 lines, 45.8% of all the CSS in the repository.

- [ ] **Step 3: Verify the built stylesheet did not move at all**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "IDENTICAL"
```

Expected: `IDENTICAL`, with an empty diff. Files that were never imported cannot affect the bundle, and this is the proof.

If the diff is not empty, one of them *was* reachable — restore it, find the importer, and start again.

- [ ] **Step 4: Delete the five unreachable rule blocks**

In `front/src/App.css`, remove `.App` from the selector list on line 16:

```css
#root, main {
  display: block;
  width: 100%;
}
```

The markup uses `className='content'` (`App.js:22`); there is no `.App` element anywhere.

In `front/src/components/CarouselImage.css`, delete both blocks at lines 41-56 — `.carousel-bottom-text` and `.carousel-bottom-text .text`. In `front/src/components/CarouselImage.js`, delete the commented-out markup at lines 9-11 and the now-unused `bottomText` prop from the destructuring on line 4:

```jsx
const CarouselImage = ({ imageSrc, altText, isActive }) => {
  return (
    <div className={`carousel-image-wrapper ${isActive ? 'active' : ''}`}>
      <img src={imageSrc} alt={altText} className="carousel-image active" />
      <div className="carousel-top-text"></div>
    </div>
  );
};
```

In `front/src/pages/Fundraiser.css`, remove `.learn-btn` from the grouped selector on line 74 and delete both `.learn-btn` blocks at lines 93-102:

```css
.donate-btn {
  padding: 12px 25px;
  border: none;
  margin: 10px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 25px;
  transition: transform 0.3s ease;
  background-color: #ff5733;
  color: #fff;
}
```

Note that the two `.donate-btn` blocks merge into one here. Leave the colours alone — Task 11 changes them.

In `front/src/pages/Showcase.css`, delete `.showcase-span` at lines 15-18.

- [ ] **Step 5: Verify the diff contains only what you deleted**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt -
```

Expected: only `<` lines — nothing added — and every one of them names `.App`, `.carousel-bottom-text`, `.carousel-bottom-text .text`, `.learn-btn`, `.learn-btn:hover` or `.showcase-span`. Count them:

```bash
cd front && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - | grep -c '^<'
```

Expected: **27**, distributed exactly like this:

| Selector | Lines removed |
|---|---|
| `.App` | 2 |
| `.carousel-bottom-text` | 7 |
| `.carousel-bottom-text .text` | 4 |
| `.learn-btn` | 10 (7 inherited from the grouped rule, 3 of its own) |
| `.learn-btn:hover` | 2 |
| `.showcase-span` | 2 |

Check the distribution, not just the total:

```bash
cd front && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - \
  | grep '^<' | cut -d'|' -f2 | sort | uniq -c
```

If a line names any other selector, you deleted too much — the `.donate-btn` declarations that used to share a rule with `.learn-btn` must all survive.

- [ ] **Step 6: Refresh the baseline and run the suite**

```bash
cd front && node scripts/css-digest.js build/static/css > /tmp/css-baseline.txt
CI=true npx react-scripts test --watchAll=false
```

Expected: 3 suites, 22 tests, all pass. The carousel test asserts `.carousel-image` and `.indicator` counts, neither of which you touched.

- [ ] **Step 7: Record the number in the ADR**

Add to `docs/decisions/0002-one-definition-per-idea-in-css.md`: 979 of 2,139 CSS lines were unreachable, and the digest was byte-identical before and after their removal.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(css): delete three unimported stylesheets and five unreachable rules"
```

### Task 7: One definition of each animation

**Files:**
- Create: `front/src/assets/css/animations.css`
- Modify: `front/src/index.js`
- Modify: `front/src/pages/Fundraiser.css`, `front/src/pages/AboutUs.css`, `front/src/pages/Blog.css`, `front/src/pages/Contact.css`, `front/src/pages/Testimonials.css`

**Interfaces:**
- Consumes: the digest baseline refreshed at the end of Task 6.
- Produces: `front/src/assets/css/animations.css`, the only place a `@keyframes` may be declared from now on.

- [ ] **Step 1: See the collision for yourself**

```bash
cd front
grep -rn "@keyframes" src/pages src/components
grep -c "translateX(-100px)" build/static/css/main.*.css
```

Expected: six `@keyframes` declarations across five files — `slideInLeft` four times, `slideInRight` twice, `popIn`, `pulse`, `scrollLeft`, `scrollRight` once each — and `0` occurrences of `translateX(-100px)` in the build.

That zero is the finding. `Fundraiser.css`, `AboutUs.css` and `Blog.css` each define `slideInLeft` as a 100-**pixel** slide, `Contact.css` defines it as a 100-**percent** slide, and only one definition survives the build: Contact's. Three stylesheets are written against an animation that never runs.

- [ ] **Step 2: Create the single source**

Create `front/src/assets/css/animations.css`:

```css
/* Every @keyframes in this application. Nothing else may declare one.
 *
 * Before this file existed, slideInLeft was declared four times and
 * slideInRight twice, in different stylesheets and with different distances.
 * A name can only mean one thing in the final bundle, so the last declaration
 * silently won for every user of the name. The values below are that winner —
 * the ones that were already running in production — so consolidating them
 * changes nothing. */

@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(230, 57, 70, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(230, 57, 70, 0.7);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(230, 57, 70, 0.5);
  }
}

@keyframes scrollLeft {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes scrollRight {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}
```

- [ ] **Step 3: Import it once, first**

In `front/src/index.js`, add the import above `./index.css`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/animations.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
```

- [ ] **Step 4: Delete the six now-duplicate declarations**

- `front/src/pages/Fundraiser.css`: delete `@keyframes slideInLeft` (lines 159-168), `@keyframes slideInRight` (169-178) and `@keyframes pulse` (179-192).
- `front/src/pages/AboutUs.css`: delete `@keyframes slideInLeft` (lines 151-160) and the `/* Slide-in Animations */` comment above it.
- `front/src/pages/Blog.css`: delete `@keyframes slideInLeft` (lines 151-160) and the comment above it.
- `front/src/pages/Contact.css`: delete `@keyframes slideInLeft` (86-95), `@keyframes slideInRight` (98-107) and `@keyframes popIn` (110-126), with their comments.
- `front/src/pages/Testimonials.css`: delete `@keyframes scrollLeft` (74-81) and `@keyframes scrollRight` (88-95).

Confirm none survive outside the new file:

```bash
cd front && grep -rn "@keyframes" src --include=*.css
```

Expected: six hits, all in `src/assets/css/animations.css`.

- [ ] **Step 5: Verify the built stylesheet is unchanged**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "IDENTICAL"
```

Expected: `IDENTICAL`. This is the whole point of the task: the bundle already contained exactly one `slideInLeft`, and it was already the `-100%` one, so writing that down explicitly changes nothing that ships. What it changes is that the next person reading `AboutUs.css` will no longer believe the title slides 100 pixels.

If the diff is not empty, you copied the wrong variant. Read the diff, take the value the baseline holds, and correct `animations.css` — never the baseline.

- [ ] **Step 6: Run the suite**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`
Expected: 3 suites, 22 tests, all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(css): give every animation exactly one definition"
```

### Task 8: One definition of each design token

**Files:**
- Create: `front/src/assets/css/tokens.css`
- Modify: `front/src/index.js`, `front/src/App.css`
- Modify: `front/src/components/Carousel.css`, `front/src/components/CarouselImage.css`, `front/src/components/Header.css`, `front/src/components/Navbar.css`
- Modify: `front/src/pages/AboutUs.css`, `front/src/pages/Blog.css`, `front/src/pages/Contact.css`, `front/src/pages/Fundraiser.css`, `front/src/pages/Testimonials.css`

**Interfaces:**
- Consumes: the digest baseline, which resolves `var()` from `:root` and therefore treats a literal and its token as the same value.
- Produces: `front/src/assets/css/tokens.css`, the only place a `:root` custom property may be declared.

- [ ] **Step 1: Count what you are about to replace**

```bash
cd front && grep -rn "#fff\b\|#ffffff\|: white\|background-color: white" src --include=*.css
```

Expected: **15 hits**, plus the `--colorwhite: white` declaration itself in `App.css`. They break down as `#fff` nine times, `white` five, `#ffffff` once, across `Carousel.css`, `CarouselImage.css`, `Header.css`, `Navbar.css`, `AboutUs.css`, `Blog.css`, `Contact.css`, `Fundraiser.css` and `Testimonials.css`. Meanwhile `var(--colorwhite)` is already used 10 times. One colour, four spellings.

The survey counted 19. Task 6 removed four of them along with the `.learn-btn` and `.carousel-bottom-text .text` rules that held them, which is why the number is lower here.

- [ ] **Step 2: Create the token file**

Create `front/src/assets/css/tokens.css`, moving the `@import` and the `:root` block out of `App.css` unchanged apart from the two deletions noted in the comments:

```css
/* The web font and every design token, in one place. Nothing else may declare
 * a :root custom property.
 *
 * The @import must stay at the top of a stylesheet to be valid CSS. Webpack
 * hoists it to the top of the concatenated bundle, but keeping it first here
 * means the source says what the output does. */
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

:root {
  /* Brand palette. Values unchanged from the block that used to live in
   * App.css. --color4 and --color5 were declared there and used nowhere, so
   * they are not carried over. */
  --color1: #93441a;
  --color2: rgb(182, 115, 50);
  --color3: rgb(218, 171, 58);
  --colorwhite: white;
  --colorblack: black;

  /* Typography. --font2 names Quintessential, whose @font-face import is
   * commented out at the top of the old App.css, so it resolves to the
   * sans-serif fallback. It is kept because removing it would change what
   * .carousel-top-text renders in; see docs/decisions/0004-deferred-findings.md. */
  --font1: 'Poppins', sans-serif;
  --font2: 'Quintessential', sans-serif;

  /* Borders. Written out identically in Header.css and Contact.css. */
  --border-subtle: 1px solid #ccc;
}
```

- [ ] **Step 3: Import it first, and strip `App.css`**

In `front/src/index.js`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/tokens.css';
import './assets/css/animations.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
```

Then delete lines 1-14 of `front/src/App.css` — the `@import`, the commented-out second `@import`, and the whole `:root` block. `App.css` now starts at `#root, main {`.

- [ ] **Step 4: Replace every white literal with the token**

Apply these exact substitutions. They are keyed by selector rather than by line number, because Tasks 6 and 7 have already shifted the line numbers in five of these files.

| File | Selector | From | To |
|---|---|---|---|
| `components/Carousel.css` | `.arrow` | `color: white;` | `color: var(--colorwhite);` |
| `components/CarouselImage.css` | `.carousel-top-text` | `color: white;` | `color: var(--colorwhite);` |
| `components/Header.css` | `.language-select` | `background-color: white;` | `background-color: var(--colorwhite);` |
| `components/Navbar.css` | `.dropdown-content` | `background-color: white;` | `background-color: var(--colorwhite);` |
| `pages/AboutUs.css` | `.our-team .title` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/AboutUs.css` | `.our-team .post` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/AboutUs.css` | `.our-team .description` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/AboutUs.css` | `.our-team .social-links li a` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/Blog.css` | `.blog-card` | `background-color: #fff;` | `background-color: var(--colorwhite);` |
| `pages/Blog.css` | `.modal-content` | `background-color: #fff;` | `background-color: var(--colorwhite);` |
| `pages/Contact.css` | `.contact-form button` | `color: white;` | `color: var(--colorwhite);` |
| `pages/Fundraiser.css` | `#fundraiser` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/Fundraiser.css` | `.donate-btn` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/Fundraiser.css` | `.fixed-donate-btn` | `color: #fff;` | `color: var(--colorwhite);` |
| `pages/Testimonials.css` | `.testimonial-card` | `background-color: #ffffff;` | `background-color: var(--colorwhite);` |

Then replace the two blacks, both in `components/Navbar.css`:

| Selector | From | To |
|---|---|---|
| `.navbar` | `color: black;` | `color: var(--colorblack);` |
| `.menu button` | `color: black;` | `color: var(--colorblack);` |

And the two identical borders:

| File | Selector | From | To |
|---|---|---|---|
| `components/Header.css` | `.language-select` | `border: 1px solid #ccc;` | `border: var(--border-subtle);` |
| `pages/Contact.css` | `.contact-form input, .contact-form textarea` | `border: 1px solid #ccc;` | `border: var(--border-subtle);` |

Leave `Blog.css:85` and `Testimonials.css:111,116` alone — those are `white` and `#f9f9f9` inside `linear-gradient()`, and one of them is not white at all.

Confirm nothing was missed:

```bash
cd front && grep -rn "#fff\b\|#ffffff\|: white;\|: black;\|1px solid #ccc" src --include=*.css | grep -v "assets/css/tokens.css"
```

Expected: only the `linear-gradient` lines in `Blog.css` and `Testimonials.css`.

- [ ] **Step 5: Verify the built stylesheet is unchanged**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "IDENTICAL"
```

Expected: `IDENTICAL`.

This works because the digest resolves `var()` from `:root` before comparing, and because the CSS minifier normalises `white`, `#fff` and `#ffffff` to the same output. A literal replaced by a token holding the same value is therefore genuinely invisible here — which is exactly the claim the task is making.

If a line differs, read it: you have replaced a literal with a token whose value is *not* the same. Fix the substitution, never the baseline.

- [ ] **Step 6: Run the suite**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`
Expected: 3 suites, 22 tests, all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(css): move the tokens into one file and use them"
```

### Task 9: One definition of the section shell and the section title

**Files:**
- Create: `front/src/assets/css/sections.css`
- Modify: `front/src/index.js`
- Modify: `front/src/pages/AboutUs.css`, `front/src/pages/Blog.css`, `front/src/pages/Contact.css`, `front/src/pages/Showcase.css`, `front/src/pages/Testimonials.css`

**Interfaces:**
- Consumes: `var(--colorwhite)` from Task 8.
- Produces: `front/src/assets/css/sections.css`. No JSX changes at all — the shared rules use grouped selectors on the ids and classes that already exist, so the digest can prove the result identical.

- [ ] **Step 1: Confirm the duplication**

```bash
cd front && grep -c "min-height: fit-content" src/pages/*.css
cd front && grep -c "font-size: 3rem" src/pages/*.css
```

Expected: `min-height: fit-content` in five files (`AboutUs`, `Blog`, `Contact`, `Showcase`, `Testimonials`), `font-size: 3rem` in five (the four titles plus `.fundraiser-content h1`, which is not part of this group).

`#about-us` and `#contact` are identical for twelve consecutive declarations; `.about-title` and `.blog-title` are byte-identical apart from the selector.

- [ ] **Step 2: Create the shared file**

Create `front/src/assets/css/sections.css`:

```css
/* The declarations every page section shares.
 *
 * These use grouped selectors on the ids and classes the markup already has,
 * rather than new utility classes, for one reason: it keeps the JSX untouched,
 * which lets scripts/css-digest.js prove that the built stylesheet is
 * byte-identical before and after. A new class name would change the
 * selectors and make that proof impossible.
 *
 * Anything a single section needs on top of this — #blog and #contact each
 * pin a height, #testimonials centres its text — stays in that section's own
 * stylesheet. */

#about-us,
#blog,
#contact,
#showcase,
#testimonials {
  position: relative;
  width: 100%;
  min-height: fit-content;
  background: var(--colorwhite);
  margin: 0;
  padding: 0;
}

#about-us,
#contact,
#testimonials {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: center;
  justify-content: flex-start;
}

#about-us,
#contact {
  overflow-x: hidden;
}

.about-title,
.blog-title,
.contact-title,
.testimonials-title {
  margin: 15px 0;
  padding: 0;
  font-size: 3rem;
  text-align: center;
}
```

`#showcase` is deliberately not in the second group: it uses `align-items: center` rather than `flex-wrap`/`align-content`, so its flex declarations stay in `Showcase.css`.

- [ ] **Step 3: Import it after the tokens**

In `front/src/index.js`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/tokens.css';
import './assets/css/animations.css';
import './assets/css/sections.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
```

- [ ] **Step 4: Delete the moved declarations from the five page stylesheets**

`front/src/pages/AboutUs.css` — `#about-us` and `.about-title` become:

```css
#about-us {
}

.about-title {
  animation: slideInLeft 1s ease-out;
}
```

Delete the now-empty `#about-us` rule entirely.

`front/src/pages/Blog.css`:

```css
#blog {
  height: 600px;
}

.blog-title {
  animation: slideInLeft 1s ease-out;
}
```

`front/src/pages/Contact.css`:

```css
#contact {
  height: 600px;
}

.contact-title {
  opacity: 1;
  transform: translateX(-100%);
}
```

`front/src/pages/Showcase.css`:

```css
#showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
```

`front/src/pages/Testimonials.css`:

```css
#testimonials {
  text-align: center;
  overflow: hidden;
}

.testimonials-title {
}
```

Delete the now-empty `.testimonials-title` rule entirely.

- [ ] **Step 5: Verify the built stylesheet is unchanged**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "IDENTICAL"
```

Expected: `IDENTICAL`. The digest splits grouped selectors into one line per selector, so `#about-us, #blog, ... { position: relative }` produces the same five lines the five separate rules did.

If a line is missing, you deleted a declaration that was not in the shared file — most likely `#testimonials`'s `text-align: center` or `#showcase`'s `align-items`. Put it back in the page stylesheet.

If a line is *added*, a shared rule reached a selector that did not have it before — check that `#showcase` is not in the flex group.

- [ ] **Step 6: Count what the file removed**

```bash
cd front && git diff --stat -- src/pages
```

Expected: five stylesheets shrink. `sections.css` holds **16 declarations**, and they replace **63 occurrences** in the page files:

| Group | Declarations | Selectors | Occurrences replaced |
|---|---|---|---|
| section shell | 6 | 5 | 30 |
| section flex layout | 5 | 3 | 15 |
| `overflow-x` | 1 | 2 | 2 |
| section title | 4 | 4 | 16 |
| | **16** | | **63** |

- [ ] **Step 7: Run the suite**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`
Expected: 3 suites, 22 tests, all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(css): collapse the repeated section shell and title rules"
```

### Task 10: Delete dead JavaScript and lift the carousel content out of the component

**Files:**
- Delete: `front/src/components/TourCard.js`, `front/src/logo.svg`, `front/src/assets/images/bike-horse-logo.png`, `front/src/assets/images/biking-tour.jpg`, `front/src/assets/images/home-banner.jpg`, `front/src/assets/images/horse-riding.jpg`
- Create: `front/src/assets/data/carouselSlides.js`
- Modify: `front/src/App.js`, `front/src/components/Carousel.js`, `front/src/pages/Fundraiser.js`
- Modify: `front/src/assets/locales/en.json`, `fr.json`, `de.json`
- Modify: `docs/decisions/0004-deferred-findings.md`

**Interfaces:**
- Consumes: `LanguageContext` from `front/src/context/LanguageContext.js`.
- Produces: `carouselSlides`, an array of `{ src, altKey }` where `altKey` names a key in the locale files. Task 11 uses the same context in `Carousel` for the indicator labels.

- [ ] **Step 1: Prove `TourCard` is unreachable**

```bash
cd front && grep -rn "TourCard" src
```

Expected: only the two lines inside `src/components/TourCard.js` itself. It is also the only importer of `react-router-dom`:

```bash
cd front && grep -rn "react-router" src
```

Expected: only `src/components/TourCard.js:2`.

Delete it:

```bash
git rm front/src/components/TourCard.js
```

Leave `react-router-dom` in `package.json`. Removing a dependency is Task 12's job, and this repository has no router to remove it from safely in the same commit as a component deletion.

- [ ] **Step 2: Delete the unreferenced assets**

```bash
cd front && for f in logo.svg assets/images/bike-horse-logo.png assets/images/biking-tour.jpg assets/images/home-banner.jpg assets/images/horse-riding.jpg; do
  echo "== $f"; grep -rn "$(basename "$f")" src public | grep -v "^Binary" || echo "   unreferenced"
done
```

Expected: all five report `unreferenced`. Then:

```bash
git rm front/src/logo.svg \
       front/src/assets/images/bike-horse-logo.png \
       front/src/assets/images/biking-tour.jpg \
       front/src/assets/images/home-banner.jpg \
       front/src/assets/images/horse-riding.jpg
```

Do **not** delete `hero-banner.jpeg` — `Fundraiser.css:6` uses it — nor `farm-in-tuscany.jpg`, `bike-tour-tuscany.jpg` or `horse-riding-tuscany.jpg`, which the carousel uses.

- [ ] **Step 3: Remove the three build warnings**

In `front/src/App.js`, delete the two unused imports on lines 9-10:

```jsx
import Fundraiser from './pages/Fundraiser';
import Showcase from './pages/Showcase';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import Testimonials from './pages/Testimonial';
import Contact from './pages/Contact';
```

Leave the commented-out `{/* <BikingTour /> */}` and `{/* <HorseRiding /> */}` lines and both component files where they are — they record an intent to re-enable those sections, and deleting them would discard planned pages. This is recorded in `docs/decisions/0004-deferred-findings.md`.

In `front/src/pages/Fundraiser.js:9`, drop the unused setter:

```jsx
  const raised = 1500; // Amount raised so far
  const goal = 10000; // Fundraising goal
```

Delete `useState` from the import on line 1 if nothing else in the file uses it — `showFixedButton` does, so keep it.

- [ ] **Step 4: Verify the build is now warning-free**

```bash
cd front && npm run build 2>&1 | grep -i "warning\|no-unused-vars" || echo "NO WARNINGS"
```

Expected: `NO WARNINGS`. That matters beyond tidiness: Create React App turns warnings into build errors whenever `CI` is set, so this is what makes it safe to add `CI=true` to a build step later.

- [ ] **Step 5: Add the new locale keys and drop the dead ones**

In `front/src/assets/locales/en.json`, delete `headerTitle_old`, `fundraiserTitle_old` and `fundraiserText_old`, and add:

```json
  "carouselAltFarm": "The farmhouse and its grounds in Tuscany",
  "carouselAltBike": "A guided bike tour through the Tuscan hills",
  "carouselAltHorse": "Horse riding on the trails around the farm",
```

In `front/src/assets/locales/fr.json`, delete the same three keys and add:

```json
  "carouselAltFarm": "La ferme et son domaine en Toscane",
  "carouselAltBike": "Une randonnée à vélo guidée dans les collines toscanes",
  "carouselAltHorse": "Balade à cheval sur les sentiers autour de la ferme",
```

In `front/src/assets/locales/de.json`, delete the same three keys and add:

```json
  "carouselAltFarm": "Der Bauernhof und sein Gelände in der Toskana",
  "carouselAltBike": "Eine geführte Radtour durch die toskanischen Hügel",
  "carouselAltHorse": "Ausritt auf den Wegen rund um den Bauernhof",
```

Confirm the three files stay in parity:

```bash
cd front && node -e "
const k = (l) => Object.keys(require('./src/assets/locales/' + l + '.json')).sort();
const [en, fr, de] = ['en','fr','de'].map(k);
console.log('counts', en.length, fr.length, de.length);
console.log('identical key sets:', JSON.stringify(en) === JSON.stringify(fr) && JSON.stringify(en) === JSON.stringify(de));
"
```

Expected: `counts 28 28 28` and `identical key sets: true` — three keys removed, three added.

- [ ] **Step 6: Create the data module**

Create `front/src/assets/data/carouselSlides.js`:

```js
import farmImage from '../images/farm-in-tuscany.jpg';
import bikeImage from '../images/bike-tour-tuscany.jpg';
import horseImage from '../images/horse-riding-tuscany.jpg';

// The slides the showcase carousel cycles through.
//
// `altKey` names a key in src/assets/locales/<lang>.json rather than holding
// the text itself, so the alternative text is translated along with the rest of
// the site. Before this module existed the alt text was the string "Image 1",
// hard-coded in English inside the component.
export const carouselSlides = [
  { src: farmImage, altKey: 'carouselAltFarm' },
  { src: bikeImage, altKey: 'carouselAltBike' },
  { src: horseImage, altKey: 'carouselAltHorse' },
];
```

- [ ] **Step 7: Rewrite the top of `Carousel.js` to use it**

Replace lines 1-15 of `front/src/components/Carousel.js`:

```jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import './Carousel.css';
import CarouselImage from './CarouselImage.js';

import { carouselSlides } from '../assets/data/carouselSlides';
import { LanguageContext } from '../context/LanguageContext';

const Carousel = () => {
  const { texts } = useContext(LanguageContext);
  const images = carouselSlides;
```

Then update the render at lines 63-71 so the alternative text comes from the locale:

```jsx
        {images.map((image, index) => (
          <CarouselImage
            key={image.altKey}
            imageSrc={image.src}
            altText={texts[image.altKey]}
            isActive={index === currentIndex}
          />
        ))}
```

The `bottomText` prop is gone — Task 6 removed the markup that consumed it. The `key` moves from the array index to `altKey`, which is stable.

- [ ] **Step 8: Verify the alternative text is now real and translated**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 3 suites, 22 tests, all pass. The carousel test counts `.carousel-image` elements and does not read `alt`, which is why it survives.

Then check the new text is actually reaching the DOM:

```bash
cd front && grep -rn "Image 1\|Image 2\|Image 3" src || echo "NO PLACEHOLDER ALT TEXT LEFT"
```

Expected: `NO PLACEHOLDER ALT TEXT LEFT`.

- [ ] **Step 9: Confirm the stylesheet did not move**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "IDENTICAL"
```

Expected: `IDENTICAL`. This task touches no CSS, so any diff means something else changed by accident.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: delete dead code and move the carousel's content into a data module"
```

### Task 11: Accessibility baseline

A deliberate behaviour change, so every test here asserts the corrected behaviour and fails before the fix. None of it is pinned by a characterization test — the same reasoning Spec D8 applies to security defects applies here: a characterization test that pinned five `<h1>` elements would make the deploy gate defend them.

**Files:**
- Create: `front/src/Accessibility.test.js`
- Modify: `front/src/components/Header.js`, `front/src/components/Navbar.js`, `front/src/components/Navbar.css`, `front/src/components/Carousel.js`, `front/src/components/Carousel.css`
- Modify: `front/src/pages/Fundraiser.js`, `front/src/pages/Fundraiser.css`, `front/src/pages/AboutUs.js`, `front/src/pages/Blog.js`, `front/src/pages/Blog.css`, `front/src/pages/Contact.js`, `front/src/pages/Contact.css`, `front/src/pages/Testimonial.js`
- Modify: `front/src/assets/locales/en.json`, `fr.json`, `de.json`
- Modify: `docs/decisions/0004-deferred-findings.md`

**Interfaces:**
- Consumes: `LanguageContext`, already wired into `Carousel` by Task 10.
- Produces: three new locale keys — `languageLabel`, `menuToggle`, `carouselSlide` — and one accessible name convention for the social links.

- [ ] **Step 1: Add the three locale keys**

`en.json`:

```json
  "languageLabel": "Language",
  "menuToggle": "Menu",
  "carouselSlide": "Slide",
```

`fr.json`:

```json
  "languageLabel": "Langue",
  "menuToggle": "Menu",
  "carouselSlide": "Diapositive",
```

`de.json`:

```json
  "languageLabel": "Sprache",
  "menuToggle": "Menü",
  "carouselSlide": "Bild",
```

Re-run the parity check from Task 10 Step 5. Expected: `counts 31 31 31`, `identical key sets: true`.

- [ ] **Step 2: Write the failing tests**

Create `front/src/Accessibility.test.js`:

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

// These tests assert corrected behaviour, not current behaviour. Every one of
// them fails before the fixes in this task, which is the point: a
// characterization test that pinned five <h1> elements would make the deploy
// gate defend them.

const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
];

const ORIGINAL_WIDTH = window.innerWidth;

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  window.innerWidth = ORIGINAL_WIDTH;
});

async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('heading structure', () => {
  it('has exactly one level-one heading', async () => {
    await renderApp();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to La Ferme');
  });

  it('titles every section with a level-two heading', async () => {
    await renderApp();
    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(titles).toEqual(
      expect.arrayContaining([
        'Help Us Save La Ferme',
        'About Us',
        'Contact',
        'Latest News',
        'What People Say',
      ]),
    );
  });
});

describe('controls are real controls', () => {
  it('exposes the mobile menu toggle as a button that reports its state', async () => {
    window.innerWidth = 500;
    await renderApp();

    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('exposes each carousel indicator as a named button', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Slide 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide 3' })).toBeInTheDocument();
  });

  it('exposes each news card as a button naming its article', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: /New Hiking Trails Open!/ })).toBeInTheDocument();
  });
});

describe('everything interactive has an accessible name', () => {
  it('names the language selector', async () => {
    await renderApp();
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
  });

  it('names every contact field', async () => {
    await renderApp();
    expect(screen.getByLabelText('Your Name')).toHaveAttribute('name', 'name');
    expect(screen.getByLabelText('Your Email')).toHaveAttribute('name', 'email');
    expect(screen.getByLabelText('Your Message')).toHaveAttribute('name', 'message');
  });

  it('names every social link', async () => {
    await renderApp();
    expect(screen.getByRole('link', { name: 'Emma Carter – Twitter' })).toHaveAttribute(
      'href',
      'https://twitter.com/emmafarmlife',
    );
    expect(screen.getByRole('link', { name: 'Emma Carter – LinkedIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Emma Carter – Facebook' })).toBeInTheDocument();
  });

  it('describes each carousel image in the visitor’s language', async () => {
    await renderApp();
    expect(
      screen.getByAltText('The farmhouse and its grounds in Tuscany'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'fr' },
    });

    expect(await screen.findByAltText('La ferme et son domaine en Toscane')).toBeInTheDocument();
  });
});

describe('the article modal', () => {
  it('is announced as a dialog naming its article', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /New Hiking Trails Open!/ }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('New Hiking Trails Open!');
  });

  it('closes on Escape', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /New Hiking Trails Open!/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('React receives valid DOM props', () => {
  it('renders the fixed donate wrapper without a lower-case class prop', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = await renderApp();

    expect(container.querySelector('.fixed-donate-btn-wrapper')).not.toBeNull();
    const complaints = spy.mock.calls
      .map((args) => String(args[0]))
      .filter((message) => message.includes('Invalid DOM property'));
    expect(complaints).toEqual([]);
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `cd front && CI=true npx react-scripts test --watchAll=false --testPathPattern=Accessibility`

Expected: **FAIL**, with roughly twelve failures. Read them; each one names a defect from the survey table. The three characterization suites must still pass — run the whole thing to confirm the new file did not break them.

- [ ] **Step 4: One `h1`, four `h2`s**

`front/src/pages/Fundraiser.js:43` — `<h1>{texts.fundraiserTitle}</h1>` becomes `<h2>{texts.fundraiserTitle}</h2>`.

`front/src/pages/AboutUs.js:40` — `<h1 className={...}>` becomes `<h2 className={...}>`.

`front/src/pages/Contact.js:31` — `<h1 className="contact-title">` becomes `<h2 className="contact-title">`.

`front/src/pages/Testimonial.js:23` — `<h1 className='testimonials-title'>` becomes `<h2 className="testimonials-title">`.

`front/src/components/Header.js:14` keeps its `<h1>`; it is the page's name and the only level-one heading left.

One stylesheet follows: `front/src/pages/Fundraiser.css:35` selects by element, not by class.

```css
.fundraiser-content h2 {
  font-size: 3rem;
  margin-bottom: 15px;
  animation: slideInLeft 1s ease-out;
}
```

The other three titles are styled by class and need no change. `AboutUs.js`'s per-person `<h3 className="title">` is now correctly one level below its section heading instead of two.

- [ ] **Step 5: Make the hamburger a real button**

In `front/src/components/Navbar.js`, replace lines 152-155:

```jsx
          {/* Hamburger icon */}
          <button
            type="button"
            className="toggle"
            aria-label={texts.menuToggle}
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            {menuOpen ? '✖' : '☰'}
          </button>
```

In `front/src/components/Navbar.css`, extend `.toggle` at line 67 so the button looks exactly like the `<div>` did:

```css
.toggle {
  font-size: 30px;
  cursor: pointer;
  display: none;

  /* The element used to be a <div>. These four declarations strip the
     button defaults so nothing about it looks different. */
  border: none;
  background: none;
  color: inherit;
  padding: 0;
}
```

- [ ] **Step 6: Make the carousel indicators real buttons**

In `front/src/components/Carousel.js`, replace the indicator loop at lines 86-92:

```jsx
        {images.map((image, index) => (
          <button
            type="button"
            key={image.altKey}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            aria-label={`${texts.carouselSlide} ${index + 1}`}
            aria-current={index === currentIndex}
            onClick={() => goToSlide(index)}
          />
        ))}
```

In `front/src/components/Carousel.css`, extend `.indicator` at line 57:

```css
.indicator {
  width: 12px;
  height: 12px;
  margin: 0 5px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;

  /* Was a <span>. These strip the button defaults. */
  border: none;
  padding: 0;
}
```

- [ ] **Step 7: Make the news card a real button**

In `front/src/pages/Blog.js`, replace the card at lines 42-49:

```jsx
          <button
            type="button"
            key={post.id}
            className="blog-card"
            onClick={() => setSelectedPost(post)}
          >
            <img src={post.image} alt={post.title} className="blog-image" />
            <div className="blog-info">
              <h3>{post.title}</h3>
              <p><i>{post.date}</i></p>
              <p className="blog-preview">{post.content.slice(0, 100)}...</p>
            </div>
          </button>
```

In `front/src/pages/Blog.css`, extend `.blog-card` at line 29:

```css
.blog-card {
  display: flex;
  background-color: var(--colorwhite);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s;
  width: 30%;
  min-width: 250px;
  max-width: 350px;

  /* Was a <div>. These strip the button defaults so the card is unchanged. */
  border: none;
  padding: 0;
  text-align: left;
  font: inherit;
  color: inherit;
}
```

- [ ] **Step 8: Give the modal a role and an Escape key**

In `front/src/pages/Blog.js`, add an effect after the existing `IntersectionObserver` effect:

```jsx
  // Escape closes the article. Without this the only way out is the mouse,
  // which strands a keyboard user inside the overlay.
  useEffect(() => {
    if (!selectedPost) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedPost(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedPost]);
```

and give the modal its role at line 54:

```jsx
        <div className="modal" onClick={() => setSelectedPost(null)}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPost.title}
            onClick={(e) => e.stopPropagation()}
          >
```

This does not add a focus trap and does not restore focus on close. That is recorded in `docs/decisions/0004-deferred-findings.md`, because a correct trap is a component of its own and this task is a baseline, not a complete implementation.

- [ ] **Step 9: Name the language selector and the form fields**

In `front/src/components/Header.js`, add the label to the `<select>` at line 17:

```jsx
        <select
          className="language-select"
          aria-label={texts.languageLabel}
          value={language}
          onChange={(e) => toggleLanguage(e.target.value)}
        >
```

In `front/src/pages/Contact.js`, replace the three fields at lines 34-36:

```jsx
        <input type="text" name="name" aria-label={texts.contactName} placeholder={texts.contactName} required />
        <input type="email" name="email" aria-label={texts.contactEmail} placeholder={texts.contactEmail} required />
        <textarea name="message" aria-label={texts.contactMsg} placeholder={texts.contactMsg} required></textarea>
```

`aria-label` rather than a visible `<label>` is chosen deliberately: it gives every field an accessible name without adding any visible element, so the layout is untouched. The `name` attributes are added because a field without one contributes nothing to a submission — which matters the day the form gets the destination `docs/decisions/0003-contact-form-has-no-destination.md` says it needs.

- [ ] **Step 10: Name the social links**

In `front/src/pages/AboutUs.js`, replace lines 52-56:

```jsx
              <ul className="social-links">
                <li>
                  <a href={person.socialLinks.twitter} aria-label={`${person.name} – Twitter`}>
                    <FontAwesomeIcon icon={faTwitter} />
                  </a>
                </li>
                <li>
                  <a href={person.socialLinks.linkedin} aria-label={`${person.name} – LinkedIn`}>
                    <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                </li>
                <li>
                  <a href={person.socialLinks.facebook} aria-label={`${person.name} – Facebook`}>
                    <FontAwesomeIcon icon={faFacebook} />
                  </a>
                </li>
              </ul>
```

`FontAwesomeIcon` renders its `<svg>` with `aria-hidden="true"`, so before this change each of these twelve links had no accessible name at all — a screen reader announced twelve anonymous links. The platform names are proper nouns and are not translated.

- [ ] **Step 11: Fix the invalid DOM property**

In `front/src/pages/Fundraiser.js:59`, `class` becomes `className`:

```jsx
      <div className={`fixed-donate-btn-wrapper ${showFixedButton ? 'show' : ''}`}>
```

React 19 passes an unrecognised `class` attribute through to the DOM, so the styling has been working — but it logs `Invalid DOM property 'class'` on every render, and any future React version is free to stop passing it. This is a correctness fix with no visual effect.

- [ ] **Step 12: Run the accessibility suite and watch it pass**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 4 suites, all pass. The three characterization suites must still be green **unchanged** — that is what proves these fixes did not alter what the page renders. In particular `Navbar.test.js`'s narrow-viewport tests still query `container.querySelector('.toggle')`, which matches the `<button>` just as it matched the `<div>`.

If a characterization test now fails, read it before touching it. A failure there means an accessibility fix changed behaviour it should not have.

- [ ] **Step 13: Raise the three call-to-action colours to WCAG AA**

Measured with the WCAG relative-luminance formula, against the white text each button carries:

| Element | Before | Ratio | After | Ratio |
|---|---|---|---|---|
| `.donate-btn` background | `#ff5733` | 3.15:1 | `#c2410c` | 5.18:1 |
| `.fixed-donate-btn` background | `#e63946` | 4.17:1 | `#c0392b` | 5.44:1 |
| `.fixed-donate-btn:hover` background | `#d62828` | — | `#9a3412` | 7.31:1 |
| `.contact-form button` background | `var(--color2)` = `rgb(182,115,50)` | 3.83:1 | `#8c5a2b` | 5.81:1 |
| `.contact-form button:hover` background | `#8c5a2b` | 5.81:1 | `#6f4722` | 8.02:1 |

`front/src/pages/Fundraiser.css`:

```css
.donate-btn {
  padding: 12px 25px;
  border: none;
  margin: 10px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 25px;
  transition: transform 0.3s ease;
  background-color: #c2410c;
  color: var(--colorwhite);
}
```

and

```css
.fixed-donate-btn {
  padding: 15px 25px;
  background-color: #c0392b;
  color: var(--colorwhite);
  font-size: 1rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

.fixed-donate-btn:hover {
  background-color: #9a3412;
  transform: scale(1.1);
}
```

`front/src/pages/Contact.css`:

```css
.contact-form button {
  padding: 10px 20px;
  width: 300px;
  margin: 0 auto;
  background-color: #8c5a2b;
  color: var(--colorwhite);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.contact-form button:hover {
  background-color: #6f4722;
}
```

Do **not** change `--color2` itself. It also colours the mobile menu background, where black text on it already measures 5.49:1, and the active carousel indicator. Changing the token would move three unrelated things to fix one.

- [ ] **Step 14: Verify the stylesheet diff is exactly the contrast change**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt -
```

Expected: a diff naming only `.donate-btn`, `.fixed-donate-btn`, `.fixed-donate-btn:hover`, `.contact-form button`, `.contact-form button:hover`, `.fundraiser-content h1` → `.fundraiser-content h2`, and the button-reset declarations added to `.toggle`, `.indicator` and `.blog-card`. Nothing else may appear.

Re-verify the numbers yourself rather than trusting the table:

```bash
node -e "
const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
const cr=(a,b)=>{const l1=lum(...a),l2=lum(...b),[h,l]=l1>l2?[l1,l2]:[l2,l1];return ((h+0.05)/(l+0.05)).toFixed(2)};
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
['#c2410c','#c0392b','#9a3412','#8c5a2b','#6f4722'].forEach(c=>console.log(c, cr(hex(c),[255,255,255])));
"
```

Expected: every value at or above 4.5.

Then refresh the baseline: `cd front && node scripts/css-digest.js build/static/css > /tmp/css-baseline.txt`

- [ ] **Step 15: Record what this task did not fix**

Append to `docs/decisions/0004-deferred-findings.md`: the modal has a dialog role and an Escape key but no focus trap and no focus restoration; the carousel auto-advances every three seconds with no pause control, which fails WCAG 2.2.2; and `.our-team .description` renders white text over `rgba(0,0,0,0.4)` laid on a photograph, so its contrast cannot be measured statically and needs a solid scrim to be guaranteed.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "a11y: one h1, real buttons, accessible names and AA contrast on every call to action"
```

### Task 12: Remove the dependencies nothing imports

Spec D5 puts security-motivated dependency work in scope, and it happens here — after the characterization suite is green, never before.

**Files:**
- Modify: `front/package.json`, `front/package-lock.json`
- Modify: `docs/decisions/0004-deferred-findings.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Prove `react-fontawesome` is unused**

```bash
cd front && grep -rn "react-fontawesome" src
```

Expected: exactly one line — `src/pages/AboutUs.js:2: import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`.

That import is the **scoped** package, `@fortawesome/react-fontawesome@0.2.6`. The unscoped `react-fontawesome@1.7.1` in `package.json` is a different package by a different author: a 2018 release built for the Font Awesome 4 CSS-class API, declaring `"react": ">=0.12.0"`, and pulling its own `prop-types` subtree. Nothing in this repository imports it. It has received no release, and therefore no security patch, in seven years.

- [ ] **Step 2: Prove `cra-template` is unused**

```bash
cd front && grep -rn "cra-template" src public
```

Expected: no output. `cra-template@1.2.0` is the scaffolding `create-react-app` reads once, at generation time. Listing it as a runtime dependency means every `npm ci` — including the one in CI and the one in the Docker build — downloads it for nothing.

- [ ] **Step 3: Remove both**

```bash
cd front && npm uninstall react-fontawesome cra-template
```

- [ ] **Step 4: Pin the Font Awesome core to the major its icons come from**

```bash
cd front && npm ls @fortawesome/fontawesome-svg-core @fortawesome/free-brands-svg-icons
```

Expected: `free-brands-svg-icons@6.7.2` alongside `fontawesome-svg-core@7.1.0`. The core is installed only as an auto-resolved peer dependency of `@fortawesome/react-fontawesome`, so nothing pins it, and it has floated a whole major version ahead of the icon package that supplies `faTwitter`, `faLinkedin` and `faFacebook`. Font Awesome's own guidance is to keep the core and the icon packages on the same major.

Pin it to match the icons, rather than upgrading the icons — the version 7 brand set renamed and removed icons, and that is a content change, not a dependency bump:

```bash
cd front && npm install --save-dev @fortawesome/fontawesome-svg-core@^6.7.2
```

- [ ] **Step 5: Verify the icons still render**

Run: `cd front && CI=true npx react-scripts test --watchAll=false`

Expected: 4 suites, all pass. Two of those tests are the icon check: `Content.test.js`'s `links each member to three social profiles` only passes if all twelve anchors exist, and `Accessibility.test.js`'s `names every social link` only passes if `FontAwesomeIcon` rendered without throwing.

Then confirm the icons themselves are the right ones — the pin would be pointless if a mismatched core silently rendered nothing:

```bash
cd front && CI=true npx react-scripts test --watchAll=false --testPathPattern=Accessibility 2>&1 | grep -c "names every social link" || true
cd front && npm run build && grep -c "fa-twitter\|data-icon" build/static/js/main.*.js
```

Expected: the build's main bundle contains the Font Awesome runtime. If `npm run build` fails with a module-resolution error naming `@fortawesome/fontawesome-svg-core`, the peer did not install — re-run Step 4 and check `npm ls @fortawesome/fontawesome-svg-core` reports `6.7.x`.

- [ ] **Step 6: Verify the removals took**

```bash
cd front && grep -n "react-fontawesome\|cra-template" package.json
```

Expected: one line only — `"@fortawesome/react-fontawesome": "^0.2.2"`.

```bash
cd front && npm ls react-fontawesome 2>&1 | tail -2
```

Expected: `(empty)` or an "not found" message — not a version.

- [ ] **Step 7: Note what stays and why**

`react-router-dom@7.1.1` is now imported by nothing, because Task 10 deleted `TourCard.js`. Leave it installed and record it in `docs/decisions/0004-deferred-findings.md`: the site has no routes today, but `front/nginx.conf` is already configured with `try_files ... /index.html` for client-side routing, and removing the router would have to be undone the moment a second page appears. It is unused weight in the bundle only if something imports it, and nothing does — webpack tree-shakes it out. Verify that claim:

```bash
cd front && grep -c "react-router" build/static/js/main.*.js || echo "0 — not in the bundle"
```

- [ ] **Step 8: Commit**

```bash
git add front/package.json front/package-lock.json docs/decisions/0004-deferred-findings.md
git commit -m "security: drop the unused react-fontawesome and cra-template dependencies"
```

### Task 13: Prettier, ESLint and the formatter sweep

Deliberately last: running it earlier would mix reformatting into every review diff above.

**Files:**
- Create: `front/.prettierrc`, `front/.prettierignore`, `front/.eslintrc.json`
- Create: `.git-blame-ignore-revs`
- Modify: `front/package.json`, `front/package-lock.json`, `docs/technical.md`
- Modify: every file under `front/src` (formatting only)

**Interfaces:**
- Consumes: `eslint@8.57.1`, already present via `react-scripts`.
- Produces: `npm run format` and `npm run lint` in `front/package.json`.

- [ ] **Step 1: Confirm the suite is green before reformatting anything**

```bash
cd front && CI=true npx react-scripts test --watchAll=false
```

Expected: 4 suites passing. **Write down the suite and test counts.** A sweep applied on top of a red suite makes it impossible to tell formatting from breakage.

Also refresh the CSS baseline, because Prettier reformats stylesheets too:

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css > /tmp/css-baseline.txt
```

- [ ] **Step 2: Install the formatter**

```bash
cd front && npm install --save-dev prettier@3 eslint-config-prettier@9
```

`eslint-config-prettier` turns off the ESLint rules that would fight Prettier over the same whitespace. Without it the two tools disagree and neither wins.

- [ ] **Step 3: Configure Prettier**

Create `front/.prettierrc`:

```json
{
  "printWidth": 100,
  "singleQuote": true
}
```

Both settings match what the existing source mostly does — single quotes in JavaScript, and lines that rarely exceed 100 characters. Everything else is left at Prettier's defaults, including its 2-space indent, which is what `src/**/*.js` already uses.

Create `front/.prettierignore`:

```
build
coverage
node_modules
package-lock.json
```

- [ ] **Step 4: Move the ESLint configuration out of `package.json`**

Create `front/.eslintrc.json`:

```json
{
  "root": true,
  "extends": ["react-app", "react-app/jest", "prettier"]
}
```

Then delete the `eslintConfig` key from `front/package.json`. Move it, do not copy it: ESLint 8 reads at most one configuration per directory, and leaving both means the one that loses is silently ignored — a configuration that appears to be in effect and is not.

`react-scripts` picks this up automatically. Its webpack ESLint plugin runs with `useEslintrc` at its default of `true` and a `baseConfig` of `eslint-config-react-app/base`, so a `.eslintrc.json` in `front/` is found and layered on top.

- [ ] **Step 5: Add the scripts**

In `front/package.json`:

```json
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "format": "prettier --write \"src/**/*.{js,jsx,css,json}\" \"scripts/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,css,json}\" \"scripts/**/*.js\"",
    "lint": "eslint src scripts"
  },
```

- [ ] **Step 6: Verify the tooling works before it touches anything**

```bash
cd front && npx eslint src scripts
```

Expected: no output, exit 0. If ESLint reports that it cannot resolve `prettier`, `eslint-config-prettier` did not install into `front/node_modules` — fix that before continuing.

```bash
cd front && npx prettier --check "src/**/*.{js,jsx,css,json}" "scripts/**/*.js"
```

Expected: a list of files that **would** be reformatted, and a non-zero exit. That list is the sweep you are about to make.

- [ ] **Step 7: Commit the configuration on its own**

```bash
git add front/.prettierrc front/.prettierignore front/.eslintrc.json front/package.json front/package-lock.json
git commit -m "chore: adopt Prettier and move the ESLint configuration into its own file"
```

Separating this from the sweep means the sweep commit contains formatting and nothing else, which is what makes it safe to list in `.git-blame-ignore-revs`.

- [ ] **Step 8: Run the sweep**

```bash
cd front && npm run format
```

- [ ] **Step 9: Prove nothing but formatting changed**

```bash
cd front && CI=true npx react-scripts test --watchAll=false
```

Expected: PASS, with **the same suite and test counts as Step 1**. A changed count means something other than formatting happened.

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css | diff /tmp/css-baseline.txt - && echo "STYLESHEET IDENTICAL"
```

Expected: `STYLESHEET IDENTICAL`. Prettier rewrites the source stylesheets' whitespace; the minified bundle it produces must be unchanged. This is the strongest single check in the whole plan and it costs one command.

```bash
git diff --stat
```

Expected: many files, whitespace and quote style only. Read it. If a string literal changed, or a JSX attribute moved between elements, revert and investigate before going further.

- [ ] **Step 10: Commit formatting alone**

```bash
git add -A
git commit -m "style: apply Prettier across the front-end source"
```

- [ ] **Step 11: Record the sweep so blame stays readable**

```bash
git rev-parse HEAD
```

Create `.git-blame-ignore-revs` at the **repository root**, not inside `front/`:

```
# Commits that only reformat. Enable with:
#   git config blame.ignoreRevsFile .git-blame-ignore-revs
# Prettier sweep, 2026-08-22
<paste the SHA printed above>
```

```bash
git add .git-blame-ignore-revs
git commit -m "chore: ignore the formatting sweep in git blame"
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

- [ ] **Step 12: Document the tooling**

Fill in the "Formatting" section of `docs/technical.md`: `npm run format` rewrites, `npm run format:check` verifies, `npm run lint` runs ESLint, the configuration lives in `front/.prettierrc` and `front/.eslintrc.json`, and every fresh clone needs the one-time `git config blame.ignoreRevsFile .git-blame-ignore-revs` for `git blame` to skip the sweep.

```bash
git add docs/technical.md
git commit -m "docs: record the formatting tooling"
```

---

## Phase D — Verify

### Task 14: Full verification and handover

**Files:**
- Modify: `docs/decisions/0004-deferred-findings.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the verification record the reviewing session reads before merging.

- [ ] **Step 1: Run the suite from a clean install, exactly as CI does**

```bash
cd front && rm -rf node_modules && npm ci && CI=true npx react-scripts test --watchAll=false
```

Expected: 4 suites, all passing. Record the counts — the baseline was 1 suite and 1 test.

`npm ci` from clean is not optional here: Task 12 changed `package-lock.json`, and a stale `node_modules` can hide a dependency that is no longer installable.

- [ ] **Step 2: Build the image the way the VPS does**

```bash
docker compose build frontend
```

Expected: the image builds. This runs `npm ci` and `npm run build` inside `node:20-alpine`, against Node 20 rather than whatever is on your machine.

- [ ] **Step 3: Confirm the workflow still matches the commands**

```bash
grep -n "react-scripts test\|working-directory\|needs:" .github/workflows/deploy.yml
```

Expected: `working-directory: front`, `run: npx react-scripts test --watchAll=false`, and `needs: test` on `build-and-deploy`. No task in this plan changes the workflow, so if any of those has moved, something went wrong — fix the workflow before merging.

- [ ] **Step 4: Confirm the final CSS is what you intended**

```bash
cd front && npm run build && node scripts/css-digest.js build/static/css > /tmp/css-final.txt
wc -l /tmp/css-final.txt
```

Compare against the number recorded in Task 5 Step 2. The only intended reductions across the whole plan are Task 6's unreachable rules; the only intended changes are Task 11's contrast values, heading selector and button resets. Every other task proved an identical digest at the time. If the final count differs by more than that, find out why before merging.

Then confirm the source really did shrink:

```bash
cd front && find src -name '*.css' | wc -l
cd front && find src -name '*.css' -exec cat {} + | wc -l
```

Expected: **18 stylesheets and 2,139 lines before; 18 stylesheets after** — three deleted (`global.css`, `styles.css`, `test.css`), three created (`tokens.css`, `animations.css`, `sections.css`) — holding a little under 1,200 lines. The exact figure depends on how Prettier reflowed the files in Task 13, so treat it as a sanity check, not a target: if the count has not fallen by at least 900 lines, the 979 dead lines from Task 6 did not actually go.

- [ ] **Step 5: Confirm the whole diff against `main`**

```bash
git diff main --stat
git diff main -- front/src/assets/locales
```

Read the locale diff line by line. It is the only place in this plan where visitor-facing copy changes, and it must contain exactly: three `_old` keys removed, and six new keys added to each of three files.

- [ ] **Step 6: Complete the deferred findings record**

`docs/decisions/0004-deferred-findings.md` must list everything found and not fixed, each with a reason. At minimum, the entries seeded in Task 1 Step 10 plus:

- the modal's missing focus trap and focus restoration (Task 11)
- the carousel's three-second auto-advance with no pause control (Task 11)
- `.our-team .description`'s unmeasurable contrast over a photograph (Task 11)
- `react-router-dom` retained despite having no importer (Task 12)
- anything surprising you hit while running the characterization suite in Phase B

```bash
git add docs/decisions/0004-deferred-findings.md
git commit -m "docs: record what this cycle deliberately left alone"
```

- [ ] **Step 7: Write the handover summary**

Report to the reviewing session. State:

- the suite result with counts, before (1 suite, 1 test) and after
- the `docker compose build frontend` result
- the CSS numbers: 2,139 lines before, of which 979 were unreachable; the final count
- the defects fixed and what covers each: the four colliding `@keyframes slideInLeft` definitions (Task 7), the eleven accessibility findings (Task 11, covered by `Accessibility.test.js`), the invalid `class` prop (Task 11), the three contrast failures (Task 11), the two unused dependencies (Task 12)
- the defects deliberately **not** fixed and why: the contact form with no destination (ADR 0003), and everything in ADR 0004
- the security scan result: no `dangerouslySetInnerHTML`, no `target="_blank"`, no secrets, no personal data

- [ ] **Step 8: Push the branch and stop**

```bash
git push -u origin refactor/website-laferme
```

Do not open a pull request and do not merge to `main`. Per Spec D6 the reviewing session reads the diff, re-runs the suite, and merges.

---

## Deployment note

Merging to `main` triggers `.github/workflows/deploy.yml`, which runs the test suite and, only if it passes, rsyncs `front/` and `docker-compose.yml` to the VPS and rebuilds the container there.

After the reviewing session merges, confirm the live site recovered:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://website.santoriello.ch/
```

Expected: `200`.

**Do not test `laferme.santoriello.ch`.** That hostname resolves to the VPS but has no traefik router behind it, so it answers with traefik's default certificate and `curl` reports exit 60 and status `000`. That is not a certificate failure and not an outage — it is a hostname with nothing serving it, and it has already triggered one false alarm. The hostname this repository serves is the one in the `Host()` rule in `docker-compose.yml`, and it is `website.santoriello.ch`. See `docs/runbook.md`.
