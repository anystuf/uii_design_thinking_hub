import { test, expect } from "@playwright/test";

test("lecturer creates a draft five-mode course with five persisted quiz templates", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixtures only");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token", JSON.stringify({
    access_token: "fixture-token",
    refresh_token: "fixture-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "teacher-1", email: "teacher@example.test" },
  })));

  const createdLessons: Array<Record<string, unknown>> = [];
  const createdQuizzes: Array<Record<string, unknown>> = [];
  const course = {
    id: "guided-course", title: "Design Thinking Foundations · Guided Studio",
    description: "Guided Design Thinking draft", level: "Foundation", status: "DRAFT",
    createdById: "teacher-1",
  };
  await page.route("http://localhost:4000/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let body: unknown = [];
    if (path === "/auth/me") body = { id: "teacher-1", fullName: "Teacher", role: "LECTURER" };
    else if (path === "/courses" && method === "GET") body = [];
    else if (path === "/courses" && method === "POST") body = course;
    else if (path === "/courses/guided-course") body = course;
    else if (path === "/courses/guided-course/lessons" && method === "POST") {
      const payload = route.request().postDataJSON();
      const lesson = {
        id: "lesson-" + (createdLessons.length + 1), courseId: course.id,
        ...payload, publishedAt: payload.isPublished ? "2026-11-21T00:00:00Z" : null,
      };
      createdLessons.push(lesson);
      body = lesson;
    } else if (path === "/courses/guided-course/lessons") body = createdLessons;
    else if (/^\/lessons\/lesson-\d+\/exercise$/.test(path) && method === "PUT") {
      createdQuizzes.push(route.request().postDataJSON());
      body = { id: "quiz-" + createdQuizzes.length };
    }
    await route.fulfill({ json: body, headers: { "Access-Control-Allow-Origin": "*" } });
  });

  await page.goto("/learn");
  await page.getByText("Dành cho giảng viên · Tạo khóa học mới").click();
  await page.getByRole("button", { name: /Tạo khóa học mẫu 5 bài \+ quiz/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã tạo khóa học nháp với 5 bài thực hành và 5 quiz" })).toBeVisible();
  expect(createdLessons).toHaveLength(5);
  expect(createdQuizzes).toHaveLength(5);
  expect(createdLessons.map(item => (item.title as string).slice(0, 3))).toEqual(["M01", "M02", "M03", "M04", "M05"]);
  expect(createdQuizzes.every(quiz => quiz.kind === "QUIZ" && quiz.published === true && Array.isArray(quiz.items))).toBe(true);
  await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
  await expect(page.getByText("Bản nháp", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("guided lesson reveals accessible hints, honest self-check and stage deep link", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixtures only");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token", JSON.stringify({
    access_token: "fixture-token", refresh_token: "fixture-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "student-1", email: "student@example.test" },
  })));
  const course = { id: "course", title: "Guided Foundations", status: "PUBLISHED", level: "Foundation", createdById: "teacher" };
  const lesson = { id: "m01", courseId: "course", title: "M01 · Empathize — Lắng nghe để hiểu người dùng", content: "MỤC TIÊU: Học phỏng vấn.", publishedAt: "2026-11-21T00:00:00Z", orderIndex: 0 };
  await page.route("http://localhost:4000/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/auth/me") body = { id: "student-1", role: "STUDENT", fullName: "Student" };
    if (path === "/courses") body = [course];
    if (path === "/courses/my-enrollments") body = [{ id: "enrolled", courseId: "course", course }];
    if (path === "/courses/course") body = course;
    if (path === "/courses/course/lessons") body = [lesson];
    if (path === "/courses/course/my-progress") body = { courseId: "course", totalLessons: 1, completedLessons: 0, percent: 0, lessons: [] };
    if (path === "/courses/course/my-rewards") body = { courseId: "course", xp: 0, possibleXp: 60, totalLessons: 1, completedLessons: 0, passedExercises: 0, totalExercises: 1 };
    if (path === "/lessons/m01/exercise") body = null;
    await route.fulfill({ json: body });
  });

  await page.goto("/learn?course=course&lesson=m01");
  await expect(page.getByRole("heading", { name: "Nhiệm vụ thực hành của bạn" })).toBeVisible();
  await page.getByRole("button", { name: "Xem gợi ý" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Bắt đầu bằng/ })).toBeVisible();
  await page.getByLabel("Tự kiểm tra nhanh · Không tính điểm").getByText("Hãy kể về lần gần nhất bạn không tìm được chỗ tự học.").click();
  await expect(page.getByText(/Đúng! Câu hỏi mở/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Mở đúng chế độ EMPATHIZE trong Studio/ }))
    .toHaveAttribute("href", "/studio?mode=EMPATHIZE&course=course");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Studio deep link keeps the selected course and visibly points to the right mode", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local fixtures only");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token", JSON.stringify({
    access_token: "fixture-token", refresh_token: "fixture-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "student-1", email: "student@example.test" },
  })));
  const course = { id: "course", title: "Guided Foundations", status: "PUBLISHED", createdById: "teacher" };
  await page.route("http://localhost:4000/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/auth/me") body = { id: "student-1", role: "STUDENT", fullName: "Student" };
    if (path === "/courses") body = [course];
    if (path === "/courses/my-enrollments") body = [{ course }];
    await route.fulfill({ json: body });
  });
  await page.goto("/studio?mode=IDEATE&course=course");
  await expect(page.getByRole("status").filter({ hasText: "La bàn của bạn: Ideate" })).toBeVisible();
  await expect(page.locator("#course")).toHaveValue("course");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
