import { expect, test } from "@playwright/test";

test("visitor moves from homepage to guided demo, then finds signup", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await expect(page.getByRole("button",{name:/Mở Hỏi UII/})).toHaveCount(1);
  await page.getByRole("button",{name:/Mở Hỏi UII/}).click();
  await expect(page.getByRole("dialog",{name:"Chatbot hướng dẫn sử dụng UII"})).toBeVisible();
  await page.getByLabel("Nhập câu hỏi cho chatbot").fill("Trạng thái phát triển hiện tại của nền tảng?");
  await page.getByRole("button",{name:"Gửi câu hỏi"}).click();
  await expect(page.getByText(/Giai đoạn sản phẩm: đang thử nghiệm/i)).toBeVisible({timeout:12000});
  await page.getByRole("button",{name:"Đóng cửa sổ chatbot"}).click();
  await page.goto("/demo");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.getByRole("button",{name:/Mở Hỏi UII/})).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("registration form records desired role but clearly prevents self-granted privileges",async ({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.goto("/learn");
  await expect(page.getByRole("heading",{name:"Đăng nhập"})).toBeVisible();
  await page.getByRole("button",{name:"Chưa có tài khoản? Đăng ký"}).click();
  await expect(page.getByRole("group",{name:/vai trò nào/})).toBeVisible();
  await expect(page.getByRole("radio",{name:/Sinh viên/})).toBeChecked();
  await page.getByRole("radio",{name:/Giảng viên/}).check();
  await expect(page.getByRole("radio",{name:/Giảng viên/})).toBeChecked();
  await expect(page.getByText(/không phải quyền được cấp ngay/i)).toBeVisible();
  await expect(page.getByText(/quản trị viên/i).first()).toBeVisible();
  await expect(page.getByRole("radio",{name:/Quản trị viên/})).toHaveCount(0);
});

test("assistant API is grounded, guest progress is private and user cannot spoof role",async ({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.goto("/");
  const status=await page.request.get("/api/assistant/chat");
  expect(status.status()).toBe(200);
  const state=await status.json();
  expect(state.ciStatus).toBe("unknown-from-this-endpoint");
  expect(state.modelConfigured).toBe(false);
  const progress=await page.request.post("/api/assistant/chat",{
    data:{message:"Tôi đã hoàn thành bao nhiêu bài học?",role:"ADMIN",path:"/admin"},
  });
  expect(progress.status()).toBe(200);
  const p=await progress.json();
  expect(p.mode).toBe("verified-data");
  expect(p.role).toBe("GUEST");
  expect(p.answer).toMatch(/cần đăng nhập|chưa có dữ liệu/i);
  expect(p.answer).not.toMatch(/\d{1,3}%/);
  const question=await page.request.post("/api/assistant/chat",{
    data:{message:"Tạo bài tập quiz như thế nào?",path:"/learn"},
  });
  expect(question.status()).toBe(200);
  const answer=await question.json();
  expect(answer.mode).toBe("guided");
  expect(answer.answer).toMatch(/Luyện tập và bài tập|bài tập thật/);
  expect(answer.links.every((l:{href:string})=>l.href.startsWith("/"))).toBe(true);
});
