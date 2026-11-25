import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const role of ["STUDENT", "LECTURER", "ADMIN"]) {
  test(`${role} task dashboard and navigation at eight widths (local fixture)`, async ({
    page,
  }, testInfo) => {
    test.skip(!!process.env.E2E_BASE_URL, "Local fixtures only");
    await page.addInitScript(() =>
      localStorage.setItem(
        "sb-example-auth-token",
        JSON.stringify({
          access_token: "fixture-token",
          refresh_token: "fixture-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: "fixture", email: "fixture@example.test" },
        }),
      ),
    );
    const course = {
      id: "course",
      title: "Design Thinking Foundations",
      status: "PUBLISHED",
      createdById: "fixture",
    };
    let profileRequests = 0;
    await page.route("http://localhost:4000/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = [];
      if (path === "/auth/me") {
        profileRequests++;
        data = { id: "fixture", fullName: "Local fixture", role };
      }
      if (path === "/courses") data = [course];
      if (path === "/courses/course") data = course;
      if (path === "/courses/my-enrollments")
        data = [{ id: "enrollment", courseId: "course", course, progress: {totalLessons:4,completedLessons:1,percent:25,nextLesson:{id:"next",title:"Next lesson"}} }];
      if (path.endsWith("/my-progress"))
        data = { totalLessons: 4, completedLessons: 1, percent: 25, lessons: [] };
      await route.fulfill({ json: data });
    });
    await page.goto("/dashboard");
    await expect(page.getByText("Hello, Local fixture")).toBeVisible();
    if (role === "STUDENT") {
      await expect(
        page.getByRole("link", { name: "Continue learning", exact: true }),
      ).toHaveAttribute("href", "/learn?course=course&lesson=next");
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "25",
      );
    }
    if (role === "LECTURER")
      await expect(
        page.getByRole("link", { name: "Manage courses", exact: true }),
      ).toBeVisible();
    if (role === "ADMIN")
      await expect(
        page.getByRole("link", { name: "Open account management" }),
      ).toHaveAttribute("href", "/admin");
    await page.getByRole("button", {name:"Help", exact:true}).filter({visible:true}).click();
    const guide = page.getByRole("dialog", {name:"How to use the hub"});
    const question = role === "ADMIN" ? "Where can I review accounts and permissions?" :
      role === "LECTURER" ? "Chấm bài và gửi phản hồi thế nào?" : "Nộp bài và đọc phản hồi ở đâu?";
    await guide.getByRole("button", {name:question, exact:true}).click();
    await expect(guide.getByRole("link")).toHaveAttribute("href", role === "ADMIN" ? "/admin" : role === "LECTURER" ? "/review" : "/evidence");
    if (role !== "ADMIN") await expect(guide.getByRole("button", {name:"Where can I review accounts and permissions?"})).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(guide).not.toBeVisible();
    expect(profileRequests).toBe(1);
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${role}-${width}.png`),
        fullPage: true,
      });
      if (width < 1024) {
        await page.getByText("Menu", { exact: true }).click();
        const nav = page
          .getByRole("navigation", { name: "Workspace navigation" })
          .filter({ visible: true });
        await expect(
          nav.getByRole("link", { name: "Dashboard", exact: true }),
        ).toHaveAttribute("aria-current", "page");
        await expect(
          nav.getByRole("link", { name: "Administration", exact: true }),
        ).toHaveCount(role === "ADMIN" ? 1 : 0);
        await page.keyboard.press("Escape");
        await page.getByText("Menu", { exact: true }).click();
      }
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (role === 'STUDENT') {
      await page.getByRole('link', {name:'Continue learning',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Design Thinking Foundations',exact:true})).toBeVisible();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','25');
    }

  });
}
