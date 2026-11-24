/**
 * Original, reusable Design Thinking learning material for lecturer-authorized courses.
 * No third-party media is bundled and no learner progress is simulated here.
 */
export type ThinkingMode = "EMPATHIZE" | "DEFINE" | "IDEATE" | "PROTOTYPE" | "TEST";

export type LearningKitLesson = {
  mode: ThinkingMode;
  title: string;
  objective: string;
  content: string;
  mission: string;
  deliverable: string;
  questions: readonly string[];
  hints: readonly string[];
  quiz: {
    prompt: string;
    options: readonly [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
};

export const DESIGN_THINKING_KIT: readonly LearningKitLesson[] = [
  {
    mode: "EMPATHIZE",
    title: "M01 · Empathize — Lắng nghe để hiểu người dùng",
    objective: "Thu thập trải nghiệm thực tế thay vì suy đoán nhu cầu.",
    content: `MỤC TIÊU: Sau bài học, bạn viết được 3 câu hỏi mở và thực hiện một cuộc phỏng vấn thấu cảm.

KHỞI ĐỘNG: Hãy nhớ lần gần nhất bạn gặp khó khăn khi tìm một nơi tự học yên tĩnh. Đừng vội nghĩ ra ứng dụng.

KIẾN THỨC: Empathize tập trung vào hành vi, bối cảnh, khó khăn và động lực của con người. Đặt câu hỏi về trải nghiệm đã xảy ra: “Lần gần nhất bạn gặp việc này là khi nào?”, “Điều gì khiến bạn khó xử lý nhất?”. Tránh câu hỏi dẫn dắt như “Bạn có muốn dùng ứng dụng AI của chúng tôi không?”.

THỰC HÀNH: Phỏng vấn một người, ghi lại ít nhất ba phát biểu nguyên văn và tách chúng khỏi nhận định của nhóm.

TỰ KIỂM TRA: Bạn đang ghi nhận điều người dùng nói hay đang ghi lại giả định của chính mình?

ĐẦU RA: 3 câu hỏi mở, 3 phát biểu nguyên văn và 1 quan sát đáng chú ý. Tạo hoạt động Empathy trong Design Studio và lưu bản nháp.`,
    mission: "Phỏng vấn một sinh viên về trải nghiệm tìm nơi tự học trong trường.",
    deliverable: "3 câu hỏi mở + 3 trích dẫn từ người dùng + 1 insight được đánh dấu là giả thuyết.",
    questions: ["Người dùng đã thực sự trải qua điều gì?", "Câu hỏi có gợi ý sẵn giải pháp không?", "Đâu là bằng chứng trực tiếp?"],
    hints: ["Bắt đầu bằng “Hãy kể về lần gần nhất…”", "Đừng tranh luận với người được phỏng vấn; ghi lại chính xác lời họ."],
    quiz: { prompt: "Câu nào là câu hỏi phỏng vấn thấu cảm tốt nhất?", options: ["Bạn thích ứng dụng mới này đúng không?", "Hãy kể về lần gần nhất bạn không tìm được chỗ tự học.", "Bạn có muốn chúng tôi làm chatbot không?", "Ý tưởng của nhóm tôi có tuyệt vời không?"], correctIndex: 1, explanation: "Câu hỏi mở về một trải nghiệm thật cho phép quan sát nhu cầu mà không dẫn dắt giải pháp." },
  },
  {
    mode: "DEFINE",
    title: "M02 · Define — Xác định đúng vấn đề",
    objective: "Tổng hợp nghiên cứu thành phát biểu vấn đề rõ người dùng và nhu cầu.",
    content: `MỤC TIÊU: Viết được một Point of View (POV) dựa trên nghiên cứu.

KHỞI ĐỘNG: Đọc ba phát biểu đã ghi ở Empathize. Những điều gì lặp lại và điều gì là bất ngờ?

KIẾN THỨC: Nhóm các quan sát tương đồng, tìm nhu cầu và insight. Viết POV theo mẫu: [Người dùng cụ thể] cần [nhu cầu] vì [insight bất ngờ]. Phân biệt nhu cầu với giải pháp: “cần tìm nơi học phù hợp” không đồng nghĩa với “cần một ứng dụng”.

THỰC HÀNH: Viết hai POV khác nhau, dùng dữ liệu phỏng vấn để chọn một POV có cơ sở hơn.

TỰ KIỂM TRA: Nhóm có thể chỉ ra phát biểu nào của người dùng hỗ trợ POV không?

ĐẦU RA: 1 POV và 1 câu hỏi How Might We (HMW) mở hướng khám phá.`,
    mission: "Tổng hợp dữ liệu phỏng vấn thành một phát biểu vấn đề và câu hỏi HMW.",
    deliverable: "1 POV (người dùng + nhu cầu + insight), 1 HMW và các trích dẫn hỗ trợ.",
    questions: ["Vấn đề nói về nhu cầu hay đang nhét sẵn giải pháp?", "Ai là người bị ảnh hưởng?", "Insight được hỗ trợ bởi bằng chứng nào?"],
    hints: ["Dùng mẫu: “Sinh viên ... cần ... bởi vì ...”", "Chuyển POV thành câu “Làm thế nào chúng ta có thể…?” mà không gắn sẵn công nghệ."],
    quiz: { prompt: "Phát biểu nào là một POV phù hợp?", options: ["Chúng ta cần làm ứng dụng tìm phòng học.", "Sinh viên năm nhất cần biết không gian nào đang phù hợp vì họ ít có thời gian đi thử từng nơi.", "AI giải quyết mọi vấn đề.", "Thiết kế giao diện màu xanh."], correctIndex: 1, explanation: "POV thể hiện đối tượng, nhu cầu và insight, chưa khóa vào một giải pháp cụ thể." },
  },
  {
    mode: "IDEATE",
    title: "M03 · Ideate — Phát triển nhiều phương án",
    objective: "Đưa ra phương án đa dạng trước khi chọn để thử nghiệm.",
    content: `MỤC TIÊU: Đề xuất ít nhất 8 ý tưởng và lựa chọn một ý tưởng để thử.

KHỞI ĐỘNG: Đọc câu HMW của nhóm. Đặt đồng hồ cá nhân nếu bạn muốn, nhưng không có giới hạn bắt buộc.

KIẾN THỨC: Tách tư duy phân kỳ (tạo nhiều ý tưởng) khỏi tư duy hội tụ (chọn ý tưởng). Hoãn phán xét trong vòng đầu, khuyến khích những hướng khác nhau, sau đó đánh giá dựa trên nhu cầu, tính khả thi và điều có thể kiểm chứng.

THỰC HÀNH: Viết 8 ý tưởng độc lập. Gom các ý tưởng tương tự. Chọn 2 phương án để so sánh, ghi lý do chọn 1.

TỰ KIỂM TRA: Nhóm đã xem xét phương án phi công nghệ hoặc quy trình chưa?

ĐẦU RA: Danh sách ý tưởng, tiêu chí lựa chọn và phương án để prototype.`,
    mission: "Tìm ít nhất 8 cách giúp sinh viên chọn được nơi học phù hợp.",
    deliverable: "8 ý tưởng khác biệt + ma trận lựa chọn ngắn + 1 ý tưởng ưu tiên.",
    questions: ["Có bao nhiêu ý tưởng thực sự khác nhau?", "Có ý tưởng không cần app không?", "Tiêu chí chọn có xuất phát từ nhu cầu người dùng?"],
    hints: ["Thử giải pháp về dịch vụ, biển chỉ dẫn, quy trình hoặc cộng đồng trước khi nghĩ đến AI.", "Tách thời gian tạo ý tưởng và thời gian đánh giá."],
    quiz: { prompt: "Trong giai đoạn tạo ý tưởng ban đầu, nên làm gì?", options: ["Bác bỏ ngay các ý tưởng chưa khả thi.", "Chỉ chọn một ý tưởng công nghệ.", "Tạo đa dạng ý tưởng trước khi đánh giá.", "Bỏ qua kết quả nghiên cứu người dùng."], correctIndex: 2, explanation: "Ideate khuyến khích tư duy phân kỳ trước khi hội tụ lựa chọn để thử nghiệm." },
  },
  {
    mode: "PROTOTYPE",
    title: "M04 · Prototype — Học bằng nguyên mẫu",
    objective: "Tạo mẫu đủ cụ thể để nhận phản hồi sớm mà không tốn chi phí lớn.",
    content: `MỤC TIÊU: Xây dựng nguyên mẫu mức độ trung thực thấp và thiết kế kịch bản sử dụng.

KHỞI ĐỘNG: Chọn giả thuyết quan trọng nhất của ý tưởng. Bạn cần học điều gì từ mẫu?

KIẾN THỨC: Prototype có thể là bản phác thảo giấy, storyboard, đóng vai quy trình hoặc giao diện click-through. Mục đích chính là làm rõ giả định và gợi phản hồi, không phải hoàn thiện sản phẩm.

THỰC HÀNH: Tạo mẫu cho một hành động chính. Viết kịch bản “người dùng muốn… → họ thử… → nhóm quan sát…”.

TỰ KIỂM TRA: Mẫu đã đủ rõ để người dùng thực hiện một nhiệm vụ chưa?

ĐẦU RA: Ảnh hoặc liên kết bản mẫu, mô tả giả thuyết và kịch bản kiểm thử.`,
    mission: "Phác thảo cách sinh viên kiểm tra nơi tự học phù hợp trước khi di chuyển.",
    deliverable: "1 nguyên mẫu, 1 giả thuyết và 1 tác vụ người dùng có thể thử.",
    questions: ["Mẫu này kiểm tra giả định nào?", "Có thể thử bằng giấy trước khi lập trình không?", "Người dùng có thể làm gì với mẫu?"],
    hints: ["Vẽ 3 màn hình hoặc một storyboard 4 khung.", "Chỉ xây phần đủ để học một điều từ người dùng."],
    quiz: { prompt: "Mục tiêu quan trọng nhất của nguyên mẫu đầu tiên là gì?", options: ["Trông giống sản phẩm thương mại.", "Tìm hiểu sớm về giả định và phản ứng người dùng.", "Viết toàn bộ backend.", "Đạt 100% tính năng."], correctIndex: 1, explanation: "Nguyên mẫu ban đầu được dùng để học nhanh, giảm rủi ro và nhận phản hồi." },
  },
  {
    mode: "TEST",
    title: "M05 · Test — Thử nghiệm và cải tiến",
    objective: "Thu thập bằng chứng từ người dùng và quyết định vòng lặp tiếp theo.",
    content: `MỤC TIÊU: Tổ chức một buổi thử nghiệm, ghi chép quan sát và đề xuất thay đổi dựa trên bằng chứng.

KHỞI ĐỘNG: Viết nhiệm vụ cụ thể mà người dùng sẽ thực hiện với nguyên mẫu.

KIẾN THỨC: Đưa nhiệm vụ, quan sát cách họ làm, hạn chế giải thích hộ. Ghi lại hành vi, lời nói, chỗ vướng, mức hoàn thành và sự khác biệt với giả thuyết. Không hỏi duy nhất “Bạn thích không?”.

THỰC HÀNH: Cho ít nhất một người thử. Ghi điều hoạt động, điều chưa rõ và điều bất ngờ. Chọn vòng lặp tiếp theo: quay lại Empathize, Define, Ideate hoặc sửa Prototype.

TỰ KIỂM TRA: Kết luận của nhóm dựa trên quan sát hay cảm tính?

ĐẦU RA: 1 bảng quan sát, 2 cải tiến ưu tiên và lý do chọn bước tiếp theo.`,
    mission: "Cho một người thực hiện tác vụ với nguyên mẫu và quan sát mà không chỉ dẫn.",
    deliverable: "1 kết quả thử nghiệm + 2 thay đổi ưu tiên + quyết định vòng lặp kế tiếp.",
    questions: ["Có bằng chứng nào bác bỏ giả thuyết ban đầu?", "Người dùng mắc kẹt ở bước nào?", "Cần quay lại chế độ nào để học thêm?"],
    hints: ["Hãy nói “Bạn cứ thử như bình thường và nói điều bạn đang nghĩ”.", "Ghi rõ những gì người dùng làm, không chỉ những gì họ nói thích."],
    quiz: { prompt: "Khi người dùng gặp khó khăn trong bài test, nhóm nên làm gì?", options: ["Ngay lập tức hướng dẫn họ từng bước.", "Quan sát, ghi nhận và chỉ hỗ trợ khi cần bảo đảm an toàn.", "Bỏ qua vì mẫu chưa hoàn thiện.", "Chỉ ghi lại lời khen."], correctIndex: 1, explanation: "Quan sát khó khăn thật giúp nhóm tìm ra điều cần cải tiến thay vì che giấu lỗi thiết kế." },
  },
];

/** Only infer a mode from a deliberately tagged lesson title; never fake progress. */
export function findKitLesson(title: string): LearningKitLesson | null {
  const prefix = title.match(/^M0[1-5]\s*[·.:-]/i);
  if (prefix) {
    const mode = Number(prefix[0][2]) - 1;
    return DESIGN_THINKING_KIT[mode] ?? null;
  }
  const upper = title.toUpperCase();
  return DESIGN_THINKING_KIT.find(item => new RegExp("\\b" + item.mode + "\\b").test(upper)) ?? null;
}

export function studioModeHref(mode: ThinkingMode, courseId: string) {
  return "/studio?mode=" + encodeURIComponent(mode) + "&course=" + encodeURIComponent(courseId);
}
