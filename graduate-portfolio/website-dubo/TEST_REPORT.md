# DoBu Martial Arts — Local verification

**Test date:** 19 November 2026

The locally repaired coursework application was started with Node.js and tested using `npm.cmd test`.

| Check | Observed result |
|---|---|
| Home page and five named HTML routes | HTTP 200 |
| JavaScript file route | HTTP 200 |
| List forum posts | Passed |
| Register a demo account | Passed |
| Log in with demo credentials | Passed |
| Create a demo forum post | Passed |
| Delete that forum post | Passed |
| Direct request for `/backend/users.json` | HTTP 404 (blocked) |
| JavaScript syntax checks | Passed |

The frontend uses same-origin API calls, removing the previous dependency on a VS Code Live Server extension and a proxy server. No public deployment was performed.

**Safety limitations:** The app retains a client-controlled demo identity header, does not offer production authentication/session security, and stores demo records in JSON. It must remain local-only until reworked. Passing smoke tests does not prove security, accessibility or a comprehensive UI regression suite.
