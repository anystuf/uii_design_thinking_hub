import {test,expect} from "@playwright/test";
import {STAGE_GUIDES,SAMPLE_TEAMS,guideForStage} from "../lib/stage-experience";
import {trustedCollabEmbed} from "../components/external-collaboration-board";

test("learning stage parity: five stages each have questions, tools and deliverables",()=>{
 expect(STAGE_GUIDES.map(x=>x.id)).toEqual(["EMPATHIZE","DEFINE","IDEATE","PROTOTYPE","TEST"]);
 const tools=new Set(STAGE_GUIDES.flatMap(stage=>stage.tools));
 expect(tools.size).toBe(10);
 for(const guide of STAGE_GUIDES){
   expect(guide.prompts).toHaveLength(3);
   expect(guide.deliverable.length).toBeGreaterThan(15);
   expect(guide.question.length).toBeGreaterThan(15);
   expect(guideForStage(guide.id).id).toBe(guide.id);
 }
 expect(guideForStage("EMPATHIZE").tools).toContain("Empathy Map");
 expect(guideForStage("PROTOTYPE").tools).toContain("Storyboard");
});

test("two sample groups illustrate all five phases and cannot be mistaken for persisted results",()=>{
 expect(SAMPLE_TEAMS.length).toBeGreaterThanOrEqual(2);
 for(const team of SAMPLE_TEAMS){
   expect(team.members.length).toBeGreaterThanOrEqual(2);
   for(const stage of STAGE_GUIDES)expect(team.progress[stage.id]).toMatch(/Mô phỏng/);
 }
});

test("untrusted collaboration URLs are rejected before loading external content",()=>{
 expect(trustedCollabEmbed("https://padlet.com/embed/aBc12")).toBe("https://padlet.com/embed/aBc12");
 expect(trustedCollabEmbed("https://miro.com/app/live-embed/o9J_YxZ=")).toBe("https://miro.com/app/live-embed/o9J_YxZ=");
 expect(trustedCollabEmbed("https://evil.example/iframe")).toBeNull();
 expect(trustedCollabEmbed("https://padlet.com.attacker.example/embed/aBc12")).toBeNull();
 expect(trustedCollabEmbed("javascript:alert(1)")).toBeNull();
 expect(trustedCollabEmbed("https://padlet.com/padlets/private-board")).toBeNull();
 expect(trustedCollabEmbed("<iframe src='https://padlet.com/embed/abcd'></iframe>")).toBeNull();
 expect(trustedCollabEmbed("https://miro.com/app/board/abc")).toBeNull();
});

test("community shows real-vs-demo boundary without exposing protected content to guests",async ({page})=>{
 test.skip(!!process.env.E2E_BASE_URL,"Local preview fixture only");
 await page.setViewportSize({width:375,height:812});
 await page.goto("/community");
 await expect(page.getByRole("heading",{name:/Ý tưởng tốt hơn khi được chia sẻ/})).toBeVisible();
 await expect(page.getByTestId("sample-team-gallery")).toBeVisible();
 await expect(page.getByRole("button",{name:/Nhóm Mây Xanh/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Nhóm Hạt Giống/})).toBeVisible();
 await expect(page.getByText(/SAMPLE · KHÔNG LƯU LMS/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
