import { test, expect } from '@playwright/test';

test('student discovers, enrolls, and completes a lesson in the new learning player', async ({ page }, testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.startsWith('http://localhost'), 'Local learning fixture only');
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: 'local-fixture-token', refresh_token: 'local-fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'student', email: 'student@example.test' },
  })));
  const course = { id: 'course', title: 'Design Thinking Foundations', status: 'PUBLISHED', createdById: 'teacher',
    level: 'Foundation', description: 'Design for real people.', _count: { lessons: 2 },
    createdBy: { fullName: 'Demo Lecturer', id: 'teacher' } };
  const lessons = [
    { id: 'lesson-a', courseId: 'course', title: 'Empathize with people', content: 'Observe real user needs.', contentType: 'VIDEO', videoUrl: 'https://youtu.be/ldYzbV0NDp8', orderIndex: 0, publishedAt: '2026-11-14T00:00:00Z' },
    { id: 'lesson-b', courseId: 'course', title: 'Define the problem', content: 'Frame a useful design question.', contentType: 'ARTICLE', orderIndex: 1, publishedAt: '2026-11-14T00:00:00Z' },
  ];
  let enrolled = false;
  let completed = false;
  await page.route('http://localhost:4000/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body: unknown = [];
    if (path === '/auth/me') body = { id: 'student', fullName: 'Fixture Student', role: 'STUDENT' };
    if (path === '/courses') body = [course];
    if (path === '/courses/course') body = course;
    if (path === '/courses/my-enrollments') body = enrolled ? [{id: 'enrollment', courseId:'course',course}] : [];
    if (path === '/courses/course/enroll' && request.method() === 'POST') { enrolled = true; body = { id: 'enrollment' }; }
    if (path === '/courses/course/lessons') body = enrolled ? lessons : [];
    if (path === '/courses/course/my-progress') body = { courseId:'course',totalLessons:2,completedLessons:completed?1:0,percent:completed?50:0,lessons:completed?[{lessonId:'lesson-a',completed:true}]:[] };
    if (path === '/lessons/lesson-a/progress' && request.method() === 'PUT') { completed = Boolean(request.postDataJSON().completed); body = { completed }; }
    await route.fulfill({ json: body, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:/Design Thinking Foundations/}).click();
  await expect(page.getByRole('heading',{name:'Design Thinking Foundations',exact:true})).toBeFocused();
  await expect(page.getByRole('button',{name:'Ghi danh khóa học'})).toBeInViewport();
  await page.getByRole('button',{name:'Ghi danh khóa học'}).click();
  await expect(page.getByRole('button',{name:/Học tiếp bài này/})).toBeVisible();
  await page.getByRole('button',{name:/Học tiếp bài này/}).click();
  await expect(page.getByRole('heading',{name:'Empathize with people'})).toBeVisible();
  await expect(page.getByTitle('Video bài học: Empathize with people')).toBeVisible();
  await page.getByRole('button',{name:'Đánh dấu hoàn thành'}).click();
  await expect(page.getByRole('button',{name:/Đã hoàn thành/}).last()).toBeVisible();
  await page.getByRole('button',{name:'Chương trình khóa học'}).click();
  await expect(page.getByTestId('student-next-action')).toContainText('Tiếp tục: Define the problem');
  await expect(page.getByTestId('student-next-action')).toContainText('Đã hoàn thành 1/2 bài đang hiển thị');
  await page.getByRole('button',{name:/Học tiếp bài này/}).click();
  await expect(page.getByRole('heading',{name:'Define the problem'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('lesson-player-mobile-320.png'),fullPage:true});
});


test('completed course offers project application rather than restarting lessons', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local learning fixture only');
  await page.setViewportSize({ width: 375, height: 844 });
  await page.addInitScript(() => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token:'fixture-token',refresh_token:'fixture-refresh',
    expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'student',email:'student@example.test'},
  })));
  const course={id:'course',title:'Complete Design Thinking',createdById:'teacher',
    status:'PUBLISHED',level:'Foundation',description:'Apply every step.'};
  const lessons=[
    {id:'a',title:'Empathize',courseId:'course',publishedAt:'2026-11-20T00:00:00Z',orderIndex:0},
    {id:'b',title:'Define',courseId:'course',publishedAt:'2026-11-20T00:00:00Z',orderIndex:1},
  ];
  await page.route('http://localhost:4000/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let data:unknown=[];
    if(path==='/auth/me')data={id:'student',fullName:'Student',role:'STUDENT'};
    if(path==='/courses')data=[course];
    if(path==='/courses/course')data=course;
    if(path==='/courses/my-enrollments')data=[{id:'enrollment',courseId:'course',course}];
    if(path==='/courses/course/lessons')data=lessons;
    if(path==='/courses/course/my-progress')data={courseId:'course',completedLessons:2,totalLessons:2,percent:100,
      lessons:[{lessonId:'a',completed:true},{lessonId:'b',completed:true}]};
    await route.fulfill({json:data});
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:/Complete Design Thinking/}).click();
  const next=page.getByTestId('student-next-action');
  await expect(next.getByRole('heading',{name:'Chuyển kiến thức thành sản phẩm'})).toBeVisible();
  await expect(next.getByRole('link',{name:/Đến Design Studio/}))
    .toHaveAttribute('href','/studio?course=course');
  await expect(next.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
  await expect(next.getByRole('button',{name:/Học tiếp bài này/})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
