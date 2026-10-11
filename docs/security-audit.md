# Pre-publication repository audit

The pre-publication baseline was main commit 8824533. All remote branches and tags
were fetched before inspecting the non-shallow repository. The available history
contained 11 reachable commits and 94 distinct historical file blobs.

Gitleaks v8.24.3 was downloaded from its official GitHub release and verified
against the release checksum. Standard rules plus a Resend-key rule scanned:

- Git history across all available refs.
- Every historical blob, including files removed or replaced in later commits.
- The full current repository checkout, including the publication changes.

No credential findings were reported. No historical filenames indicated a private
key, environment credential file, or secret store. The displayed organizational
emails, approved mailing address, and WhatsApp number are intentional public
contact information. Simulated test credentials are test-only strings. No real
mail-provider credentials are available in this checkout.

The staged Pages artifact is independently tested to contain only approved public
HTML/assets and `.nojekyll`, excluding server source, Git history, configuration,
docs, tests, and environment files. It uses a static-host marker to avoid backend
requests, and preserves the original page content, logo, and design.

The publishing workflow repeats redacted credential scans before every build and
blocks deployment on failures. All third-party Actions are pinned to complete
commit identifiers. Deploy permissions are restricted to the publish job. Following explicit owner
authorization for automatic publishing, its earlier approval-variable gate was
replaced with a default-GitHub-domain check that blocks custom-domain deployment.

This records results for available repository history; it is not a guarantee
about unknown credentials, deleted remote refs, or external hosting accounts.
No history was rewritten, existing work removed, domain/mail settings changed,
or public deployment performed during preparation.
