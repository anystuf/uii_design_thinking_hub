import { test, expect } from '@playwright/test';

function loginFixture(page: import('@playwright/test').Page, id: string) {
  return page.addInitScript((person) => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: 'fixture-token', refresh_token: 'fixture-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: person, email: person + '@example.test' },
  })), id);
}

const course = {id:'course',title:'Introduction to Design Thinking',status:'PUBLISHED',createdById:'teacher',
  level:'Foundation',description:'Human-centered practice.'};
const lesson = {id:'lesson-a',courseId:'course',title:'Empathize',orderIndex:0,publishedAt:'2026-11-14T00:00:00Z',
  content:'Observe and practice interviewing.',contentType:'ARTICLE'};

test('student completes a server-graded quiz and receives guidance from the chatbot at 320px', async ({page},testInfo) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await page.setViewportSize({width:320,height:844});
  await loginFixture(page,'student');
  const exercise = {id:'quiz-1',lessonId:'lesson-a',kind:'QUIZ',title:'Empathy interview quiz',instructions:'Choose the best answer',
    items:[{id:'1',prompt:'Which question is open-ended?',options:['Do you like this?','What challenges do you face?'],points:1}],
    passingScore:70,maxAttempts:3,publishedAt:'2026-11-14T00:00:00Z',dueAt:null};
  let posts=0;
  await page.route('http://localhost:4000/**',async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if(path==='/auth/me')data={id:'student',fullName:'Student Demo',role:'STUDENT'};
    if(path==='/courses')data=[course];
    if(path==='/courses/my-enrollments')data=[{id:'enrollment',courseId:'course',course}];
    if(path==='/courses/course')data=course;
    if(path==='/courses/course/lessons')data=[lesson];
    if(path==='/courses/course/my-progress')data={courseId:'course',totalLessons:1,completedLessons:0,percent:0,lessons:[]};
    if(path==='/lessons/lesson-a/exercise')data=exercise;
    if(path==='/exercises/quiz-1/attempts/me')data=[];
    if(path==='/exercises/quiz-1/attempts' && route.request().method()==='POST') {
      expect(route.request().postDataJSON()).toMatchObject({answerIndexes:[1]});
      posts++;
      data={id:'attempt',status:'GRADED',score:100,feedback:'Câu 1: Đúng.',answers:{answerIndexes:[1]},createdAt:'2026-11-20T00:00:00Z'};
    }
    await route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*'}});
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:/Introduction to Design Thinking/}).click();
  await page.getByRole('button',{name:'Bắt đầu / tiếp tục học'}).click();
  await expect(page.getByRole('heading',{name:'Luyện tập và bài tập'})).toBeVisible();
  await page.getByText('Which question is open-ended?').scrollIntoViewIfNeeded();
  await page.getByLabel('What challenges do you face?').check();
  await page.getByRole('button',{name:'Nộp bài và xem kết quả'}).click();
  await expect(page.getByText('Kết quả: 100/100')).toBeVisible();
  expect(posts).toBe(1);
  await page.getByRole('button',{name:/Mở Hỏi UII/}).click();
  await expect(page.getByRole('dialog',{name:'Chatbot hướng dẫn sử dụng UII'})).toBeVisible();
  await page.getByLabel('Nhập câu hỏi cho chatbot').fill('Làm quiz ở đâu?');
  await page.getByRole('button',{name:'Gửi câu hỏi'}).click();
  await expect(page.getByText(/kéo tới mục Luyện tập và bài tập/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('practice-chat-mobile-320.png'),fullPage:true});
});

test('lecturer creates and publishes a quiz with private correct answer and explanation',async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await loginFixture(page,'teacher');
  let saved: Record<string,unknown> | null = null;
  await page.route('http://localhost:4000/**',async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if(path==='/auth/me')data={id:'teacher',fullName:'Teacher Demo',role:'LECTURER'};
    if(path==='/courses')data=[course];
    if(path==='/courses/course')data=course;
    if(path==='/courses/course/lessons')data=[lesson];
    if(path==='/lessons/lesson-a/exercise' && route.request().method()==='GET')data=saved ? {...saved,id:'new-exercise',lessonId:'lesson-a',publishedAt:'2026-11-20T00:00:00Z',dueAt:null} : null;
    if(path==='/lessons/lesson-a/exercise' && route.request().method()==='PUT'){
      saved=route.request().postDataJSON();
      data={...(saved as object),id:'new-exercise',lessonId:'lesson-a',publishedAt:'2026-11-20T00:00:00Z',dueAt:null};
    }
    if(path==='/exercises/new-exercise/attempts')data=[];
    await route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*'}});
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:/Introduction to Design Thinking/}).click();
  await page.getByRole('button',{name:'Mở bài học'}).click();
  await page.getByRole('button',{name:'Tạo bài tập'}).click();
  await page.getByLabel('Tiêu đề bài tập').fill('First empathy quiz');
  await page.getByLabel('Nội dung câu hỏi').fill('Which question is open-ended?');
  await page.getByLabel('Lựa chọn A').fill('Do you like it?');
  await page.getByLabel('Lựa chọn B').fill('What happened last time?');
  await page.getByLabel('Lựa chọn C').fill('Is it fine?');
  await page.getByLabel('Lựa chọn D').fill('Yes or no?');
  await page.getByLabel('Đáp án đúng').selectOption('1');
  await page.getByLabel('Giải thích đáp án (hiển thị sau khi nộp)').fill('Describe real experiences.');
  await page.getByLabel('Công bố bài tập cho sinh viên').check();
  await page.getByRole('button',{name:'Lưu bài tập'}).click();
  await expect.poll(()=>saved).toMatchObject({kind:'QUIZ',published:true});
  expect((saved as unknown as {items:{correctIndex:number}[]}).items[0].correctIndex).toBe(1);
  await expect(page.getByText('First empathy quiz').first()).toBeVisible();
});


test('new lesson without exercise: empty HTTP 200 is treated as absence, not broken JSON', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await loginFixture(page,'teacher');
  let exerciseReads = 0;
  await page.route('http://localhost:4000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if(path==='/auth/me') data={id:'teacher',fullName:'Teacher Demo',role:'LECTURER'};
    if(path==='/courses') data=[course];
    if(path==='/courses/course') data=course;
    if(path==='/courses/course/lessons') data=[lesson];
    if(path==='/lessons/lesson-a/exercise') {
      exerciseReads++;
      return route.fulfill({status:200,body:'',headers:{'content-type':'application/json'}});
    }
    await route.fulfill({json:data});
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:/Introduction to Design Thinking/}).click();
  await page.getByRole('button',{name:'Mở bài học'}).click();
  await expect(page.getByRole('heading',{name:'Luyện tập và bài tập'})).toBeVisible();
  await expect(page.getByText('Chưa có bài tập cho bài học này.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Tạo bài tập'})).toBeVisible();
  await expect(page.getByText(/Unexpected end of JSON input/)).toHaveCount(0);
  expect(exerciseReads).toBeGreaterThan(0);
  await expect(page.getByTestId('creative-pointer-trail')).toHaveCount(1);
});

test('red creative cursor works automatically and draws real pixels over the entire page', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await page.setViewportSize({width:900,height:680});
  await loginFixture(page,'teacher');
  await page.route('http://localhost:4000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if(path==='/auth/me') data={id:'teacher',fullName:'Teacher Demo',role:'LECTURER'};
    if(path==='/courses') data=[course];
    await route.fulfill({json:data});
  });
  await page.goto('/learn');
  const trail=page.getByTestId('creative-pointer-trail');
  await expect(trail).toHaveCount(1);
  await expect(page.getByRole('button',{name:/con trỏ nét vẽ/i})).toHaveCount(0);
  await page.mouse.move(100,180);
  await page.mouse.move(260,235, {steps:12});
  await expect(trail).toHaveAttribute('data-active','true');
  await expect.poll(async () => page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="creative-pointer-trail"]');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const ratio = canvas.width / innerWidth;
    const pixel = ctx.getImageData(Math.floor(260 * ratio), Math.floor(235 * ratio), 1, 1).data;
    return pixel[0] > 150 && pixel[1] < 125 && pixel[2] < 125 && pixel[3] > 100;
  })).toBe(true);
});

test('creative cursor is disabled by operating-system reduced motion', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local fixture only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trail = page.getByTestId('creative-pointer-trail');
  await expect(trail).toHaveCount(1);
  await page.mouse.move(100,120);
  await page.mouse.move(350,200, {steps:8});
  await expect(trail).toHaveAttribute('data-active','false');
});
