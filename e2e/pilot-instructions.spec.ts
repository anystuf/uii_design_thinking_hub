import { expect, test } from "@playwright/test";

test("teacher pilot guide is readable without login at 320px and links to the right tasks", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/pilot");
  await expect(page.getByRole("heading", { level: 1, name: /Một nhiệm vụ rõ ràng/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thử giao diện không cần đăng nhập/ })).toHaveAttribute("href", "/demo");
  await expect(page.getByRole("link", { name: /Đăng nhập tài khoản thử nghiệm/ })).toHaveAttribute("href", "/learn");
  await expect(page.getByText(/Lưu minh chứng KHÔNG có nghĩa là đã nộp bài/)).toBeVisible();
  await expect(page.getByText(/Hai vấn đề/i).first()).toBeVisible();
  await expect(page.getByText(/Không nhập dữ liệu nhận diện người phỏng vấn/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId("creative-pointer-trail")).toHaveCount(0);
});
