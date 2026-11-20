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
  correctIndex?: number; feedback?: string;
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
  workshop: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=82",
  stickyNotes: "https://images.unsplash.com/photo-1676277757211-ebd7fdeb3d5b?auto=format&fit=crop&w=1300&q=82",
  chalkboard: "https://images.unsplash.com/photo-1758873272540-439a105db676?auto=format&fit=crop&w=1300&q=82",
  teamwork: "https://images.unsplash.com/photo-1622674777904-386b3ef30c4a?auto=format&fit=crop&w=1300&q=82",
  meeting: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1300&q=82",
  classroom: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1300&q=82",
} as const;

export const DEMO_COURSES: readonly DemoCourse[] = [
  {id:"foundations",title:"Design Thinking Foundations",summary:"Nắm tư duy lấy con người làm trung tâm qua năm chế độ và thử thách nhỏ.",level:"Foundation",duration:"4 tuần",focus:"From curiosity to impact",photo:DEMO_PHOTOS.workshop,accent:"#c6ebff",
   chapters:["Tư duy thiết kế lấy con người làm trung tâm","Hiểu người dùng và bối cảnh","Viết vấn đề cần giải quyết","Tư duy phân kỳ và lựa chọn","Làm nguyên mẫu giấy","Thử nghiệm và phản tư"],
   skills:["Empathy","Problem framing","Iteration"]},
  {id:"empathy",title:"Empathy & Research",summary:"Tập phỏng vấn, quan sát và nhận diện insight thay vì đoán nhu cầu.",level:"Foundation",duration:"2 tuần",focus:"See differently",photo:DEMO_PHOTOS.stickyNotes,accent:"#ffdcc3",
   chapters:["Đạo đức nghiên cứu người dùng","Chuẩn bị phỏng vấn mở","Quan sát trong bối cảnh","Viết ghi chú không thiên kiến","Nhóm dữ liệu và insight","Chia sẻ phát hiện với nhóm"],
   skills:["Interviewing","Research ethics","Synthesis"]},
  {id:"framing",title:"Problem Framing & POV",summary:"Biến dữ liệu thực địa thành POV và câu hỏi How Might We có sức mở.",level:"Intermediate",duration:"2 tuần",focus:"Ask better questions",photo:DEMO_PHOTOS.chalkboard,accent:"#e5ddfa",
   chapters:["Dấu hiệu của vấn đề thật","Tách nhu cầu và giải pháp","Tạo empathy map từ dữ liệu","Viết POV có bằng chứng","How Might We trong thực tế","Soát lại giả định cùng nhóm"],
   skills:["POV","HMW","Synthesis"]},
  {id:"ideation",title:"Ideation Sprint",summary:"Tạo thật nhiều ý tưởng, phát triển phương án rồi chọn điều đáng thử.",level:"Intermediate",duration:"1 tuần",focus:"Make space for ideas",photo:DEMO_PHOTOS.classroom,accent:"#d6f4b8",
   chapters:["Nguyên tắc phân kỳ","Crazy 8s với phác thảo","Brainwriting không áp lực","Kết hợp và biến đổi ý tưởng","Ma trận chọn thử nghiệm","Pitch một phương án"],
   skills:["Divergent thinking","Sketching","Decision-making"]},
  {id:"prototyping",title:"Rapid Prototyping",summary:"Biến ý tưởng thành mẫu giấy, storyboard hoặc trải nghiệm đủ để thử.",level:"Intermediate",duration:"2 tuần",focus:"Make it to learn",photo:DEMO_PHOTOS.teamwork,accent:"#ffdf8c",
   chapters:["Giả định rủi ro nhất","Sketch trải nghiệm bốn khung","Paper prototype","Đóng vai dịch vụ","Chuẩn bị kịch bản thao tác","Chụp và trình bày nguyên mẫu"],
   skills:["Storyboarding","Prototyping","Assumption testing"]},
  {id:"iteration",title:"Testing & Iteration",summary:"Thiết kế thử nghiệm, quan sát người dùng và cải tiến dựa trên bằng chứng.",level:"Intermediate",duration:"2 tuần",focus:"Learn from reality",photo:DEMO_PHOTOS.meeting,accent:"#ffc8d2",
   chapters:["Lập kế hoạch thử nghiệm","Viết tác vụ không dẫn dắt","Quan sát thay vì giảng giải","Tổng hợp phản hồi","Ưu tiên thay đổi","Quay lại thử nghiệm vòng mới"],
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

export const DEMO_EXERCISES: readonly DemoExercise[] = DEMO_COURSES.flatMap((course, courseIndex) =>
  course.chapters.map((chapter, chapterIndex) => {
    const kind = (["QUIZ","QUIZ","WRITTEN","ACTIVITY","PROJECT","QUIZ"] as const)[chapterIndex];
    const prompt = kind === "QUIZ" ? EXERCISE_PROMPTS[chapterIndex] :
      kind === "WRITTEN" ? "Viết phản tư 150–200 từ về điều bạn quan sát và một nhu cầu chưa được đáp ứng. Phân biệt dữ liệu với suy đoán." :
      kind === "ACTIVITY" ? "Trong 8 phút, phác họa tám hướng tiếp cận khác nhau cho vấn đề. Chọn một ý tưởng và nêu vì sao đáng thử." :
      "Tạo nguyên mẫu mức độ trung thực thấp cho chủ đề trên, mô tả một giả định cần kiểm chứng và cách mời người dùng thử.";
    return {
      id: course.id + "-ex-" + (chapterIndex + 1),
      courseId: course.id,
      chapterIndex,
      title: (chapterIndex + 1).toString().padStart(2,"0") + " · " + chapter,
      kind, prompt,
      deliverable: kind === "QUIZ" ? "Chọn một đáp án, nhận phản hồi ngay." :
        kind === "WRITTEN" ? "Bản phản tư ngắn (demo, không lưu)." :
        kind === "ACTIVITY" ? "Ảnh phác thảo tám ý tưởng và ghi chú lựa chọn." :
        "Ảnh/bản vẽ nguyên mẫu, giả định và kịch bản kiểm thử.",
      ...(kind === "QUIZ" ? {
        options: QUIZ_OPTIONS[chapterIndex] as readonly [string,string,string,string],
        correctIndex: 0,
        feedback: "Học từ người dùng và bằng chứng giúp nhóm giảm giả định. Hãy áp dụng điều này trong Design Studio.",
      } : {}),
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
