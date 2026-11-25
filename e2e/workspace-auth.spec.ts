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
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Fixture!password123');
  const confirm = page.getByLabel('Confirm password');
  await confirm.fill('Wrong!password123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Passwords do not match.' })).toHaveText('Passwords do not match.');
  await expect(confirm).toBeFocused();
  expect(signups).toBe(0);
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(confirm).toHaveAttribute('type', 'text');
  await confirm.fill('Fixture!password123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', {name:'Check your email to continue'})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Your signup request has been processed');
  await expect(page.getByRole('button', {name:/I confirmed my email/})).toBeVisible();
  await expect(page.getByRole('button', {name:'Create account', exact:true})).toHaveCount(0);
  expect(signups).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', {name:/I confirmed my email/}).click();
  await expect(page.getByRole('heading',{name:'Sign in'})).toBeVisible();
  await expect(page.getByLabel('Email',{exact:true})).toHaveValue('student@example.test');
});

test('Google sign-in redirects to the configured Supabase provider and returns to learning', async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local OAuth fixture only');
  await page.route('https://example.supabase.co/auth/v1/authorize?**', route => route.fulfill({ body: 'OAuth fixture' }));
  await page.goto('/learn');
  const request = page.waitForRequest(url => url.url().startsWith('https://example.supabase.co/auth/v1/authorize?'));
  await page.getByRole('button', { name: 'Continue with Google' }).click();
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
  await page.getByRole('button',{name:'New here? Create an account'}).click();
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Fixture!password123');
  await page.getByLabel('Confirm password').fill('Fixture!password123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('button',{name:/Resend confirmation/}).click();
  await expect(page.getByText(/Resend requested/)).toBeVisible();
  await expect(page.getByRole('button',{name:/Resend available in/})).toBeDisabled();
  expect(signups).toBe(1);
  expect(resends).toBe(1);
});

test('rate-limited signup shows actionable error and does not claim success',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local auth fixture only');
  await page.route(url=>url.origin==='https://example.supabase.co'&&url.pathname==='/auth/v1/signup',route=>
    route.fulfill({status:429,json:{code:'over_email_send_rate_limit',msg:'rate limit exceeded'}}));
  await page.goto('/learn');
  await page.getByRole('button',{name:'New here? Create an account'}).click();
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Fixture!password123');
  await page.getByLabel('Confirm password').fill('Fixture!password123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Too many'})).toContainText('Too many');
  await expect(page.getByRole('heading',{name:'Check your email to continue'})).toHaveCount(0);
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
  await page.getByRole('link',{name:'Forgot password?'}).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByRole('button',{name:'Send reset instructions'}).click();
  await expect(page.getByRole('status')).toContainText('If this email belongs to a UII account');
  expect(requests).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('password recovery rate limit is truthful and never claims an email was sent', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.route(url => url.origin === 'https://example.supabase.co' && url.pathname === '/auth/v1/recover',
    route => route.fulfill({status:429,json:{code:'over_email_send_rate_limit',msg:'rate limit exceeded'}}));
  await page.goto('/forgot-password');
  await page.getByLabel('Email',{exact:true}).fill('student@example.test');
  await page.getByRole('button',{name:'Send reset instructions'}).click();
  await expect(page.getByRole('alert').filter({hasText:'Too many requests'})).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('password update route denies access without a valid recovery session', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local auth fixture only');
  await page.goto('/reset-password#type=recovery');
  await expect(page.getByRole('heading',{name:'Invalid or expired link'})).toBeVisible();
  await page.goto('/reset-password');
  await expect(page.getByRole('heading',{name:'Invalid or expired link'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Update password'})).toHaveCount(0);
  await expect(page.getByRole('link',{name:/Request a new recovery email/})).toHaveAttribute('href','/forgot-password?reason=expired');
});


test('recovery link establishes a session and updates the password without exposing tokens in UI', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local mocked recovery session only');
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = [
    encode({alg:'HS256',typ:'JWT'}),
    encode({sub:'00000000-0000-4000-a000-000000000001',role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600}),
    'fixture-signature'
  ].join('.');
  const user = { id:'00000000-0000-4000-a000-000000000001', aud:'authenticated', role:'authenticated',
    email:'recovery-fixture@example.test', app_metadata:{provider:'email',providers:['email']}, user_metadata:{}, identities:[],
    created_at:'2026-11-01T00:00:00Z', updated_at:'2026-11-01T00:00:00Z' };
  let updates = 0;
  await page.route(url => url.hostname==='example.supabase.co' && url.pathname === '/auth/v1/user', async route => {
    if (route.request().method()==='PUT') {
      updates++;
      expect(route.request().postDataJSON().password).toBe('NewFixturePassword!2026');
    }
    await route.fulfill({status:200,json:user});
  });
  await page.route(url => url.hostname==='example.supabase.co' && url.pathname.startsWith('/auth/v1/logout'), route => route.fulfill({status:204,body:''}));
  const hash = new URLSearchParams({access_token:accessToken,refresh_token:'fixture-refresh',
    expires_in:'3600',expires_at:String(Math.floor(Date.now()/1000)+3600),token_type:'bearer',type:'recovery'});
  await page.goto('/reset-password#'+hash.toString());
  await expect(page.getByRole('heading',{name:'Choose a new password'})).toBeVisible({timeout:10000});
  await page.getByLabel('New password',{exact:true}).fill('NewFixturePassword!2026');
  await page.getByLabel('Confirm new password').fill('NewFixturePassword!2026');
  await page.getByRole('button',{name:'Update password'}).click();
  await expect(page.getByRole('heading',{name:'Password updated'})).toBeVisible({timeout:15000});
  expect(updates).toBe(1);
});

test('password recovery pages disable decorative ink and floating chatbot', async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, 'Local visual fixture only');
  for (const path of ['/forgot-password','/reset-password']) {
    await page.goto(path);
    await page.mouse.move(40,40);
    await page.mouse.move(320,240,{steps:16});
    const canvas = page.getByTestId('creative-pointer-trail');
    await expect(canvas).toHaveCount(0);
    await expect(page.getByRole('button',{name:/Open UII learning assistant/})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
