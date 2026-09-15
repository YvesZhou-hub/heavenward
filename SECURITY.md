# Security policy

## Supported versions

Security fixes go into the `main` branch and are released to [heavenward.vercel.app](https://heavenward.vercel.app). Older releases are not patched.

## Scope

Heavenward is a static, client-only web game. It has no server code, accounts, database, analytics or API keys, and saves stay in the browser's local storage.

Reports that matter include, for example:

- script injection or unsafe rendering from crafted save data, diagnostics or URLs;
- missing or weakened security headers or unexpected content on the deployed site;
- secrets or personal data committed to the repository;
- vulnerable dependencies that ship to the browser.

Editing your own local save to change a run is not a vulnerability.

## Reporting a vulnerability

Please do not open a public issue, pull request or discussion for a suspected vulnerability.

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**, or go directly to <https://github.com/YvesZhou-hub/heavenward/security/advisories/new>. Include:

- the affected version, commit or URL;
- steps to reproduce, or a proof of concept;
- the impact you expect.

Heavenward has a single maintainer, so reports are handled on a best-effort basis. Confirmed issues are fixed in a normal release and disclosed through a GitHub security advisory, crediting the reporter unless they prefer otherwise.
