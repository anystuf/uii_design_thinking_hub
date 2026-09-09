# UII Design Thinking Learning Hub & InnoGallery

A high-fidelity, fully editable **Next.js + TypeScript + Tailwind CSS** frontend kit for the UII Design Thinking Learning Hub.

This version applies the USI Hub visual language to the learning platform:

- Deep navy left sidebar and light-mode enterprise dashboard shell
- UII blue/orange token system
- Academic serif headings + sharp sans-serif UI typography
- Studio dashboard: learning metrics, sprint analytics, support ranking, and AI mentor preview
- Course catalog and pre-enrollment overview
- Native InnoGallery with project stage and structured critique panel
- Enrolled learning dashboard with collapsible LMS navigation
- Subtle red sketch-trail canvas for d.school-style tactile interaction

## Recommended local path

Put the folder anywhere you store coding projects. Example:

```powershell
D:\Projects\uii-design-thinking-hub
```

or

```powershell
C:\Projects\uii-design-thinking-hub
```

The important thing is that `package.json` is directly inside the folder you open in Terminal.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Main files

```text
app/page.tsx                         Main page entry
app/globals.css                      Global design tokens and base styles
components/uii-learning-hub.tsx      Main dashboard shell and overview screen
components/course-catalog.tsx        Course catalog section
components/course-overview.tsx       Pre-enrollment course overview
components/inno-gallery.tsx          Gallery feed, project stage, critique panel
components/active-learning-dashboard.tsx Enrolled LMS workspace
components/sketch-trail-canvas.tsx   Red sketch interaction layer
lib/hub-data.ts                      Editable sample data and navigation config
tailwind.config.ts                   UII design system tokens
```

## Suggested next implementation step

Replace mock data in `lib/hub-data.ts` with real records from your UII/USI data source or Firebase/Firestore.
