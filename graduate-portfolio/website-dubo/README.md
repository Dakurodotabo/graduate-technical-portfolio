# DoBu Martial Arts (coursework demonstration)
Multi-page web coursework with a Node.js/Express backend, registration/login, forum posts and profile functionality.

## Start
Run npm.cmd install, then npm.cmd start from the project root.
Visit http://127.0.0.1:3000 (or /Home.HTML). One Node server serves the frontend and backend.
No VS Code Live Server extension, proxy plugin or port forwarding is needed.

## Verification
Run npm.cmd test with the server running for local smoke tests.
Tests create temporary demo account/posts. Runtime data is excluded from Git.

## Important limitations
This is coursework code, NOT production-ready. The client-controlled x-user-id is not secure authentication.
Never expose the app to the public Internet or use real user data without replacing authentication and storage.

## Fixes
- Removed Live Server / proxy dependency; frontend and API share port 3000 via relative API paths.
- Removed logging of passwords and password hashes.
- Started server on loopback only, persisted password changes and added registration validation.
- Excluded runtime user records and user-uploaded media from version control.
