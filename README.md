# CarGPT website

Static HTML, CSS and vanilla JavaScript. There is no compilation or production
build step: deploy the root HTML files, `styles.css`, `preview.js`, `analytics.js`
and `assets/` as static files. No package installation is required.

## Website analytics

`analytics.js` loads the supplied Umami tracker only after explicit consent,
using website ID `a8742fc8-7075-431c-b936-61a4e8616efe`. It disables automatic
tracking and optional features, sending only consent-gated pageviews. The
before-send guard blocks tracking after withdrawal and sanitizes page/referrer
addresses. Query/hash-only history changes do not generate extra pageviews.
There are no custom events or user IDs. No reload is needed to withdraw.

Choices use `cargpt.umami.consent.v1` (`accepted`/`denied`). Storage failures fail
closed; a session flag provides an additional block where available. When both
storage mechanisms fail, the in-memory block lasts for the current document;
a future visit may see the old preference. Storage events synchronize persisted
choices; BroadcastChannel also communicates changes where available.

Every page provides the same optional-analytics banner and footer preferences
button. Keep these shared markup sections in sync when adding pages. The linked
website notice is in `privacy.html#website-analytics`; the existing iOS app
privacy disclosures remain separate.

References: [Umami tracker configuration](https://docs.umami.is/docs/tracker-configuration),
[tracker functions](https://docs.umami.is/docs/tracker-functions),
[metric definitions](https://docs.umami.is/docs/metric-definitions), and
[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj).
