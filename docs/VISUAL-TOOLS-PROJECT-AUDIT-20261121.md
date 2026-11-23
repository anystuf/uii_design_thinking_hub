# UII product audit: visual convergence, tool canvases, evidence and project readiness
Date: 2026-11-21. Scope: isolated PR #20 preview. The public homepage visual language is now the reference design system.

## Single UII design system
Canonical reference: public / landing. Typography Plus Jakarta Sans, cream #faf8f1, deep ink/navy #173445, coral #c94b35, sky #c4edf4, mint #c8ebe3, soft pastel card groups, generous spacing, rounded surfaces and editorial labels. This is applied to /dashboard, /learn, /studio, /evidence, /review, /admin, /notifications through WorkspaceNav, workspace-root class and app/globals.css. Both logo and explicit sidebar item point to /. Course hero reprises 'Try, learn, try again'; dashboard uses matching navy banner; Studio highlights hands-on project development.

The creative pointer trail is auto-on, now 2.6px instead of 5px, maximum 95 sampled points, per-segment age-based fading immediately (860ms lifetime) and decreasing opacity toward the tail. There is no long opaque hold; Reduced Motion still displays a static stroke for 700ms, without animation. Focus Mode suppresses ink.

## Hands-on toolkit, not ten text boxes
The public demo now has a lightweight native canvas for each of the 10 activity types (one React component, no new SDK dependencies): Interview Guide, Observation Log, Empathy Map (6 sticky-note zones), POV Builder, HMW Reframing, Crazy 8s (8 idea slots), Idea Selection (2x2), Storyboard (4 scenes), Prototype Checklist and Feedback Canvas. Users can create and delete additional sticky notes within supported tools, copy the draft and/or move to an official provider template.

Official Miro resources are linked to the specific template where available, e.g. empathy map https://miro.com/templates/empathy-map/ and storyboard https://miro.com/templates/storyboard/. These are external links, **not embedded edit-in-place**: third-party CSP/X-Frame-Options and login/collaboration terms cannot be assumed. Do not frame external links as embedded integrations. This saves bundle weight and avoids unsupported iframe promises. /demo remains transient and does not fake LMS submissions. Studio's real authenticated activities are saved per template via existing API and have a pastel grid layout, but are NOT yet a true collaborative canvas.

## Storage-light submissions
Backend currently enforces <=50 MiB per uploaded file in PresignUploadDto, not the unverified UEH-LMS 100MB assumption. /evidence now has an optional external URL field supporting HTTPS official Drive/Docs/Miro/Figma/Canva/GitHub/Notion/OneDrive URLs, stored as a structured marker inside the existing versioned evidence description (max 3000 chars). Validation occurs in lib/external-evidence.ts. Every version and snapshot retains its **link string**, and the UI exposes the clickable reference. No Prisma migration, no increase in blob storage or new backend deploy is necessary for this first release.

Important limitation: the content of a Google Drive/Miro document is externally mutable; UII's snapshot does **not** archive the linked artifact, check permissions, scan the resource or fix the file revision. Students should grant the lecturer/reviewer view access using appropriate restricted sharing, verify access before the due date and avoid changing the file after submission. Never force 'Anyone with link' for private projects. File uploads remain available with existing private storage controls.

## Project workspace capability audit
Current implementation includes authenticated course-to-challenge selection, challenge drafts/publication, milestones with due dates, lecturer-assigned activities, team creation, invitation and acceptance, basic taskboard with assignees/statuses, non-linear five-mode navigation, activity drafts/completion and server persistence, versioned evidence and submission snapshots, rubric and assessments. This is a credible project **MVP**, not a full-featured Stanford d.school-style collaborative Design Studio.

Still missing or requiring real-user validation:
- Dedicated in-LMS visual whiteboard with simultaneous collaborative sticky-note drag/drop, drawing, storyboard/image upload and conflict resolution; the new public demo canvas is local-only.
- A project-wide visual timeline/dependency view, milestones consolidated across courses and cohort analytics for lecturer/admin.
- Fine-grained notifications and due date escalation, reviewer tracking and evidence link accessibility checks.
- Version-pinned third-party files or archived exports for legal-grade immutable assessment.
- Dedicated typed external URL field in database and malicious link reputation checking for production maturity. Marker-in-description is a no-migration preview compromise.
- Role approval UI and production-grade privacy/accessibility/UAT verification with real accounts.

## Acceptance gates
Frontend build/lint, backend tests, mobile 320px, contrast, cursor, auth, project access controls, 10 demo tools (especially Empathy Map and Storyboard), data not leaking into Supabase from demo, versioned project link save/revise and link display through authorized project pages. Check CI and isolated Vercel READY. Do not claim shared staging is updated unless its alias was explicitly assigned. Do not merge to main before owner/student/lecturer UAT.
