Internal KYC Review — Current State & Future Integration
What exists now
`src/screens/KYCReviewScreen.js` (route: `/internal/kyc-review`) lets a
reviewer see submitted KYC applications and mark each one Approved,
Rejected, or Manual review, with an optional note.
This is a functional mock, not a production admin tool. There is
no real backend for it yet — see "What this is NOT" below.
How the mock works
`src/services/kycReviewService.js` uses `localStorage`
(`kycReviewQueue` key) as a stand-in "database".
When a user completes KYC (`KYCScreen.js`), a minimal, masked
entry is pushed into this queue: name, email, mobile, masked ID
(last 4 digits only — see `src/utils/sensitiveData.js`), status,
and timestamp. No raw ID number or selfie is ever stored here —
consistent with `docs/SENSITIVE_DATA_HANDLING.md`.
The review screen reads/writes this same `localStorage` queue.
As a demo convenience only: if the reviewer's decision matches the
applicant's own email (i.e., you're testing in the same browser as
the "applicant"), the applicant's `kycStatus` is updated too, so the
full loop (submit → review → applicant sees new status) can be seen
end-to-end without a real backend. This convenience should be
removed once real accounts/backend exist — a real reviewer and
a real applicant are different people on different devices.
What this is NOT (must change before production)
No real authentication/authorization. The route is only gated
by `ProtectedRoute` (i.e. "is any user logged in"), not by a
reviewer/admin role — there is no roles system anywhere in this
app yet. Right now, any logged-in customer could technically
navigate to `/internal/kyc-review` and see (masked) data for other
users, and change their KYC status. This is only acceptable
because it's running against mock local data in development — it
is not safe to deploy as-is.
No real backend. `localStorage` is per-browser, not shared
across devices/reviewers, and isn't a database. A real
implementation needs:
A backend endpoint (e.g. `GET /admin/kyc/queue`,
`POST /admin/kyc/:id/decision`) with reviewer-role auth.
The review queue populated from actual KYC submissions in your
real database, not pushed client-side.
No access to the actual ID document or selfie. By design (see
`docs/SENSITIVE_DATA_HANDLING.md`), the frontend no longer keeps
raw ID numbers or selfie images anywhere after submission. A real
reviewer legitimately does need to see the actual document to
verify it — that should come from a secure, audited backend
endpoint (e.g. a signed, short-lived URL to view the document,
fetched only when a reviewer with the right role opens a specific
case), not from anything cached in the browser. This screen has a
placeholder note pointing at this document instead of pretending
to show a document it doesn't have.
No audit trail. A real review action (who approved/rejected,
when, from which IP/session) should be logged server-side for
compliance. The mock only stores the note and timestamp
client-side.
No pagination/search. Fine for a demo queue of a handful of
entries; a real queue needs server-side pagination, search, and
sorting once submission volume grows.
Suggested integration shape (for whoever builds the real backend)
```
GET  /admin/kyc/queue?status=Pending&page=1
     -> list of { id, name, maskedIdNumber, email, mobile, status,
                  submittedAt, reviewedAt, reviewerNote }

GET  /admin/kyc/:id
     -> full case detail for an authorized reviewer, including a
        secure reference/URL to view the ID document and selfie
        (short-lived, logged access)

POST /admin/kyc/:id/decision
     body: { status: "Approved" | "Rejected" | "Manual review",
             note: string }
     -> requires reviewer/admin role; should also notify the
        applicant (email/push) rather than relying on them polling
        their own KYC status
```
Once this exists, `kycReviewService.js` just needs its localStorage
calls swapped for calls to these endpoints — `KYCReviewScreen.js`
itself shouldn't need structural changes, since it already treats the
service layer as the source of truth.