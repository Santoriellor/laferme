# Design

## What the site is

A one-page marketing and fundraising site for **La Ferme**, presented as a farm
guesthouse in Tuscany that is raising money after storm damage.

**La Ferme is not a real business.** This repository is a portfolio piece. The
farm, the team, the news items, the testimonials and the fundraising total are
all invented. That is a design fact, not an oversight, and several decisions in
this documentation follow from it - most directly
[`decisions/0003-contact-form-has-no-destination.md`](decisions/0003-contact-form-has-no-destination.md),
which records that the contact form is deliberately inert because there is no
inbox for it to reach and none is wanted.

The site's job is to look like a plausible small-business site and to
demonstrate the front-end work. Anyone reusing it for a real business has to
read ADR 0003 first: several things that are acceptable in a demo become live
defects the moment a real visitor uses them.

The visitor is offered exactly one action - "Donate" - and the donate buttons
are not wired to a payment provider either. Everything else on the page is
presentation.

## Information architecture

One page, one scroll, six visible sections. There is no routing, no URL
fragment and no history entry; the whole site is always at `/`. See
[`architecture.md`](architecture.md) for how the scrolling is implemented.

In DOM order:

| # | Section | Anchor | Purpose |
|---|---|---|---|
| 1 | Fundraiser | `#fundraiser` | Hero image, campaign pitch, progress bar, "Donate Now" |
| 2 | About Us | `#about-us` | Team cards: photo, name, role, blurb, three social links |
| 3 | Contact | `#contact` | Name / email / message form (inert - see ADR 0003) |
| 4 | Blog | `#blog` | Latest news cards; clicking one opens a modal with the full text |
| 5 | Showcase | `#showcase` | Auto-advancing three-slide carousel |
| 6 | Testimonials | `#testimonials` | Two marquee rows of quotes, scrolling in opposite directions |

A fixed 100px header sits above all of it with the logo, the site title, the
language selector and the menu. A single-line footer sits below.

Two further sections - **Biking Tour** (`#biking-tour`) and **Horse Riding**
(`#horse-riding`) - are built and styled but not shown: their JSX is commented
out at `App.js:30-31`, and so are the menu entries for them. The comments are
kept rather than deleted because they record an intent to re-enable the
sections later.

The menu offers six destinations - Home, About Us, Contact, News, Gallery,
Testimonials - which map onto the six sections above in that order. As the
viewport narrows, the least important entries move into a "More" dropdown, and
below 675px the whole menu collapses behind a hamburger. Which entries move,
and at which width, is decided in JavaScript; see the `Navbar` table in
[`architecture.md`](architecture.md).

The header is the only `h1` the design intends. In the markup as it stands
there are five `h1` elements on the page; that, and the rest of the
accessibility baseline, is Task 11 of the refactor cycle, not a design
statement.

## The three-language content model

The site is offered in English, French and German, chosen from a `<select>` in
the header (`Header.js:17-25`).

`front/src/context/LanguageContext.js` provides the whole model. The context
value is exactly three things:

| Field | Type | Meaning |
|---|---|---|
| `language` | `'en' \| 'fr' \| 'de'` | The current choice. Initial value `'en'`. |
| `texts` | object | The full set of 28 copy keys for that language. |
| `toggleLanguage` | `(lang) => void` | Sets `language`, ignoring any value that is not one of the three keys. |

`texts` is **swapped wholesale**. There is no key-by-key lookup and no
fallback: `LanguageContext.js:18-20` replaces the entire object with
`locales/<lang>.json` whenever `language` changes. A component reads
`texts.someKey` and gets whatever that language file happens to hold, so a key
missing from one file renders as `undefined` rather than falling back to
English. In practice the three files are in exact parity - 28 keys each - so
this has not bitten yet.

Three content sets follow the language and one does not:

- `locales/{en,fr,de}.json` - all interface copy. Static import.
- `locales/about_us_{en,fr,de}.json` - the team. Per-language dynamic import.
- `news/news_{en,fr,de}.json` - the news items. Per-language dynamic import.
- `public/testimonials/testimonials.json` - **not translated.** One English
  file for every language.

Three consequences of this model are worth stating plainly, because they are
all visible to a visitor:

- **The language is not persisted.** There is no `localStorage`, no cookie and
  no server-side preference. A reload returns to English, whatever the visitor
  picked.
- **The language is not in the URL.** No path segment, no query parameter, no
  fragment. A French visitor cannot send a French link to anyone, and a search
  engine only ever sees the English page.
- **The language is not reflected in `<html lang>`.** `front/public/index.html:2`
  hard-codes `<html lang="en">` and nothing ever writes to
  `document.documentElement.lang`. A screen reader announces German and French
  copy with English pronunciation rules for the whole session.

All three are recorded in
[`decisions/0004-deferred-findings.md`](decisions/0004-deferred-findings.md).
Fixing any of them changes behaviour rather than structure, which puts it
outside this refactor cycle.

## Known placeholder content

None of the following is real. It is listed here so that nobody mistakes any of
it for data, and so that whoever eventually supplies real content knows exactly
what to replace.

**Testimonials** - `front/public/testimonials/testimonials.json`. All seven
entries are invented, and several are duplicated verbatim under different
names. The roles ("CEO of TechCorp", "Marketing Director", "Freelancer",
"Entrepreneur") describe a software product, not a farm guesthouse; the file is
stock filler text that was never rewritten for this site. It is also the only
content file that is fetched at runtime rather than bundled, and the only one
with no translations.

**The team** - `front/src/assets/locales/about_us_en.json`, `_fr.json`,
`_de.json`. Four members, all invented ("Emma Carter, Owner & Host", "Liam
Brooks, Farm Manager"). Their three social links each point at a profile that
does not exist (`https://linkedin.com/in/emmafarmlife` and similar), and the
photos are stock images under `front/public/images/aboutus/`.

**The news** - `front/src/assets/news/news_en.json`, `_fr.json`, `_de.json`.
Three items, all dated January 2025, all with truncated placeholder bodies
("Discover the new scenic hiking trails now open to the public...").

**The fundraising total** - `Fundraiser.js:9-10` hard-codes
`const [raised, setRaised] = useState(1500)` and `const goal = 10000`, and
`setRaised` is never called anywhere. The progress bar therefore always shows
15%, and the only way to change the displayed total is to edit the source and
redeploy. A real campaign needs a data source; see
[`decisions/0004-deferred-findings.md`](decisions/0004-deferred-findings.md).

**The carousel captions** - `Carousel.js:10-15` carries three English caption
strings ("Text describing the general activities around the farm" and two
siblings) which are passed to `CarouselImage` as `bottomText` and then rendered
by nothing, because the element that would show them is commented out at
`CarouselImage.js:9-11`. The `alt` text on the same three slides is
`'Image 1'`, `'Image 2'` and `'Image 3'`.

**The German copy** - `front/src/assets/locales/de.json` is partly untranslated
and carries typos: `"menuAboutUs": "About Us"` and `"contactSend": "Message
Senden"` are still English or half-English, and `"Wilkommen"` (for
*Willkommen*), `"Kontact"` (for *Kontakt*) and `"Was die Leute über us sagen"`
(for *uns*) are misspelt. This is copy, not code, and is deferred.

**Dead copy keys** - all three locale files carry `headerTitle_old`,
`fundraiserTitle_old` and `fundraiserText_old`, left from an earlier version of
the site when the business was called "Le Canne". Nothing reads them. They are
removed in Task 10 of the refactor cycle.

**The page description** - `front/public/index.html` still carries
`<meta name="description" content="Web site created using create-react-app">`.
