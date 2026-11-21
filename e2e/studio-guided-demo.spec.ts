import { test, expect } from "@playwright/test";

test("teacher can view and try self-guided Studio without a Vercel or LMS login", async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  await page.goto("/");
  await expect(page.getByRole("link",{name:/Thử Design Studio tự hướng dẫn/}))
    .toHaveAttribute("href","/demo#studio-self-guided");
  await page.getByRole("link",{name:/Thử Design Studio tự hướng dẫn/}).click();

  const demo=page.getByTestId("studio-guided-demo");
  const guide=demo.getByTestId("studio-guided-journey");
  await expect(demo.getByText("DEMO · KHÔNG GHI DỮ LIỆU")).toBeVisible();
  await expect(guide).toContainText("Khám phá một thử thách thực tế");

  await guide.getByRole("button",{name:"Xem thử thách"}).click();
  await expect(guide).toContainText("Tạo không gian cho nhóm của bạn");
  await guide.getByRole("button",{name:"Đặt tên nhóm"}).click();
  await demo.getByLabel("Tên nhóm minh họa").fill("Team Green");
  await demo.getByRole("button",{name:"Tạo nhóm mô phỏng"}).click();

  await expect(guide).toContainText("Thử một phương pháp nhỏ");
  await guide.getByRole("button",{name:"Bắt đầu hoạt động"}).click();
  await expect(guide).toContainText("Tiếp tục bản nháp đang làm");
  await demo.getByLabel("Một quan sát hoặc câu hỏi bạn muốn kiểm chứng")
    .fill("When did you last find a quiet study place?");
  await demo.getByRole("button",{name:"Hoàn thành hoạt động minh họa"}).click();

  await expect(guide).toContainText("Bạn đã hoàn thành một hoạt động");
  await expect(demo.getByRole("status")).toContainText("không được gửi lên LMS");
  await expect(guide.getByRole("link",{name:"Xem Studio thật"})).toHaveAttribute("href","/studio");
  await demo.getByRole("button",{name:"Thử lại từ đầu"}).click();
  await expect(guide).toContainText("Khám phá một thử thách thực tế");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("public demo guide is skippable and advanced methods stay optional", async ({page}) => {
  await page.goto("/demo#studio-self-guided");
  const guide=page.getByTestId("studio-guided-demo").getByTestId("studio-guided-journey");
  await guide.getByRole("button",{name:"Thu gọn hướng dẫn"}).click();
  await expect(guide.getByRole("button",{name:"Mở gợi ý"})).toBeVisible();
  await guide.getByRole("button",{name:"Mở gợi ý"}).click();
  const extra=guide.getByTestId("studio-extra-guidance");
  await expect(extra).not.toHaveAttribute("open");
  await extra.locator("summary").click();
  await expect(extra).toHaveAttribute("open");
  await extra.getByRole("button",{name:"Test",exact:true}).click();
  await expect(extra.getByRole("button",{name:"Test",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(guide).toContainText("Khám phá một thử thách thực tế");
});
