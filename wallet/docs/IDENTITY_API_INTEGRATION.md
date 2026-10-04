Identity API Integration — `/kyc/submit`
Status: contract confirmed with AI Identity Researcher — ready for backend wiring
The identity verification service is DeepFace-based, with liveness
detection, built as its own separate service (not embedded in
the `/kyc/submit` request handler). Confirmed details below.
Confirmed: image format
The identity/OCR service expects JPEG input for both the ID
document and the selfie.
Frontend handling: rather than rejecting anything that isn't
already a `.jpg` file, the frontend now accepts JPG/PNG/WEBP and
automatically converts to JPEG client-side before upload (see
`src/utils/fileUtils.js` → `convertImageFileToJpeg()`, canvas-based,
no library needed). This keeps the "always send JPEG" contract with
the backend while not making users find/produce a JPEG themselves.
Not handled client-side: PDF (scanned documents) and HEIC
(default format on iPhone camera). Recommendation: handle these
server-side if you want to support them — e.g. `pdf2image` +
Pillow, or `pillow-heif` for HEIC, converting to JPEG before handing
off to the DeepFace service. This is a reasonable v2 addition, not
a blocker for launch — the frontend already guides users to take a
regular photo instead if they pick an unsupported format.
Selfies were already always JPEG (canvas-captured from the camera
stream) — no change needed there.
Confirmed: score thresholds
The identity service returns a `faceMatchScore` (0–100). The
confirmed decision bands:
Score	Outcome
> 85	Accept — `status: "Approved"`
50 – 85	Manual review — `status: "Manual review"`
< 50	Reject — `status: "Rejected"`
Architectural decision: this threshold logic belongs on the
backend, not the frontend. The frontend should never be the thing
deciding whether someone passes identity verification — that's a
security boundary. The backend (or the identity service itself)
should apply this table and return the final `status` already
decided; the frontend just displays whatever `status` and
`faceMatchScore` come back (see `KYCScreen.js`'s response handling —
it already reads `response.status` as the source of truth and only
uses a mock fallback with a visible console warning if the backend
doesn't return one yet).
Confirmed: service architecture
The identity/OCR/liveness service is its own separate service,
not embedded into the `/kyc/submit` handler's own code. This means
your backend's `/kyc/submit` endpoint should:
Receive the multipart upload from the frontend (document + selfie
form fields — already implemented, see below).
Store the files somewhere durable (S3/GCS — see the DevOps
coordination note in `docs/SENSITIVE_DATA_HANDLING.md` and
`db_migrations/002_kyc_table_expansion.sql`'s `document_url`/
`selfie_url` columns).
Call the identity service (as its own network call — likely async,
since face-match/liveness/OCR processing takes longer than a
typical HTTP request timeout budget) with the JPEG selfie (and
document, for OCR).
Apply the threshold table above to the returned score.
Store the result (`face_match_score`, `liveness`, `status`) in the
`kyc` table (columns added in the migration).
Return the final `status`/`faceMatchScore`/`liveness`/`ocrData` to
the frontend in the shape already documented below.
Suggested pattern given step 3 is likely slow: don't make the
frontend's `/kyc/submit` call block on the full identity-service
round trip. Either:
Respond immediately with `status: "Pending"` and process
asynchronously (webhook/polling — frontend already handles a
"Pending" state gracefully), or
If synchronous is simpler for now, just make sure your HTTP timeout
budget (and the frontend's axios timeout, if any is configured) is
generous enough for DeepFace processing time.
Confirmed: OCR ownership
The same person/service that owns DeepFace face-match + liveness also
owns the OCR step that reads the ID number/name off the uploaded
document. One service, one integration point — simplifies coordination
versus two separate vendors.
---
Request — what the frontend sends
`POST {REACT_APP_REAL_API}/kyc/submit`
`Content-Type: multipart/form-data` (set automatically by the browser)
`Authorization: Bearer <token>` (added automatically by the axios interceptor in `src/services/api.js`)
Field	Type	Notes
`govId`	string	The ID number as entered (e.g. Aadhaar number)
`govIdType`	string	e.g. `"Aadhaar"`
`email`	string	Applicant's account email
`mobile`	string	Applicant's account mobile
`fullName`	string	Flat fields, one per key in the personal details form
`dob`, `gender`, `address`, `city`, `state`, `pincode`	string	Same — flat, not nested
`document`	file	The uploaded ID document, always JPEG (converted client-side if needed)
`selfie`	file	The captured/uploaded selfie, always JPEG, sent as `selfie.jpg`
> **Why flat fields, not `personalDetails[fullName]` nesting:** an
> earlier version of this sent personal details using bracket
> notation (a PHP/Rails convention). FastAPI's `Form(...)` doesn't
> automatically un-nest that into a dictionary, which caused a real
> 500 error in testing — FastAPI tried to parse the whole multipart
> body as a single JSON object and failed. Flat fields map directly
> onto simple `Form(...)` parameters with zero extra backend parsing
> needed. See the working FastAPI example below.
```python
from fastapi import Form, File, UploadFile

@app.post("/kyc/submit")
async def submit_kyc(
    govId: str = Form(...),
    govIdType: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    fullName: str = Form(...),
    dob: str = Form(...),
    gender: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    pincode: str = Form(...),
    document: UploadFile = File(...),
    selfie: UploadFile = File(...),
):
    document_bytes = await document.read()
    selfie_bytes = await selfie.read()
    # ...save files, call the DeepFace service, apply the
    # threshold table, save to the kyc table, return the result
```
Confirmed with the AI Identity Researcher
File format: JPEG only, for both the ID document photo and the
selfie. The frontend now enforces this — document/selfie uploads
and the live camera capture all produce/accept `image/jpeg` only
(previously PDF/PNG were also allowed, which would have failed
once real verification was connected).
Verification model: DeepFace, for both face-matching and
liveness detection. The same service also owns the OCR step that
reads the ID number/name off the document photo.
Architecture: runs as its own standalone service, called by
the backend — not embedded directly in the `/kyc/submit` request
handler. The backend calls out to it, then responds to the frontend
with the result.
Score thresholds (used to compute `status`):
Score	Status
> 85	`Approved`
50 – 85	`Manual review`
< 50	`Rejected`
This logic is implemented on the frontend as
`deriveStatusFromScore()` in `kycService.js`, but only as a local
-development fallback for when a response doesn't yet include a
computed `status`. The backend should be the one applying these
thresholds and returning `status` directly — see "Needs
confirmation" below.
Response — what the frontend expects back
On success (HTTP 200/201):
```json
{
  "status": "Pending" | "Approved" | "Rejected" | "Manual review",
  "faceMatchScore": 92,
  "liveness": true,
  "ocrData": {
    "name": "Jane Doe",
    "idNumber": "123456789012"
  },
  "message": "KYC submitted successfully"
}
```
`status` should already reflect the confirmed threshold table (see
above: >85 Approved, 50–85 Manual review, <50 Rejected) — the
backend applies this logic, not the frontend. `faceMatchScore` and
`liveness` are still sent alongside `status` purely for display/audit
purposes (e.g. shown to a reviewer on `/internal/kyc-review` once that
screen is wired to real data).
If the backend doesn't return these fields yet, the frontend
currently falls back to fixed mock values (`faceMatchScore: 85`,
`liveness: true`) for local development only, and logs a
`console.warn` so it's obvious in dev tools that real values aren't
wired up yet. This fallback should be removed once the backend
reliably returns these fields — search for `"KYC: backend response is missing"` in `KYCScreen.js`.
Errors — how the frontend handles them
`saveKYC()` maps HTTP status codes to user-facing messages:
Status	Message shown to user
400	"The submitted document or selfie could not be processed..." (or the backend's own message, if provided)
413	"The file is too large..."
401 / 403	"Your session has expired. Please log in again..."
5xx	"The identity verification service is temporarily unavailable..."
anything else	Backend's error message, or a generic fallback
If your backend returns a specific error body (e.g.
`{ "detail": "..." }` or `{ "message": "..." }`), it's already
extracted by the shared axios error interceptor in `src/services/api.js`
and surfaces here as `error.message` — no extra wiring needed for that
part.
What I could not verify
I don't have network access to your running backend from this
environment, so I could not make a live end-to-end call against
`http://127.0.0.1:8000/kyc/submit` to confirm the field names above
match what your backend actually expects, or that a real response
comes back in the shape described.
To confirm this works end-to-end, you'll need to:
Run your backend locally.
Go through the KYC flow in the app with a real document + selfie.
Check your backend logs / a tool like Postman to confirm the
`multipart/form-data` fields arrive as expected.
Check the browser console for the `"KYC: backend response is missing..."` warning — if you see it, the backend isn't returning
`faceMatchScore`/`liveness` yet and those are still mock values.
If the field names need to change to match your backend, the only
file that needs editing is `saveKYC()` in `src/services/kycService.js`
— nothing else in the app needs to know about the wire format.