import { expect, test } from "@playwright/test";

test("photo-rich public landing has working course, workshop, tools and project gallery at 320px", async ({page},testInfo)=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.setViewportSize({width:320,height:780});
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.locator("#courses a[href^='/demo?course=']")).toHaveCount(6);
  await expect(page.locator("#projects article")).toHaveCount(8);
  await expect(page.locator("#tools a[href^='/demo?tool=']")).toHaveCount(10);
  await expect(page.locator("#events article")).toHaveCount(4);
  await expect(page.getByTestId("demo-photo").first()).toBeVisible();
  await expect(page.getByText(/số liệu người dùng thực tế/i).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("home-photo-editorial-mobile.png"),fullPage:true});
});

test("interactive public course demo grades quiz locally and never creates fake LMS score", async ({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.setViewportSize({width:390,height:844});
  await page.goto("/demo?course=foundations");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Design Thinking Foundations"})).toBeVisible();
  await expect(page.getByRole("progressbar",{name:"Tiến độ demo trong khóa học"})).toHaveAttribute("aria-valuenow","0");
  await page.getByRole("radio",{name:/Quan sát hành vi người dùng thực tế/}).check();
  await expect(page.getByRole("status").filter({hasText:"Chính xác!"})).toBeVisible();
  await page.getByRole("button",{name:/Đã hiểu · Đến bài tiếp/}).click();
  await expect(page.getByRole("progressbar",{name:"Tiến độ demo trong khóa học"})).toHaveAttribute("aria-valuenow","17");
  await page.getByRole("button",{name:/Viết vấn đề cần giải quyết/}).click();
  await page.getByRole("textbox",{name:/Phản tư của bạn/}).fill("Quan sát người dùng là điều kiện để đặt câu hỏi đúng.");
  await expect(page.getByText(/Không lưu vào máy chủ/)).toBeVisible();
  await page.getByRole("button",{name:"Focus Mode"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-uii-focus-mode","true");
  await expect(page.getByRole("button",{name:"Thoát Focus Mode"})).toBeVisible();
  await page.getByRole("button",{name:"Thoát Focus Mode"}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("public demo offers usable tools and shows truthful no-persistence feedback",async ({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.goto("/demo?tool=Crazy%208s#tools");
  await expect(page.getByRole("heading",{name:"10 công cụ thực hành"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Crazy 8s"})).toBeVisible();
  await page.getByRole("textbox",{name:/Thử viết một ý tưởng/}).fill("Một bảng hướng dẫn tốt hơn cho sinh viên.");
  await page.getByRole("button",{name:"Đã thử công cụ"}).click();
  await expect(page.getByRole("status").filter({hasText:/không được gửi lên máy chủ/})).toBeVisible();
});


test("homepage and demo render without client-side JavaScript exceptions", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  const exceptions: string[] = [];
  page.on("pageerror", error => exceptions.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", {level:1})).toBeVisible();
  await page.goto("/demo");
  await expect(page.getByRole("heading",{name:/Try, learn/})).toBeVisible();
  expect(exceptions, "unexpected client-side errors in public pages").toEqual([]);
});
