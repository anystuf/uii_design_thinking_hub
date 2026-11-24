"use client";

import {useState} from "react";
import {ExternalLink,Frame,ShieldAlert} from "lucide-react";

/** Consent-gated lazy iframe: only provider share/embed src URLs are accepted.
 * No third-party requests until the learner explicitly opts in.
 */
export function trustedCollabEmbed(input:string):string|null {
 try {
   const u=new URL(input.trim());
   if(u.protocol!=="https:"||u.username||u.password||u.hash||u.href.length>1200)return null;
   const host=u.hostname.toLowerCase();
   if(host==="padlet.com"||host==="www.padlet.com"){
     if(/^\/embed\/[A-Za-z0-9_-]+\/?$/.test(u.pathname))return u.href;
   }
   if(host==="miro.com"||host==="www.miro.com"){
     if(/^\/app\/live-embed\/[A-Za-z0-9_=-]+\/?$/.test(u.pathname))return u.href;
   }
   return null;
 }catch{return null;}
}
export function ExternalCollaborationBoard(){
 const [url,setUrl]=useState("");
 const [loaded,setLoaded]=useState(false);
 const candidate=trustedCollabEmbed(url);
 return <section aria-labelledby="external-board-heading" className="rounded-[24px] border border-[#dae7dd] bg-[#f7faf5] p-4 sm:p-5">
   <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#a64836]">OPTIONAL · RESOURCE-SAVING COLLABORATION</p>
   <h3 id="external-board-heading" className="mt-2 flex items-center gap-2 text-lg font-black text-[#173445]"><Frame size={19}/> Bảng nhóm từ Miro hoặc Padlet</h3>
   <p className="mt-2 text-xs leading-6 text-[#526e74]">Sao chép đúng <strong>địa chỉ src của mã nhúng</strong> do Miro/Padlet cung cấp; chỉ nhúng nếu chủ bảng cho phép. Hợp tác trên bảng của nhà cung cấp, UII không lưu ảnh hay video. Liên kết này chỉ dùng trong phiên xem hiện tại; hãy lưu liên kết sản phẩm chính thức trong phần Minh chứng.</p>
   <label htmlFor="external-collab-src" className="mt-3 block text-xs font-black">Địa chỉ iframe src chính thức (không dán mã HTML)</label>
   <input id="external-collab-src" type="url" maxLength={1200} value={url} onChange={e=>{setUrl(e.target.value);setLoaded(false);}}
     placeholder="https://padlet.com/embed/… hoặc https://miro.com/app/live-embed/…"
     className="mt-2 min-h-11 w-full rounded-xl border border-[#bdd7cb] bg-white px-3 text-base"/>
   {url.trim()&&!candidate&&<p role="alert" className="mt-2 text-xs font-bold text-[#a03b31]">Chỉ chấp nhận URL HTTPS chính thức của Padlet Embed hoặc Miro Live Embed. Hãy dùng Share → Embed trong công cụ để lấy đường dẫn.</p>}
   <div className="mt-3 flex flex-wrap gap-2">
     <button type="button" disabled={!candidate} onClick={()=>setLoaded(x=>!x)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-4 text-xs font-black text-white disabled:opacity-40">
       {loaded?"Đóng bảng nhúng":"Xem bảng nhúng (tải khi bấm)"} <ExternalLink size={15}/>
     </button>
     {candidate&&<a href={candidate} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-[#bad0c6] bg-white px-4 text-xs font-black text-[#173445]">Mở bảng trong tab mới ↗</a>}
   </div>
   {loaded&&candidate&&<div className="mt-4 overflow-hidden rounded-2xl border border-[#cbdcd3] bg-white">
     <iframe title="Bảng Miro/Padlet do người dùng lựa chọn" src={candidate}
       className="h-[480px] w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
       sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"/>
     <p className="border-t p-3 text-xs text-[#5a7075]">Nếu trang yêu cầu đăng nhập hoặc không cho nhúng, chọn “Mở bảng trong tab mới”. Quyền xem/sửa do nhà cung cấp kiểm soát.</p>
   </div>}
   <p className="mt-3 flex items-start gap-2 text-[11px] leading-6 text-[#6c7876]"><ShieldAlert size={17} className="mt-1 shrink-0"/> Chỉ bật khi đã đồng ý chia sẻ dữ liệu với bên ngoài. Không nhúng bảng chứa hồ sơ người tham gia, thông tin sức khỏe, dữ liệu dự án riêng hoặc nội dung chưa được phép công bố.</p>
 </section>;
}
