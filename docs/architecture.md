# Architecture

## Overview

`website-laferme` is a single-page React marketing site for La Ferme, a
fictional Tuscan farm guesthouse. It is a static bundle: there is no backend,
no database and no server-side code in this repository. Create React App
compiles `front/src` into `front/build`, and an unprivileged nginx container
serves that directory behind traefik.

**There is no router.** `react-router-dom@7.1.1` is a dependency, but the only
file that imports it is `front/src/components/TourCard.js`, which nothing
imports in turn. `front/src/App.js` renders every section of the site at once,
stacked inside a single `<main>`:

```
LanguageProvider
  div.content
    Header            (fixed, 100px tall - Header.css:6)
      Navbar
    main.main-container
      Fundraiser      #fundraiser
      AboutUs         #about-us
      Contact         #contact
      Blog            #blog
      Showcase        #showcase        (renders Carousel -> CarouselImage)
      Testimonials    #testimonials
    Footer
```

Navigation is therefore scrolling, not routing. `Navbar.js:16-25` looks the
target section up with `document.getElementById(id)`, computes
`getBoundingClientRect().top + window.scrollY - 110`, and calls
`window.scrollTo({ top, behavior: 'smooth' })`. The `-110px` offset exists to
clear the fixed 100px header plus a small margin. No URL ever changes; the
address bar shows `/` throughout, with no fragment.

`BikingTour` (`#biking-tour`) and `HorseRiding` (`#horse-riding`) exist as
components and are imported by `App.js`, but their JSX is commented out at
`App.js:30-31`, as are the menu entries that would scroll to them
(`Navbar.js:44-45`, and the equivalent commented pair inside each other menu
layout). Their stylesheets are still bundled, because the imports at the top of
`App.js` survive even though the elements are never rendered.

## Components

| Component | File | Responsibility |
|---|---|---|
| `App` | `front/src/App.js` | Wraps everything in `LanguageProvider` and stacks the sections |
| `Header` | `front/src/components/Header.js` | Fixed header: logo, site title, language `<select>`, `Navbar` |
| `Navbar` | `front/src/components/Navbar.js` | Five mutually exclusive menu layouts; scroll-to-section |
| `Footer` | `front/src/components/Footer.js` | Single copyright line |
| `Fundraiser` | `front/src/pages/Fundraiser.js` | Hero banner, progress bar, two donate buttons |
| `AboutUs` | `front/src/pages/AboutUs.js` | Team cards with Font Awesome social links |
| `Contact` | `front/src/pages/Contact.js` | Contact form - see ADR 0003, it submits nowhere |
| `Blog` | `front/src/pages/Blog.js` | News cards plus a click-to-open modal |
| `Showcase` | `front/src/pages/Showcase.js` | Wrapper around `Carousel` |
| `Carousel` | `front/src/components/Carousel.js` | Three auto-advancing slides, arrows, indicators |
| `CarouselImage` | `front/src/components/CarouselImage.js` | One slide |
| `Testimonials` | `front/src/pages/Testimonial.js` | Two opposite-direction marquee sliders |
| `TourCard` | `front/src/components/TourCard.js` | Imported by nothing; the only importer of `react-router-dom` |
| `LanguageProvider` | `front/src/context/LanguageContext.js` | Holds `language`, `texts`, `toggleLanguage` |

Note the filename asymmetry: the testimonials component lives in
`front/src/pages/Testimonial.js` (singular) but exports `Testimonials` and
imports `./Testimonials.css` (plural). `App.js:11` imports it as
`Testimonials from './pages/Testimonial'`.

Four sections (`Fundraiser`, `AboutUs`, `Contact`, `Blog`) construct an
`IntersectionObserver` in a `useEffect` to drive scroll-reveal animations.
jsdom does not implement `IntersectionObserver`, which is why
`front/src/setupTests.js` stubs it - without the stub every `render(<App />)`
throws.

### `Navbar` chooses its layout in JavaScript, not in CSS

`Navbar.js:9` reads `window.innerWidth` into state and `Navbar.js:28-32`
updates it on `resize`. The render then picks exactly one of five branches:

| Condition | Rendered layout |
|---|---|
| `> 1151` | All six links inline |
| `<= 1150 && > 1051` | Five links plus a "More" dropdown holding Testimonials |
| `<= 1050 && > 901` | Four links plus a dropdown holding Gallery and Testimonials |
| `<= 900 && > 768` | Three links plus a dropdown holding News, Gallery, Testimonials |
| `<= 767 && > 675` | Two links plus a dropdown holding the remaining four |
| `<= 674` | Hamburger toggle plus a full vertical menu |

This is layout logic expressed in JavaScript rather than in media queries. It
has two consequences: the menu does not respond to a viewport change until a
`resize` event fires and re-renders the component, and the six link labels are
duplicated across six JSX blocks. `front/src/components/Navbar.css` carries a
**sixth** breakpoint of its own - `@media (max-width: 674px)` at
`Navbar.css:74` - which styles the hamburger layout that the `<= 674` branch
renders. The JavaScript boundaries and the CSS boundary have to be kept in step
by hand. Note also that the conditions leave gaps at their own boundaries: each
branch is written `<= upper && > lower`, and the next branch starts at
`<= lower - 1`, so the width equal to `lower` itself is matched by no branch.
At exactly 675, 768, 901, 1051 and 1151 CSS pixels the navbar renders no menu
at all.

Restructuring this is a rewrite, not a refactor, so it is recorded in
[`decisions/0004-deferred-findings.md`](decisions/0004-deferred-findings.md).

## Content loading

Copy and data reach the page through **four different mechanisms**:

1. **Static import of bundled JSON, at module load.**
   `front/src/context/LanguageContext.js:2-4` imports
   `src/assets/locales/en.json`, `fr.json` and `de.json` directly, so all three
   are in the main bundle from the first byte. Each holds 28 keys, in exact
   parity across the three languages. Consumers: `Header`, `Navbar`, `Footer`,
   `Fundraiser`, `AboutUs`, `Contact`, `Blog`, `Testimonials` - every component
   that renders visible prose.

2. **Per-language dynamic `import()` of bundled JSON, at render.**
   `AboutUs.js:16` resolves `import('../assets/locales/about_us_' + language + '.json')`
   and `Blog.js:15` resolves `import('../assets/news/news_' + language + '.json')`,
   both written as template literals and both re-running when `language`
   changes. webpack turns each template literal into one lazy chunk per
   matching file, so this content arrives as a separate request after first
   paint. Consumers: `AboutUs` (team members), `Blog` (news items).

3. **Runtime `fetch` of a file in `public/`.**
   `Testimonial.js:11-16` calls `fetch('/testimonials/testimonials.json')` once
   on mount. That file is *not* bundled - it is copied verbatim into `build/`
   and served by nginx, so it can be edited on the server without a rebuild. It
   is also the only content path with no per-language variant. There is no
   loading state and no error state: a failed fetch logs to the console and the
   section renders empty. Consumer: `Testimonials`.

4. **Hard-coded in the component.**
   `Carousel.js:10-15` declares its three slides inline - imported image
   modules plus English `alt` text (`'Image 1'`, `'Image 2'`, `'Image 3'`) and
   three English caption strings that no markup renders.
   `Fundraiser.js:9-10` hard-codes `raised = 1500` and `goal = 10000`.
   `BikingTour.js` and `HorseRiding.js` hold their headings and prose as
   literal JSX. Consumers: `Carousel`, `Fundraiser`, `BikingTour`,
   `HorseRiding`.

Images follow the same split. Files under `front/src/assets/images/` are
imported by JavaScript or referenced from CSS and get content-hashed by
webpack; files under `front/public/images/` are referenced by absolute path
from the JSON data files (`"/images/aboutus/user2.jpg"`,
`"/images/news/bike-trail.jpg"`) and are served as-is.

## Build

`npm run build` in `front/` runs `react-scripts build`, which emits a static
site into `front/build`: `index.html`, one hashed JS bundle plus seven lazy
chunks, one hashed CSS bundle, and everything under `public/` copied through.

Each of the 15 stylesheets imported from a `.js` file is concatenated into that
single CSS bundle, in webpack's import order. This matters: identically named
`@keyframes` in different files collide, and only the last definition in
cascade order survives. See
[`decisions/0002-one-definition-per-idea-in-css.md`](decisions/0002-one-definition-per-idea-in-css.md).

`front/Dockerfile` is a two-stage build:

1. `node:20-alpine` - `npm ci`, then `npm run build`.
2. `nginxinc/nginx-unprivileged:1.29-alpine` - copies `/app/build` to
   `/usr/share/nginx/html` and `nginx.conf` to
   `/etc/nginx/conf.d/default.conf`.

The runtime image **listens on 8080, not 80**, because it runs as uid 101 and a
non-root process cannot bind a port below 1024. `front/nginx.conf` sets
`listen 8080;` and `docker-compose.yml` carries the matching
`traefik.http.services.laferme-frontend.loadbalancer.server.port=8080` label.
Changing one without the other takes the site down.

`front/nginx.conf` serves `try_files $uri $uri/ /index.html`. The site has no
client-side routes today, so nothing currently depends on this; it exists so
that a direct hit or a refresh on a deep URL would work if a router is ever
introduced.

The Docker build context is `./front` (`docker-compose.yml`: `build: ./front`),
which is why `front/.dockerignore` has to live there - a `.dockerignore` at the
repository root is not read for this build.

## Deployment topology

```
visitor
  |  https
  v
traefik  (shared edge, separate repository)
  |  router laferme-frontend
  |    rule         Host(`website.santoriello.ch`)
  |    entrypoint   websecure
  |    certresolver le
  |    middlewares  security-headers@file, gzip-compress@file
  |  http, over the external docker network proxy-network
  v
frontend container   nginx-unprivileged:1.29-alpine, uid 101, :8080
  \- /usr/share/nginx/html   <- front/build
```

traefik terminates TLS and is not part of this repository; it is the shared
edge for every site in the estate. The two middlewares named with the `@file`
suffix come from traefik's own file provider (`dynamic/middlewares.yml`), not
from any label here.

The container declares a healthcheck that wgets `http://127.0.0.1:8080/` every
15 seconds, and `restart: unless-stopped` (`docker-compose.yml`).

Deployment is push-to-`main`: `.github/workflows/deploy.yml` rsyncs `front/`
and `docker-compose.yml` to the VPS, then runs `docker compose build frontend`
and `docker compose up -d frontend` over SSH. The rsync uses `--delete`, so the
server mirrors the repository and a renamed or removed file does not linger.
See [`technical.md`](technical.md) for the test gate in front of that job and
[`runbook.md`](runbook.md) for operating it.
