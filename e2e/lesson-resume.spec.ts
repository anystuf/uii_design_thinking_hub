import { test, expect } from "@playwright/test";
test("resume skips completed courses and opens the first unfinished lesson with bulk dashboard reads", async ({
  page,
}) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixtures only");
  await page.addInitScript(() =>
    localStorage.setItem(
      "sb-example-auth-token",
      JSON.stringify({
        access_token: "local-token",
        refresh_token: "local-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: "student", email: "local@example.test" },
      }),
    ),
  );
  const finished = {
    id: "finished",
    title: "Completed course",
    status: "PUBLISHED",
  };
  const active = { id: "active", title: "Active course", status: "PUBLISHED" };
  const lessons = [
    {
      id: "done",
      title: "Completed lesson",
      publishedAt: "2026-01-01",
      orderIndex: 1,
    },
    {
      id: "gap",
      title: "Next unfinished lesson",
      publishedAt: "2026-01-01",
      orderIndex: 2,
    },
    {
      id: "later",
      title: "Later lesson",
      publishedAt: "2026-01-01",
      orderIndex: 3,
    },
  ];
  let milestoneReads = 0;
  let teamReads = 0;
  let progressReads = 0;
  await page.route("http://localhost:4000/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === "/auth/me")
      data = {
        id: "student",
        fullName: "Local resume student",
        role: "STUDENT",
      };
    if (path === "/courses") data = [finished, active];
    if (path === "/courses/my-enrollments")
      data = [
        {
          id: "one",
          courseId: "finished",
          course: finished,
          progress: {
            totalLessons: 1,
            completedLessons: 1,
            percent: 100,
            nextLesson: null,
          },
        },
        {
          id: "two",
          courseId: "active",
          course: active,
          progress: {
            totalLessons: 3,
            completedLessons: 1,
            percent: 33,
            nextLesson: { id: "gap", title: "Next unfinished lesson" },
          },
        },
      ];
    if (path === "/courses/active") data = active;
    if (path === "/courses/active/lessons") data = lessons;
    if (path === "/courses/active/my-progress") {
      progressReads++;
      data = {
        totalLessons: 3,
        completedLessons: 1,
        percent: 33,
        lessons: [{ lessonId: "done", completed: true }],
      };
    }
    if (path === "/teams/my/milestones") {
      milestoneReads++;
      data = [];
    } else if (path.startsWith("/teams/")) teamReads++;
    await route.fulfill({ json: data });
  });
  await page.goto("/dashboard");
  const resume = page.getByRole("link", { name: "Tiếp tục học", exact: true });
  await expect(resume).toHaveAttribute(
    "href",
    "/learn?course=active&lesson=gap",
  );
  await expect(page.getByText("1/1 bài · 100% →")).toBeVisible();
  expect(milestoneReads).toBe(1);
  expect(teamReads).toBe(0);
  expect(progressReads).toBe(0);
  await resume.click();
  await expect(
    page.getByRole("heading", { name: "Active course", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#lesson-gap")).toHaveAttribute("open", "");
  await expect(page.locator("#lesson-done")).not.toHaveAttribute("open", "");
  await expect(page.locator("#lesson-gap summary")).toBeFocused();
});
