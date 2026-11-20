import { NextResponse, type NextRequest } from "next/server";
import {
  buildAIKnowledge, deterministicGuide, findGuideTopics, isPersonalProgress,
  isProductStatus, type HubRole,
} from "@/lib/uii-assistant-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatHistory = {role:"user"|"model";text:string};
const limit = new Map<string,{count:number;reset:number}>();
const MAX_REQUEST_BYTES=9000;
const ALL_ROLES:HubRole[]=["GUEST","STUDENT","LECTURER","MENTOR","ADMIN"];

function requestGuard(req:NextRequest):Response|null {
  const origin=req.headers.get("origin");
  if(origin) {
    try {if(new URL(origin).host!==req.nextUrl.host)return NextResponse.json({error:"Origin denied"},{status:403});}
    catch {return NextResponse.json({error:"Invalid origin"},{status:403});}
  }
  const claimedSize=Number(req.headers.get("content-length")||0);
  if(claimedSize>MAX_REQUEST_BYTES)return NextResponse.json({error:"Message too long"},{status:413});
  const ip=(req.headers.get("x-forwarded-for")||"visitor").split(",")[0].trim().slice(0,90);
  const now=Date.now();
  if(limit.size>3000) for(const [key,value] of limit) {if(value.reset<now)limit.delete(key);}
  const record=limit.get(ip);
  if(!record||record.reset<now)limit.set(ip,{count:1,reset:now+60000});
  else if(record.count>=15)return NextResponse.json({error:"Bạn đã gửi nhiều câu hỏi. Hãy thử lại sau ít phút."},{status:429});
  else record.count++;
  return null;
}

const backend=process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/,"")||"http://localhost:4000";
async function trustedUser(token:string|undefined,timeoutMs=3500):Promise<{role:HubRole;verified:boolean}> {
  if(!token)return {role:"GUEST",verified:false};
  try {
    const res=await fetch(backend+"/auth/me",{
      headers:{Authorization:"Bearer "+token},
      cache:"no-store",signal:AbortSignal.timeout(timeoutMs),
    });
    if(!res.ok)return {role:"GUEST",verified:false};
    const user=await res.json() as {role?:string};
    const role=ALL_ROLES.find(r=>r===user.role&&r!=="GUEST");
    return role?{role,verified:true}:{role:"GUEST",verified:false};
  } catch {return {role:"GUEST",verified:false};}
}

async function trustedProgress(token:string,role:HubRole):Promise<string> {
  if(role!=="STUDENT")return "Tiến độ theo khóa học được dành cho tài khoản Sinh viên. Hãy mở Tổng quan hoặc Khóa học theo quyền hiện tại.";
  try {
    const res=await fetch(backend+"/courses/my-enrollments",{
      headers:{Authorization:"Bearer "+token},
      cache:"no-store",signal:AbortSignal.timeout(9500),
    });
    if(!res.ok)return "Mình đã xác minh tài khoản nhưng chưa truy xuất được tiến độ học. Vui lòng mở Tổng quan để thử lại, mình không tự suy đoán.";
    const data=await res.json() as unknown;
    if(!Array.isArray(data))return "API chưa trả về cấu trúc tiến độ hợp lệ. Mời bạn xem Tổng quan.";
    const enrolled=data.slice(0,8).map((item:unknown)=>{
      if(!item||typeof item!=="object")return null;
      const row=item as {course?:{title?:string};progress?:{completedLessons?:number;totalLessons?:number;percent?:number;nextLesson?:{title?:string}|null}};
      const title=typeof row.course?.title==="string"?row.course.title.slice(0,100):"Khóa học";
      const completed=Math.max(0,Math.min(10000,Number(row.progress?.completedLessons)||0));
      const total=Math.max(completed,Math.min(10000,Number(row.progress?.totalLessons)||0));
      const percentage=total?Math.round(completed/total*100):0;
      const next=typeof row.progress?.nextLesson?.title==="string"?row.progress.nextLesson.title.slice(0,80):"";
      return "• "+title+": "+completed+"/"+total+" bài ("+percentage+"%)."+(next?" Bài tiếp theo: "+next+".":"");
    }).filter(Boolean);
    if(!enrolled.length)return "Bạn đã đăng nhập với vai trò Sinh viên nhưng hiện chưa có khóa học đã ghi danh trong dữ liệu thực. Hãy mở Khóa học để tìm khóa đã công bố, ghi danh rồi bắt đầu.";
    return "Mình đã kiểm tra tiến độ từ API có xác thực của UII:\n"+enrolled.join("\n")+
      "\n\nĐây là dữ liệu LMS thực lúc tra cứu, không phải điểm từ /demo. Bạn có thể xem chi tiết ở Tổng quan hoặc Khóa học.";
  }catch {
    return "Tài khoản đã xác minh, nhưng API tiến độ đang phản hồi chậm hoặc không truy cập được. Mình chưa có số liệu đủ tin cậy. Hãy thử lại hoặc xem Tổng quan.";
  }
}

type GeminiFailure = "not-configured"|"invalid-key"|"model-unavailable"|"quota"|"provider-unavailable"|"timeout"|"empty-response"|"request-rejected"|"invalid-model";
type GeminiOutcome = {answer:string|null;status:"ok"|GeminiFailure;model:string;httpStatus?:number};
const DEFAULT_MODEL="gemini-3.5-flash-lite"; // Cost-aware, stable for new AI Studio projects.
const MODEL_FALLBACK="gemini-3.5-flash"; // Only retry on a 404 for the requested model.

function classifyProviderError(httpStatus:number):GeminiFailure {
  if(httpStatus===401||httpStatus===403)return "invalid-key";
  if(httpStatus===404)return "model-unavailable";
  if(httpStatus===429)return "quota";
  if(httpStatus===408||httpStatus===504)return "timeout";
  if(httpStatus>=500)return "provider-unavailable";
  return "request-rejected";
}
async function runGemini(input:{question:string;history:ChatHistory[];role:HubRole;path:string}):Promise<GeminiOutcome> {
  const key=process.env.GEMINI_API_KEY?.trim();
  const initialModel=process.env.GEMINI_MODEL||DEFAULT_MODEL;
  if(!key)return {answer:null,status:"not-configured",model:initialModel};
  if(!/^[a-z0-9][a-z0-9._-]{2,72}$/i.test(initialModel))
    return {answer:null,status:"invalid-model",model:"unknown"};
  const system=[
    "Bạn là trợ lý AI UII Design Thinking Hub, thân thiện, học thuật, có kiến thức về phương pháp Design Thinking và cách dùng sản phẩm.",
    "Phân biệt hai ý định: (1) Câu hỏi về TÍNH NĂNG UII: dùng kho kiến thức UII bên dưới để chỉ thao tác và quyền truy cập. (2) Câu hỏi HỌC THUẬT: dạy phương pháp, thiết kế hoạt động thực hành, đưa ví dụ cụ thể và giải thích lý do. Không ép yêu cầu thực hành về một trang hay nút của ứng dụng.",
    "Với câu hỏi thiết kế một hoạt động 15 phút: phải đưa lịch trình các phút cộng lại đúng 15, mục tiêu, hoạt động quan sát/phỏng vấn, đầu ra và lý do sư phạm. Tôn trọng đồng thuận và riêng tư của người tham gia.",
    "TRÁNH BỊA: không suy đoán người dùng thật, tỷ lệ tiến độ hay tình trạng CI. Demo không lưu LMS. Không đưa lời giải trực tiếp cho quiz đang chấm; ưu tiên gợi ý.",
    "Không yêu cầu mật khẩu, token hay API key. Role trong kho kiến thức đã được backend xác minh hoặc là GUEST. Không tự nhận đã nhấp hoặc thực hiện tác vụ cho người dùng.",
    "Trả lời tự nhiên bằng ngôn ngữ của người hỏi. Khi câu hỏi đơn giản, trả lời ngắn; với kế hoạch thực hành có thể dài hơn. Không cần chèn liên kết web vì UI đã cung cấp link điều hướng an toàn.",
    buildAIKnowledge(input.question,input.role,input.path),
  ].join("\n");
  const contents=input.history.slice(-6).filter(x=>x.text.trim()).map(item=>({
    role:item.role,parts:[{text:item.text.slice(0,600)}],
  }));
  contents.push({role:"user",parts:[{text:input.question}]});
  const models=initialModel===MODEL_FALLBACK?[initialModel]:[initialModel,MODEL_FALLBACK];
  for(let index=0;index<models.length;index++) {
    const model=models[index];
    try {
      const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
        method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
        body:JSON.stringify({
          systemInstruction:{parts:[{text:system}]},
          contents,
          generationConfig:{temperature:0.4,maxOutputTokens:1800},
        }),
        cache:"no-store",signal:AbortSignal.timeout(18000),
      });
      if(!response.ok){
        const status=classifyProviderError(response.status);
        // Never log the key, user question, request body, or upstream response body.
        console.warn("[uii-assistant] Gemini response failure",{status,httpStatus:response.status,model});
        if(status==="model-unavailable" && index+1<models.length)continue;
        return {answer:null,status,model,httpStatus:response.status};
      }
      const data=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]};finishReason?:string}[]};
      const answer=data.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
      if(answer && answer.length<=6500)return {answer,status:"ok",model};
      const status:"empty-response"="empty-response";
      console.warn("[uii-assistant] Gemini empty generation",{status,model,finishReason:data.candidates?.[0]?.finishReason||"unknown"});
      return {answer:null,status,model};
    }catch(e){
      const status:GeminiFailure=e instanceof Error&&(e.name==="TimeoutError"||e.name==="AbortError")?"timeout":"provider-unavailable";
      console.warn("[uii-assistant] Gemini request failed",{status,model});
      return {answer:null,status,model};
    }
  }
  return {answer:null,status:"model-unavailable",model:initialModel};
}

export async function GET() {
  return NextResponse.json({
    assistant:process.env.GEMINI_API_KEY?"configured":"guided",
    modelConfigured:!!process.env.GEMINI_API_KEY,
    connectionVerified:false,
    model:process.env.GEMINI_MODEL||DEFAULT_MODEL,
    deployment:process.env.VERCEL_ENV||"local",
    productStage:"pilot-review",
    ciStatus:"unknown-from-this-endpoint",
  },{headers:{"Cache-Control":"no-store"}});
}

export async function POST(req:NextRequest) {
  const blocked=requestGuard(req);
  if(blocked)return blocked;
  try {
    const raw=await req.text();
    if(raw.length>MAX_REQUEST_BYTES)return NextResponse.json({error:"Message too long"},{status:413});
    const body=JSON.parse(raw) as {message?:unknown;path?:unknown;history?:unknown};
    if(typeof body.message!=="string"||body.message.trim().length<2||body.message.length>700)
      return NextResponse.json({error:"Câu hỏi phải có từ 2 đến 700 ký tự."},{status:400});
    const question=body.message.trim();
    const path=typeof body.path==="string"&&body.path.startsWith("/")&&!body.path.startsWith("//")?
      body.path.slice(0,160):"/";
    const history:ChatHistory[]=Array.isArray(body.history)?body.history.slice(-6).filter((x:unknown)=>{
      if(!x||typeof x!=="object")return false;
      const v=x as {role?:unknown;text?:unknown};
      return (v.role==="user"||v.role==="model")&&typeof v.text==="string"&&v.text.length<=600;
    }):[];
    const authorization=req.headers.get("authorization")||"";
    const token=authorization.startsWith("Bearer ")?authorization.slice(7).trim():undefined;
    const user=await trustedUser(token,isPersonalProgress(question)?9500:3500);
    const role=user.role;
    const verified=user.verified;
    const suggestions=findGuideTopics(question,role,3)
      .filter(t=>t.roles.includes(role)||t.roles.includes("GUEST"))
      .slice(0,2).map(t=>({href:t.href,label:t.action}));
    // Never let the language model invent or interpolate any private progress.
    if(isPersonalProgress(question)){
      const answer=token&&verified?await trustedProgress(token,role):
        "Để xem tiến độ học cá nhân, bạn cần đăng nhập và hệ thống phải xác minh được tài khoản. Mình hiện chưa có dữ liệu học có xác thực, nên không thể báo số bài hoặc tỷ lệ hoàn thành. Hãy vào Tổng quan hoặc Khóa học.";
      return NextResponse.json({answer,mode:"verified-data",links:[{href:"/dashboard",label:"Mở Tổng quan"},{href:"/learn",label:"Khóa học"}],verified,role},{headers:{"Cache-Control":"no-store"}});
    }
    // Product status is deliberately factual rather than generated speculation.
    if(isProductStatus(question)){
      const fall=deterministicGuide(question,role,path);
      const current=process.env.VERCEL_ENV||"local";
      const status="Môi trường hiện tại: "+current.toUpperCase()+". Giai đoạn sản phẩm: đang thử nghiệm/nghiệm thu, không đồng nghĩa production-ready. Endpoint này không có quyền truy cập GitHub CI theo thời gian thực.\n\n";
      return NextResponse.json({answer:status+fall.text,mode:"verified-status",links:fall.links,verified,role},{headers:{"Cache-Control":"no-store"}});
    }
    const result=await runGemini({question,history,role,path});
    const fall=deterministicGuide(question,role,path);
    return NextResponse.json({
      answer:result.answer||fall.text,
      mode:result.answer?"gemini":"guided",
      aiStatus:result.status,
      model:result.model,
      ...(result.httpStatus?{providerHttpStatus:result.httpStatus}:{}),
      links:result.answer?suggestions:fall.links,
      verified,
      role,
    },{headers:{"Cache-Control":"no-store"}});
  }catch {
    return NextResponse.json({error:"Không đọc được câu hỏi. Vui lòng thử lại."},{status:400});
  }
}
