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

type QuizConfig = {prompt: string; options: readonly [string,string,string,string]; correctIndex: number; feedback: string; hint: string};
const QUIZ_SCENARIOS: Record<string, Record<number, QuizConfig>> = {
  "foundations": {
    "0": {
      "prompt": "Nhóm thấy sinh viên ít sử dụng khu tự học dù trường vừa cải tạo. Bước đầu giúp hiểu vấn đề nhất là gì?",
      "options": [
        "Quan sát hành vi người dùng thực tế",
        "Làm ngay ứng dụng đặt chỗ",
        "Giả định do sinh viên lười học",
        "Tăng thêm bàn ghế mà không hỏi ai"
      ],
      "correctIndex": 0,
      "feedback": "Quan sát giúp xác định thực tế người học gặp khó khăn gì; việc có nhiều ghế chưa chứng minh được nhu cầu. Hãy ghi lại một quan sát có thể kiểm chứng.",
      "hint": "Đừng chọn giải pháp trước. Bước nào mang lại bằng chứng trực tiếp từ người sử dụng không gian?"
    },
    "1": {
      "prompt": "Trong lần phỏng vấn đầu, nhóm muốn hiểu vì sao sinh viên tránh thư viện. Câu hỏi nào giúp tránh dẫn dắt?",
      "options": [
        "Thư viện ồn nên bạn không thích, đúng không?",
        "Lần gần nhất bạn chọn chỗ học ở đâu và vì sao?",
        "Bạn có ủng hộ app mới không?",
        "Có phải bạn muốn thư viện mở muộn hơn?"
      ],
      "correctIndex": 1,
      "feedback": "Một câu hỏi mở về trải nghiệm gần nhất tạo cơ hội phát hiện nhu cầu ngoài giả định của nhóm.",
      "hint": "Hãy chọn câu hỏi khiến người trả lời kể một trải nghiệm đã xảy ra, không chỉ đồng ý với giả thuyết."
    },
    "5": {
      "prompt": "Người thử nguyên mẫu mất nhiều thời gian tìm nút đặt chỗ. Nhóm nên phản ứng thế nào?",
      "options": [
        "Giải thích nút nằm ở đâu ngay lập tức",
        "Xem đây là lỗi người dùng",
        "Quan sát, hỏi lại sau tác vụ và ghi nhận bằng chứng",
        "Xóa ngay toàn bộ nguyên mẫu"
      ],
      "correctIndex": 2,
      "feedback": "Phản ứng tốt nhất là quan sát và ghi lại điểm vướng trước khi quyết định thay đổi.",
      "hint": "Trong kiểm thử, điều cần học là hành vi thực tế; đừng huấn luyện người thử để họ vượt qua lỗi."
    }
  },
  "empathy": {
    "0": {
      "prompt": "Nhóm định phỏng vấn sinh viên về áp lực học tập. Cách xử lý thông tin nào phù hợp nhất?",
      "options": [
        "Ghi hình và đăng lên nhóm công khai",
        "Xin đồng ý, chỉ lưu dữ liệu cần thiết và ẩn danh ghi chú",
        "Thu số điện thoại để tiện đối chiếu dù không cần",
        "Gắn tên thật vào mọi trích dẫn"
      ],
      "correctIndex": 1,
      "feedback": "Nghiên cứu thấu cảm cần tôn trọng sự đồng ý, quyền riêng tư và giới hạn dữ liệu thu thập.",
      "hint": "Người được phỏng vấn cần biết dữ liệu sẽ được dùng thế nào và có quyền từ chối."
    },
    "1": {
      "prompt": "Khi phỏng vấn người ít dùng căn tin trường, câu hỏi nào ít áp đặt nhất?",
      "options": [
        "Bạn thấy căn tin quá đắt đúng không?",
        "Nếu căn tin có app, bạn có dùng không?",
        "Kể lần gần nhất bạn quyết định ăn ở đâu và điều gì ảnh hưởng lựa chọn.",
        "Bạn có đồng ý menu hiện tại quá ít món?"
      ],
      "correctIndex": 2,
      "feedback": "Khai thác một lần ra quyết định cụ thể sẽ giúp nhóm nghe được nhu cầu chưa dự kiến.",
      "hint": "Câu hỏi tốt không tiết lộ kết luận của người hỏi."
    },
    "5": {
      "prompt": "Hai người được phỏng vấn đưa ra trải nghiệm trái ngược. Nhóm nên báo cáo thế nào?",
      "options": [
        "Giữ cả hai góc nhìn, nêu bối cảnh và điều chưa xác minh",
        "Loại một trường hợp cho kết luận đẹp hơn",
        "Chỉ báo cáo điều phù hợp với giải pháp sẵn có",
        "Gộp chúng thành một ý kiến chung"
      ],
      "correctIndex": 0,
      "feedback": "Một insight đáng tin cậy phải phân biệt phát hiện, sự khác biệt và giả định chưa kiểm tra.",
      "hint": "Dữ liệu mâu thuẫn có thể mở ra nhóm nhu cầu hoặc bối cảnh mới, không phải lỗi cần xóa."
    }
  },
  "framing": {
    "0": {
      "prompt": "Sinh viên thường đến lớp muộn. Phát biểu nào thể hiện vấn đề thay vì giải pháp?",
      "options": [
        "Xây app nhắc giờ bằng AI",
        "Người đi xe buýt thiếu thông tin chính xác về thời điểm xe đến, khiến họ khó lên kế hoạch",
        "Mua một màn hình LED cho mỗi bến",
        "Bắt buộc mọi sinh viên đến sớm 30 phút"
      ],
      "correctIndex": 1,
      "feedback": "Tuyên bố tốt xác định đối tượng, nhu cầu và khó khăn có thể kiểm chứng thay vì khóa vào một sản phẩm.",
      "hint": "Hãy tìm câu mô tả người gặp khó khăn và nhu cầu của họ, chưa yêu cầu một công nghệ cụ thể."
    },
    "1": {
      "prompt": "Nhóm cho rằng sinh viên muốn 'ứng dụng xịn hơn'. Bằng chứng nào giúp kiểm tra nhận định?",
      "options": [
        "Ghi nhận cách sinh viên thực hiện tác vụ hiện tại và các điểm vướng",
        "Bỏ phiếu giữa các thành viên nhóm",
        "Chọn màu giao diện mới",
        "Xem app của đối thủ rồi sao chép"
      ],
      "correctIndex": 0,
      "feedback": "Bằng chứng về hành vi thực và bối cảnh giúp chuyển từ ý thích mơ hồ sang nhu cầu có cơ sở.",
      "hint": "Một ý kiến thuận tiện cho nhóm chưa đủ là vấn đề của người dùng."
    },
    "5": {
      "prompt": "Nhóm viết câu HMW và nhận ra nó ngầm bắt buộc dùng chatbot. Nên làm gì?",
      "options": [
        "Giữ vì chatbot đang phổ biến",
        "Thêm nhiều tính năng chatbot",
        "Viết lại HMW xoay quanh nhu cầu, sau đó kiểm tra giả định với người dùng",
        "Chuyển luôn sang lập trình"
      ],
      "correctIndex": 2,
      "feedback": "HMW tốt mở ra nhiều hướng giải quyết; nó không nên đóng khung một giải pháp quá sớm.",
      "hint": "Hỏi liệu câu HMW còn có thể dẫn đến giải pháp không phải chatbot hay không."
    }
  },
  "ideation": {
    "0": {
      "prompt": "Buổi lên ý tưởng đầu tiên chỉ có hai ý tưởng khá giống nhau. Nên làm gì để mở rộng không gian giải pháp?",
      "options": [
        "Chọn ngay ý tưởng đầu tiên",
        "Để trưởng nhóm quyết định",
        "Dừng vì đã đủ hai ý tưởng",
        "Tách pha tạo ý tưởng khỏi pha đánh giá, mời mỗi thành viên đề xuất phương án khác nhau"
      ],
      "correctIndex": 3,
      "feedback": "Phân kỳ trước hội tụ giúp giảm thiên kiến bám vào phương án đầu và mở rộng góc nhìn.",
      "hint": "Khi mới tạo ý tưởng, trì hoãn phán xét có ích hơn xếp hạng ngay."
    },
    "1": {
      "prompt": "Khi dùng Crazy 8s, một thành viên dành hết thời gian vẽ hoàn hảo một ý tưởng. Cách hỗ trợ phù hợp?",
      "options": [
        "Khuyến khích phác thảo nhanh nhiều cách khác nhau trước khi chọn",
        "Chuyển sang làm bản trình chiếu đẹp",
        "Dừng để cả nhóm chấm ý tưởng đó",
        "Yêu cầu mọi người sao chép tranh đầu tiên"
      ],
      "correctIndex": 0,
      "feedback": "Crazy 8s tạo sự đa dạng bằng nhiều phác thảo nhanh; chất lượng thẩm mỹ không phải mục tiêu của vòng này.",
      "hint": "Trong pha phân kỳ, số lượng góc tiếp cận quan trọng hơn độ trau chuốt của một ý tưởng."
    },
    "5": {
      "prompt": "Nhóm có ba ý tưởng, cần chọn một ý tưởng thử trong một ngày. Cách thuyết phục hợp lý nhất?",
      "options": [
        "Ý tưởng có logo đẹp nhất",
        "Nêu nhu cầu người dùng, giả định quan trọng và phép thử nhỏ có thể thực hiện",
        "Ý tưởng mà người nói tự tin nhất",
        "Ý tưởng dùng nhiều công nghệ nhất"
      ],
      "correctIndex": 1,
      "feedback": "Một pitch tốt không chỉ truyền cảm hứng mà còn chỉ ra điều cần học từ thử nghiệm tiếp theo.",
      "hint": "Ưu tiên phương án có khả năng mang lại học hỏi nhanh, thay vì chỉ hấp dẫn khi trình bày."
    }
  },
  "prototyping": {
    "0": {
      "prompt": "Nhóm thiết kế dịch vụ tìm phòng học. Giả định nào đáng ưu tiên kiểm tra bằng nguyên mẫu đầu tiên?",
      "options": [
        "Màu logo nào đẹp hơn",
        "Số lượng slide giới thiệu",
        "Sinh viên có hiểu cách tìm và xác nhận phòng phù hợp hay không",
        "Tên ứng dụng có dễ đọc hay không"
      ],
      "correctIndex": 2,
      "feedback": "Nguyên mẫu nên kiểm tra giả định rủi ro đối với hành vi cốt lõi trước khi đánh bóng thương hiệu.",
      "hint": "Nếu giả định này sai, giá trị chính của giải pháp có còn tồn tại?"
    },
    "1": {
      "prompt": "Khi làm storyboard cho ứng dụng hỗ trợ sinh viên mới, yếu tố nào cần thể hiện?",
      "options": [
        "Chỉ ảnh chụp trang chủ",
        "Bối cảnh, hành động người dùng, điểm quyết định và kết quả ở từng khung",
        "Một danh sách chức năng kỹ thuật",
        "Số lượng thành viên phát triển"
      ],
      "correctIndex": 1,
      "feedback": "Storyboard mô tả trải nghiệm xuyên suốt, giúp nhóm nhìn ra lỗ hổng mà giao diện riêng lẻ không cho thấy.",
      "hint": "Hãy kể một tình huống sử dụng theo thời gian, không chỉ vẽ màn hình."
    },
    "5": {
      "prompt": "Nhóm đã hoàn thành nguyên mẫu giấy. Làm gì để học từ buổi thử nghiệm?",
      "options": [
        "Chỉ chụp ảnh nguyên mẫu hoàn chỉnh",
        "Chỉ hỏi 'bạn có thích không?'",
        "Yêu cầu người dùng luôn hoàn thành tác vụ",
        "Ghi lại phiên bản nguyên mẫu, tác vụ thử, hành vi quan sát và thay đổi cần làm"
      ],
      "correctIndex": 3,
      "feedback": "Minh chứng về thử nghiệm và phiên bản tạo căn cứ cho vòng cải tiến, không chỉ cho phần trình bày đẹp.",
      "hint": "Tài liệu tốt cho phép nhóm quay lại hiểu vì sao đã thay đổi một chi tiết."
    }
  },
  "iteration": {
    "0": {
      "prompt": "Nhóm cần kiểm tra biểu mẫu đăng ký sự kiện. Nhiệm vụ thử nghiệm nào ít dẫn dắt nhất?",
      "options": [
        "Hãy đăng ký một buổi workshop vào thứ Sáu bằng thông tin giả lập",
        "Hãy nhấn nút màu xanh ở góc phải",
        "Bạn thấy giao diện dễ dùng đúng không?",
        "Hãy thao tác đúng như bản hướng dẫn này"
      ],
      "correctIndex": 0,
      "feedback": "Tác vụ nêu mục tiêu nhưng không chỉ ra từng nút; nhờ đó người thử bộc lộ điểm khó hiểu.",
      "hint": "Nhiệm vụ tốt mô tả điều người dùng muốn hoàn thành, không mô tả cách thực hiện."
    },
    "1": {
      "prompt": "Người thử bối rối ở bước chọn giờ. Người quan sát nên làm gì?",
      "options": [
        "Chỉ ngay nơi nhấn cho người dùng",
        "Giải thích vì sao giao diện hợp lý",
        "Ghi nhận điểm dừng và hỏi lại sau khi người dùng hoàn thành hoặc dừng tác vụ",
        "Bỏ qua vì chỉ một người gặp"
      ],
      "correctIndex": 2,
      "feedback": "Quan sát khách quan trước khi hướng dẫn giúp tránh che giấu lỗi của nguyên mẫu.",
      "hint": "Người thử không cần được chứng minh là đã biết dùng sản phẩm."
    },
    "5": {
      "prompt": "Ba lượt thử đều không hiểu nút xác nhận. Cách quyết định vòng cải tiến nào hợp lý?",
      "options": [
        "Giữ nguyên vì đã thiết kế xong",
        "Chỉnh nút theo bằng chứng, nêu giả thuyết thay đổi và thử lại với người dùng",
        "Đổi logo để tạo cảm giác mới",
        "Chỉ thêm một đoạn giải thích dài"
      ],
      "correctIndex": 1,
      "feedback": "Build → Measure → Learn → Improve đòi hỏi thay đổi dựa trên bằng chứng rồi kiểm tra lại tác động.",
      "hint": "Kết quả thử nghiệm là dữ liệu để học, không phải một phán quyết rằng nhóm đã thất bại."
    }
  }
};

const ACTIVITY_CASES: Record<string, NonNullable<DemoExercise["activity"]>> = {
  "foundations": {
    "title": "Crazy 8s — tám cách tiếp cận",
    "labels": [
      "Ý tưởng 1",
      "Ý tưởng 2",
      "Ý tưởng 3",
      "Ý tưởng 4",
      "Ý tưởng 5",
      "Ý tưởng 6",
      "Ý tưởng 7",
      "Ý tưởng 8"
    ],
    "instruction": "Gõ phác thảo bằng vài từ cho mỗi ô; chọn ý tưởng khác nhau trước khi đánh giá.",
    "output": "Tám ý tưởng ngắn và một ý tưởng đáng thử."
  },
  "empathy": {
    "title": "Empathy Map — điều gì là bằng chứng?",
    "labels": [
      "Người dùng nói",
      "Người dùng làm",
      "Điều nhóm suy đoán",
      "Câu hỏi cần kiểm chứng"
    ],
    "instruction": "Phân biệt câu nói/hành vi được ghi nhận với suy luận chưa kiểm chứng.",
    "output": "Bản đồ 4 vùng với ghi chú thấu cảm."
  },
  "framing": {
    "title": "How Might We — mở lại vấn đề",
    "labels": [
      "HMW 1: góc nhu cầu",
      "HMW 2: góc bối cảnh",
      "HMW 3: góc cơ hội",
      "Giả định cần kiểm chứng"
    ],
    "instruction": "Viết ba câu bắt đầu bằng 'Làm thế nào chúng ta có thể…' mà không khóa vào giải pháp.",
    "output": "Ba câu HMW và giả định quan trọng."
  },
  "ideation": {
    "title": "Crazy 8s — ý tưởng đa dạng",
    "labels": [
      "Ý tưởng 1",
      "Ý tưởng 2",
      "Ý tưởng 3",
      "Ý tưởng 4",
      "Ý tưởng 5",
      "Ý tưởng 6",
      "Ý tưởng 7",
      "Ý tưởng 8"
    ],
    "instruction": "Mỗi ô một hướng khác nhau. Đừng dừng lại để chấm điểm trong vòng phân kỳ.",
    "output": "Tám ý tưởng khác biệt."
  },
  "prototyping": {
    "title": "Storyboard — hành trình thử mẫu",
    "labels": [
      "1. Bối cảnh",
      "2. Người dùng bắt đầu",
      "3. Điểm khó khăn/quyết định",
      "4. Kết quả cần quan sát"
    ],
    "instruction": "Phác bằng chữ một trải nghiệm có thể diễn thành nguyên mẫu giấy.",
    "output": "Storyboard bốn khung."
  },
  "iteration": {
    "title": "Feedback Canvas — điều gì đã học?",
    "labels": [
      "Điều người dùng làm được",
      "Điểm người dùng gặp khó",
      "Bằng chứng quan sát",
      "Thay đổi để thử vòng sau"
    ],
    "instruction": "Tách quan sát thực tế khỏi phán đoán rồi xác định một cải tiến có thể thử.",
    "output": "Bảng phản hồi và một giả thuyết cải tiến."
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
