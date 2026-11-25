/**
 * PUBLIC DEMONSTRATION CONTENT — no real enrollment, user count, rating,
 * endorsement, scheduled event or project outcome is implied.
 * Never write these records to the production LMS database automatically.
 */
export type DemoCourse = {
  id: string; title: string; summary: string; level: "Foundation" | "Intermediate";
  duration: string; focus: string; photo: string; accent: string;
  chapters: readonly string[]; skills: readonly string[];
};
export type DemoExercise = {
  id: string; courseId: string; chapterIndex: number; title: string;
  kind: "QUIZ" | "WRITTEN" | "PROJECT" | "ACTIVITY";
  prompt: string; deliverable: string;
  options?: readonly [string,string,string,string];
  correctIndex?: number; feedback?: string; hint?: string;
  activity?: {title: string; labels: readonly string[]; instruction: string; output: string};
};
export type DemoProject = {
  title: string; team: string; theme: string; mode: string; summary: string; photo: string;
};
export type DemoTool = {
  name: string; mode: string; minutes: number; kind: string; intro: string; output: string;
};
export type DemoEvent = {
  date: string; title: string; format: string; description: string;
};
export const DEMO_PHOTOS = {
  workshop: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=70",
  stickyNotes: "https://images.unsplash.com/photo-1676277757211-ebd7fdeb3d5b?auto=format&fit=crop&w=1080&q=66",
  chalkboard: "https://images.unsplash.com/photo-1758873272540-439a105db676?auto=format&fit=crop&w=1080&q=66",
  teamwork: "https://images.unsplash.com/photo-1622674777904-386b3ef30c4a?auto=format&fit=crop&w=1080&q=66",
  meeting: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1080&q=66",
  classroom: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1080&q=66",
} as const;

export const DEMO_COURSES: readonly DemoCourse[] = [
  {id:"foundations",title:"Design Thinking Foundations",summary:"Learn human-centred design through five stages and small practical challenges.",level:"Foundation",duration:"4 weeks",focus:"From curiosity to impact",photo:DEMO_PHOTOS.workshop,accent:"#c6ebff",
   chapters:["Human-centred Design Thinking","Understanding users and context","Framing the right problem","Divergence and convergence","Paper prototyping","Testing and reflection"],
   skills:["Empathy","Problem framing","Iteration"]},
  {id:"empathy",title:"Empathy & Research",summary:"Practise interviews, observation, and insight synthesis instead of guessing needs.",level:"Foundation",duration:"2 weeks",focus:"See differently",photo:DEMO_PHOTOS.stickyNotes,accent:"#ffdcc3",
   chapters:["User research ethics","Preparing open interviews","Contextual observation","Writing unbiased notes","Clustering data and insights","Sharing findings with your team"],
   skills:["Interviewing","Research ethics","Synthesis"]},
  {id:"framing",title:"Problem Framing & POV",summary:"Turn real observations into evidence-based POV and How Might We questions.",level:"Intermediate",duration:"2 weeks",focus:"Ask better questions",photo:DEMO_PHOTOS.chalkboard,accent:"#e5ddfa",
   chapters:["Signs of a real problem","Needs versus solutions","Evidence-based empathy map","Writing an evidence-based POV","How Might We in practice","Revisiting team assumptions"],
   skills:["POV","HMW","Synthesis"]},
  {id:"ideation",title:"Ideation Sprint",summary:"Generate many ideas, develop alternatives, and select a testable approach.",level:"Intermediate",duration:"1 week",focus:"Make space for ideas",photo:DEMO_PHOTOS.classroom,accent:"#d6f4b8",
   chapters:["Principles of divergent thinking","Sketching with Crazy 8s","Low-pressure brainwriting","Combining and adapting ideas","Selecting ideas for testing","Pitching a solution"],
   skills:["Divergent thinking","Sketching","Decision-making"]},
  {id:"prototyping",title:"Rapid Prototyping",summary:"Turn ideas into paper prototypes, storyboards, or experiences worth testing.",level:"Intermediate",duration:"2 weeks",focus:"Make it to learn",photo:DEMO_PHOTOS.teamwork,accent:"#ffdf8c",
   chapters:["Your riskiest assumption","Four-frame experience sketch","Paper prototype","Service role-play","Preparing task scenarios","Documenting and presenting prototypes"],
   skills:["Storyboarding","Prototyping","Assumption testing"]},
  {id:"iteration",title:"Testing & Iteration",summary:"Design tests, observe users, and improve through evidence.",level:"Intermediate",duration:"2 weeks",focus:"Learn from reality",photo:DEMO_PHOTOS.meeting,accent:"#ffc8d2",
   chapters:["Planning a user test","Writing neutral tasks","Observe without coaching","Synthesizing feedback","Prioritizing improvements","Retesting a new iteration"],
   skills:["Usability testing","Feedback","Reflection"]},
];

const QUIZ_OPTIONS = [
  ["Quan sát hành vi người dùng thực tế","Đoán điều người dùng cần","Chọn công nghệ trước","Chỉ hỏi người trong nhóm"],
  ["Bắt đầu bằng câu hỏi mở","Chỉ hỏi Có/Không","Giới thiệu sẵn giải pháp","Yêu cầu người dùng đồng ý"],
  ["Tập trung vào nhu cầu có bằng chứng","Chốt giải pháp ngay","Bỏ qua lời người dùng","Dựa hoàn toàn vào giả định"],
  ["Tạo nhiều góc nhìn rồi hội tụ","Chọn ý tưởng đầu tiên","Tránh phương án khác biệt","Chỉ dùng giải pháp AI"],
  ["Dùng mẫu đủ để học","Lập trình toàn bộ sản phẩm","Làm logo trước","Không hỏi ý kiến ai"],
  ["Quan sát và ghi nhận phản hồi","Giải thích hộ người dùng","Chỉ thu lời khen","Không sửa mẫu"],
] as const;

const EXERCISE_PROMPTS = [
  "Theo tinh thần Design Thinking, hành động nào giúp nhóm hiểu vấn đề tốt nhất?",
  "Khi bắt đầu nghiên cứu, bạn nên chọn cách hỏi nào?",
  "Một vấn đề được định nghĩa tốt cần dựa trên điều gì?",
  "Khi tạo ý tưởng ban đầu, nhóm nên làm gì?",
  "Với nguyên mẫu đầu tiên, ưu tiên quan trọng nhất là gì?",
  "Khi một người thử nghiệm gặp khó khăn, nhóm cần làm gì?",
] as const;

type QuizConfig = {prompt: string; options: readonly [string,string,string,string]; correctIndex: number; feedback: string; hint: string};
const QUIZ_SCENARIOS: Record<string, Record<number, QuizConfig>> = {
  "foundations": {
    "0": {
      "prompt": "Students rarely use a renovated study area. What should the team do first?",
      "options": [
        "Observe how students actually use the space",
        "Immediately build a booking app",
        "Assume students are simply unmotivated",
        "Buy more desks without talking to anyone"
      ],
      "correctIndex": 0,
      "feedback": "Observation reveals real barriers. New furniture alone does not prove what students need. Record a specific, testable observation.",
      "hint": "Which action gives direct evidence from the people using the space?"
    },
    "1": {
      "prompt": "Your team wants to understand why students avoid the library. Which question is least leading?",
      "options": [
        "The library is noisy, isn't it?",
        "Tell me about the last place you chose to study and why.",
        "Would you support our new app?",
        "Do you wish the library stayed open later?"
      ],
      "correctIndex": 1,
      "feedback": "Asking about a recent experience creates space for unexpected needs and avoids suggesting an answer.",
      "hint": "Invite the participant to describe something that actually happened."
    },
    "5": {
      "prompt": "During prototype testing, someone cannot find the booking button. What should the team do?",
      "options": [
        "Immediately point out the button",
        "Blame the participant",
        "Observe, ask after the task, and record evidence",
        "Delete the whole prototype"
      ],
      "correctIndex": 2,
      "feedback": "Watch and document the point of friction before deciding what to change.",
      "hint": "A test is about real behaviour, not teaching participants where to click."
    }
  },
  "empathy": {
    "0": {
      "prompt": "Your team interviews students about academic stress. Which approach best protects participants?",
      "options": [
        "Record interviews and post them publicly",
        "Obtain consent, collect only needed information, and anonymize notes",
        "Collect phone numbers just in case",
        "Attach full names to every quote"
      ],
      "correctIndex": 1,
      "feedback": "Empathy research requires informed consent, privacy, and data minimization.",
      "hint": "Participants must know how their information will be used and be free to decline."
    },
    "1": {
      "prompt": "Which interview question is least biased when learning why people avoid the campus cafeteria?",
      "options": [
        "The cafeteria is too expensive, right?",
        "Would you use our cafeteria app?",
        "Tell me about the last time you decided where to eat and what influenced you.",
        "Don't you agree there are too few menu items?"
      ],
      "correctIndex": 2,
      "feedback": "A concrete decision story can reveal needs the team did not anticipate.",
      "hint": "Avoid inserting your own conclusion into the question."
    },
    "5": {
      "prompt": "Two participants describe opposite experiences. How should the team report them?",
      "options": [
        "Keep both perspectives, explain their contexts, and flag what remains unverified",
        "Discard the inconvenient interview",
        "Only include evidence supporting the existing idea",
        "Merge them into a false consensus"
      ],
      "correctIndex": 0,
      "feedback": "Credible insights distinguish observations, differences, and assumptions still to be tested.",
      "hint": "Contradictions may reveal different user segments rather than bad data."
    }
  },
  "framing": {
    "0": {
      "prompt": "Students often arrive late to class. Which statement defines a problem rather than a solution?",
      "options": [
        "Build an AI reminder app",
        "Bus riders lack reliable arrival information, making planning difficult",
        "Buy displays for every stop",
        "Require everyone to arrive 30 minutes early"
      ],
      "correctIndex": 1,
      "feedback": "A useful problem statement identifies people, needs, and evidence without locking in one product.",
      "hint": "Describe who struggles and why before naming a technology."
    },
    "1": {
      "prompt": "The team claims students want a 'better app'. Which evidence would test that assumption?",
      "options": [
        "Observe how students complete the current task and where they get stuck",
        "Vote among team members",
        "Choose new interface colours",
        "Copy a competitor's app"
      ],
      "correctIndex": 0,
      "feedback": "Real behaviour and context turn vague preferences into testable user needs.",
      "hint": "A team preference is not proof of a user's problem."
    },
    "5": {
      "prompt": "A How Might We question already assumes the solution must be a chatbot. What next?",
      "options": [
        "Keep it because chatbots are popular",
        "Add more chatbot features",
        "Reframe around the user need and validate assumptions",
        "Start coding immediately"
      ],
      "correctIndex": 2,
      "feedback": "A good HMW question opens multiple solution paths instead of preselecting one.",
      "hint": "Could your HMW also lead to a solution without a chatbot?"
    }
  },
  "ideation": {
    "0": {
      "prompt": "A brainstorming session produces only two similar ideas. What should the team do?",
      "options": [
        "Choose the first idea now",
        "Let the team leader decide",
        "Stop because two is enough",
        "Separate generating ideas from evaluating them, and invite diverse proposals"
      ],
      "correctIndex": 3,
      "feedback": "Divergent thinking before convergence reduces anchoring on the first proposed solution.",
      "hint": "Early judgement usually limits the range of options."
    },
    "1": {
      "prompt": "During Crazy 8s, a teammate spends the whole time perfecting one drawing. What helps?",
      "options": [
        "Encourage quick sketches of several different approaches",
        "Make a polished slide deck",
        "Stop and score the first drawing",
        "Ask everyone to copy it"
      ],
      "correctIndex": 0,
      "feedback": "Crazy 8s is about generating multiple fast ideas, not perfecting one illustration.",
      "hint": "In divergence, variety matters more than polished visuals."
    },
    "5": {
      "prompt": "Your team must choose one idea to test tomorrow. What makes the strongest pitch?",
      "options": [
        "The prettiest logo",
        "A user need, a key assumption, and a small feasible experiment",
        "The most confident speaker",
        "The most sophisticated technology"
      ],
      "correctIndex": 1,
      "feedback": "A strong pitch identifies what the experiment can teach, not just why an idea sounds exciting.",
      "hint": "Prioritize a hypothesis that can be learned from quickly."
    }
  },
  "prototyping": {
    "0": {
      "prompt": "Your team prototypes a study-room finder. Which assumption should be tested first?",
      "options": [
        "Which logo colour looks best",
        "How many introduction slides to use",
        "Whether students can find and confirm a suitable room",
        "Whether the product name is catchy"
      ],
      "correctIndex": 2,
      "feedback": "Test the riskiest assumption about the core task before polishing branding.",
      "hint": "If this assumption fails, does the main solution still have value?"
    },
    "1": {
      "prompt": "Which elements belong in a storyboard for a first-year student support service?",
      "options": [
        "Only the home screen",
        "Context, user actions, decision points, and outcomes in sequence",
        "A technical feature list",
        "The team member roster"
      ],
      "correctIndex": 1,
      "feedback": "A storyboard follows an experience through time and surfaces gaps between individual screens.",
      "hint": "Tell a complete user story rather than showing isolated pages."
    },
    "5": {
      "prompt": "Your paper prototype is finished. How will you learn from a test?",
      "options": [
        "Photograph only the final prototype",
        "Only ask 'Did you like it?'",
        "Force every participant to finish the task",
        "Record the prototype version, task, observations, and changes to test next"
      ],
      "correctIndex": 3,
      "feedback": "Documenting the version, task, and evidence makes later improvements traceable.",
      "hint": "Could the team explain why each change was made later?"
    }
  },
  "iteration": {
    "0": {
      "prompt": "Which usability task is least leading when testing an event registration form?",
      "options": [
        "Register for a Friday workshop using fictional details",
        "Click the blue button in the top-right corner",
        "You find this easy to use, don't you?",
        "Follow each step exactly as I demonstrate"
      ],
      "correctIndex": 0,
      "feedback": "A neutral task describes the goal without telling participants which controls to use.",
      "hint": "Describe the desired outcome, not the steps."
    },
    "1": {
      "prompt": "A participant pauses at the time selection step. What should the observer do?",
      "options": [
        "Point immediately to the right button",
        "Explain why the interface is logical",
        "Record the hesitation and ask about it afterward",
        "Ignore the issue because only one person struggled"
      ],
      "correctIndex": 2,
      "feedback": "Neutral observation avoids hiding problems by coaching the participant.",
      "hint": "You are testing the design, not the participant's ability."
    },
    "5": {
      "prompt": "Three test participants misunderstand the confirmation button. What is a sound next iteration?",
      "options": [
        "Keep it unchanged because development is done",
        "Revise based on observations, state a hypothesis, and retest",
        "Replace the logo",
        "Add a long instruction paragraph without testing"
      ],
      "correctIndex": 1,
      "feedback": "Build–measure–learn requires changes supported by evidence and verified in a new test.",
      "hint": "Testing is a learning cycle, not a pass/fail judgement."
    }
  }
};

const ACTIVITY_CASES: Record<string, NonNullable<DemoExercise["activity"]>> = {
  "foundations": {
    "title": "Crazy 8s — eight approaches",
    "labels": [
      "Idea 1",
      "Idea 2",
      "Idea 3",
      "Idea 4",
      "Idea 5",
      "Idea 6",
      "Idea 7",
      "Idea 8"
    ],
    "instruction": "Sketch each approach in a few words. Explore different options before judging.",
    "output": "Eight quick ideas and one worth testing."
  },
  "empathy": {
    "title": "Empathy Map — observation vs assumption",
    "labels": [
      "What the user says",
      "What the user does",
      "What the team assumes",
      "Questions to verify"
    ],
    "instruction": "Separate observed statements and behaviours from unverified inferences.",
    "output": "A four-quadrant empathy map."
  },
  "framing": {
    "title": "How Might We — open the problem",
    "labels": [
      "HMW 1 · user need",
      "HMW 2 · context",
      "HMW 3 · opportunity",
      "Key assumption"
    ],
    "instruction": "Write three 'How might we…' questions without locking in a solution.",
    "output": "Three HMW questions and one key assumption."
  },
  "ideation": {
    "title": "Crazy 8s — diverse ideas",
    "labels": [
      "Idea 1",
      "Idea 2",
      "Idea 3",
      "Idea 4",
      "Idea 5",
      "Idea 6",
      "Idea 7",
      "Idea 8"
    ],
    "instruction": "Try a different direction in each cell. Save evaluation until after divergence.",
    "output": "Eight distinct ideas."
  },
  "prototyping": {
    "title": "Storyboard — prototype journey",
    "labels": [
      "1. Context",
      "2. Starting action",
      "3. Difficulty or decision",
      "4. Observable outcome"
    ],
    "instruction": "Describe an experience as four frames that could be prototyped on paper.",
    "output": "A four-frame storyboard."
  },
  "iteration": {
    "title": "Feedback Canvas — what changed?",
    "labels": [
      "What worked",
      "What was confusing",
      "Observed evidence",
      "Next change to test"
    ],
    "instruction": "Separate observations from interpretation, then choose one improvement to test.",
    "output": "A feedback canvas and a testable improvement."
  }
};

export const DEMO_EXERCISES: readonly DemoExercise[] = DEMO_COURSES.flatMap((course, courseIndex) =>
  course.chapters.map((chapter, chapterIndex) => {
    const kind = (["QUIZ","QUIZ","WRITTEN","ACTIVITY","PROJECT","QUIZ"] as const)[chapterIndex];
    const quiz = QUIZ_SCENARIOS[course.id]?.[chapterIndex];
    const activity = ACTIVITY_CASES[course.id];
    const prompt = kind === "QUIZ" ? (quiz?.prompt ?? EXERCISE_PROMPTS[chapterIndex]) :
      kind === "WRITTEN" ? `Với chủ đề "${chapter}" trong khóa ${course.title}, hãy mô tả một tình huống cụ thể, phân biệt bằng chứng với giả định và nêu một điều cần xác minh (150–200 từ).` :
      kind === "ACTIVITY" ? activity.instruction :
      `Với chủ đề "${chapter}" trong khóa ${course.title}, hãy tạo một bản mẫu nhỏ, ghi giả định rủi ro nhất và cách quan sát người dùng thử nó.`;
    return {
      id: course.id + "-ex-" + (chapterIndex + 1),
      courseId: course.id,
      chapterIndex,
      title: (chapterIndex + 1).toString().padStart(2,"0") + " · " + chapter,
      kind, prompt,
      deliverable: kind === "QUIZ" ? "Chọn một đáp án, nhận phản hồi ngay." :
        kind === "WRITTEN" ? "Bản phản tư ngắn (demo, không lưu)." :
        kind === "ACTIVITY" ? activity.output :
        "Ảnh/bản vẽ nguyên mẫu, giả định và kịch bản kiểm thử.",
      ...(kind === "QUIZ" ? {
        options: quiz?.options ?? QUIZ_OPTIONS[chapterIndex],
        correctIndex: quiz?.correctIndex ?? 0,
        feedback: quiz?.feedback ?? "Hãy ghi lại bằng chứng bạn cần kiểm tra trong dự án.",
        hint: quiz?.hint ?? "Dựa trên dữ liệu người dùng thay vì giả định ban đầu.",
      } : {
        hint: kind === "WRITTEN"
          ? `Hãy bắt đầu từ một tình huống của chủ đề "${chapter}". Viết một điều bạn thực sự quan sát được, một suy đoán và một câu hỏi để kiểm chứng.`
          : kind === "PROJECT"
            ? `Với "${chapter}", chỉ cần bản thử đơn giản nhất có thể kiểm tra giả định quan trọng; mô tả một tác vụ cho người dùng thay vì xây sản phẩm hoàn chỉnh.`
            : activity.instruction,
        ...(kind === "ACTIVITY" ? { activity } : {}),
      }),
    };
  })
);

export const DEMO_PROJECTS: readonly DemoProject[] = [
  {title:"Campus Study-Space Finder",team:"Nhóm Nova (demo)",theme:"Student experience",mode:"PROTOTYPE",summary:"Giúp sinh viên tìm được nơi học yên tĩnh phù hợp.",photo:DEMO_PHOTOS.stickyNotes},
  {title:"Sustainable Canteen",team:"Nhóm Green Fork (demo)",theme:"Sustainability",mode:"TEST",summary:"Giảm lãng phí đồ ăn và thời gian chờ ở căng tin.",photo:DEMO_PHOTOS.teamwork},
  {title:"Smart Student Support",team:"Nhóm HelpHub (demo)",theme:"Service design",mode:"IDEATE",summary:"Thiết kế quy trình hướng dẫn sinh viên mới không bị lạc thông tin.",photo:DEMO_PHOTOS.classroom},
  {title:"Inclusive Wayfinding",team:"Nhóm Pathmakers (demo)",theme:"Accessibility",mode:"EMPATHIZE",summary:"Giúp khách lần đầu ghé trường tự tin tìm đúng nơi.",photo:DEMO_PHOTOS.chalkboard},
  {title:"Community Garden",team:"Nhóm Growing Together (demo)",theme:"Community impact",mode:"DEFINE",summary:"Thiết kế lịch chia sẻ nguồn lực và chăm sóc khu vườn chung.",photo:DEMO_PHOTOS.workshop},
  {title:"Library Quiet Zones",team:"Nhóm Open Doors (demo)",theme:"Learning space",mode:"TEST",summary:"Cải thiện trải nghiệm tìm chỗ tự học và giảm tiếng ồn.",photo:DEMO_PHOTOS.stickyNotes},
  {title:"Accessible Course Notes",team:"Nhóm Focus First (demo)",theme:"Inclusive learning",mode:"PROTOTYPE",summary:"Thử cấu trúc ghi chú ngắn gọn cho người học dễ mất tập trung.",photo:DEMO_PHOTOS.meeting},
  {title:"Safe School Commute",team:"Nhóm Move Smart (demo)",theme:"Urban mobility",mode:"IDEATE",summary:"Giảm khó khăn khi di chuyển tới trường bằng góc nhìn người dùng.",photo:DEMO_PHOTOS.teamwork},
];

export const DEMO_TOOLS: readonly DemoTool[] = [
  {name:"Interview Guide",mode:"Empathize",minutes:20,kind:"Tool",intro:"Chuẩn bị ba câu hỏi mở và một kịch bản phỏng vấn.",output:"3 câu hỏi mở"},
  {name:"Observation Log",mode:"Empathize",minutes:15,kind:"Worksheet",intro:"Phân biệt điều thấy/nghe với điều suy đoán.",output:"Bảng quan sát"},
  {name:"Empathy Map",mode:"Empathize",minutes:25,kind:"Canvas",intro:"Tổng hợp lời nói, hành vi, suy nghĩ và cảm xúc.",output:"Bản đồ thấu cảm"},
  {name:"POV Builder",mode:"Define",minutes:10,kind:"Template",intro:"Viết người dùng + nhu cầu + insight có bằng chứng.",output:"1 POV"},
  {name:"HMW Reframing",mode:"Define",minutes:12,kind:"Activity",intro:"Mở ra cơ hội thiết kế mà chưa khóa vào một giải pháp.",output:"3 câu HMW"},
  {name:"Crazy 8s",mode:"Ideate",minutes:8,kind:"Activity",intro:"Thử tám ý tưởng trước khi đánh giá.",output:"8 phác thảo"},
  {name:"Idea Selection",mode:"Ideate",minutes:15,kind:"Canvas",intro:"Đối chiếu tác động tới người dùng và tính khả thi.",output:"Ma trận lựa chọn"},
  {name:"Storyboard",mode:"Prototype",minutes:20,kind:"Template",intro:"Mô tả trải nghiệm bằng bốn khung.",output:"Storyboard"},
  {name:"Prototype Checklist",mode:"Prototype",minutes:10,kind:"Tool",intro:"Giữ nguyên mẫu nhỏ, dễ hiểu và kiểm chứng được.",output:"Checklist kiểm thử"},
  {name:"Feedback Canvas",mode:"Test",minutes:15,kind:"Canvas",intro:"Ghi nhận điều hiệu quả, điều vướng và bước cải tiến.",output:"Bản phản hồi"},
];

export const DEMO_EVENTS: readonly DemoEvent[] = [
  {date:"12/01/2027",title:"Design Sprint Bootcamp",format:"On campus · Demo",description:"Workshop một ngày với phỏng vấn, ideation và nguyên mẫu nhanh."},
  {date:"19/01/2027",title:"Human-Centered AI Lab",format:"Hybrid · Demo",description:"Thảo luận cách AI hỗ trợ nghiên cứu mà không thay thế sự thấu cảm."},
  {date:"26/01/2027",title:"Prototype Feedback Day",format:"On campus · Demo",description:"Hoạt động thử nguyên mẫu và cho phản hồi xây dựng."},
  {date:"02/02/2027",title:"Student Project Showcase",format:"On campus · Demo",description:"Giới thiệu sản phẩm dự án và quá trình cải tiến."},
];

export const DEMO_QUOTES = [
  {role:"Sinh viên (tình huống mẫu)",quote:"Khi có một nhiệm vụ nhỏ và ví dụ rõ ràng, mình dễ bắt đầu thực hành hơn."},
  {role:"Giảng viên (tình huống mẫu)",quote:"Hành trình học – thực hành – phản hồi giúp lớp bám sát quá trình sáng tạo."},
  {role:"Mentor (tình huống mẫu)",quote:"Quan trọng không chỉ là ý tưởng, mà là bằng chứng người dùng và điều nhóm học được."},
] as const;
