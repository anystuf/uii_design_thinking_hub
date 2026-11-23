import {test,expect} from '@playwright/test';

test('signed-in learners can ask and answer a question in the Quora-style community at mobile width',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local API fixtures only');
  await page.setViewportSize({width:375,height:812});
  await page.addInitScript(()=>localStorage.setItem('sb-example-auth-token',JSON.stringify({
    access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:'student-1',email:'student@example.test'},
  })));
  type Question={id:string;title:string;caption:string;topic:string;publishedAt:string;acceptedCommentId:null;author:{id:string;fullName:string;role:string};reactions:{userId:string;type:string}[];_count:{comments:number;reactions:number}};
  const questions:Question[]=[];
  const answers:{id:string;content:string;createdAt:string;author:{id:string;fullName:string;role:string}}[]=[];
  let newQuestionCount=0;let answerCount=0;
  await page.route('http://localhost:4000/**',async route=>{
    const url=new URL(route.request().url());const path=url.pathname;const method=route.request().method();
    let data:unknown=[];
    if(path==='/auth/me')data={id:'student-1',fullName:'Learner One',role:'STUDENT'};
    if(path==='/projects')data=[];
    if(path==='/community/feed')data=[];
    if(path==='/community/questions'&&method==='GET')data=questions;
    if(path==='/community/questions'&&method==='POST'){
      const b=route.request().postDataJSON();
      expect(b).toMatchObject({topic:'EMPATHIZE'});
      newQuestionCount++;
      const question:Question={id:'question-new',title:b.title,caption:b.body,topic:b.topic,
        publishedAt:'2026-11-21T00:00:00Z',acceptedCommentId:null,
        author:{id:'student-1',fullName:'Learner One',role:'STUDENT'},
        reactions:[],_count:{comments:0,reactions:0}};
      questions.unshift(question);data={id:question.id};
    }
    if(path==='/community/questions/question-new/answers'&&method==='GET')data=answers;
    if(path==='/community/questions/question-new/answers'&&method==='POST'){
      const b=route.request().postDataJSON();answerCount++;
      answers.push({id:'a-1',content:b.content,createdAt:'2026-11-21T00:05:00Z',
        author:{id:'student-1',fullName:'Learner One',role:'STUDENT'}});
      questions[0]._count.comments=answers.length;data=answers[0];
    }
    await route.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*'}});
  });
  await page.goto('/community');
  await expect(page.getByRole('heading',{name:'Hỏi đáp cùng cộng đồng'})).toBeVisible();
  await page.getByRole('button',{name:'Đặt câu hỏi'}).click();
  await page.getByRole('textbox',{name:'Tiêu đề câu hỏi'}).fill('How can we avoid leading users in interviews?');
  await page.getByRole('combobox',{name:'Chủ đề'}).selectOption('EMPATHIZE');
  await page.getByRole('textbox',{name:'Bối cảnh và điều bạn đã thử'}).fill(
    'We are interviewing students to understand their learning habits. What questions should we ask?');
  await page.getByRole('button',{name:'Đăng câu hỏi'}).click();
  await expect(page.getByRole('heading',{name:'How can we avoid leading users in interviews?'})).toBeVisible();
  expect(newQuestionCount).toBe(1);
  await page.getByRole('textbox',{name:'Chia sẻ câu trả lời của bạn'}).fill('Ask about a real recent experience and avoid suggesting your solution.');
  await page.getByRole('button',{name:'Gửi câu trả lời'}).click();
  await expect(page.getByText('Ask about a real recent experience and avoid suggesting your solution.')).toBeVisible();
  expect(answerCount).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('new Community UI reports a missing deployed API as a rollout issue, not a user error',async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,'Local API fixture only');
  await page.addInitScript(()=>localStorage.setItem('sb-example-auth-token',JSON.stringify({
    access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:'student-1',email:'student@example.test'},
  })));
  await page.route('http://localhost:4000/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/auth/me')return route.fulfill({json:{id:'student-1',fullName:'Learner One',role:'STUDENT'}});
    if(path==='/community/questions')return route.fulfill({status:404,json:{statusCode:404,message:'Cannot GET /community/questions'}});
    return route.fulfill({json:[]});
  });
  await page.goto('/community');
  await expect(page.getByRole('heading',{name:'Hỏi đáp cùng cộng đồng'})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Hỏi đáp đang chờ đồng bộ hệ thống'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Đặt câu hỏi'})).toBeDisabled();
  await expect(page.getByText(/Chưa có câu hỏi phù hợp/)).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Dự án được chia sẻ trong UII'})).toBeVisible();
});
