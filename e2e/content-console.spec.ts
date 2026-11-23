import {test,expect} from '@playwright/test';

test('lecturer edits metadata and lesson minutes, then sends an announcement from Content Console',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local API fixtures only');
  const course={id:'course-1',createdById:'lecturer-1',title:'Design Thinking Foundations',
    description:'Existing introduction',level:'Foundation',status:'PUBLISHED' as const,
    _count:{lessons:1},lessons:[{id:'lesson-1',title:'Empathize',description:'Interview users',content:'Practice observations',
      durationMinutes:55,orderIndex:0,contentType:'ARTICLE',publishedAt:'2026-11-20T00:00:00Z'}]};
  const state={duration:55,calls:0,announcements:0};
  await page.addInitScript(()=>localStorage.setItem('sb-example-auth-token',JSON.stringify({
    access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:'lecturer-1',email:'lecturer@example.test'},
  })));
  await page.route('http://localhost:4000/**',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    const method=route.request().method();
    if(pathname==='/auth/me')return route.fulfill({json:{id:'lecturer-1',fullName:'Lecturer One',role:'LECTURER'}});
    if(pathname==='/courses'&&method==='GET')return route.fulfill({json:[course]});
    if(pathname==='/courses/course-1'&&method==='GET')return route.fulfill({json:course});
    if(pathname==='/courses/course-1'&&method==='PUT'){
      const body=route.request().postDataJSON();
      Object.assign(course,body);state.calls++;
      return route.fulfill({json:course});
    }
    if(pathname==='/projects')return route.fulfill({json:[]});
    if(pathname==='/lessons/lesson-1'&&method==='PUT'){
      const body=route.request().postDataJSON();state.duration=body.durationMinutes;
      course.lessons[0].durationMinutes=state.duration;
      return route.fulfill({json:course.lessons[0]});
    }
    if(pathname==='/notifications/announcements'&&method==='POST'){
      const body=route.request().postDataJSON();
      expect(body).toMatchObject({audience:'COURSE',courseId:'course-1',title:'Workshop update'});
      state.announcements++;return route.fulfill({json:{sent:2,audience:'COURSE'}});
    }
    return route.fulfill({json:[]});
  });
  await page.goto('/console?course=course-1');
  await expect(page.getByRole('heading',{name:'Bảng điều khiển nội dung'})).toBeVisible();
  await expect(page.getByText('55 phút · 1 bài')).toBeVisible();
  await page.getByRole('textbox',{name:'Giới thiệu khóa học'}).fill('Updated course description');
  await page.getByRole('button',{name:'Lưu thay đổi'}).click();
  await expect(page.getByRole('status').filter({hasText:'Đã lưu khóa học'})).toBeVisible();
  expect(state.calls).toBe(1);
  await page.getByRole('button',{name:'Chỉnh sửa'}).click();
  await page.getByRole('spinbutton',{name:'Thời lượng (phút)'}).fill('75');
  await page.getByRole('button',{name:'Lưu bài học'}).click();
  await expect(page.getByText('75 phút · 1 bài')).toBeVisible();
  expect(state.duration).toBe(75);
  await page.getByRole('button',{name:'Thông báo',exact:true}).click();
  await page.getByRole('combobox',{name:'Chọn khóa học'}).selectOption('course-1');
  await page.getByRole('textbox',{name:'Tiêu đề'}).fill('Workshop update');
  await page.getByRole('textbox',{name:'Nội dung'}).fill('Please review your prototype before the next workshop.');
  await page.getByRole('button',{name:'Gửi thông báo ngay'}).click();
  await expect(page.getByRole('status').filter({hasText:'2 người nhận'})).toBeVisible();
  expect(state.announcements).toBe(1);
});

test('student cannot access authoring controls',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local API fixtures only');
  await page.addInitScript(()=>localStorage.setItem('sb-example-auth-token',JSON.stringify({
    access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:'student-1',email:'student@example.test'},
  })));
  await page.route('http://localhost:4000/**',route=>route.fulfill({json:{id:'student-1',fullName:'Student',role:'STUDENT'}}));
  await page.goto('/console');
  await expect(page.getByRole('alert').filter({hasText:'Console chỉ dành cho'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Tạo khóa học'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Gửi thông báo ngay'})).toHaveCount(0);
});
