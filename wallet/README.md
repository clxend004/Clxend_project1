# wallet
Database Migrations
These address the gaps found reviewing `wallet_db`'s schema against
what the frontend now sends/expects (see
`docs/IDENTITY_API_INTEGRATION.md`, `docs/INTERNAL_KYC_REVIEW.md`,
`docs/SENSITIVE_DATA_HANDLING.md` in the frontend repo for context).
Run order
Run these in numeric order — later ones assume earlier ones already
ran (e.g. `005_foreign_keys.sql` needs `002_kyc_table_expansion.sql`'s
`reviewed_by` column to exist first).
`001_users_role_and_timestamps.sql`
`002_kyc_table_expansion.sql`
`003_transactions_fixes.sql`
`004_wallets_timestamps.sql`
`005_foreign_keys.sql`
`006_indexes.sql`
How to apply (via pgAdmin, matching your screenshots)
For each file, in order:
Open the Query tool against `wallet_db` (the same tab you used
for `SELECT * FROM users;` etc.).
Open the `.sql` file's contents (or copy-paste them in).
Run it (▶ button).
Check the Messages tab for errors before moving to the next
file.
Or via `psql` from a terminal:
```bash
psql -U postgres -d wallet_db -f 001_users_role_and_timestamps.sql
psql -U postgres -d wallet_db -f 002_kyc_table_expansion.sql
psql -U postgres -d wallet_db -f 003_transactions_fixes.sql
psql -U postgres -d wallet_db -f 004_wallets_timestamps.sql
psql -U postgres -d wallet_db -f 005_foreign_keys.sql
psql -U postgres -d wallet_db -f 006_indexes.sql
```
Safety notes
Every migration uses `IF NOT EXISTS` / existence-check patterns, so
they're safe to re-run without erroring on a partially-applied
database.
Back up your database before running these, especially
`003_transactions_fixes.sql`, which does a data backfill (casting
the existing text `timestamp` column to a real timestamp type). If
your existing timestamp text isn't in a standard format, that
specific `UPDATE` statement will fail loudly rather than corrupt
data — but test on a copy first if you have any production data you
care about.
`003_transactions_fixes.sql` does not drop the old `timestamp`
column automatically. There's a commented-out `003b` step at the
bottom of that file — only run it after confirming your backend
code has been updated to use the new `occurred_at` column instead.
Manual step required after running these
After `001_users_role_and_timestamps.sql`, every existing user
defaults to `role = 'customer'`. You need to manually promote at
least one account to `admin` or `reviewer` before the (future, real)
internal KYC review endpoints can be secured by role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```
What's intentionally NOT included here
Encrypting `kyc.gov_id` — this needs an application-level
decision about key management first. See the note at the bottom of
`002_kyc_table_expansion.sql` for the two realistic options.
Changing `amount`/`balance` from `integer` to a decimal type —
needs your team to confirm whether these are deliberately
smallest-unit integers (common for financial/crypto systems) before
changing the type on populated tables. Notes are left in
`003_transactions_fixes.sql` and `004_wallets_timestamps.sql`.
Actually wiring the backend's `/kyc/submit`, `/kyc/status`, and a
future `/admin/kyc/*` set of endpoints to use these new columns —
these migrations only prepare the schema; the API code itself is a
separate, backend-side task.