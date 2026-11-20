/** Curated product facts for Gemini grounding and deterministic offline guidance. */
export type HubRole = "GUEST" | "STUDENT" | "LECTURER" | "MENTOR" | "ADMIN";
export type GuideTopic = {
  id:string; title:string; keys:readonly string[]; href:string; action:string;
  status:"available"|"demo"|"limited"; roles:readonly HubRole[];
  summary:string; steps:readonly string[];
};
const all:readonly HubRole[]=["GUEST","STUDENT","LECTURER","MENTOR","ADMIN"];
export const GUIDE_TOPICS:readonly GuideTopic[]=[
  {id:"about",title:"Giới thiệu UII và luồng sử dụng",
    keys:["gioi thieu","uii","la gi","website","bat dau","user flow","huong dan su dung","welcome"],
    href:"/",action:"Về trang chủ",status:"available",roles:all,
    summary:"UII Design Thinking Hub là nền tảng học tập thực hành Design Thinking: khám phá → học → luyện tập → tham gia dự án → nộp minh chứng → phản hồi → cải tiến. Năm chế độ Empathize, Define, Ideate, Prototype, Test có thể lặp lại.",
    steps:["Trang chủ giới thiệu phương pháp, khóa học và các hoạt động","/demo để học thử công khai, không lưu dữ liệu hay điểm LMS","/learn để đăng ký/đăng nhập nếu muốn ghi danh và lưu tiến độ thật"]},
  {id:"signup",title:"Đăng ký và lựa chọn vai trò mong muốn",
    keys:["dang ky","tao tai khoan","signup","vai tro","role","giang vien","co van","cap quyen","xac nhan email"],
    href:"/learn",action:"Đăng ký / đăng nhập",status:"available",roles:all,
    summary:"Chọn đăng ký ở /learn, cung cấp email, mật khẩu và vai trò mong muốn Sinh viên/Giảng viên/Cố vấn. Đây là nguyện vọng, không phải quyền truy cập. Tài khoản mới luôn được backend xác minh ở quyền STUDENT; quyền cao hơn phải được quản trị phê duyệt. Không có tự đăng ký ADMIN.",
    steps:["Trang chủ → Vào học → Chưa có tài khoản? Đăng ký","Chọn nguyện vọng và tạo tài khoản; xác nhận email nếu được yêu cầu","Đăng nhập lại. Nếu muốn giảng dạy hoặc cố vấn, liên hệ quản trị viên để xác minh quyền"]},
  {id:"login",title:"Đăng nhập và xử lý lỗi xác thực",
    keys:["dang nhap","login","email","mat khau","google","oauth","auth","xac minh","failed to fetch"],
    href:"/learn",action:"Vào màn hình đăng nhập",status:"available",roles:all,
    summary:"Đăng nhập tại /learn bằng email/mật khẩu. Google OAuth chỉ hiển thị nếu trường đã bật. Máy chủ thử nghiệm có thể phản hồi chậm sau khi ngủ; tuyệt đối không cung cấp mật khẩu cho chatbot.",
    steps:["Mở /learn, nhập email/mật khẩu đã đăng ký","Nếu vừa tạo tài khoản, kiểm tra email xác nhận","Nếu xác minh chậm, thử lại một lần; gửi mã lỗi cho quản trị nếu lỗi kéo dài"]},
  {id:"courses",title:"Khóa học và ghi danh",
    keys:["khoa hoc","course","ghi danh","enroll","bai giang","tiep tuc","hoc video","lecture","catalog"],
    href:"/learn",action:"Khám phá khóa học",status:"available",roles:all,
    summary:"Thư viện khóa học thật chứa các khóa được công bố. Sinh viên có thể ghi danh và mở nội dung, video, bài luyện tập, đánh dấu hoàn thành. Dữ liệu khóa mẫu trên /demo không tự xuất hiện trong tài khoản học viên.",
    steps:["Đăng nhập để lưu tiến độ, mở Khóa học","Tìm khóa công bố → Ghi danh → Bắt đầu hoặc Tiếp tục","Xem nội dung và luyện tập, đánh dấu hoàn thành để ghi tiến độ"]},
  {id:"practice",title:"Quiz, tự luận và nhiệm vụ dự án",
    keys:["quiz","bai tap","luyen tap","trac nghiem","assessment","practice","tu luan","exercise"],
    href:"/learn",action:"Vào Luyện tập",status:"available",roles:all,
    summary:"Bài tập thật nằm trong bài học. Quiz được chấm tự động; tự luận hoặc dự án được đánh giá theo quyền. Bài học không có bài tập là trạng thái hợp lệ khi giảng viên chưa công bố.",
    steps:["Khóa học → mở bài học đã ghi danh","kéo tới mục Luyện tập và bài tập, đọc yêu cầu","Nộp và xem điểm hoặc chờ phản hồi từ giảng viên"]},
  {id:"authoring",title:"Giảng viên tạo khóa học và bài tập",
    keys:["tao khoa hoc","tao bai tap","giang day","lecturer","authoring","soan bai","cong bo","quiz builder"],
    href:"/learn",action:"Mở biên soạn khóa học",status:"available",roles:["LECTURER","ADMIN"],
    summary:"Tài khoản đã được cấp quyền Giảng viên/Quản trị có thể tạo khóa học, bài học và bài tập. Có mẫu quiz 5 câu, tự luận và dự án để chỉnh sửa; nạp mẫu không tự lưu hoặc công bố.",
    steps:["Đăng nhập tài khoản có quyền và mở Khóa học → Tạo khóa học","Thêm bài giảng và nội dung, kiểm tra quyền công bố","Mở từng bài học → Tạo bài tập, kiểm duyệt đáp án và công bố khi sẵn sàng"]},
  {id:"grading",title:"Chấm bài và rubric",
    keys:["cham","diem","rubric","feedback","danh gia","review","nhan xet","grading"],
    href:"/review",action:"Đánh giá bài nộp",status:"available",roles:["LECTURER","ADMIN"],
    summary:"Giảng viên được phân quyền có thể xem bài đang chờ, chấm tự luận và sử dụng rubric cho bài dự án. Sinh viên chỉ xem kết quả của mình trong Khóa học và Thông báo.",
    steps:["Giảng viên mở Khóa học → Bài đã nộp hoặc Đánh giá bài nộp","Chọn bài theo quyền, ghi điểm/nhận xét","Sinh viên xem Lịch sử bài làm hoặc Thông báo để cải tiến"]},
  {id:"studio",title:"Design Studio và dự án nhóm",
    keys:["studio","du an","project","nhom","empathize","define","ideate","prototype","test","persona","hwm","how might we"],
    href:"/studio",action:"Mở Design Studio",status:"available",roles:all,
    summary:"Design Studio giúp học theo thử thách, nhóm và năm chế độ tư duy. Sinh viên chỉ xem/sửa dự án được phân quyền; các chế độ không bắt buộc theo thứ tự cố định.",
    steps:["Đăng nhập và mở Dự án → thử thách/nhóm được tham gia","Chọn Empathize/Define/Ideate/Prototype/Test tùy nhu cầu","Lưu bản nháp hoặc minh chứng, dùng phản hồi để lặp lại"]},
  {id:"evidence",title:"Nộp minh chứng và tải tệp",
    keys:["minh chung","evidence","upload","tep","file","tai len","nop bai","submission"],
    href:"/evidence",action:"Mở Minh chứng & phản hồi",status:"available",roles:["STUDENT","LECTURER","MENTOR","ADMIN"],
    summary:"Minh chứng dự án được quản lý theo quyền. Chọn đúng dự án/nhóm trước khi tải lên và nộp; phản hồi có thể xuất hiện trong đánh giá hoặc thông báo.",
    steps:["Mở Minh chứng & phản hồi sau khi tham gia đúng dự án","Chọn dự án, tải tệp và điền ghi chú","Nộp theo hướng dẫn, theo dõi phản hồi"]},
  {id:"focus",title:"La bàn học tập, Focus Mode và XP",
    keys:["focus","adhd","tap trung","la ban","xp","game","gamify","con tro","mot viec"],
    href:"/learn",action:"Mở La bàn học tập",status:"available",roles:all,
    summary:"Trong Course Player có La bàn Design Thinking và chế độ Learn → Practice → Apply. Focus Mode chỉ hiển thị từng nhiệm vụ để giảm xao nhãng. XP thật tính từ bài học/quiz đã ghi nhận, không phải demo.",
    steps:["Mở một bài học đã ghi danh","Bật Chế độ tập trung để chỉ xem một bước","Hoàn thành một nhiệm vụ rồi chuyển bước hoặc thoát Focus Mode"]},
  {id:"progress",title:"Tiến độ học cá nhân",
    keys:["tien do hoc","my progress","da hoc","hoan thanh","bao nhieu","phan tram","tien do cua toi"],
    href:"/dashboard",action:"Xem tiến độ thật",status:"available",roles:all,
    summary:"Chỉ báo cáo tiến độ học sau khi xác minh tài khoản và đọc API có phân quyền. Dashboard hiển thị khóa đang học, tỷ lệ hoàn thành, bài tiếp theo khi dữ liệu có sẵn.",
    steps:["Đăng nhập và mở Tổng quan","Xem khóa đã ghi danh và tỷ lệ hoàn thành","Nếu backend chưa trả dữ liệu, chatbot sẽ nói rõ không xác minh được, không đoán %"]},
  {id:"notices",title:"Thông báo và thời hạn",
    keys:["thong bao","notification","deadline","han nop","nhan xet moi"],
    href:"/notifications",action:"Mở Thông báo",status:"available",roles:all,
    summary:"Thông báo tổng hợp phản hồi và thay đổi cần theo dõi. Hạn bài tập chính xác nằm ở từng bài học được giao.",
    steps:["Đăng nhập và mở Thông báo","Chọn thông báo để xem nội dung liên quan","Kiểm tra hạn nộp thực trong bài tập, không dùng ngày sự kiện demo"]},
  {id:"demo",title:"Tham quan và bài tập Demo",
    keys:["demo","mock","hoc thu","mau","trai nghiem","thu bai"],
    href:"/demo",action:"Thử bài học mẫu",status:"demo",roles:all,
    summary:"Trang /demo có 6 khóa học mẫu, 36 hoạt động, 8 dự án minh họa, 10 công cụ. Mọi dữ liệu như sự kiện và lời nhận xét đều là Demo, không phải dữ liệu thật. Quiz và phản tư trên demo không lưu vào LMS.",
    steps:["Mở /demo để học thử miễn phí không cần tài khoản","Chọn khóa học hoặc một công cụ, thử hoạt động","Chuyển sang /learn để tạo tài khoản và học thật"]},
  {id:"admin",title:"Quản trị và phân quyền",
    keys:["quan tri","admin","cap quyen","duyet giang vien","role approval","quan ly tai khoan"],
    href:"/admin",action:"Mở Quản trị",status:"limited",roles:["ADMIN"],
    summary:"Trang Quản trị hiện xem danh sách tài khoản và vai trò thực. Chưa có giao diện phê duyệt yêu cầu Lecturer/Mentor tích hợp; cấp quyền phải theo quy trình quản trị được ủy quyền. Chọn vai trò khi đăng ký không đổi quyền backend.",
    steps:["Dùng tài khoản ADMIN do nhà trường cấp","Mở Quản trị và xem tài khoản/role đã xác minh","Cấp quyền thông qua quy trình quản trị được phê duyệt, không dùng metadata do người dùng tự nhập"]},
  {id:"status",title:"Tình trạng phát triển nền tảng",
    keys:["trang thai he thong","tien do website","product status","roadmap","beta","release","san pham","trang web hien tai","phat trien den dau"],
    href:"/",action:"Về trang giới thiệu",status:"limited",roles:all,
    summary:"UII đang ở giai đoạn xây dựng và nghiệm thu. Homepage và demo hoạt động như bản giới thiệu; LMS có đăng nhập, khóa học, bài tập, studio, minh chứng, đánh giá và hướng dẫn nhưng cần nghiệm thu thực tế với tài khoản thật. Chỉ dùng API Gemini nếu có GEMINI_API_KEY ở server. Không thể xác nhận CI hay tiến độ phát hành trực tiếp chỉ từ bài chat.",
    steps:["Có thể trải nghiệm trang chủ và /demo công khai","Các chức năng thật phụ thuộc quyền và dữ liệu hiện có, cần UAT trước khi phát hành chính thức","Để biết build/CI hiện tại cần tra GitHub Actions hoặc Vercel, không dựa vào mô tả tĩnh"]},
];

export function normalizeGuide(input:string):string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/\s+/g," ").trim();
}
export function isPersonalProgress(question:string):boolean {
  const q=normalizeGuide(question);
  return /(tien do|progress|hoan thanh|da hoc|bao nhieu bai|phan tram)/.test(q)
    && !/(trang web|platform|he thong|website|san pham|phat trien|roadmap|product|uii)/.test(q);
}
export function isProductStatus(question:string):boolean {
  const q=normalizeGuide(question);
  return /(tien do|status|trang thai|phat trien|release|roadmap|chinh thuc)/.test(q)
    && /(trang web|platform|he thong|website|san pham|product|uii|tinh nang|phat trien|release)/.test(q);
}
export function findGuideTopics(question:string,role:HubRole,count=5):GuideTopic[] {
  const q=normalizeGuide(question);
  const items=GUIDE_TOPICS.filter(t=>t.roles.includes(role)||t.roles.includes("GUEST"))
    .map(t=>({t,score:t.keys.reduce((sum,k)=>{
      const key=normalizeGuide(k);
      return sum+(q.includes(key)?key.includes(" ")?8:5:0);
    },0)})).sort((a,b)=>b.score-a.score);
  const found=items.filter(x=>x.score>0).slice(0,count).map(x=>x.t);
  return found.length?found:GUIDE_TOPICS.filter(t=>["about","courses","demo"].includes(t.id));
}
export type GuideReply={text:string;links:{href:string;label:string}[]};
export function deterministicGuide(query:string,role:HubRole,path="/"):GuideReply {
  if(isPersonalProgress(query))return {text:"Mình chỉ có thể thông báo tiến độ cá nhân sau khi tài khoản và dữ liệu được xác thực. Hãy đăng nhập và xem Tổng quan hoặc Khóa học; mình sẽ không tự đoán điểm hoặc phần trăm.",links:[{href:"/dashboard",label:"Xem tiến độ thật"}]};
  const matched=findGuideTopics(query,role,3);
  const chosen=isProductStatus(query)?GUIDE_TOPICS.find(t=>t.id==="status")!:matched[0];
  const steps=chosen.steps.map((s,i)=>(i+1)+". "+s).join("\n");
  const contextual=path.startsWith("/demo")?"\nBạn đang ở khu demo, không có điểm LMS thật.":"";
  return {text:chosen.summary+"\n\nCách thực hiện:\n"+steps+contextual,
    links:[{href:chosen.href,label:chosen.action}]};
}
export function buildAIKnowledge(question:string,role:HubRole,path:string):string {
  return "Trang: "+path+"\nVai trò xác minh: "+role+
    "\nCác chức năng UII (KHÔNG tự suy đoán quyền, dữ liệu, đường dẫn):\n"+
    findGuideTopics(question,role,6).map(t=>t.title+" ["+t.status+"] "+t.summary+
      "\nCách làm: "+t.steps.join(" → ")+"\nĐường dẫn: "+t.href).join("\n\n");
}
