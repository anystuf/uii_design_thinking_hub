import { expect, test } from "@playwright/test";

test("student feedback: the site never draws an automatic red pointer trail", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.goto("/");
  await expect(page.getByTestId("creative-pointer-trail")).toHaveCount(0);
  await page.mouse.move(30, 40);
  await page.mouse.move(260, 210, { steps: 12 });
  await expect(page.locator('canvas[data-testid="creative-pointer-trail"]')).toHaveCount(0);
  await page.goto("/demo");
  await expect(page.getByTestId("creative-pointer-trail")).toHaveCount(0);
});

test("student feedback: one clear classroom action, other spaces still discoverable", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixture only");
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token", JSON.stringify({
    access_token: "fixture-token", refresh_token: "fixture-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "fixture-student", email: "student@example.test" },
  })));
  await page.route("http://localhost:4000/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/auth/me") body = { id: "fixture-student", fullName: "Sinh viên thử nghiệm", role: "STUDENT" };
    if (path === "/courses/my-enrollments") body = [];
    if (path === "/projects") body = [];
    if (path === "/notifications") body = [];
    if (path === "/teams/my/milestones") body = [];
    await route.fulfill({ json: body, headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.goto("/dashboard");
  const hero = page.getByRole("region", { name: "Chào mừng và hành động chính" });
  await expect(hero.getByRole("heading", { name: /Hôm nay, bạn cần làm gì/ })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Xem nhiệm vụ hôm nay" })).toHaveAttribute("href", "/classroom");
  await expect(hero.getByRole("link")).toHaveCount(1);

  const sidebar = page.getByRole("navigation", { name: "Điều hướng không gian học tập" });
  await expect(sidebar.getByRole("link", { name: "Buổi học" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Minh chứng & phản hồi" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Cộng đồng sáng tạo" })).toBeHidden();
  await sidebar.getByText("Tiện ích khác").click();
  await expect(sidebar.getByRole("link", { name: "Cộng đồng sáng tạo" })).toBeVisible();
});
