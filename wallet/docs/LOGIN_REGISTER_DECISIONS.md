Login / Registration — Design Decisions
This documents the design and UX decisions behind the current
Login and Registration screens (`src/screens/LoginScreen.js`,
`src/screens/RegisterScreen.js`), for anyone picking up this code
later.
1. Progressive (two-step) login flow
Login is split into two steps instead of one form with both fields
visible at once:
Step 1 — Identifier: user enters email, clicks Continue.
Step 2 — Password: email is shown as a read-only chip (with a
"Change" link back to step 1), password field appears.
This mirrors the pattern used by major financial/exchange products
(e.g. Binance, most banking apps), and has two practical benefits:
Lets us validate/normalize the email before ever showing a password
field (fewer wasted submits).
Keeps the initial screen visually lighter, which reads as more
"trustworthy" for a financial product than a dense form.
2. Email vs. Mobile as separate tabs, not one field
Rather than accepting "email or phone" in a single ambiguous input
(which complicates validation and placeholder text), login method is
an explicit segmented tab control. Each tab has its own, correctly
-scoped validation:
Email tab: RFC-ish format check, domain autosuggest
(`@gmail.com`, `@yahoo.com`, etc. — see
`src/constants/emailDomains.js`).
Mobile tab: country-specific digit length + pattern rules (see
`src/constants/countries.js`), with a flag + dial-code picker
reused from Registration.
Both `countries.js` and `emailDomains.js` are shared constants used
by both Login and Register, so the two screens can never drift out of
sync on validation rules.
3. Validate on blur/submit, not on every keystroke
Earlier iterations validated live (debounced ~350ms after typing
stopped), which caused "Enter a valid email address" to flash while
the user was still mid-way through typing (e.g. right after `@`,
before the domain). Both screens now validate:
On blur (leaving the field), and
On submit/continue.
`onChange` only ever clears an existing error and updates
autosuggest — it never sets a new error. This avoids interrupting the
user while they're still typing.
4. Consistent visual system across Login/Register
Both screens share:
The same brand header (logo + "VECTRO" + tagline).
The same glass-card styling (`rgba(15,20,33,0.72)` background,
`blur(20px)`, matching border/shadow tokens).
The same accent gradient (`#8b5cf6 → #2563eb`) for primary actions
and the checked state of checkboxes.
The same error/success message treatment (boxed alert with icon for
errors, inline colored text for success) instead of one screen
using plain red text and the other a bordered box.
The same "🔒 protected with secure authentication" footer.
This was a deliberate cleanup — previously the two screens had
diverged (different card border-radius, different error styling,
duplicated country/email-domain data), which reads as unpolished on a
financial product where visual consistency signals trustworthiness.
5. Reusable pieces extracted so far
What	Where	Used by
Country/dial-code data + validation rules	`src/constants/countries.js`	Login (mobile tab), Register
Email domain autosuggest	`src/constants/emailDomains.js`	Login, Register
Status pill badge	`src/components/StatusBadge.js`	KYC status page (consolidated from two duplicate implementations)
Primary/secondary buttons	`src/components/CustomButton.js`	Register (Login currently uses inline-styled buttons — see Known gaps)
Known gaps / not yet extracted
Login's input/button styling is still defined inline in
`LoginScreen.js` rather than sharing `CustomInput`/`CustomButton`
with Register. Worth revisiting if a third auth-style screen is
added, to avoid a third copy of the same visual patterns.
No shared `<Tabs />` component yet — the Email/Mobile segmented
control is bespoke to `LoginScreen.js`.
6. Loading/error states
Buttons show a text-state change ("Sign in" → "Signing in…") and
are disabled while a request is in flight, rather than a full-page
spinner, to keep the form visible and avoid layout shift.
API errors are mapped to plain-language messages in
`authService.js` (e.g. HTTP 401 → "The email or password is
incorrect.", 429 → "Too many login attempts...", 5xx → "Our server
is temporarily unavailable...") rather than surfacing raw backend
error text.
7. Responsiveness
Both screens use a single-column, max-width card (`440px`/`470px`)
centered on the page, which naturally collapses to full-width on
narrow viewports without separate mobile-specific layout code. Fixed
pixel values throughout (padding, font sizes) were kept modest enough
to remain comfortable down to typical mobile widths (~360px) without
a breakpoint-specific style pass — verified manually, not yet covered
by automated responsive tests (see `TESTING.md` if/when added for
manual cross-browser/responsive test notes).