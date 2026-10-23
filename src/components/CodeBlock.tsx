import { Check, Copy } from "lucide-react";
import { useState } from "react";

const KEYWORDS = new Set([
  "if",
  "elif",
  "else",
  "for",
  "while",
  "in",
  "not",
  "and",
  "or",
  "def",
  "return",
  "class",
  "try",
  "except",
  "finally",
  "raise",
  "with",
  "as",
  "import",
  "from",
  "lambda",
  "None",
  "True",
  "False",
  "is",
  "pass",
  "break",
  "continue",
  "yield",
  "global",
  "del",
  "async",
  "await",
  "match",
  "case",
  "nonlocal",
  "assert",
]);

type Token = { text: string; kind: "kw" | "num" | "str" | "comment" | "plain" };

function tokenizeLine(line: string): Token[] {
  const hashAt = line.indexOf("#");
  let code = line;
  let comment = "";
  if (hashAt >= 0) {
    const before = line.slice(0, hashAt);
    const quotes = (before.match(/"/g) ?? []).length + (before.match(/'/g) ?? []).length;
    if (quotes % 2 === 0) {
      code = before;
      comment = line.slice(hashAt);
    }
  }

  const tokens: Token[] = [];
  const re = /("[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), kind: "plain" });
    const value = m[0];
    if (value.startsWith('"') || value.startsWith("'")) tokens.push({ text: value, kind: "str" });
    else if (/^\d/.test(value)) tokens.push({ text: value, kind: "num" });
    else if (KEYWORDS.has(value)) tokens.push({ text: value, kind: "kw" });
    else tokens.push({ text: value, kind: "plain" });
    last = m.index + value.length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last), kind: "plain" });
  if (comment) tokens.push({ text: comment, kind: "comment" });
  return tokens;
}

const classFor: Record<Token["kind"], string> = {
  kw: "text-[#7fb6f0]",
  num: "text-[#f5cd4a]",
  str: "text-[#8fd6a8]",
  comment: "text-[#7d8ca3] italic",
  plain: "",
};

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (http or permissions): leave the button as is */
    }
  }
  return (
    <div className="group relative mt-4 overflow-hidden rounded-lg bg-code-bg text-code-fg">
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-code-fg opacity-80 transition hover:bg-white/20 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent-warm"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto px-4 py-3.5 pr-20 font-mono text-[12.5px] leading-relaxed">
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i}>
              {tokenizeLine(line).map((t, j) => (
                <span key={j} className={classFor[t.kind]}>
                  {t.text}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
