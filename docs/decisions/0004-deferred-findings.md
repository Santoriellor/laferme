# 4. Deferred findings

Date: 2026-08-22
Status: closed for this cycle - appended to by Tasks 6, 10, 11 and 12 of this
refactor cycle as they completed. Task 14 (final verification) reviewed the
register against its own checklist - the modal's focus trap, the carousel's
auto-advance, `.our-team .description`'s contrast, `react-router-dom`, and the
Phase B locale surprise - and found every required entry already present, so
it made no further addition. This document is final for
`refactor/website-laferme`.

This records what the current refactor cycle deliberately leaves alone:
problems found while documenting and surveying the site that are real, but that
this cycle does not fix. Each entry says what it is, where it is, and in one
line why it is not being fixed now.

As a rule it does **not** list problems that *are* scheduled inside this cycle
- the dead stylesheets (Task 6), the duplicated animations, tokens and section
shells (Tasks 7-9), the dead JavaScript and hard-coded carousel content (Task
10), the accessibility baseline (Task 11), or the unimported dependencies (Task
12). Those are in progress, not deferred, and they do not need a register.

**The exception, and the only one:** an in-cycle item appears here when the
entry carries something the fix alone would not - a measurement that would
otherwise be rediscovered from scratch, or a rule that has to outlive the
commit that satisfies it. Two entries below are of that kind, and both are
marked **[in cycle]** so nobody mistakes them for outstanding work: the
call-to-action contrast ratios, which record the decision *not* to change the
brand colour along with the numbers that decision was made against, and the
`clip-path` mobile menu, whose entry exists so that the same mistake is
recognised the next time somebody reaches for `clip-path` to hide something.

Two findings have ADRs of their own rather than a line here: the unmaintained
build tool ([`0001-create-react-app-stays.md`](0001-create-react-app-stays.md))
and the inert contact form
([`0003-contact-form-has-no-destination.md`](0003-contact-form-has-no-destination.md)).

## Language and internationalization

- **`<html lang>` never changes.** `front/public/index.html:2` hard-codes
  `<html lang="en">` and nothing writes to `document.documentElement.lang`, so
  a screen reader announces French and German copy with English pronunciation
  rules. Fixing it means having `LanguageContext` write to the document, which
  is a behaviour change outside this cycle's scope.

- **The language choice is not persisted and not in the URL.** No
  `localStorage`, no cookie, no path segment or query parameter, so a reload
  silently reverts to English and a French page cannot be linked to. Both are
  product behaviour, not structure.

- **`de.json` is partly untranslated and carries typos.**
  `"menuAboutUs": "About Us"` and `"contactSend": "Message Senden"` are still
  English or half-English; `"Wilkommen"`, `"Kontact"` and
  `"Was die Leute über us sagen"` are misspelt. Copy, not code - it needs a
  German speaker, not a refactor.

## Content and data

- **The fundraising total is a literal.** `Fundraiser.js:9-10` hard-codes
  `raised = 1500` and `goal = 10000`, and `setRaised` is never called, so the
  progress bar is permanently at 15% and only a redeploy can move it. A
  fundraising total that only a redeploy can change is a content problem needing
  a data source, not a code cleanup.

- **Testimonials load differently from everything else.**
  `front/public/testimonials/testimonials.json` is fetched at runtime while all
  other content is bundled from `front/src/assets/`. Unifying it is deliberately
  deferred: the file holds placeholder content that has to be replaced with real
  testimonials anyway, and moving placeholder data between two locations is
  churn.

- **`Testimonial.js:12-16` has no loading and no error state.** A failed fetch
  logs to the console and leaves an empty section with a heading above it. Adding
  states changes what the page renders, which puts it after - not inside - the
  characterization phase.

## Structure

- **`Navbar` picks its layout in JavaScript.** `Navbar.js` chooses between six
  mutually exclusive menus from `window.innerWidth` rather than in media
  queries, so the menu does not respond to a viewport change until a `resize`
  event fires, and the same six labels are written out six times. Restructuring
  it into CSS is a rewrite, not a refactor.

  Note that the five uncovered widths those six branches leave - 675, 768, 901,
  1051 and 1151, where the navbar renders no menu at all - are **not** deferred:
  Task 11 closes those gaps. It is the six-branches-in-JavaScript structure
  itself that is deferred, and it survives that fix untouched.

- **`BikingTour` and `HorseRiding` stay in the tree.** Their JSX is commented
  out at `App.js:30-31` and their menu entries at `Navbar.js:44-45` and in each
  other menu layout. They are kept, not deleted, because the comments record an
  intent to re-enable them; Task 10 removes only the unused imports that produce
  build warnings, leaving the components and their stylesheets in place.

- **[in cycle] Removing those two unused imports also drops their CSS from the
  compiled bundle.** `BikingTour.js` and `HorseRiding.js` stay on disk
  unmodified, `BikingTour.css` and `HorseRiding.css` with them, but once
  `App.js` no longer imports the two page components, nothing in the module
  graph reaches those stylesheets either, so webpack stops including them in
  `build/static/css`. This is a real change to the production CSS bundle from
  a task that otherwise touches no CSS: `front/scripts/css-digest.js` on the
  Task 9 baseline read 627 lines; after Task 10's import cleanup it reads 625,
  short exactly `#biking-tour{background:#fff}` and
  `#horse-riding{background:#fff}`. Both selectors were already unreachable -
  the sections they style are commented out of the render tree - so nothing
  visible changes; this entry exists only so the digest drop is not mistaken
  for a lost or corrupted baseline the next time it is diffed. **625 lines is
  the baseline from Task 10 onward.**

- **[in cycle] The fundraiser page's "Learn More" button is commented out.**
  `Fundraiser.js:56` has `{/* <button className="learn-btn">{texts.fundraiserLearnMore}</button> */}`.
  Task 6 deletes `.learn-btn`'s CSS as dead code - nothing renders it, so the
  rule was unreachable - but leaves the commented-out button itself alone: the
  comment records the same kind of intent as `BikingTour` and `HorseRiding`
  above, `Fundraiser.js` is not in Task 6's file list, and removing dead JSX is
  Task 10's job. This differs from `CarouselImage.js`, where Task 6 does
  delete a commented-out block - there the surrounding CSS block it referenced
  (`.carousel-bottom-text`) was deleted in the same task, so the comment and
  the rule it depended on left together.

- **The fundraiser amounts format with whatever locale the visitor's browser
  resolves.** `Fundraiser.js:53` calls `toLocaleString()` on both the raised
  amount and the goal with no locale argument, so the live site renders
  different thousands separators to different visitors depending on their
  browser's locale - a comma for an en-US browser, an apostrophe for a de-CH
  one, and so on. That is a real inconsistency on a site whose copy is
  otherwise controlled by `LanguageContext`: a French-language visitor on an
  en-US browser gets English-style number grouping regardless of the language
  they chose. It is deferred because fixing it means choosing which locale
  drives the formatting - the `LanguageContext` language, or the browser - and
  that choice is a product decision, not a refactor.

## Styling

- **`--font2` names a font that is never loaded.** `App.css:13` declares
  `--font2: "Quintessential", sans-serif`, but the `@import` that would fetch
  Quintessential is commented out at `App.css:2`, so `.carousel-top-text`
  silently falls back to `sans-serif`. The element it styles
  (`CarouselImage.js:8`) is empty in the markup, so nothing visible depends on
  the outcome either way.

- **The web font is a third-party request on every page view.** `App.css:1`
  loads Poppins from `fonts.googleapis.com`. Self-hosting it would remove a
  request to a third party from every visit - a privacy improvement, and one
  outside this cycle.

- **[in cycle] Colour contrast on the three call-to-action buttons.** Measured
  with the WCAG relative-luminance formula against the white text on each:

  | Element | Colour | Ratio | AA (4.5:1) |
  |---|---|---|---|
  | `.donate-btn` (`Fundraiser.css:85`) | `#ff5733` | **3.15:1** | fails |
  | `.contact-form button` (`Contact.css:67`, `var(--color2)`) | `rgb(182, 115, 50)` | **3.83:1** | fails |
  | `.fixed-donate-btn` (`Fundraiser.css:120`) | `#e63946` | **4.17:1** | fails |

  Task 11 brings these three controls to AA, so the failures themselves are not
  deferred. What is recorded here is the **decision underneath the fix**: the
  accent colour is the site's brand colour and is **not** changed - not by Task
  11, and not by the CSS consolidation, where no colour value in `tokens.css`
  changes at all
  ([`0002-one-definition-per-idea-in-css.md`](0002-one-definition-per-idea-in-css.md)).
  The three ratios are written down beside it so that the next person to
  question the accent colour can see it was measured, not overlooked.

## Accessibility

- **[in cycle] The mobile menu is hidden with `clip-path` alone.**
  `front/src/components/Navbar.css:81-115` is the `@media (max-width: 674px)`
  block; inside it, `.menu` carried `clip-path: inset(0 0 100% 0)` and
  `.menu.open` carried `clip-path: inset(0 0 0 0)`, and nothing else. `clip-path`
  clips painting only. It does not remove the element from the accessibility
  tree and it does not take anything out of the tab order, so while the
  hamburger menu looked closed, all six of its links remained focusable and
  screen-reader announced. A keyboard visitor tabbed through a menu they could
  not see. **Task 11 of this cycle fixed it**, which is why it appears here as a
  recorded finding rather than an open one: `.menu` now also carries
  `visibility: hidden` and `.menu.open` `visibility: visible`, with the hide
  delayed by the length of the wipe (`visibility 0s linear 0.4s`) so the
  animation still plays and the show instant (`0s linear 0s`) so the links are
  available from the first frame. It is written down because the fix has to
  survive: any future "just hide it with `clip-path`" is the same bug again.
  Note that no JavaScript test can defend it - jsdom applies no stylesheet CSS,
  so a `.menu.open` class assertion passes either way. It is verified by reading
  `front/build/static/css`.

- **The carousel advances on its own and cannot be stopped.**
  `front/src/components/Carousel.js:69-75` sets a three-second interval that
  moves to the next slide. It pauses on `mouseenter` and resumes on
  `mouseleave`, which is not a control: it is unreachable from the keyboard,
  unreachable on a touch screen, and it does not survive a page the visitor is
  not hovering. WCAG 2.2.2 (Pause, Stop, Hide) requires a mechanism to pause
  any motion that starts automatically, lasts more than five seconds and is
  presented alongside other content. Task 11 does not add one: a pause control
  is a visible new control with its own label, its own icon and its own place
  in the layout, which is a design decision rather than an accessibility fix
  applied to what is already there.

- **`.our-team .description` cannot be measured statically.**
  `front/src/pages/AboutUs.css:93-99` renders the description in
  `var(--colorwhite)` over `.our-team .over-layer`
  (`front/src/pages/AboutUs.css:57-64`), which is `rgba(0, 0, 0, 0.4)` laid
  over each team member's photograph. The effective background is therefore
  40% black over whatever pixels that particular photograph has underneath, so
  the contrast ratio is different for every member and different in every part
  of the same card - it cannot be computed from the stylesheet at all, and a
  light photograph will fail. Guaranteeing it means a solid scrim, or a much
  darker overlay, behind the text. That changes how the section looks, which
  puts it outside a baseline task whose other fixes are all invisible.

- **`Blog.js:54`'s modal has no focus trap and does not restore focus on
  close.** Task 11 gave it a dialog role and an Escape key, which is the
  majority of the value for a fraction of the machinery, but it did not add a
  full focus trap: focus can still leave the open dialog by tabbing, and closing
  it does not return focus to the card that opened it. A correct focus trap is a
  component of its own and is deferred. The card is now a `<button>`, so the
  focus that would need restoring is a real, reachable focus for the first
  time.

## Dependencies

- **`react-router-dom@7.1.1` is imported by nothing.** Task 10 deleted
  `TourCard.js`, which was the last file to import it. It stays installed
  rather than being removed: the site has no routes today, but
  `front/nginx.conf` already carries `try_files $uri $uri/ /index.html` for
  client-side routing, and pulling the router out would have to be undone the
  moment a second page appears. It costs nothing in the bundle in the
  meantime - webpack tree-shakes an unimported package out entirely, verified
  by `grep -c "react-router" build/static/js/main.*.js` returning `0`.

- **`caniuse-lite` is roughly eight months stale.** Every build prints
  `browsers data (caniuse-lite) is 8 months old`. It is left alone
  deliberately, not overlooked. The browserslist data decides what Autoprefixer
  emits, so refreshing it changes the produced CSS - which is precisely the
  output that Tasks 6 to 11 verified byte by byte through
  `front/scripts/css-digest.js`. Updating it inside this cycle would have moved
  the baseline underneath the tasks whose whole argument rests on it.

  It is safe to leave: the resolved production target set has `ios_saf
  11.0-11.2` and `and_uc 15.5` as its oldest members and stale data errs toward
  emitting *more* prefixes, never fewer. When it is updated, do it as a change
  of its own, diff the digest, and expect the diff to be non-empty - that is the
  point of doing it separately.

## Miscellaneous

- **`Header.js:13` uses a document-relative image URL.** `src="laferme.png"`
  resolves against the current path, so it works only because the site is served
  from `/`. It would break the day the site is served from a sub-path. One
  character (`/laferme.png`) fixes it, but changing it is a behaviour change to
  a rendered attribute during a phase that changes none, so it waits.

- **`front/public/index.html` still carries the Create React App boilerplate
  description**, `content="Web site created using create-react-app"`. Copy, and
  outside this cycle's file set.
