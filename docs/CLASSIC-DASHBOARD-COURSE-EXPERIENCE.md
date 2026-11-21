# Classic dashboard and course-experience milestone

Base: PR #16, commit `94904d7`. Restoration reference: pre-PR #14 dashboard source at `00b2638`.

## Delivered in this branch

- Reinstated classic navy/orange visual identity on Dashboard: dark desktop navigation, welcome hero, metric cards, four workspace modules and five Design Thinking modes. The modern role-aware sections, authenticated backend reads, Help guidance, sign-out and current data remain intact.
- Rebuilt `/learn` into visually distinguished catalog, overview and focused lesson-player states, preserving static-export-compatible query deep links.
- Course cards use a deterministic original graphical fallback when no licensed cover image metadata exists. They do not fabricate ratings, cover photos or completion percentages.
- Catalog includes title/description search, level filtering and enrolled-course selection. Course overview uses only available title, description, level, owner and lesson count data.
- The lesson player supports safe YouTube embeds, permitted direct media links, HTML5 video for approved MP4/WebM URLs, text, resources, previous/next lesson navigation, a Design Studio action and server-persisted lesson completion.
- Authorized lecturers retain editing, publishing and course creation, in areas separate from the learner's player. The `?course=...&lesson=...` deep-link path remains compatible with existing Dashboard resume links.

## Explicit limitations and next milestones

- This version does **not** introduce CourseModule schema migrations, image uploads, rich-text editing, caption authoring, LMS quizzes or a course cover URL field. These require separate backward-compatible backend work and owner-approved content governance.
- Existing lesson lists are flat and ordered; a new Module entity should be introduced only after reviewing migrations, authorization, course-editor requirements and real data.
- Course cards use original CSS graphic covers, not stock photographs. A real media/asset library and image metadata are needed before adding course-specific visual covers.
- Only available learner data is shown. No invented instructor expertise, ratings, certificates, prices or lesson durations.
- The local browser fixture validates enrollment, player and progress. Full staging Student/Lecturer/Admin UAT, private storage, monitoring and recovery remain separate production gates.
- Do not merge or deploy production without owner approval.
