Google Login — Setup & Configuration
VECTRO uses Firebase Authentication's Google provider for "Continue with
Google" on the Login screen. This document covers how it's configured,
how the code is structured, and how to set it up in a new environment.
How it works (high level)
User clicks Continue with Google on the Login screen.
`src/services/authService.js` → `googleLogin()` opens a Firebase
popup (`signInWithPopup`) against Google's OAuth flow.
On success, the Firebase ID token (`result.user.getIdToken()`) is
sent to our own backend — `POST /auth/google` in `backend/main.py`
— which verifies it server-side against Google's public keys
(`google.oauth2.id_token.verify_firebase_token`, scoped to our
Firebase project via `FIREBASE_PROJECT_ID`), finds the matching
user by email or creates one (with an auto-created wallet, same as
`/auth/register`), and returns a real VECTRO JWT — the same shape
`/auth/login` returns.
The Firebase profile (name/photo) and the backend's user record are
merged and saved via the same `saveUserAccountDetails()` helper
email/password login uses, so downstream code (KYC, dashboard)
doesn't need to know which provider was used. The real KYC status
is also synced from the backend at this point, same as
email/password login.
As a second factor, the user is still required to verify a 6-digit
OTP (currently simulated client-side — see note in
`LoginScreen.js`) before the JWT is actually committed to
`localStorage` and the user is redirected to the dashboard — see
`pendingGoogleAuth` in `LoginScreen.js`.
On failure, Firebase's error `code` (or the backend's error
message) is mapped to a plain-language message (popup closed,
popup blocked, network error, invalid/expired Google token, or an
existing account under a different provider).
Where the code lives
File	Responsibility
`src/firebase.js`	Initializes the Firebase app, exports `auth` and `provider`
`src/services/authService.js`	`googleLogin()` (Firebase sign-in + calls backend + profile mapping + error mapping), `logoutUser()` (signs out of Firebase + clears local session)
`src/screens/LoginScreen.js`	Calls `googleLogin()`, holds the pending JWT in `pendingGoogleAuth` until OTP passes, then commits it to `localStorage`
`backend/main.py`	`POST /auth/google` — verifies the Firebase ID token, finds/creates the user, issues the real JWT
`src/components/navigation/Navbar.jsx`	Calls `logoutUser()` on logout
Environment configuration
Firebase config values are not hardcoded — they're read from
environment variables so each environment (local/staging/prod) can
point at its own Firebase project without code changes.
Copy `.env.example` to `.env` and fill in the values from your
Firebase project:
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```
`.env` is gitignored and must never be committed. `.env.example` has
empty placeholders and is safe to commit.
The backend also needs its own `FIREBASE_PROJECT_ID` in
`backend/.env`, set to the same project id as
`REACT_APP_FIREBASE_PROJECT_ID` above — this is what `POST /auth/google` checks the ID token's audience against. It needs no
service-account key or admin SDK: `google.oauth2.id_token` verifies
against Google's public certs using just the project id. Run `pip install google-auth` in the backend environment if it isn't already
installed.
> Note: Firebase's client-side config values (API key, project ID,
> etc.) are not secret in the traditional sense — Google's docs
> confirm they're safe to ship in a client bundle, since real access
> control happens via Firebase Security Rules and OAuth consent, not
> by hiding these values. They were moved to `.env` anyway for
> environment-portability and to keep all config in one place.
Setting up a Firebase project (new environment)
Go to the Firebase Console
and create a project (or use an existing one).
Authentication → Sign-in method → Google → enable it.
Authentication → Settings → Authorized domains → add every
domain the app will be served from (e.g. `localhost` is included
by default; add your staging/production domains here too — Google
sign-in will fail with `auth/unauthorized-domain` otherwise).
Project settings → General → Your apps → add a Web app (or
select the existing one) → copy the `firebaseConfig` values into
your `.env` file, matching the variable names above.
Restart `npm start` after editing `.env` (env vars are only read
at build/start time, not hot-reloaded).
Logout behavior
`logoutUser()` in `authService.js`:
Calls Firebase `signOut(auth)` — ends the Google session if one is
active. Wrapped in try/catch: if the user logged in via
email/password (no Firebase session exists), this call is a no-op
and won't block logout.
Always clears local session data (`token`, `userEmail`,
`userMobile`, `registeredMobile`, `kycStatus`, `user`,
`currentUser`) in a `finally` block, regardless of whether the
Firebase call succeeded.
Known limitations / follow-ups
The OTP step after Google login is currently a client-side
simulation (a random code logged to the browser console, not sent
via SMS/email). This needs a real backend/SMS provider before
production use — note that unlike the mobile-tab OTP flow, the
Google flow's backend session (JWT) is already real; only the
2nd-factor code itself is simulated.
A first-time Google sign-in and a returning one are now both
handled correctly by `POST /auth/google` (find-by-email, else
create the user + wallet) — this is no longer a limitation.
A Google-only account is created with an unusable random password
hash and a placeholder `mobile` value (`google:<firebase-uid>`),
since neither is supplied by Google Sign-In. If a Google user later
wants email/password or SMS-based login too, that still needs a
proper "link an existing account" flow — not built yet.