/**
 * Read-only teaching fallback when Gemini is unavailable.
 * This must answer an educational prompt as an educational prompt,
 * not accidentally route "khó tập trung" to the Focus Mode feature.
 * Does not claim to be a personalized AI generation.
 */
function norm(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").trim();}

export function isPedagogicalRequest(question:string):boolean {
  const q=norm(question);
  const asksForActivity=/(thiet ke|de xuat|goi y|lap ke hoach|xay dung|huong dan|giup toi)/.test(q) &&
    /(hoat dong|thuc hanh|buoi hoc|phong van|quan sat|empathy map|storyboard|bai tap|tinh huong|nghien cuu|y tuong)/.test(q);
  const theory=/(design thinking|tu duy thiet ke|empathize|define|ideate|prototype|empathy map)/.test(q)
    && /(la gi|tai sao|vi sao|giai thich|phan biet|cac buoc|nguyen tac|vi du)/.test(q);
  return asksForActivity||theory;
}

function activityDurations(total:number):[number,number,number,number,number] {
  const weights=[2,4,5,3,1];
  const values=weights.map(x=>Math.max(1,Math.floor(total*x/15))) as [number,number,number,number,number];
  let delta=total-values.reduce((a,b)=>a+b,0);
  let index=2;
  while(delta>0){values[index%5]++;index++;delta--;}
  while(delta<0){const k=index%5;if(values[k]>1){values[k]--;delta++;}index++;}
  return values;
}

export function pedagogicalFallback(question:string):string {
  const q=norm(question);
  if(!/(hoat dong|thuc hanh|phong van|quan sat|buoi hoc|bai tap)/.test(q)) {
    return "Trong Design Thinking, ta bắt đầu bằng việc thấu hiểu con người (Empathize), xác định đúng vấn đề (Define), phát triển nhiều ý tưởng (Ideate), dựng nguyên mẫu nhỏ (Prototype), rồi thử nghiệm và cải tiến (Test). Các bước có thể lặp lại, không phải một quy trình tuyến tính cứng nhắc.\n\nBạn có thể thử ngay: chọn một khó khăn thực tế trong trường, quan sát hành vi liên quan, phỏng vấn hai người, viết một câu mô tả nhu cầu và đề xuất một thay đổi nhỏ để kiểm chứng.";
  }
  const matched=q.match(/\b(\d{1,2})\s*(phut|minutes?|min)\b/);
  const duration=Math.max(10,Math.min(60,matched?Number(matched[1]):15));
  const [frame,observe,interview,synthesize,reflect]=activityDurations(duration);
  const library=/(thu vien|library)/.test(q);
  const focus=/(tap trung|xao nhang|mat tap trung|focus)/.test(q);
  const topic=library&&focus?"điều gì khiến sinh viên khó tập trung khi học ở thư viện":
    library?"trải nghiệm của sinh viên tại thư viện":
    focus?"những yếu tố gây xao nhãng trong môi trường học tập":
    "một khó khăn cụ thể trong trải nghiệm học tập của sinh viên";
  return [
    "Bạn có thể thử hoạt động Design Thinking "+duration+" phút: **Quan sát trước, đề xuất sau**.",
    "Câu hỏi nghiên cứu: “"+topic+"?”",
    "",
    "1. **"+frame+" phút – Đặt câu hỏi:** Viết một câu cần tìm hiểu, không vội đề xuất giải pháp. Mục đích là tránh suy đoán trước khi gặp người dùng.",
    "2. **"+observe+" phút – Quan sát:** Ghi lại 3 hành vi hoặc tình huống thực tế. Tách *điều nhìn thấy* khỏi *điều mình suy đoán*. Đây là bước Empathize.",
    "3. **"+interview+" phút – Phỏng vấn ngắn:** Hỏi 1–2 người đồng ý tham gia: “Lần gần đây bạn gặp khó khăn ở đây là khi nào?”, “Điều gì cản trở bạn nhất?”, “Bạn đã thử cách nào?”. Đặt câu hỏi mở để thu nhận trải nghiệm thật.",
    "4. **"+synthesize+" phút – Tìm insight:** Chọn một mẫu lặp lại, viết: “Sinh viên [nhóm cụ thể] cần [nhu cầu] vì [insight quan sát được]”. Đây là bước Define.",
    "5. **"+reflect+" phút – Phản tư:** Ghi một điều bất ngờ và một câu hỏi cần kiểm chứng tiếp, thay vì kết luận vấn đề đã được giải quyết.",
    "",
    "**Sản phẩm cuối:** bảng quan sát 3 dòng, ghi chú 1–2 cuộc trò chuyện và một câu POV. Tôn trọng quyền riêng tư, xin phép trước khi phỏng vấn; nếu chưa có người tham gia, ghi rõ kết quả chỉ là giả định, không trình bày như dữ liệu thực.",
    "",
    "Mình đang dùng hướng dẫn học thuật dự phòng vì Gemini chưa trả lời được; bạn vẫn có thể thực hiện hoạt động này ngay."
  ].join("\n");
}
