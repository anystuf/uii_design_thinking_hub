/** Reuse the existing 3000-character versioned evidence description field.
 * No database migration or costly file storage is needed for an external link.
 * A version snapshot preserves the link string, NOT the third-party file content.
 */
const MARKER="\n\n[UII External Link] ";
const TRUSTED=["drive.google.com","docs.google.com","miro.com","www.miro.com","figma.com","www.figma.com","canva.com","www.canva.com","github.com","www.github.com","notion.so","www.notion.so","onedrive.live.com"];
export function safeEvidenceUrl(input:string):string|null {
  if(!input.trim())return null;
  try {
    const url=new URL(input.trim());
    if(url.protocol!=="https:"||url.username||url.password)return null;
    const host=url.hostname.toLowerCase();
    if(!TRUSTED.includes(host))return null;
    if(url.href.length>1000)return null;
    return url.href;
  }catch{return null;}
}
export function parseEvidenceSource(description:string|null|undefined):{notes:string;url:string|null} {
  const value=description??"";
  const idx=value.lastIndexOf(MARKER);
  if(idx<0)return {notes:value,url:null};
  const raw=value.slice(idx+MARKER.length).trim();
  const url=safeEvidenceUrl(raw);
  return url?{notes:value.slice(0,idx),url}:{notes:value,url:null};
}
export function formatEvidenceSource(notes:string,url:string):string {
  const safe=url.trim()?safeEvidenceUrl(url):null;
  if(url.trim()&&!safe)throw Error("Chỉ nhận liên kết HTTPS từ Google Drive/Docs, Miro, Figma, Canva, GitHub, Notion hoặc OneDrive.");
  const result=notes.trim()+(safe?MARKER+safe:"");
  if(result.length>3000)throw Error("Mô tả cùng đường dẫn vượt 3.000 ký tự. Hãy rút gọn ghi chú.");
  return result;
}
