# Release C — Evidence, Version History & Submission UAT

Status: review candidate; private Supabase Storage integration requires live credentials.

## Prerequisites

1. Merge and deploy Releases A and B first.
2. Apply migration \`202611050002_evidence_versions\` to a non-production test database.
3. In Supabase, create a private (not public) bucket named \`design-evidence\`.
4. Set backend-only \`SUPABASE_URL\`, \`SUPABASE_SECRET_KEY\` and \`EVIDENCE_BUCKET\`.
5. Ensure no client-side \`NEXT_PUBLIC_*\` secret keys. RLS is enabled on application tables.
6. Run Next.js and backend with real student and lecturer credentials.
7. Use the new /evidence UI; old mock upload and legacy non-snapshot submit APIs now reject writes.

## Functional checks

- [ ] C01: Unenrolled/unauthorized account cannot presign upload or list private evidence.
- [ ] C02: A team member can request signed upload for allowed PDF/PNG/JPEG/MP3/MP4/TXT.
- [ ] C03: Unsupported MIME and >50MB are rejected before token issuance.
- [ ] C04: Browser upload succeeds via \`uploadToSignedUrl\`, never with service secret.
- [ ] C05: Completion verifies actual file size and MIME from Supabase Storage.
- [ ] C06: FileAsset exists only after real upload confirmation.
- [ ] C07: Private file cannot be fetched via anonymous public URL.
- [ ] C08: Authorized team member/lecturer can obtain signed download URL.
- [ ] C09: Different team cannot sign download, even with known fileAsset ID.
- [ ] C10: Evidence v1 can be created with mode and optional uploaded file.
- [ ] C11: Revising evidence creates v2, without changing v1 metadata/file ref.
- [ ] C12: Iteration reason and decision persist across refresh.
- [ ] C13: Project submission freezes selected EvidenceVersion IDs.
- [ ] C14: After evidence revision, an old submission still shows original evidence and file.
- [ ] C15: Milestone submissions have independent numbering from project submissions.
- [ ] C16: Same scope concurrent submissions cannot share a version number.
- [ ] C17: Late submission status is correct and allowLate=false blocks late work.
- [ ] C18: Declared file metadata mismatch causes reject and object cleanup.
- [ ] C19: Prisma migration and seed pass on fresh PostgreSQL.
- [ ] C20: All tests, frontend/backend builds, privacy review and two-student pilot pass.

## Privacy and lifecycle notes

- Signed upload tokens expire; individual token revocation is not supported.
- Only server issues signed download links after project authorization.
- Upload intents that never complete may leave orphaned storage objects: add scheduled
  reconciliation/cleanup before large-scale deployment.
- Deleting a project with frozen submissions is intentionally restricted.
- Confirm institutional policies on data retention and interview participant consent.
