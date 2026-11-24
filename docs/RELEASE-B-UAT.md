# Release B — Design Studio UAT

Status: implementation candidate, not accepted for deployment.

## Setup

- Apply migration 202611050001_design_studio (after Release A migration).
- Run Prisma generate and \`npm run prisma:seed\` to initialize five templates.
- Start authenticated backend and frontend; open /studio.
- Lecturer must own a published course; two students must be enrolled in it.
- Configure valid Supabase Auth users and a trusted database-level lecturer role.

## Functional checks

- [ ] B01: Lecturer can create a challenge draft in own course.
- [ ] B02: Student cannot access a draft challenge.
- [ ] B03: Lecturer publishes challenge; enrolled student can view it.
- [ ] B04: Lecturer adds milestone/deadline.
- [ ] B05: Lecturer assigns one template to the challenge.
- [ ] B06: Student creates a team; five stages appear.
- [ ] B07: Same student cannot create/join another team for same challenge.
- [ ] B08: Team owner invites enrolled student via email; invited student accepts.
- [ ] B09: Another student cannot access private team workspace or tasks.
- [ ] B10: Student can create, assign and update team tasks.
- [ ] B11: Student sees five modes and can switch freely.
- [ ] B12: All five starter templates are present and editable.
- [ ] B13: Activity draft persists in PostgreSQL and reopens after refresh.
- [ ] B14: Activity cannot be marked completed with missing mandatory fields.
- [ ] B15: Lecturer can read assigned course team's activity submissions.
- [ ] B16: Legacy projects from before the challenge migration remain accessible.
- [ ] B17: Project evidence access allows legitimate members but denies other teams.
- [ ] B18: Invalid activity assignment ID cannot be reused in another challenge.
- [ ] B19: Migration applies from clean DB, and seed script is repeatable.
- [ ] B20: Responsive behavior, keyboard focus and unsaved-change warning work.

## Security checks

- Browser can't spoof ADMIN/LECTURER using x-user-role headers.
- Cross-project member and task enumeration returns access denied.
- Only course owner or admin may publish challenges or assign templates.
- Duplicate/parallel acceptance of team invitations cannot violate membership uniqueness.

## Release gates

CI frontend build, NestJS build, Prisma validate and deploy, seed and backend
unit tests must pass. Additionally complete real Supabase JWT, PostgreSQL,
two-student pilot and user-acceptance walkthrough before merging.
