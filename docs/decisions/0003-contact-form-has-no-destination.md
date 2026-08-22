# 3. The contact form has no destination

Date: 2026-08-22
Status: accepted - the form is intentionally inert

## Context

`front/src/pages/Contact.js:33-38` renders:

```jsx
<form className="contact-form">
  <input type="text" placeholder={texts.contactName} required />
  <input type="email" placeholder={texts.contactEmail} required />
  <textarea placeholder={texts.contactMsg} required></textarea>
  <button type="submit">{texts.contactSend}</button>
</form>
```

The `<form>` has **no `action`, no `method` and no `onSubmit` handler**, and
none of the three inputs has a `name` attribute.

A browser given a form with no `action` submits to the current URL, and a form
with no `method` uses GET. So pressing "Send Message" performs a native GET
against `/`. Because no input has a `name`, there is nothing to serialize: the
query string is empty, the page reloads, and the visitor's message is
discarded. No request carries it anywhere, nothing is logged, and no error is
shown.

The `required` attributes still work. The browser refuses to submit an empty
field and refuses an address that is not shaped like an email, so the form
gives every outward sign of validating and accepting input. **It looks like it
submits.** That is the whole of the problem: the failure is silent and
indistinguishable from success.

Nothing leaks. There is no endpoint, no third party and no data in flight. This
is not a security defect; it is a control that does nothing.

Making it work needs a destination - a mail relay, a form service, or a backend
- and this repository is a static bundle behind nginx with no server side of
its own. There is nowhere for a message to go.

**And there is no one to read it.** La Ferme is a fictional business. The site
is a portfolio piece, confirmed as such by its owner. There is no inbox behind
the form because there is no farm.

## Decision

**Leave the form inert. This is a recorded design fact, not an open defect.**

The site represents a fictional business. Wiring the form to a real endpoint
would create a mailbox nobody reads, and choosing that endpoint - a mail relay,
a form service, a backend - would be a product decision about a product that
does not exist. Neither belongs in a refactor.

`Contact.js` gains no destination in this cycle. The only changes it takes are
the accessibility ones in Task 11 - accessible names on the three inputs, a
`name` attribute on each, and a contrast-compliant send button - none of which
makes the form send anything anywhere.

## Consequences

- **The form stays visibly present and silently useless.** A visitor who fills
  it in gets a page reload and no acknowledgement. On a demo site that is
  acceptable; it is written down here so that it is a known state rather than a
  surprise.

- **If this site is ever used for a real business, this becomes a live
  defect.** Not a cosmetic one. Visitors would believe they had made contact
  and would wait for a reply that no one can send, because no one will ever
  know they wrote. Read this ADR before reusing the site for anything real.

- **What would have to change, concretely.** Three things, all of them:

  1. A destination on the `<form>`: either an `action` and `method` pointing at
     a form service - the sibling repository `santoriello.ch` uses Web3Forms
     for exactly this - or an `onSubmit` handler that posts to one.
  2. A `name` attribute on each of the three inputs. They have none as this ADR
     is written, so even a correctly wired `action` would submit three empty
     fields and the failure would still be silent. Task 11 of this cycle adds
     `name="name"`, `name="email"` and `name="message"` alongside the
     accessibility work, for exactly this reason - so that the day a
     destination is chosen, only the destination is missing.
  3. Success and failure feedback in the UI, since the form currently has no
     state to show either.

- **No characterization test pins this behaviour.** Phase B of this cycle pins
  what the page renders and deliberately asserts nothing about what happens on
  submit. Pinning "the message is discarded" would make the deploy gate defend
  a broken form: a future change that correctly wired the form up would then
  fail CI and block a deploy for doing the right thing.

- **This is the fourth of the four security classes the estate spec asks each
  project to survey, and it is the only one present here.** It is present but
  not exploitable. The other three are absent: no `dangerouslySetInnerHTML`
  anywhere in `front/src`, no `target="_blank"` and therefore no missing
  `rel="noopener noreferrer"`, and no secrets or credentials in the repository
  or the bundle ([`../technical.md`](../technical.md)).
