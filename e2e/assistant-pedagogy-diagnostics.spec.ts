import { expect, test } from "@playwright/test";
import { deterministicGuide, isPersonalProgress, isProductStatus } from "../lib/uii-assistant-knowledge";
import { isPedagogicalRequest, pedagogicalFallback } from "../lib/uii-pedagogy";

const request="Tôi là sinh viên năm nhất, chưa từng học Design Thinking. Hãy thiết kế cho tôi một hoạt động thực hành 15 phút để tìm hiểu vấn đề sinh viên khó tập trung khi học tại thư viện. Hướng dẫn cụ thể và giải thích vì sao chọn các bước đó.";

test("education questions cannot be misrouted to Focus Mode",()=>{
  expect(isPedagogicalRequest(request)).toBe(true);
  expect(isPersonalProgress(request)).toBe(false);
  expect(isProductStatus(request)).toBe(false);
  const reply=deterministicGuide(request,"GUEST","/");
  expect(reply.text).toMatch(/15 phút/);
  expect(reply.text).toMatch(/Quan sát/);
  expect(reply.text).toMatch(/Phỏng vấn/);
  expect(reply.text).toMatch(/thư viện/);
  expect(reply.text).not.toMatch(/Bật Chế độ tập trung/);
  expect(reply.links).toContainEqual({href:"/demo",label:"Thử hoạt động học tập"});
  expect(pedagogicalFallback("Hãy thiết kế một hoạt động thực hành 20 phút để tìm hiểu nhu cầu sinh viên")).toMatch(/20 phút/);
});

test("UII guide explains how to use the internal community without claiming external Quora integration",()=>{
  const reply=deterministicGuide("Làm sao đặt câu hỏi trên cộng đồng như Quora?","STUDENT","/community");
  expect(reply.text).toMatch(/Hỏi đáp nội bộ/);
  expect(reply.text).toMatch(/Empathize/);
  expect(reply.text).toMatch(/backend\/migration mới/);
  expect(reply.links).toContainEqual({href:"/community",label:"Mở Hỏi đáp cộng đồng"});
});

test("Gemini configured is not falsely reported as a verified successful generation",async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL,"Local fixture only");
  await page.goto("/");
  const res=await page.request.get("/api/assistant/chat");
  expect(res.status()).toBe(200);
  const value=await res.json();
  expect(value.connectionVerified).toBe(false);
  expect(value.assistant).toBe(value.modelConfigured?"configured":"guided");
  expect(typeof value.model).toBe("string");
});

test("without AI key, a beginner's 15 minute research activity receives a useful academic fallback",async({page})=>{
  test.skip(!!process.env.E2E_BASE_URL||!!process.env.GEMINI_API_KEY,"Local no-key fixture only");
  await page.goto("/");
  const res=await page.request.post("/api/assistant/chat",{data:{message:request,path:"/"}});
  expect(res.status()).toBe(200);
  const payload=await res.json();
  expect(payload.mode).toBe("guided");
  expect(payload.aiStatus).toBe("not-configured");
  expect(payload.answer).toContain("15 phút");
  expect(payload.answer).toMatch(/thư viện/);
  expect(payload.answer).toMatch(/Phỏng vấn/);
  expect(payload.answer).not.toMatch(/XP thật|Focus Mode|Chế độ tập trung/);
  expect(payload.links).toEqual([{href:"/demo",label:"Thử hoạt động học tập"}]);
});
