import { test, expect } from '@playwright/test';

test('mobile learning compass guides non-linear modes, earned XP and one-task focus view', async ({ page }, testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixtures only');
  await page.setViewportSize({width:320, height:844});
  await page.addInitScript(() => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: 'fixture-token', refresh_token: 'fixture-refresh',
    expires_at: Math.floor(Date.now()/1000)+3600,
    user: {id:'student-1',email:'student@example.test'},
  })));
  const course={id:'course',title:'Design Thinking Foundations',status:'PUBLISHED',createdById:'teacher',
    level:'Foundation',description:'Human-centered design'};
  const lesson={id:'lesson',title:'Empathize with users',courseId:'course',publishedAt:'2026-11-14T00:00:00Z',
    contentType:'ARTICLE',content:'Interview people and understand needs.',orderIndex:0};
  await page.route('http://localhost:4000/**', async route => {
    const path=new URL(route.request().url()).pathname;
    let body:unknown=[];
    if (path==='/auth/me') body={id:'student-1',role:'STUDENT',fullName:'Quest learner'};
    if (path==='/courses') body=[course];
    if (path==='/courses/course') body=course;
    if (path==='/courses/my-enrollments') body=[{id:'joined',courseId:'course',course}];
    if (path==='/courses/course/lessons') body=[lesson];
    if (path==='/courses/course/my-progress') body={courseId:'course',percent:0,totalLessons:1,completedLessons:0,lessons:[]};
    if (path==='/courses/course/my-rewards') body={courseId:'course',xp:60,possibleXp:60,completedLessons:1,totalLessons:1,passedExercises:1,totalExercises:1};
    if (path==='/lessons/lesson/exercise') body=null;
    await route.fulfill({json:body, headers:{'Access-Control-Allow-Origin':'*'}});
  });

  await page.goto('/learn');
  await page.getByRole('button',{name:/Design Thinking Foundations/}).click();
  await page.getByRole('button',{name:/Học tiếp bài này/}).click();
  await expect(page.getByRole('heading',{name:'La bàn học tập của bạn'})).toBeVisible();
  await expect(page.getByTestId('creative-pointer-trail')).toHaveCount(1);
  await expect(page.getByRole('button',{name:/con trỏ nét vẽ/i})).toHaveCount(0);
  await expect(page.getByText('Điểm hành trình · XP')).toBeVisible();
  await expect(page.getByRole('progressbar',{name:'Tiến độ XP khả dụng trong khóa học'})).toHaveAttribute('aria-valuenow','60');

  const ideate=page.getByRole('button',{name:/Ideate — Ý tưởng/});
  await ideate.click();
  await expect(ideate).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('link',{name:/Mở Studio & nhóm/})).toHaveAttribute('href', '/studio?mode=IDEATE&course=course');
  await expect(page.getByText(/đây không phải xếp hạng điểm số/)).toBeVisible();
  await expect(page.getByRole('link',{name:/Đem vào dự án thật/})).toHaveAttribute('href', '/studio?course=course&mode=IDEATE');

  await page.getByRole('button',{name:'Chế độ tập trung'}).click();
  await expect(page.getByRole('button',{name:'Thoát chế độ tập trung'})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-uii-focus-mode','true');
  await page.mouse.move(100, 150);
  await page.mouse.move(260, 220, {steps: 10});
  await expect(page.getByTestId('creative-pointer-trail')).toHaveAttribute('data-active','false');
  await expect(page.getByRole('heading',{name:'Nội dung bài học'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Luyện tập và bài tập'})).toBeHidden();

  await page.getByRole('button',{name:/2. Luyện tập/}).click();
  await expect(page.getByRole('heading',{name:'Luyện tập và bài tập'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Nội dung bài học'})).toBeHidden();

  await page.getByRole('button',{name:/3. Vận dụng/}).click();
  const studioLink=page.getByRole('link',{name:/Mở đúng chế độ EMPATHIZE trong Studio/});
  await expect(studioLink).toBeVisible();
  await expect(studioLink).toHaveAttribute('href', '/studio?mode=EMPATHIZE&course=course');
  await page.getByRole('button',{name:'Thoát chế độ tập trung'}).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-uii-focus-mode','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('quest-compass-mobile-320.png'), fullPage:true});
});
