"use client";
import { useState } from "react";
import { ArrowUpRight, ClipboardCopy, Plus, StickyNote, Trash2 } from "lucide-react";

type ToolLayout = {caption:string;fields:readonly string[];link:string;note:string;sticky?:boolean};
const MIRO="https://miro.com/templates/";
const layouts:Record<string,ToolLayout>={
  "Interview Guide":{caption:"Bảng chuẩn bị phỏng vấn",fields:["Mục tiêu nghiên cứu","Câu hỏi mở 1","Câu hỏi mở 2","Câu hỏi mở 3","Câu hỏi tiếp nối"],link:MIRO+"user-interview/",note:"Hỏi về trải nghiệm thực, không dẫn dắt câu trả lời."},
  "Observation Log":{caption:"Nhật ký quan sát",fields:["Bối cảnh","Điều nhìn thấy / nghe thấy","Trích dẫn nguyên văn","Giả định cần kiểm chứng"],link:MIRO+"user-research/",note:"Tách quan sát và suy luận."},
  "Empathy Map":{caption:"Bản đồ thấu cảm · Sticky notes",fields:["SAYS · Người dùng nói gì?","THINKS · Họ suy nghĩ gì?","DOES · Họ làm gì?","FEELS · Họ cảm thấy gì?","PAINS · Điều gây khó khăn","GAINS · Mong muốn / mục tiêu"],link:MIRO+"empathy-map/",note:"Gắn mỗi ghi chú vào đúng ô. Chỉ thêm insight có căn cứ từ quan sát/phỏng vấn.",sticky:true},
  "POV Builder":{caption:"Point-of-View",fields:["Người dùng cụ thể","Nhu cầu thực tế (không phải giải pháp)","Insight bất ngờ, có bằng chứng"],link:MIRO+"point-of-view-statements/",note:"POV = Người dùng + Nhu cầu + Insight."},
  "HMW Reframing":{caption:"How Might We",fields:["How might we… câu 1","How might we… câu 2","How might we… câu 3"],link:MIRO+"research-and-design/",note:"Đặt câu hỏi đủ rộng để sinh ý tưởng, đủ hẹp để hành động."},
  "Crazy 8s":{caption:"8 khung ý tưởng",fields:["Idea 01","Idea 02","Idea 03","Idea 04","Idea 05","Idea 06","Idea 07","Idea 08"],link:MIRO+"crazy-eights/",note:"Phác nhanh 8 cách tiếp cận khác nhau. Miro có bút vẽ để phác thảo hình ảnh.",sticky:true},
  "Idea Selection":{caption:"Chọn ý tưởng",fields:["Tác động cao · khả thi cao","Tác động cao · khả thi thấp","Tác động thấp · khả thi cao","Tác động thấp · khả thi thấp"],link:MIRO+"prioritization/",note:"Phân loại ý tưởng trước khi chọn phương án thử nghiệm.",sticky:true},
  "Storyboard":{caption:"Storyboard · 4 khung trải nghiệm",fields:["01 · Bối cảnh / trước khi bắt đầu","02 · Tình huống và vấn đề","03 · Tương tác với nguyên mẫu","04 · Kết quả và cảm xúc"],link:MIRO+"storyboard/",note:"Mỗi khung mô tả một cảnh. Có thể thêm sticky note; mở Miro để vẽ hoặc kéo thả ảnh.",sticky:true},
  "Prototype Checklist":{caption:"Checklist nguyên mẫu",fields:["Giả định cần kiểm chứng","Một tác vụ cốt lõi","Mức độ trung thực của mẫu","Cách thử cùng người dùng","Tín hiệu thành công"],link:MIRO+"research-and-design/",note:"Tạo mẫu đủ nhỏ để học nhanh, không cần hoàn thiện sản phẩm."},
  "Feedback Canvas":{caption:"Feedback capture grid",fields:["Điều hiệu quả","Điều người dùng chưa hiểu","Câu hỏi mới phát sinh","Thay đổi trong vòng lặp tiếp theo"],link:MIRO+"canvas/",note:"Ghi bằng chứng cụ thể, rồi quyết định cải tiến.",sticky:true},
};

const colors=["#ffe4b8","#d6ecf3","#f6d4e4","#e5e4fd","#daf0cb","#fff2ba","#fad6c3","#e4e8fd"];

export function DemoToolCanvas({name}:{name:string}) {
  const layout=layouts[name]??layouts["Interview Guide"];
  const [cards,setCards]=useState<Record<string,string[]>>({});
  const [message,setMessage]=useState("");
  const update=(field:string,index:number,value:string)=>{
    setCards(previous=>({...previous,[field]:layoutFields(previous,field).map((item,i)=>i===index?value:item)}));
    setMessage("");
  };
  const add=(field:string)=>{setCards(previous=>({...previous,[field]:[...layoutFields(previous,field),""]}));};
  const remove=(field:string,index:number)=>{
    setCards(previous=>({...previous,[field]:layoutFields(previous,field).filter((_,i)=>i!==index)}));
  };
  const copy=async()=>{
    const result=[name,...layout.fields.map(label=>label+"\n"+layoutFields(cards,label).filter(Boolean).map(x=>"- "+x).join("\n"))].join("\n\n");
    try {await navigator.clipboard.writeText(result);setMessage("Đã sao chép bản nháp để dán vào Google Docs hoặc bài nộp.");}
    catch {setMessage("Trình duyệt chưa cho sao chép. Bạn có thể chọn và sao chép từng ghi chú.");}
  };
  return <div className="mt-5 space-y-4" data-testid="demo-structured-tool">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[11px] font-black uppercase tracking-[.12em] text-[#ae442c]">WORKSHOP CANVAS</p>
        <h4 className="mt-1 text-lg font-black text-[#173445]">{layout.caption}</h4></div>
      <a href={layout.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#173445] bg-white px-4 text-xs font-black text-[#173445] hover:bg-[#e5f3f0]">
        Mở mẫu Miro chính thức <ArrowUpRight size={15}/></a>
    </div>
    <p className="text-xs leading-6 text-[#536d71]">{layout.note} Miro là dịch vụ bên ngoài, có thể yêu cầu tài khoản. Không tải SDK nặng hoặc tự động chia sẻ dữ liệu với Miro.</p>
    <div className={"grid gap-3 "+(layout.sticky?"sm:grid-cols-2":"sm:grid-cols-2 xl:grid-cols-3")}>
      {layout.fields.map((field,index)=><section key={field} className="min-w-0 rounded-2xl border border-[#dae5da] p-3" style={{backgroundColor:colors[index%colors.length]}}>
        <h5 className="flex items-center gap-2 text-sm font-black text-[#243943]"><StickyNote size={16} aria-hidden="true"/>{field}</h5>
        <div className="mt-3 space-y-2">
          {layoutFields(cards,field).map((value,i)=><div key={i} className="group relative rounded-xl bg-white/90 p-2 shadow-sm">
            <label className="sr-only" htmlFor={"note-"+index+"-"+i}>{field} · ghi chú {i+1}</label>
            <textarea id={"note-"+index+"-"+i} value={value} rows={layout.sticky?2:3} maxLength={550}
              placeholder={layout.sticky?"Ghi một điều quan sát…":"Thử điền nội dung ở đây…"}
              className="w-full resize-y rounded-lg border border-transparent bg-transparent p-2 pr-6 text-sm leading-6 text-[#183542] focus:border-[#7fabb4]"
              onChange={e=>update(field,i,e.target.value)}/>
            {layout.sticky&&layoutFields(cards,field).length>1&&<button type="button" onClick={()=>remove(field,i)}
              aria-label={"Xóa ghi chú "+(i+1)+" ở "+field} className="absolute right-1 top-1 grid size-8 place-items-center rounded-lg text-[#6b6c62] hover:bg-[#fce1dc]"><Trash2 size={15}/></button>}
          </div>)}
        </div>
        {layout.sticky&&<button type="button" onClick={()=>add(field)}
          className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-full border border-[#627981] px-3 text-xs font-bold text-[#234858] hover:bg-white/70"><Plus size={14}/> Thêm sticky note</button>}
      </section>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e8e1] pt-4">
      <p className="max-w-md text-xs leading-5 text-[#647678]">Bản nháp chỉ tồn tại trong tab hiện tại. Dùng “Sao chép” hoặc Miro/Drive để lưu và nộp liên kết tại Minh chứng.</p>
      <button type="button" onClick={()=>void copy()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-5 text-xs font-black text-white"><ClipboardCopy size={16}/> Sao chép bản nháp</button>
    </div>
    {message&&<p role="status" className="rounded-xl bg-[#dcefe2] p-3 text-xs font-semibold text-[#285847]">{message}</p>}
  </div>;
}
function layoutFields(cards:Record<string,string[]>,field:string):string[]{return cards[field]??[""];}
