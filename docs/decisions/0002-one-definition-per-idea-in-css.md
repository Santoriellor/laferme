# 2. One definition per idea in CSS

Date: 2026-08-22
Status: accepted

## Context

The site has 18 stylesheets totalling 2,139 lines. The survey that opened this
refactor cycle measured four things about them.

**979 of those 2,139 lines - 45.8% - are dead.** Three files are imported by
nothing: `front/src/assets/css/global.css` (951 lines),
`front/src/styles.css` (22) and `front/src/pages/test.css` (6). Fifteen `.js`
files import a stylesheet; none of them names these three. `test.css` is a
discarded experiment that restyles `#fundraiser` with `color: #af1a1a` and
`height: 800px`, values that appear nowhere else in the project. Reading
`global.css` to understand a style is reading a file that has no effect on the
page.

**`@keyframes slideInLeft` is declared seven times, and only one of them
runs.** Four are in live stylesheets - `Fundraiser.css:159`, `AboutUs.css:151`
and `Blog.css:151`, all animating `translateX(-100px)`, and `Contact.css:86`,
animating `translateX(-100%)`. The other three are inside the dead
`global.css`. webpack concatenates every imported stylesheet into one bundle,
and identically named `@keyframes` collide: the last definition in cascade
order wins for the whole document. Contact's is last. In the built bundle,
`grep -c "translateX(-100px)" front/build/static/css/main.*.css` returns `0`.

So `.about-title`, `.blog-title` and `.fundraiser-content h1` are each written
against a 100-pixel slide and each actually animates across its full width. The
same is true of `slideInRight`, declared twice in live stylesheets
(`Fundraiser.css:169` at `100px`, `Contact.css:98` at `100%`). Nobody chose
this. It is what the cascade decided, and no file says so.

**White is written four ways.** The count that the consolidation tasks work
from is produced by this grep, run over the 15 live stylesheets:

```bash
grep -rn "#fff\b\|#ffffff\|: white\|background-color: white" src --include=*.css
```

It returns 20 lines, one of which is the `--colorwhite: white` token
declaration itself at `App.css:10`. That leaves **19 literal white values
across 9 live stylesheets** - `#fff` twelve times, `white` six times,
`#ffffff` once - alongside 10 uses of the `var(--colorwhite)` token that exists
precisely to avoid them.

One further literal white sits outside that pattern and is deliberately
excluded: `Blog.css:85`, `background: linear-gradient(transparent, white)`. A
gradient stop is not a flat colour and substituting a token there is not the
same edit, so the consolidation leaves it alone; a wider `\bwhite\b` search
will report 20 rather than 19 because of it.

Black-with-alpha appears 17 times
with nine distinct alphas, in two different spacings (`rgba(0, 0, 0, 0.4)` and
`rgba(0,0,0,0.4)`); `rgba(0, 0, 0, 0.1)` alone appears four times, in
`Footer.css`, `Header.css`, `Blog.css` and `Testimonials.css`. Two declared
tokens, `--color4` and `--color5` (`App.css:8-9`), are used zero times.

**The section shell is written five times.** The block

```css
position: relative;
width: 100%;
min-height: fit-content;
background: var(--colorwhite);
margin: 0;
padding: 0;
```

appears identically on `#about-us`, `#blog`, `#contact`, `#showcase` and
`#testimonials`. `#about-us` and `#contact` agree on all twelve of
`#about-us`'s declarations, in the same order, and differ only by `#contact`'s
one extra `height: 600px`. The section title
is written four times: `margin: 15px 0; padding: 0; font-size: 3rem;
text-align: center` on `.about-title`, `.blog-title`, `.contact-title` and
`.testimonials-title`, of which `.about-title` and `.blog-title` are
byte-identical apart from the selector.

The common thread is that no idea in this stylesheet set has one home. A colour
has four spellings, an animation has seven declarations and one effect, a
section shell has five copies. Changing any of them means finding all of them,
and the cascade decides what actually happens.

## Decision

**One definition per idea, in one place, imported once.**

The refactor cycle introduces three shared stylesheets under
`front/src/assets/css/`:

| File | Holds |
|---|---|
| `tokens.css` | The `:root` custom properties and the web-font `@import`, moved out of `App.css` |
| `animations.css` | One definition of each `@keyframes` name |
| `sections.css` | The section-shell and section-title declarations the five sections share |

They are imported from `front/src/index.js`, before `App`, so they load once
and in a known order rather than arriving wherever a component happens to be
imported. The three dead files are deleted.

Where a duplicate set disagrees, the definition that survives is the one that
**already wins today**. For `slideInLeft` and `slideInRight` that is Contact's
percentage-based version, because that is what every element on the page is
currently animating with. Consolidating to the "intended" 100-pixel version
would be a visual change disguised as a cleanup.

## Consequences

- **A correct change here is invisible, which is exactly the problem.** There
  is no observable difference between a consolidation that preserved the
  cascade and one that quietly dropped a declaration. "It looks the same" is
  not evidence.

- **CSS changes are therefore verified mechanically, not by eye.** Task 5 of
  this cycle installs `front/scripts/css-digest.js`, which reduces the *built*
  stylesheet - `front/build/static/css/main.*.css`, after webpack has
  concatenated all imports and the cascade has resolved - to an order-free,
  `var()`-resolved list of `selector | property: value` lines.

- **Every CSS task states what the digest must do, and the rule is binary:**

  - For a **pure consolidation**, the digest must be **byte-identical** before
    and after. Any difference at all is a regression, including one nobody can
    see.
  - For a **deliberate change**, the digest diff must contain **exactly the
    enumerated lines** named by that task, and nothing else. An unexpected line
    in the diff is a finding, not noise to be waved through.

- **`tokens.css` is a rename risk, not a value risk.** No colour value changes
  as part of this consolidation. The accent colours stay exactly as they are;
  where a token's value causes a contrast failure, that is recorded as a
  deferred finding with the measured ratio in
  [`0004-deferred-findings.md`](0004-deferred-findings.md) and addressed
  separately, without redefining the brand colour.

- **Two duplicated rules become site-wide by intent rather than by accident.**
  `Contact.css:80` currently declares `a { color: inherit; text-decoration:
  none; }` - a global rule living in one page's stylesheet, which strips the
  underline from every link on the site including `AboutUs`'s. Consolidation
  moves such a rule somewhere its scope is honest, but does not change what it
  does.
