import { test, expect } from "@playwright/test";
import { getStudioGuidedStep } from "../lib/studio-guidance";

test("guidance selects genuine next steps without inventing progress or forcing stages", () => {
  const base = {
    courseId: "course", challenges: [{ id: "challenge", status: "PUBLISHED" }],
    challengeId: null as string | null, teamId: null as string | null,
    myTeams: [] as {id:string;challengeId:string}[], invitationCount: 0,
    templates: [{ id: "template", mode: "EMPATHIZE" as const }],
    activities: [] as {id:string;mode:"EMPATHIZE";status:string;templateId:string}[],
    mode: "EMPATHIZE" as const,
  };
  expect(getStudioGuidedStep({...base,courseId:""}).kind).toBe("enroll");
  expect(getStudioGuidedStep(base).kind).toBe("choose-challenge");
  expect(getStudioGuidedStep({...base,challenges:[]}).kind).toBe("await-challenge");
  expect(getStudioGuidedStep({...base,challengeId:"challenge"}).kind).toBe("create-team");
  expect(getStudioGuidedStep({...base,challengeId:"challenge",invitationCount:1}).kind).toBe("accept-invitation");
  expect(getStudioGuidedStep({...base,challengeId:"challenge",myTeams:[{id:"team",challengeId:"challenge"}]}).kind).toBe("choose-team");
  expect(getStudioGuidedStep({...base,challengeId:"challenge",teamId:"team"}).kind).toBe("start");
  expect(getStudioGuidedStep({...base,challengeId:"challenge",teamId:"team",activities:[
    {id:"draft",mode:"EMPATHIZE",status:"DRAFT",templateId:"template"},
  ]}).kind).toBe("resume");
  expect(getStudioGuidedStep({...base,challengeId:"challenge",teamId:"team",activities:[
    {id:"complete",mode:"EMPATHIZE",status:"COMPLETED",templateId:"template"},
  ]}).kind).toBe("evidence");
});

test("student explores a real Studio task from existing team to persisted evidence, mobile-first", async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local API fixtures only");
  await page.setViewportSize({width:320,height:840});
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token",JSON.stringify({
    access_token:"fixture-token",refresh_token:"fixture-refresh",
    expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:"student-1",email:"student@example.test"},
  })));
  const course={id:"course",title:"Design Thinking Foundations",status:"PUBLISHED",createdById:"teacher"};
  const challenge={id:"challenge",courseId:"course",title:"Study spaces",brief:"Find quiet study spaces",
    status:"PUBLISHED",milestones:[]};
  const team={id:"team",title:"Team Green",ownerId:"student-1",challengeId:"challenge",currentStage:"EMPATHIZE",
    members:[{id:"member",userId:"student-1",role:"OWNER",
      user:{id:"student-1",fullName:"Learner One",email:"student@example.test"}}],
    tasks:[],challenge};
  const template={id:"template",name:"Interview Guide",slug:"interview-guide",mode:"EMPATHIZE",
    description:"Talk to real users",instructions:"Ask about a real recent experience",
    fields:[{key:"question",label:"First interview question",type:"textarea"}]};
  type Activity={id:string;templateId:string;template:typeof template;mode:"EMPATHIZE";status:"DRAFT"|"COMPLETED";content:Record<string,string>;createdAt:string;updatedAt:string};
  const activities:Activity[]=[];
  let created=0, completed=0;
  await page.route("http://localhost:4000/**",async route=>{
    const path=new URL(route.request().url()).pathname;
    const method=route.request().method();
    let result:unknown=[];
    if(path==="/auth/me")result={id:"student-1",fullName:"Learner One",role:"STUDENT"};
    else if(path==="/courses")result=[course];
    else if(path==="/courses/my-enrollments")result=[{course}];
    else if(path==="/activity-templates")result=[template];
    else if(path==="/teams/my")result=[team];
    else if(path==="/team-invitations/my")result=[];
    else if(path==="/courses/course/challenges")result=[challenge];
    else if(path==="/challenges/challenge")result=challenge;
    else if(path==="/challenges/challenge/teams")result=[team];
    else if(path==="/challenges/challenge/activities")result=[];
    else if(path==="/teams/team")result=team;
    else if(path==="/projects/team/activities"&&method==="GET")result=activities;
    else if(path==="/projects/team/activities"&&method==="POST"){
      created++;
      const a:Activity={id:"activity-1",templateId:"template",template,mode:"EMPATHIZE",
        status:"DRAFT",content:{},createdAt:"2026-11-21T00:00:00Z",updatedAt:"2026-11-21T00:00:00Z"};
      activities.push(a);result=a;
    }else if(path==="/project-activities/activity-1"&&method==="PATCH"){
      const body=route.request().postDataJSON();
      const a=activities[0];
      a.content=body.content;a.status=body.status;
      if(body.status==="COMPLETED")completed++;
      result=a;
    }else if(path.startsWith("/projects/team/discussion"))result=[];
    await route.fulfill({json:result,headers:{"Access-Control-Allow-Origin":"*"}});
  });
  await page.goto("/studio?course=course");
  const guide=page.getByTestId("studio-guided-journey");
  await expect(guide).toContainText("Khám phá một thử thách thực tế");
  await expect(guide.getByRole("button",{name:"Xem thử thách"})).toBeVisible();
  await expect(page.getByText("Hai nhóm, hai cách tiếp cận.")).toBeHidden();
  await guide.getByRole("button",{name:"Xem thử thách"}).click();
  await expect(guide).toContainText("Tiếp tục cùng nhóm của bạn");
  await guide.getByRole("button",{name:"Mở không gian nhóm"}).click();
  await expect(guide).toContainText("Thử một phương pháp nhỏ");
  await expect(page.getByText("Taskboard")).toBeHidden();
  await expect(guide.getByTestId("studio-extra-guidance")).not.toHaveAttribute("open");
  await guide.getByRole("button",{name:"Bắt đầu hoạt động"}).click();
  await expect(page.getByLabel("First interview question")).toBeVisible();
  expect(created).toBe(1);
  await page.getByLabel("First interview question").fill("When did you last have trouble finding a quiet place?");
  await page.getByRole("button",{name:/Hoàn thành activity/}).click();
  await expect(guide).toContainText("Bạn đã hoàn thành một hoạt động");
  await expect(guide.getByRole("link",{name:"Lưu minh chứng"}))
    .toHaveAttribute("href","/evidence?projectId=team");
  expect(completed).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("guide is voluntary and advanced methods remain discoverable", async ({page}) => {
  test.skip(!!process.env.E2E_BASE_URL, "Local API fixtures only");
  await page.addInitScript(() => localStorage.setItem("sb-example-auth-token",JSON.stringify({
    access_token:"fixture-token",refresh_token:"fixture-refresh",
    expires_at:Math.floor(Date.now()/1000)+3600,
    user:{id:"student-1",email:"student@example.test"},
  })));
  await page.route("http://localhost:4000/**",async route=>{
    const path=new URL(route.request().url()).pathname;
    let result:unknown=[];
    if(path==="/auth/me")result={id:"student-1",fullName:"Learner",role:"STUDENT"};
    if(path==="/courses")result=[{id:"course",title:"Course",status:"PUBLISHED",createdById:"teacher"}];
    if(path==="/courses/my-enrollments")result=[{course:{id:"course",title:"Course",status:"PUBLISHED",createdById:"teacher"}}];
    await route.fulfill({json:result});
  });
  await page.goto("/studio");
  const guide=page.getByTestId("studio-guided-journey");
  await expect(guide).toContainText("Chưa có thử thách để tham gia");
  await guide.getByRole("button",{name:"Thu gọn hướng dẫn"}).click();
  await expect(guide.getByRole("button",{name:"Mở gợi ý"})).toBeVisible();
  await guide.getByRole("button",{name:"Mở gợi ý"}).click();
  const extra=guide.getByTestId("studio-extra-guidance");
  await extra.locator("summary").click();
  await expect(extra).toHaveAttribute("open");
  await extra.getByRole("button",{name:"Ideate"}).click();
  await expect(extra.getByRole("button",{name:"Ideate"})).toHaveAttribute("aria-pressed","true");
});
