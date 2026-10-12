# Confirmed payment-brand row

- American Express: the organization reports that its live Stripe checkout
  displays American Express. `public/amex-logo.svg` is copied unchanged from
  PayPal's official SDK logos repository, `cdn/2.3.7/amex.svg`, at commit
  `4c39c1ec50b15dde3af99b524fb24ec8aa9fa11b`.
- Link by Stripe: the organization reports seeing Link in the connected Stripe
  checkout. Official asset provenance is recorded in `link-logo.md`.
- PayPal: the organization confirms that its existing PayPal checkout works.
  Its unchanged official wordmark and provenance are in `paypal-logo.md`.

American Express source:
https://github.com/paypal/paypal-sdk-logos/blob/4c39c1ec50b15dde3af99b524fb24ec8aa9fa11b/cdn/2.3.7/amex.svg
The SDK's Apache 2.0 license is included in `paypal-logo-LICENSE.txt`.
These marks identify available payment methods and do not imply sponsorship.

Visa, Mastercard, and Discover acceptance remains unconfirmed for the particular
merchant account and checkout links. Provider websites and documentation were
blocked by this environment. These three marks are intentionally not advertised
as accepted. To add each, obtain a screenshot/list explicitly showing that brand
as accepted on one of the existing live checkout links, or account-specific
confirmation from Stripe/PayPal settings or provider support. Generic credit/debit
card availability alone does not establish every card brand's acceptance.
No real payments, card-number tests, credentials, or account changes are needed.
