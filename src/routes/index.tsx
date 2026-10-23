import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Moon, RotateCcw, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { AnswerVote } from "@/components/AnswerVote";
import { CodeBlock } from "@/components/CodeBlock";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { answerQuestion, autocomplete, learnedWeights, topics, type Answer } from "@/lib/answer";
import { knowledgeBase } from "@/lib/knowledge-base";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "PyQuery — Personal Python Answer Engine" },
      {
        name: "description",
        content:
          "Ask Python questions in plain English and get instant answers with runnable examples from a curated Python knowledge base. No sign-up, works on any device.",
      },
      { property: "og:title", content: "PyQuery — Personal Python Answer Engine" },
      {
        property: "og:description",
        content:
          "Ask Python questions in plain English and get instant answers. No sign-up required.",
      },
    ],
  }),
  component: ChatPage,
});

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; question: string; answer: Answer };

const HISTORY_KEY = "pyquery.history.v1";
const STARTERS = [
  "How do I reverse a list?",
  "What is a decorator?",
  "How do f-strings work?",
  "How do I handle exceptions?",
  "What is __init__ and self?",
  "How do I read a JSON file?",
];

let seq = 0;
const nextId = () => `${Date.now().toString(36)}-${(seq += 1)}`;

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [dark, setDark] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore history + theme after hydration (localStorage is browser-only).
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as Message[];
      if (Array.isArray(saved)) setMessages(saved);
    } catch {
      /* corrupt or blocked storage: start fresh */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return; // don't overwrite saved history before it's restored
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      /* storage blocked: history just won't persist */
    }
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, loaded]);

  // "/" focuses the prompt from anywhere, like a search box.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const completions = useMemo(() => autocomplete(input), [input]);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const answer = answerQuestion(text, learnedWeights());
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text },
      { id: nextId(), role: "bot", question: text, answer },
    ]);
    setInput("");
    setHighlight(-1);
    setTopicsOpen(false);
    inputRef.current?.focus();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(highlight >= 0 && completions[highlight] ? completions[highlight] : input);
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!completions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % completions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? completions.length - 1 : h - 1));
    } else if (e.key === "Escape") {
      setHighlight(-1);
      setInput("");
    }
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pyquery.theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  const topicIndex = <TopicIndex onAsk={ask} />;

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              <span className="font-mono text-accent-warm" aria-hidden>
                &gt;&gt;&gt;
              </span>{" "}
              pyquery
            </h1>
            <p className="hidden text-sm text-subtle sm:block">
              Python answers from {knowledgeBase.length} curated entries
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Sheet open={topicsOpen} onOpenChange={setTopicsOpen}>
              <SheetTrigger asChild>
                <button type="button" className={`${iconBtn} lg:hidden`} aria-label="Browse topics">
                  <BookOpen className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] max-w-sm overflow-y-auto border-line bg-surface p-0"
              >
                <SheetHeader className="border-b border-line px-4 py-3">
                  <SheetTitle className="font-display text-ink">Browse topics</SheetTitle>
                </SheetHeader>
                {topicIndex}
              </SheetContent>
            </Sheet>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className={iconBtn}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className={iconBtn}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-line lg:block">
          {topicIndex}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite">
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
              {messages.length === 0 ? (
                <Welcome onAsk={ask} />
              ) : (
                <ol className="space-y-6">
                  {messages.map((m) => (
                    <li key={m.id} className="msg-enter">
                      {m.role === "user" ? (
                        <p className="font-mono text-[15px] text-ink">
                          <span className="mr-2 select-none text-accent-warm">&gt;&gt;&gt;</span>
                          {m.text}
                        </p>
                      ) : (
                        <AnswerCell question={m.question} answer={m.answer} onAsk={ask} />
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-line bg-surface/80 backdrop-blur">
            <form onSubmit={onSubmit} className="relative mx-auto max-w-3xl px-4 py-3 sm:px-8">
              {completions.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Matching questions"
                  className="msg-enter absolute inset-x-4 bottom-full mb-2 overflow-hidden rounded-lg border border-line bg-surface shadow-lg sm:inset-x-8"
                >
                  {completions.map((c, i) => (
                    <li key={c} role="option" aria-selected={i === highlight}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => ask(c)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${i === highlight ? "bg-line-soft text-brand" : "text-body hover:bg-line-soft"}`}
                      >
                        <Search className="size-3.5 shrink-0 text-faint" />
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2.5 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <span
                  className="select-none font-mono text-sm font-bold text-accent-warm"
                  aria-hidden
                >
                  &gt;&gt;&gt;
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setHighlight(-1);
                  }}
                  onKeyDown={onInputKey}
                  maxLength={500}
                  autoComplete="off"
                  placeholder="Ask a Python question…"
                  aria-label="Ask a Python question"
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-faint"
                />
                <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] text-faint sm:inline">
                  /
                </kbd>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-40 dark:text-paper"
                >
                  Ask
                </button>
              </label>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-md text-subtle transition-colors hover:bg-line-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

function Welcome({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <div className="pt-6 sm:pt-14">
      <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        Ask Python
        <br />
        anything<span className="caret-blink text-accent-warm">_</span>
      </h2>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-body">
        Plain-English questions, straight answers with code you can copy. Everything runs in your
        browser — no sign-up, no waiting, and it never makes things up: if it doesn't know, it says
        so.
      </p>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onAsk(q)}
            className="group flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm text-body transition-colors hover:border-brand hover:text-ink"
          >
            <span className="font-mono text-faint transition-colors group-hover:text-accent-warm">
              &gt;&gt;&gt;
            </span>
            {q}
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm text-subtle">
        Tip: press <kbd className="rounded border border-line px-1 font-mono text-xs">/</kbd> to
        jump to the prompt, or browse every topic in the index.
      </p>
    </div>
  );
}

/** Renders `inline code` spans inside answer prose. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="rounded bg-line-soft px-1 py-0.5 font-mono text-[0.9em] text-ink"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function AnswerCell({
  question,
  answer,
  onAsk,
}: {
  question: string;
  answer: Answer;
  onAsk: (q: string) => void;
}) {
  const pct = Math.round(answer.confidence * 100);
  return (
    <article
      className={`rounded-xl border bg-surface p-4 sm:p-5 ${answer.matched ? "border-line" : "border-dashed border-accent-warm/70"}`}
    >
      {answer.matched && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs text-subtle"># {answer.topic}</span>
          <span
            className="flex items-center gap-2 text-xs text-faint"
            title="How closely your question matched the stored one"
          >
            <span className="h-1 w-16 overflow-hidden rounded-full bg-line-soft">
              <span className="block h-full rounded-full bg-online" style={{ width: `${pct}%` }} />
            </span>
            {pct}% match
          </span>
        </div>
      )}
      <p className="text-[15px] leading-relaxed text-body">
        <Prose text={answer.answer} />
      </p>
      {answer.code && <CodeBlock code={answer.code} />}
      {answer.suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-subtle">{answer.matched ? "Related:" : "Try:"}</span>
          {answer.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAsk(s)}
              className="rounded-full border border-line px-3 py-1 text-xs text-body transition-colors hover:border-brand hover:text-brand"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {answer.matched && answer.entryId && (
        <div className="mt-4 flex justify-end border-t border-line-soft pt-3">
          <AnswerVote question={question} entryId={answer.entryId} />
        </div>
      )}
    </article>
  );
}

function TopicIndex({ onAsk }: { onAsk: (q: string) => void }) {
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return topics;
    return topics
      .map((t) => ({
        ...t,
        questions: t.name.toLowerCase().includes(f)
          ? t.questions
          : t.questions.filter((q) => q.toLowerCase().includes(f)),
      }))
      .filter((t) => t.questions.length > 0);
  }, [filter]);

  return (
    <nav aria-label="Topics" className="p-3">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter topics…"
        aria-label="Filter topics"
        className="mb-3 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-brand"
      />
      {shown.length === 0 && (
        <p className="px-2 text-sm text-subtle">No topic matches “{filter}”.</p>
      )}
      {shown.map((t) => (
        <details
          key={t.name}
          open={!!filter.trim()}
          className="group border-b border-line-soft last:border-0"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2 text-sm font-semibold text-ink hover:bg-line-soft [&::-webkit-details-marker]:hidden">
            {t.name}
            <span className="font-mono text-xs font-normal text-faint">{t.questions.length}</span>
          </summary>
          <ul className="mb-2 space-y-0.5 pl-2">
            {t.questions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onAsk(q)}
                  className="w-full rounded px-2 py-1.5 text-left text-[13px] leading-snug text-body transition-colors hover:bg-line-soft hover:text-brand"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
