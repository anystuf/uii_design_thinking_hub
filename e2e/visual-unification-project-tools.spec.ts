import {test,expect} from "@playwright/test";
import {formatEvidenceSource,parseEvidenceSource,safeEvidenceUrl} from "../lib/external-evidence";

test("workspace keeps homepage navigation and the canonical editorial palette",async ({page})=>{
 test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
 await page.setViewportSize({width:320,height:760});
 await page.goto("/learn");
 const home=page.getByRole("link",{name:"Về trang chủ UII Design Thinking Hub"});
 await expect(home).toBeVisible();
 await expect(page.locator(".workspace-header")).toHaveCSS("background-color","rgb(250, 248, 241)");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await home.click();
 await expect(page).toHaveURL("/");
});

test("Empathy Map renders editable sticky notes and Storyboard has four distinct frames",async ({page})=>{
 test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
 await page.setViewportSize({width:375,height:844});
 await page.goto("/demo?tool=Empathy%20Map");
 await expect(page.getByTestId("demo-structured-tool")).toBeVisible();
 await expect(page.getByRole("heading",{name:/SAYS/})).toBeVisible();
 await page.getByRole("button",{name:/Thêm sticky note/}).first().click();
 await expect(page.getByLabel(/SAYS.+ghi chú 2/)).toBeVisible();
 await page.getByLabel(/SAYS.+ghi chú 2/).fill("Người dùng: quá nhiều bước để đăng ký");
 await expect(page.getByRole("link",{name:/Mở mẫu Miro chính thức/})).toHaveAttribute("href","https://miro.com/templates/empathy-map/");
 await page.getByRole("button",{name:"Storyboard",exact:true}).click();
 await expect(page.getByRole("heading",{name:/Storyboard · 4 khung trải nghiệm/})).toBeVisible();
 await expect(page.getByRole("heading",{name:/01 · Bối cảnh/})).toBeVisible();
 await expect(page.getByRole("heading",{name:/04 · Kết quả/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("external evidence stores only validated project links in immutable version descriptions",()=>{
 const url="https://drive.google.com/file/d/1aBcDE/view";
 const content=formatEvidenceSource("Prototype tested in class.",url);
 expect(parseEvidenceSource(content)).toEqual({notes:"Prototype tested in class.",url});
 expect(safeEvidenceUrl("javascript:alert(1)")).toBeNull();
 expect(safeEvidenceUrl("https://evil.example/phishing")).toBeNull();
 expect(safeEvidenceUrl("https://drive.google.com.evil.example/file")).toBeNull();
 expect(()=>formatEvidenceSource("Evidence","http://localhost:4000")).toThrow();
 expect(formatEvidenceSource("Only reflection","")).toBe("Only reflection");
});

test("fine pencil trail clears quickly without leaving a thick marker across text",async ({page})=>{
 test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("/");
 const trail=page.getByTestId("creative-pointer-trail");
 await page.mouse.move(100,120);
 await page.mouse.move(240,210,{steps:18});
 await expect(trail).toHaveAttribute("data-active","true");
 await expect(trail).toHaveAttribute("data-active","false",{timeout:2200});
});
