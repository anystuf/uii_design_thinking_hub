import { expect, test } from "@playwright/test";

test("feedback regression: demo quizzes are course-specific, explained, and color-coded correctly", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo?course=foundations");
  await expect(page.getByText(/Nhóm thấy sinh viên ít sử dụng khu tự học/)).toBeVisible();
  const foundationCorrect = page.getByRole("radio", { name: /Quan sát hành vi người dùng thực tế/ });
  await foundationCorrect.check();
  await expect(page.getByRole("status").filter({ hasText: "Chính xác!" })).toBeVisible();
  await expect(foundationCorrect.locator("xpath=..")).toHaveClass(/bg-\[#e6f5ed\]/);

  await page.getByRole("button", { name: /Empathy & Research/ }).click();
  await expect(page.getByText(/Nhóm định phỏng vấn sinh viên về áp lực học tập/)).toBeVisible();
  await page.getByRole("radio", { name: /Ghi hình và đăng lên nhóm công khai/ }).check();
  await expect(page.getByRole("status").filter({ hasText: /Thử lại nhé/ })).toContainText("Gợi ý:");
  await page.getByRole("radio", { name: /Xin đồng ý, chỉ lưu dữ liệu cần thiết/ }).check();
  await expect(page.getByRole("status").filter({ hasText: "Chính xác!" })).toContainText("quyền riêng tư");

  await page.getByRole("button", { name: /Viết ghi chú không thiên kiến/ }).click();
  await expect(page.getByText(/Empathy Map — điều gì là bằng chứng/)).toBeVisible();
  await page.getByRole("textbox", { name: "Người dùng nói" }).fill("Tôi phải đi qua ba khu nhà để tìm chỗ học.");
  await expect(page.getByRole("textbox", { name: "Người dùng nói" })).toHaveValue(/ba khu nhà/);
  await expect(page.getByText(/không gửi lên máy chủ/).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
