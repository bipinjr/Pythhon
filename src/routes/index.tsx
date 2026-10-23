import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, Bug, Database, Moon, Plus, Search, Sparkles, Sun, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { AnswerVote } from "@/components/AnswerVote";
import { CodeBlock } from "@/components/CodeBlock";
import { Logo, LogoMark } from "@/components/Logo";
import { answerQuestion, autocomplete, learnedWeights, type Answer } from "@/lib/answer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "PyQuery — Ask anything about Python" },
      {
        name: "description",
        content:
          "Ask Python questions in plain English and get instant answers with example code. Free, no sign-up, works on any device.",
      },
      { property: "og:title", content: "PyQuery — Ask anything about Python" },
      {
        property: "og:description",
        content: "Ask Python questions in plain English and get instant answers with example code.",
      },
    ],
  }),
  component: ChatPage,
});

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; question: string; answer: Answer };

const HISTORY_KEY = "pyquery.history.v2";

const STARTERS: { icon: ReactNode; label: string; question: string }[] = [
  {
    icon: <Sparkles className="size-4" />,
    label: "Basics",
    question: "What is a list comprehension?",
  },
  {
    icon: <Bug className="size-4" />,
    label: "Fix an error",
    question: "What does AttributeError mean?",
  },
  { icon: <Wrench className="size-4" />, label: "How-to", question: "How do I read a JSON file?" },
  {
    icon: <Database className="size-4" />,
    label: "Practice",
    question: "Write a Fibonacci program in Python",
  },
];

let seq = 0;
const nextId = () => `${Date.now().toString(36)}-${(seq += 1)}`;

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
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
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
  }, [messages, loaded]);

  // "/" focuses the input from anywhere, like a search box.
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
    inputRef.current?.focus();
  }

  function submit() {
    ask(highlight >= 0 && completions[highlight] ? completions[highlight] : input);
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
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

  const empty = messages.length === 0;

  const composer = (
    <div className="relative w-full">
      {completions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Suggested questions"
          className={`msg-enter absolute inset-x-0 z-10 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-xl ${empty ? "top-full mt-2" : "bottom-full mb-2"}`}
        >
          {completions.map((c, i) => (
            <li key={c} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ask(c)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${i === highlight ? "bg-brand/10 text-brand" : "text-body hover:bg-line-soft"}`}
              >
                <Search className="size-4 shrink-0 text-faint" />
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-5 shadow-[0_8px_30px_-12px_rgb(19_35_61/0.25)] transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_8px_30px_-10px_rgb(47_108_168/0.45)]">
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
          autoFocus
          enterKeyHint="send"
          placeholder={empty ? "Ask anything about Python…" : "Ask a follow-up…"}
          aria-label="Ask a Python question"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!input.trim()}
          aria-label="Send question"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-hover active:scale-95 disabled:bg-line disabled:text-faint dark:text-paper"
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMessages([])}
            aria-label="PyQuery home"
            className="rounded-lg"
          >
            <Logo />
          </button>
          <div className="flex items-center gap-1">
            {!empty && (
              <button type="button" onClick={() => setMessages([])} className={pillBtn}>
                <Plus className="size-4" />
                New chat
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

      {empty ? (
        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-16 sm:px-6">
          <div className="msg-enter w-full max-w-2xl text-center">
            <LogoMark className="mx-auto size-16" />
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              What do you want to know about Python?
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-subtle">
              Ask in plain English. You get a clear explanation and code you can copy, instantly.
            </p>
            <div className="mt-8 text-left">{composer}</div>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s.question}
                  type="button"
                  onClick={() => ask(s.question)}
                  className="group rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-md"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-brand">
                    {s.icon}
                    {s.label}
                  </span>
                  <span className="mt-1.5 block text-sm text-body group-hover:text-ink">
                    {s.question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto" aria-live="polite">
            <ol className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
              {messages.map((m) => (
                <li key={m.id} className="msg-enter">
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white dark:text-paper">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <BotMessage question={m.question} answer={m.answer} onAsk={ask} />
                  )}
                </li>
              ))}
            </ol>
            <div ref={bottomRef} />
          </main>
          <div className="shrink-0 bg-gradient-to-t from-paper via-paper to-transparent pt-2">
            <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
              {composer}
              <p className="mt-2 text-center text-xs text-faint">
                Answers come from a curated Python knowledge base — if it doesn't know, it says so.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-line-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";
const pillBtn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-subtle transition-colors hover:bg-line-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

/** Renders `inline code` spans inside answer prose. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="rounded-md bg-line-soft px-1.5 py-0.5 font-mono text-[0.88em] text-ink"
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

function BotMessage({
  question,
  answer,
  onAsk,
}: {
  question: string;
  answer: Answer;
  onAsk: (q: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <LogoMark className="mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        {answer.matched ? (
          <p className="mb-2 flex items-center gap-2 text-xs text-subtle">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
              {answer.topic}
            </span>
            {answer.confidence < 0.4 && (
              <span>Closest match — rephrase if this isn't what you meant</span>
            )}
          </p>
        ) : (
          <p className="mb-2 text-sm font-semibold text-ink">I'm not sure about that one.</p>
        )}
        <div className="text-[15px] leading-relaxed text-body">
          <Prose text={answer.answer} />
        </div>
        {answer.code && <CodeBlock code={answer.code} />}
        {answer.suggestions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-subtle">
              {answer.matched ? "Related questions" : "Try asking"}
            </p>
            <div className="flex flex-col items-start gap-1.5">
              {answer.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onAsk(s)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-left text-sm text-body transition-colors hover:border-brand hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {answer.matched && answer.entryId && (
          <div className="mt-3">
            <AnswerVote question={question} entryId={answer.entryId} />
          </div>
        )}
      </div>
    </div>
  );
}
