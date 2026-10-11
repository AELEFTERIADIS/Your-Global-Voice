# Contact page setup and delivery

The Contact page implements all approved public details, mailto links, WhatsApp
communication, address copying, and the eight requested inquiry categories.
`content/contact.json` holds public details only. `scripts/contact.mjs` renders
Contact content, and `public/contact.css` and `public/contact.js` apply only there.
The other seven HTML pages, shared CSS, and circular logo are unchanged.

## Actual delivery status

Email delivery is **not configured or verified**. No provider request was sent.
The browser probes `/api/contact/status`; the server returns unavailable without
mail configuration, and Send stays disabled. Local `file://` viewing displays the
contact information and copy fallback, but cannot submit to a server. No delivery
success is displayed in either case. Tests use an explicitly simulated provider.

## Server implementation

The existing Node preview server now includes `/api/contact/status` and
`POST /api/contact`. It validates name, email, category, message length, and
consent on the server. Categories are allowlisted. Donations & Financial Support
is routed to support@ygvoice.org; all others go to info@ygvoice.org. Recipients
cannot be supplied or overridden by the browser. Mail contains the full name,
email, category, and message in plain text. Visitor email is Reply-To, never From.

Spam controls include a honeypot, same-origin JSON submissions, cryptographically
random single-use tokens bound to the connection address, a one-second minimum
submission time, token expiry after 15 minutes, a five-attempt/15-minute address
limit, limited token issuance, and a 32-KiB request limit. Provider requests time
out after ten seconds. Errors do not expose provider details or credentials.
Success uses the requested exact wording only after the delivery API returns a
successful response with an acceptance identifier. Acceptance does not prove
final inbox delivery; provider logs and inbox receipt must also be checked.

## Compatible delivery option and required external configuration

A server-side HTTPS Resend adapter is implemented. No SMTP/API credentials are in
public files or Git. Provide these variables privately in the server environment:

- `CONTACT_MAIL_API_KEY`: Resend key authorized to send emails, used only in HTTPS
  requests to api.resend.com. Do not supply its value in chat or public code.
- `CONTACT_MAIL_FROM`: an existing verified sender email authorized by that
  provider. Verification must already cover that sender/domain. If no verified
  sender exists, delivery cannot be enabled under the current restriction against
  DNS changes. Any future verification that requires DNS needs separate approval.
- `CONTACT_SITE_ORIGIN`: exact HTTPS website origin for a future production
  handler. Local preview automatically permits its own localhost origin.

The repository contains a static website and local Node development server,
not a known production Node hosting configuration. No cPanel access, hosting-plan
metadata, SMTP bindings, or mail credentials were available. A prior read-only
HTTPS probe of ygvoice.org was blocked by the cloud egress proxy (CONNECT 403);
it did not identify the live hosting runtime. Namecheap as registrar does not
establish Node/PHP hosting capability.

Before making the form public, confirm that the existing host can run the Node
handler, or host an approved equivalent handler using an available server runtime.
A static-file host alone cannot process this API. Do not deploy the development
server unchanged: it intentionally binds loopback. A future production integration
must supply HTTPS, private process variables, the exact allowed origin, and route
the Contact API to the server. Keep the Contact-only CSP script/connect/form
permissions and prohibit forms/scripts on other pages. Configure a production
request timeout and durable/shared rate limits for multiple server instances.
The current limiter uses the actual socket address, ignores untrusted forwarded
headers, and resets on restart. Behind a proxy it may limit all users together;
trusted proxy handling must be decided for the actual hosting architecture.

No purchase, account creation, DNS/email/hosting setting change, or deployment
has been performed. Confirm both published mailboxes and the WhatsApp account
are operational, approve inquiry retention/privacy practices, then run a real
end-to-end acceptance and inbox-delivery test before release. Verify provider
rejections/timeouts, spam controls, and the success/error messages as well.

## Development verification

Run `node --test` to test the committed pages and server without regeneration.
Run `node scripts/build.mjs` when changing Contact source; other page output
should remain byte-identical. `node scripts/server.mjs` starts local preview.
No dependency installation is required. Mailing-address copying uses Clipboard
API when supported and selects the address for Command+C/Ctrl+C otherwise.
