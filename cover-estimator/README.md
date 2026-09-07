# Health Cover Estimator

A Manifest V3 Chrome extension that estimates annual health insurance premiums
for individual and family floater plans in India. Runs entirely in the browser,
stores nothing on a server, calls no APIs.

Built as a linkable asset: something a reader or a finance blogger has a reason
to share, which is where the referring domains come from.

## Install locally

1. Open `chrome://extensions`
2. Turn on Developer mode
3. Click "Load unpacked" and select this folder
4. Click the extension icon to open the side panel

## Before you publish

**Replace the rate table.** `rates.js` holds indicative market-range figures,
not any insurer's filed rate card. Swap in real brochure or API numbers before
launch. Everything else reads from that file — you should not need to touch
`sidepanel.js` to re-price.

**Decide the branding.** The extension currently ships brand-neutral. Publishing
under an insurer's name requires written permission from them; without it the
listing is exposed to a trademark takedown and the Web Store removes first and
asks later. If you have a client agreement covering it, rename in
`manifest.json` and the masthead in `sidepanel.html`.

**Keep the disclaimer.** Financial tools get extra scrutiny in Web Store review.
The "estimate, not a quote" line at the bottom is doing real work there.

## File map

| File | Does what |
|---|---|
| `manifest.json` | MV3 config, side panel registration |
| `background.js` | Opens the panel when the toolbar icon is clicked |
| `rates.js` | The whole rate model — age bands, cover factors, loadings, GST |
| `sidepanel.html` | Panel markup |
| `sidepanel.css` | Styling |
| `sidepanel.js` | Premium engine, rendering, state persistence, copy-to-share |

## Built for link acquisition

Two things in the panel serve the domain-authority goal directly:

- **"Copy this estimate"** produces plain text with the inputs, the full
  breakdown, and a link back to the site. This is what people paste into
  forum and Reddit replies — the answer travels with an attributed link,
  which is where organic referring domains come from.
- **Footer link** points to `https://www.starhealth.in/`. The Web Store
  listing itself is nofollow, so the panel routing installed users to the
  domain is part of what makes the extension worth shipping.

Change the target in one place — `SITE_URL` at the top of the update section
in `sidepanel.js`, and the `href` on `#siteLink` in `sidepanel.html`.

## How the premium is calculated

1. Look up an annual rate per lakh of cover for the person's age band
2. Scale it by cover amount — bigger cover costs less per lakh
3. Scale by city tier — metro hospitals cost more to treat in
4. For floaters, price the eldest member fully, then add each other person at a
   share of that, capped at what their own standalone cover would cost
5. Apply pre-existing condition and tobacco loadings
6. Multiply by term, subtract the multi-year discount
7. Add 18% GST

Sanity-checked against published market ranges: a 32-year-old on ₹10 lakh cover
in a metro lands near ₹11,000 a year; a 60-year-old on the same cover near
₹37,000; a couple with one child near ₹18,700.

## Rollout plan for links

The extension alone won't earn much. The sequence matters:

1. **Landing page first.** Put the tool's home on your own domain — explain the
   calculation, publish the methodology, embed a web version if you can. The
   Web Store listing points here. Store links are nofollow, so the landing page
   is what everything else links to.
2. **Publish and submit.** Web Store review takes a few days for finance-adjacent
   tools. Then submit to extension directories: Chrome-Stats, ExtPose,
   Crx4Chrome, AlternativeTo, SaaSHub, Product Hunt.
3. **Outreach.** Pitch insurance and personal-finance bloggers with the tool as
   the hook, not the brand. "Free premium estimator, no signup" gets replies.
4. **Community.** Answer real premium questions on Reddit r/IndiaInvestments,
   Quora, and insurance forums where the tool genuinely answers the question.
   Drop-and-run linking gets removed; useful answers stay up.

Realistic expectation: 10–25 referring domains over three or four months with
consistent outreach. That is a contribution to authority, not a transformation
of it. The larger lever for an insurance site remains digital PR — original
claim-settlement analysis, survey data, ombudsman complaint trends — which
journalists cite at far higher volume than a calculator.
