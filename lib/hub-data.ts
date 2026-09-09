import {
  Archive,
  Award,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Clock3,
  FileText,
  FlaskConical,
  GalleryHorizontalEnd,
  GraduationCap,
  Layers3,
  Lightbulb,
  MessageSquareText,
  Milestone,
  PlayCircle,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export type Difficulty = "Foundation" | "Intermediate" | "Advanced";
export type SprintPhase = "Empathize" | "Define" | "Ideate" | "Prototype" | "Test";

export type Course = {
  id: string;
  title: string;
  mentor: string;
  phase: SprintPhase | "Full Sprint";
  level: Difficulty;
  duration: string;
  tag: string;
  price: string;
  description: string;
  accent: string;
  icon: typeof BookOpen;
  progress?: number;
};

export const sidebarLinks = [
  { label: "Dashboard", icon: Layers3, href: "#dashboard" },
  { label: "Learning Studio", icon: GraduationCap, href: "#studio" },
  { label: "Courses", icon: BookOpen, href: "#catalog" },
  { label: "Sprint Workspace", icon: Milestone, href: "#workspace" },
  { label: "Assignments", icon: FileText, href: "#assignments" },
  { label: "InnoGallery", icon: GalleryHorizontalEnd, href: "#gallery" },
  { label: "Portfolio", icon: Award, href: "#portfolio" },
  { label: "Resources", icon: Archive, href: "#resources" },
  { label: "Community", icon: Users, href: "#community" },
  { label: "AI Mentor", icon: BrainCircuit, href: "#ai-mentor" },
];

export const topNavLinks = [
  { label: "Overview", href: "#dashboard" },
  { label: "Studio", href: "#studio" },
  { label: "Gallery", href: "#gallery" },
  { label: "Learning", href: "#workspace" },
];

export const dashboardMetrics = [
  { label: "Active Courses", value: "12", note: "Open design thinking modules", icon: BookOpen },
  { label: "Sprint Tasks", value: "34", note: "Assignments and peer reviews", icon: Milestone },
  { label: "Learning Resources", value: "86", note: "PDFs, templates, cases", icon: Archive },
  { label: "AI Mentor Suggestions", value: "9", note: "Review before applying", icon: BrainCircuit },
  { label: "Published Projects", value: "128", note: "Portfolio-ready gallery entries", icon: GalleryHorizontalEnd },
  { label: "Lecturer Critiques", value: "1.6k", note: "Evidence-based comments", icon: MessageSquareText },
];

export const courses: Course[] = [
  {
    id: "dt-foundations",
    title: "Design Thinking Foundations",
    mentor: "Dr. Linh Tran",
    phase: "Full Sprint",
    level: "Foundation",
    duration: "4 weeks",
    tag: "Core Studio",
    price: "Enroll free",
    description: "Build confidence with empathy work, reframing, ideation rituals, and critique etiquette.",
    accent: "bg-gradient-to-br from-white via-uii-cream to-blue-50",
    icon: GraduationCap,
    progress: 68,
  },
  {
    id: "prototyping-lab",
    title: "Advanced Prototyping Lab",
    mentor: "Mentor Khoa Nguyen",
    phase: "Prototype",
    level: "Advanced",
    duration: "6 labs",
    tag: "Maker Track",
    price: "Request seat",
    description: "Translate concept evidence into tangible experiments, low-code demos, and testable mockups.",
    accent: "bg-gradient-to-br from-white via-orange-50 to-slate-50",
    icon: FlaskConical,
    progress: 42,
  },
  {
    id: "field-research",
    title: "Ethnographic Field Sprint",
    mentor: "Assoc. Prof. Mai Pham",
    phase: "Empathize",
    level: "Intermediate",
    duration: "3 weeks",
    tag: "Research Intensive",
    price: "Cohort access",
    description: "Practice interviews, observation notes, synthesis maps, and responsible consent workflows.",
    accent: "bg-gradient-to-br from-white via-blue-50 to-slate-50",
    icon: Users,
    progress: 74,
  },
  {
    id: "ai-human-centered",
    title: "AI for Human-Centered Design",
    mentor: "UII Innovation Fellows",
    phase: "Ideate",
    level: "Advanced",
    duration: "5 modules",
    tag: "AI Studio",
    price: "Apply now",
    description: "Use AI responsibly as a design collaborator while keeping human evidence visible.",
    accent: "bg-gradient-to-br from-white via-orange-50 to-amber-50",
    icon: BrainCircuit,
    progress: 26,
  },
];

export const resourceBlocks = [
  {
    title: "Sprint Toolkit Library",
    eyebrow: "PDFs / Templates",
    icon: FileText,
    body: "Empathy maps, HMW cards, experiment canvases, and peer-review rubrics.",
  },
  {
    title: "Critique Circles",
    eyebrow: "Peer Studio",
    icon: MessageSquareText,
    body: "Structured weekly critique rituals for project teams and lecturers.",
  },
  {
    title: "Gallery Jury Board",
    eyebrow: "InnoGallery",
    icon: Star,
    body: "Browse high-performing student portfolios and learn from annotated process evidence.",
  },
];

export const sprintPhases = [
  { name: "Empathize", value: 92, count: 18, color: "bg-uii-blue" },
  { name: "Define", value: 76, count: 14, color: "bg-uii-orange" },
  { name: "Ideate", value: 68, count: 11, color: "bg-uii-success" },
  { name: "Prototype", value: 51, count: 8, color: "bg-uii-warning" },
  { name: "Test", value: 38, count: 5, color: "bg-purple-500" },
];

export const learningJourney = [
  { label: "Needs review", value: 4, color: "#DC2626" },
  { label: "Stable", value: 34, color: "#F37021" },
  { label: "Portfolio-ready", value: 12, color: "#16A34A" },
];

export const supportNeeds = [
  { label: "Field research", value: 9 },
  { label: "Prototype testing", value: 8 },
  { label: "Storytelling", value: 7 },
  { label: "Business model", value: 6 },
  { label: "Peer critique", value: 6 },
];

export const courseProgressRows = [
  { name: "Team Lotus", project: "AgriSense · Prototype", progress: 82, status: "Portfolio-ready" },
  { name: "Circular Lab", project: "Campus Waste · Test", progress: 72, status: "Stable" },
  { name: "Motion Studio", project: "Mobility Safety · Define", progress: 64, status: "Stable" },
  { name: "Delta Team", project: "Water Test Service · Empathize", progress: 56, status: "Needs review" },
  { name: "UII Fellows", project: "Mentor Matching · Ideate", progress: 68, status: "Stable" },
  { name: "Freshman Lab", project: "Orientation Journey · Define", progress: 60, status: "Needs review" },
];

export const studioInsights = [
  {
    title: "Strongest studio pattern",
    body: "Teams that link each gallery slide back to interview evidence receive clearer peer critiques and faster lecturer approval.",
    next: "Next: require one evidence tag on every project stage slide.",
  },
  {
    title: "Design-thinking gap",
    body: "Prototype submissions are strong visually, but many do not state the riskiest assumption being tested.",
    next: "Next: add assumption cards under the Prototype tab.",
  },
  {
    title: "AI mentor rule",
    body: "AI should suggest critique prompts and resource matches only. Students and lecturers decide final ratings.",
    next: "Next: route every AI suggestion through a human approval state.",
  },
  {
    title: "3 teams need review",
    body: "Low evidence traceability appears in interview notes, HMW framing, and testing plans. Schedule focused studio check-ins.",
  },
];

export const syllabus = [
  {
    week: "01",
    title: "Observe before solving",
    phase: "Empathize",
    objectives: [
      "Plan ethical field observations and interview scripts.",
      "Capture need statements without jumping to solutions.",
      "Create a shared evidence wall for team synthesis.",
    ],
  },
  {
    week: "02",
    title: "Frame a precise design challenge",
    phase: "Define",
    objectives: [
      "Convert raw insights into patterns and contradictions.",
      "Write How Might We prompts with clear user, tension, and outcome.",
      "Prioritize opportunities through impact/evidence scoring.",
    ],
  },
  {
    week: "03",
    title: "Generate, select, and storyboard",
    phase: "Ideate",
    objectives: [
      "Run divergence exercises without premature critique.",
      "Select concept bets using desirability, feasibility, and viability.",
      "Build a storyboard that communicates the experience end-to-end.",
    ],
  },
  {
    week: "04",
    title: "Prototype and test the riskiest assumption",
    phase: "Prototype / Test",
    objectives: [
      "Create testable artifacts with minimum fidelity and maximum learning.",
      "Design a moderated test protocol and feedback capture sheet.",
      "Report decisions, pivots, and open risks for the next sprint.",
    ],
  },
];

export const galleryProjects = [
  {
    title: "AgriSense Field Companion",
    author: "Minh Anh · Team Lotus",
    phase: "Prototype",
    rating: "4.7",
    badges: ["Desirable 91", "Feasible 82", "Viable 76"],
  },
  {
    title: "Campus Waste Ritual Map",
    author: "Huy Tran · Circular Lab",
    phase: "Test",
    rating: "4.5",
    badges: ["Evidence 88", "Story 84"],
  },
  {
    title: "Micro-Mobility Safety Kit",
    author: "Lan Pham · Motion Studio",
    phase: "Define",
    rating: "4.8",
    badges: ["Insight 94", "Clarity 89"],
  },
  {
    title: "Peer Mentor Matching System",
    author: "Khoa Le · UII Fellows",
    phase: "Ideate",
    rating: "4.6",
    badges: ["Impact 86", "UX 92"],
  },
  {
    title: "Low-Cost Water Test Service",
    author: "Nhi Vo · Delta Team",
    phase: "Empathize",
    rating: "4.4",
    badges: ["Need 90", "Reach 73"],
  },
];

export const stageSlides = [
  {
    phase: "Empathize",
    title: "Field interview synthesis",
    caption: "12 student interviews, 4 lecturer reviews, and one contradictory need pattern.",
  },
  {
    phase: "Define",
    title: "Opportunity frame",
    caption: "Teams converted evidence into a narrow challenge for first-year students.",
  },
  {
    phase: "Ideate",
    title: "Concept clustering",
    caption: "Ideas were grouped by confidence, social value, and prototype cost.",
  },
  {
    phase: "Prototype",
    title: "Clickable service storyboard",
    caption: "The final artifact combines mobile flows, service cards, and lecturer feedback loops.",
  },
];

export const lmsSections = [
  {
    title: "Sprint 01 · Empathize",
    duration: "48 min",
    items: ["Design research ethics", "Interview warm-up", "Observation capture"],
  },
  {
    title: "Sprint 02 · Define",
    duration: "36 min",
    items: ["Affinity mapping", "Need statements", "HMW framing"],
  },
  {
    title: "Sprint 03 · Ideate",
    duration: "42 min",
    items: ["Creative constraints", "Dot voting", "Concept storyboard"],
  },
  {
    title: "Sprint 04 · Prototype",
    duration: "61 min",
    items: ["Fidelity ladder", "Prototype clinic", "Testing checklist"],
  },
];

export const toolkitFiles = [
  "Empathy Interview Script.pdf",
  "Insight Synthesis Board.fig",
  "Prototype Test Plan.xlsx",
  "Critique Scorecard Template.pdf",
];

export const hubStats = [
  { label: "Sprint modules", value: "24" },
  { label: "Peer projects", value: "128" },
  { label: "Lecturer critiques", value: "1.6k" },
];

export const navigationLinks = [
  { label: "Catalog", href: "#catalog" },
  { label: "Overview", href: "#overview" },
  { label: "InnoGallery", href: "#gallery" },
  { label: "Learning", href: "#workspace" },
];

export const phaseIcons = {
  Empathize: Target,
  Define: Layers3,
  Ideate: Sparkles,
  Prototype: FlaskConical,
  Test: Trophy,
  "Full Sprint": Rocket,
};

export const upcomingWorkshops = [
  { title: "Rapid Ideation Jam", date: "Tomorrow", time: "14:00", icon: Lightbulb },
  { title: "Prototype Critique Circle", date: "Fri", time: "09:30", icon: MessageSquareText },
  { title: "Portfolio Storytelling Clinic", date: "Mon", time: "16:00", icon: PlayCircle },
  { title: "Field Interview Practice", date: "Wed", time: "10:00", icon: CalendarDays },
];
