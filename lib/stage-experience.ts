/**
 * Teaching-only examples and stage-specific tools.
 * These examples are never enrollments, submissions, real teams or research data.
 */
export type ThinkingStage = "EMPATHIZE" | "DEFINE" | "IDEATE" | "PROTOTYPE" | "TEST";
export type StageGuide={
  id:ThinkingStage;title:string;vi:string;tagline:string;question:string;description:string;
  deliverable:string;tools:readonly string[];prompts:readonly string[];
  color:string;surface:string;
};
export const STAGE_GUIDES: readonly StageGuide[]=[
 {id:"EMPATHIZE",title:"Empathize",vi:"Thấu hiểu",tagline:"Listen first.",question:"Người dùng thật sự đang trải qua điều gì?",
  description:"Quan sát hành vi, phỏng vấn bằng câu hỏi mở, phân biệt sự thật và giả định.",
  deliverable:"3 câu hỏi phỏng vấn + nhật ký quan sát + Empathy Map",tools:["Interview Guide","Observation Log","Empathy Map"],
  prompts:["Người dùng làm gì, nói gì, nghĩ gì, cảm thấy gì?","Lần gần nhất vấn đề xảy ra là khi nào?","Điều gì bạn đang giả định mà chưa có chứng cứ?"],
  color:"#ffdfc9",surface:"#fff5ee"},
 {id:"DEFINE",title:"Define",vi:"Xác định vấn đề",tagline:"Find the real problem.",question:"Nhu cầu nào thực sự cần được giải quyết?",
  description:"Chắt lọc dữ liệu thành insight, viết POV và câu hỏi How Might We.",
  deliverable:"1 POV có bằng chứng + 2 câu HMW",tools:["POV Builder","HMW Reframing"],
  prompts:["Ai cần gì, và tại sao?","Insight nào lặp lại trong quan sát?","HMW có đang vội đề xuất giải pháp không?"],
  color:"#f4d3e1",surface:"#fff5fa"},
 {id:"IDEATE",title:"Ideate",vi:"Tạo ý tưởng",tagline:"Think many, then choose.",question:"Có những cách giải quyết nào khác nhau?",
  description:"Tách suy nghĩ phân kỳ và hội tụ. Ưu tiên số lượng trước khi đánh giá.",
  deliverable:"8 phác thảo Crazy 8s + ma trận lựa chọn",tools:["Crazy 8s","Idea Selection"],
  prompts:["Nếu không giới hạn công nghệ, bạn sẽ làm gì?","Giải pháp ít chi phí nhất là gì?","Ý tưởng nào tác động tốt mà có thể thử trong tuần?"],
  color:"#dfe1fc",surface:"#f6f5ff"},
 {id:"PROTOTYPE",title:"Prototype",vi:"Tạo mẫu",tagline:"Make it tangible.",question:"Chúng ta có thể làm gì để người khác thử ngay?",
  description:"Dựng nguyên mẫu tối thiểu, ghi lại hành trình người dùng và điều cần kiểm chứng.",
  deliverable:"Storyboard 4 khung + checklist nguyên mẫu + liên kết sản phẩm",tools:["Storyboard","Prototype Checklist"],
  prompts:["Nguyên mẫu phải kiểm chứng giả định nào?","Người dùng sẽ thao tác bước đầu tiên thế nào?","Phần nào có thể làm bằng giấy hoặc Figma?"],
  color:"#d7efb7",surface:"#f2f9e7"},
 {id:"TEST",title:"Test",vi:"Kiểm thử",tagline:"Learn and iterate.",question:"Người dùng thực sự phản ứng ra sao?",
  description:"Quan sát sử dụng nguyên mẫu, thu nhận phản hồi và quyết định bước cải tiến.",
  deliverable:"Feedback Canvas + thay đổi ưu tiên cho vòng tiếp theo",tools:["Feedback Canvas"],
  prompts:["Điều gì diễn ra khác dự đoán?","Người thử đã làm gì, không chỉ nói gì?","Giả định nào đã bị bác bỏ?"],
  color:"#c8edf4",surface:"#ebf9fb"},
];
export function guideForStage(id:ThinkingStage):StageGuide{return STAGE_GUIDES.find(x=>x.id===id)??STAGE_GUIDES[0];}
export type SampleTeam={
 id:string;name:string;subtitle:string;problem:string;members:readonly string[];tone:string;
 progress:Partial<Record<ThinkingStage,string>>;share:string;
};
export const SAMPLE_TEAMS:readonly SampleTeam[]=[
 {
 id:"sample-library",name:"Nhóm Mây Xanh",subtitle:"Campus Focus · Trải nghiệm thư viện",
 problem:"Làm thế nào để sinh viên tìm được góc học tập phù hợp và duy trì sự tập trung?",
 members:["An · điều phối","Linh · nghiên cứu","Minh · nguyên mẫu","Huy · kiểm thử"],tone:"#d9eee0",
 share:"Ví dụ: nhật ký quan sát → bản đồ thấu cảm → sơ đồ khu vực yên tĩnh → thử nguyên mẫu với sinh viên tình nguyện.",
 progress:{
 EMPATHIZE:"Mô phỏng: ghi lại tiếng ồn, ánh sáng, chỗ ngồi; lập 3 câu hỏi mở và Empathy Map.",
 DEFINE:"Mô phỏng POV: Sinh viên ôn thi cần biết khu vực yên tĩnh vì thời gian tìm chỗ làm gián đoạn việc học.",
 IDEATE:"Mô phỏng: brainstorm 8 ý tưởng; chọn bản đồ khu vực và nhãn mức độ ồn.",
 PROTOTYPE:"Mô phỏng: phác bản đồ thư viện giấy, storyboard 4 cảnh và một màn hình mẫu.",
 TEST:"Mô phỏng: 3 người thử tìm chỗ; ghi thời gian, điều nhầm lẫn và sửa nhãn."
 }},
 {
 id:"sample-canteen",name:"Nhóm Hạt Giống",subtitle:"Campus Lunch · Hành trình căn tin",
 problem:"Làm sao giúp sinh viên chọn món và xếp hàng nhanh hơn trong giờ cao điểm?",
 members:["Vy · phỏng vấn","Khoa · tổng hợp","Phúc · ý tưởng","Thảo · trình bày"],tone:"#ffe3c6",
 share:"Ví dụ: quan sát giờ trưa → xác định nút thắt → 8 ý tưởng → storyboard hướng dẫn chọn quầy → phản hồi.",
 progress:{
 EMPATHIZE:"Mô phỏng: quan sát 2 hàng chờ, xác định thời điểm phát sinh nhầm lẫn; không quay phim người lạ.",
 DEFINE:"Mô phỏng POV: Sinh viên có lịch học sát giờ ăn cần biết quầy nào còn suất vì không đủ thời gian chờ.",
 IDEATE:"Mô phỏng: 8 cách cập nhật thực đơn; lựa chọn bảng trạng thái quầy đơn giản.",
 PROTOTYPE:"Mô phỏng: vẽ bảng thông tin thực đơn bằng giấy hoặc Figma, chưa kết nối POS.",
 TEST:"Mô phỏng: cho bạn học thực hiện nhiệm vụ chọn quầy; ghi vấn đề điều hướng và cải tiến."
 }}
];
