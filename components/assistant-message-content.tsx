import { type ReactNode } from "react";

/** Safe, dependency-free formatting for chatbot replies; never renders raw HTML. */
export function normalizeAssistantText(input: string): string {
  return input.replace(/\r\n?/g, "\n")
    .replace(/\\([*_[\]#])/g, "$1")
    .replace(/^(\s*)\.\/\s+(?=\S)/gm, "$1")
    .trim();
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+\*|_[^_\n]+_)/g;
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > end) nodes.push(text.slice(end, start));
    const token = match[0], strong = token.startsWith("**") || token.startsWith("__");
    const value = token.slice(strong ? 2 : 1, strong ? -2 : -1);
    nodes.push(strong ? <strong key={start} className="font-bold">{value}</strong> : <em key={start}>{value}</em>);
    end = start + token.length;
  }
  if (end < text.length) nodes.push(text.slice(end));
  return nodes;
}

type Block = { kind: "paragraph" | "heading" | "unordered" | "ordered" | "code"; text?: string; items?: string[] };
export function parseAssistantBlocks(raw: string): Block[] {
  const lines = normalizeAssistantText(raw).split("\n"), blocks: Block[] = [];
  let i = 0;
  const fence = String.fromCharCode(96).repeat(3);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.trimStart().startsWith(fence)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith(fence)) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    const heading = line.match(/^\s*#{1,3}\s+(.+)$/);
    if (heading) { blocks.push({ kind: "heading", text: heading[1].replace(/\s+#+$/, "") }); i++; continue; }
    const unordered = /^\s*[-*+]\s+(.+)$/, ordered = /^\s*\d+[.)]\s+(.+)$/;
    const kind = unordered.test(line) ? "unordered" : ordered.test(line) ? "ordered" : null;
    if (kind) {
      const items: string[] = [], pattern = kind === "unordered" ? unordered : ordered;
      while (i < lines.length) {
        const match = lines[i].match(pattern);
        if (!match) break;
        items.push(match[1]); i++;
      }
      blocks.push({ kind, items }); continue;
    }
    const paragraph = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim()
      && !/^\s*(?:#{1,3}\s|[-*+]\s|\d+[.)]\s)/.test(lines[i])
      && !lines[i].trimStart().startsWith(fence)) {
      paragraph.push(lines[i].trim()); i++;
    }
    blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
  }
  return blocks;
}

export function AssistantMessageContent({ text }: { text: string }) {
  return <div className="space-y-2 break-words [overflow-wrap:anywhere]">
    {parseAssistantBlocks(text).map((block, index) => {
      if (block.kind === "heading") return <p key={index} className="pt-1 font-extrabold leading-6">{inline(block.text || "")}</p>;
      if (block.kind === "code") return <pre key={index} className="overflow-x-auto rounded-lg bg-[#edf2ef] p-3 text-xs leading-5"><code>{block.text}</code></pre>;
      if (block.kind === "unordered") return <ul key={index} className="list-disc space-y-1 pl-5">{block.items?.map((item, j) => <li key={j}>{inline(item)}</li>)}</ul>;
      if (block.kind === "ordered") return <ol key={index} className="list-decimal space-y-1 pl-5">{block.items?.map((item, j) => <li key={j}>{inline(item)}</li>)}</ol>;
      return <p key={index} className="whitespace-pre-line">{inline(block.text || "")}</p>;
    })}
  </div>;
}
