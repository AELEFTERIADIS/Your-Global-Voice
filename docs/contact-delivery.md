# Contact page delivery configuration

The approved contact information is in `content/contact.json`. The generator
renders the Contact page from `scripts/contact.mjs`; its additional stylesheet
is `public/contact.css`. Other page content and shared styling are unchanged.

## Current hosting evidence

This repository is a static HTML/CSS site with a local Node.js development server.
There is no production deployment configuration, cPanel access, hosting-plan
metadata, SMTP binding, or mail-provider credentials available in this workspace.
Namecheap being the registrar does not establish which hosting runtime is enabled.
A read-only HTTPS header check of ygvoice.org was blocked by the cloud egress
proxy (CONNECT returned HTTP 403), so it provides no evidence about the live
hosting provider or runtime. No hosting, DNS, mailbox, or Namecheap settings have
been changed.

## Recommended compatible delivery

Use a hosted HTTPS form receiver, such as Formspree, with a verified organizational
recipient. Native HTML POST works with the existing static site and does not require
Node.js hosting, browser SMTP credentials, or DNS changes. No account was created,
service purchased, or provider endpoint activated. Evaluate the provider's current
limits, spam controls, retention, and privacy terms before selecting it.

External steps still required:

1. Confirm which mailbox should receive form messages and that both advertised
   email accounts and the WhatsApp account are operational. Public approval of
   an address does not establish mailbox provisioning or delivery.
2. Supply an approved provider's HTTPS submission URL after verifying the recipient
   and configuring server-side validation, spam filtering/rate limits, sender
   handling, and success/error responses. These must run at the receiver; HTML
   validation alone is not a security control. Never include SMTP/API secrets in
   the page or `content/contact.json`.
3. Approve inquiry privacy/retention practices, including use of an external
   processor. The form provides a consent checkbox and sensitive-data guidance.
4. Set `formEndpoint` to the public submission URL, generate the Contact page,
   and test a real approved message end to end before enabling public submissions.
   Match the production Contact response's `form-action` CSP to the endpoint's
   HTTPS origin. The development server derives this permission from the same
   configuration, exclusively for the Contact routes. Other pages continue to
   prohibit submissions. Test receiver validation, spam controls, success/error
   handling, and delivery to the actual recipient before release.

Until then, the form explicitly states that nothing is transmitted, has no action,
and its send control is disabled. Email links open the visitor's mail application;
the WhatsApp link opens the approved account in a new tab. Neither proves delivery.
The form can be composed locally; hosted form delivery later requires Internet access.

If the existing plan is confirmed to support PHP, an alternative is a same-origin
PHP handler using authenticated SMTP through the existing mailbox service. That
requires private hosting credentials and server-side implementation after the
actual plan is identified. Do not assume that this development Node server is a
production email service. No Namecheap settings changes are required by the
recommended hosted-form approach.
