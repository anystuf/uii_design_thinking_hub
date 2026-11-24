import { expect, test } from '@playwright/test';
import { authRedirectUrl } from '../lib/auth-redirect';

test('registration mismatch is explained and no signup is sent at 320px', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.setViewportSize({ width: 320, height: 844 });
  let signups = 0;
  await page.route(url => url.origin === 'https://example.supabase.co' && url.pathname === '/auth/v1/signup', async route => {
    signups += 1;
    await route.fulfill({ json: { id: 'fixture-user', email: 'student@example.test' } });
  });
  await page.goto('/learn');
  await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký' }).click();
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Fixture!password123');
  const confirm = page.getByLabel('Xác nhận mật khẩu');
  await confirm.fill('Wrong!password123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Hai mật khẩu chưa khớp.' })).toHaveText('Hai mật khẩu chưa khớp.');
  await expect(confirm).toBeFocused();
  expect(signups).toBe(0);
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(confirm).toHaveAttribute('type', 'text');
  await confirm.fill('Fixture!password123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('heading', {name:'Kiểm tra email để tiếp tục'})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Hệ thống đã xử lý yêu cầu đăng ký');
  await expect(page.getByRole('button', {name:/Tôi đã xác nhận email/})).toBeVisible();
  await expect(page.getByRole('button', {name:'Đăng ký', exact:true})).toHaveCount(0);
  expect(signups).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', {name:/Tôi đã xác nhận email/}).click();
  await expect(page.getByRole('heading',{name:'Đăng nhập'})).toBeVisible();
  await expect(page.getByLabel('Email',{exact:true})).toHaveValue('student@example.test');
});

test('Google sign-in redirects to the configured Supabase provider and returns to learning', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local OAuth fixture only');
  await page.route('https://example.supabase.co/auth/v1/authorize?**', route => route.fulfill({ body: 'OAuth fixture' }));
  await page.goto('/learn');
  const request = page.waitForRequest(url => url.url().startsWith('https://example.supabase.co/auth/v1/authorize?'));
  await page.getByRole('button', { name: 'Tiếp tục với Google' }).click();
  const params = new URL((await request).url()).searchParams;
  expect(params.get('provider')).toBe('google');
  expect(params.get('redirect_to')).toBe('http://localhost:3100/learn');
});

test('verification redirect remains on stable staging origin instead of expiring preview host',()=>{
  expect(authRedirectUrl('https://uii-design-thinking-hub-staging-7m88jb0mo-team.vercel.app','/learn'))
    .toBe('https://uii-design-thinking-hub-staging.vercel.app/learn');
  expect(authRedirectUrl('https://uii-design-thinking-hub-preview.vercel.app','/learn'))
    .toBe('https://uii-design-thinking-hub-staging.vercel.app/learn');
  expect(authRedirectUrl('https://uii-design-thinking-hub-staging.vercel.app','/learn'))
    .toBe('https://uii-design-thinking-hub-staging.vercel.app/learn');
  expect(authRedirectUrl('http://localhost:3100','/learn')).toBe('http://localhost:3100/learn');
});

test('signup can request confirmation again, without repeating account creation',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local auth fixture only');
  let signups=0, resends=0;
  await page.route(url=>url.origin==='https://example.supabase.co'&&url.pathname==='/auth/v1/signup',async route=>{
    signups++;
    await route.fulfill({json:{id:'fixture-user',email:'student@example.test'}});
  });
  await page.route(url=>url.origin==='https://example.supabase.co'&&url.pathname==='/auth/v1/resend',async route=>{
    resends++;
    const payload=route.request().postDataJSON();
    expect(payload).toMatchObject({type:'signup',email:'student@example.test'});
    await route.fulfill({json:{}});
  });
  await page.goto('/learn');
  await page.getByRole('button',{name:'Chưa có tài khoản? Đăng ký'}).click();
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('Fixture!password123');
  await page.getByLabel('Xác nhận mật khẩu').fill('Fixture!password123');
  await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
  await page.getByRole('button',{name:/Chưa nhận được\? Gửi lại email xác nhận/}).click();
  await expect(page.getByText(/Đã tiếp nhận yêu cầu gửi lại/)).toBeVisible();
  await expect(page.getByRole('button',{name:/Có thể gửi lại sau/})).toBeDisabled();
  expect(signups).toBe(1);
  expect(resends).toBe(1);
});

test('rate-limited signup shows actionable error and does not claim success',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local auth fixture only');
  await page.route(url=>url.origin==='https://example.supabase.co'&&url.pathname==='/auth/v1/signup',route=>
    route.fulfill({status:429,json:{code:'over_email_send_rate_limit',msg:'rate limit exceeded'}}));
  await page.goto('/learn');
  await page.getByRole('button',{name:'Chưa có tài khoản? Đăng ký'}).click();
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('Fixture!password123');
  await page.getByLabel('Xác nhận mật khẩu').fill('Fixture!password123');
  await page.getByRole('button',{name:'Đăng ký',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'giới hạn'})).toContainText('giới hạn');
  await expect(page.getByRole('heading',{name:'Kiểm tra email để tiếp tục'})).toHaveCount(0);
});


test('UII password recovery requests a stable UII destination and does not reveal account existence', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.setViewportSize({width:320,height:844});
  let requests=0;
  await page.route(url => url.origin === 'https://example.supabase.co' && url.pathname === '/auth/v1/recover', async route => {
    requests++;
    const redirect = new URL(route.request().url()).searchParams.get('redirect_to');
    expect(redirect).toBe('http://localhost:3100/reset-password');
    const body = route.request().postDataJSON();
    expect(body.email).toBe('student@example.test');
    await route.fulfill({status:200,json:{}});
  });
  await page.goto('/learn');
  await page.getByRole('link',{name:'Quên mật khẩu?'}).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByRole('button',{name:'Gửi hướng dẫn đặt lại mật khẩu'}).click();
  await expect(page.getByRole('status')).toContainText('Nếu địa chỉ email này có tài khoản UII');
  expect(requests).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('password recovery rate limit is truthful and never claims an email was sent', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.route(url => url.origin === 'https://example.supabase.co' && url.pathname === '/auth/v1/recover',
    route => route.fulfill({status:429,json:{code:'over_email_send_rate_limit',msg:'rate limit exceeded'}}));
  await page.goto('/forgot-password');
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByRole('button',{name:'Gửi hướng dẫn đặt lại mật khẩu'}).click();
  await expect(page.getByRole('alert')).toContainText('giới hạn');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('password update route denies access without a valid recovery session', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.goto('/reset-password');
  await expect(page.getByRole('heading',{name:'Liên kết không còn hợp lệ'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Cập nhật mật khẩu'})).toHaveCount(0);
  await expect(page.getByRole('link',{name:/Về trang đăng nhập/})).toHaveAttribute('href','/learn');
});
