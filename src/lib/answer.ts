import { knowledgeBase } from "./knowledge-base";
import { findAnswer, tokenize, type LearnedWeight } from "./nlp";

export type Answer = {
  matched: boolean;
  entryId?: string | undefined;
  answer: string;
  topic?: string | undefined;
  code?: string | undefined;
  confidence: number;
  suggestions: string[];
};

const FALLBACK =
  "I only answer from my Python knowledge base, so I won't guess. Try rephrasing, or pick one of these:";

// Matching runs in the browser: the knowledge base is static, so answers are instant and work offline.
export function answerQuestion(question: string, weights: LearnedWeight[] = []): Answer {
  const result = findAnswer(question, weights);
  if (!result.matched || !result.entry) {
    return {
      matched: false,
      answer: FALLBACK,
      confidence: result.confidence,
      suggestions:
        result.confidence < 0.12
          ? [
              "What is a list comprehension?",
              "How do I handle exceptions?",
              "What is __init__ and self?",
            ]
          : result.suggestions,
    };
  }
  return {
    matched: true,
    entryId: result.entry.id,
    answer: result.entry.answer,
    topic: result.entry.topic,
    code: result.entry.code,
    confidence: result.confidence,
    suggestions: result.suggestions,
  };
}

const allQuestions = [...new Set(knowledgeBase.flatMap((e) => e.questions))];

/** Type-ahead: stored questions containing every typed word prefix. */
export function autocomplete(text: string, limit = 5): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (words.length === 0) return [];
  return allQuestions
    .filter((q) => {
      const lower = q.toLowerCase();
      return words.every((w) => lower.includes(w));
    })
    .slice(0, limit);
}

// ---------- Per-browser learning from votes ----------
const VOTES_KEY = "pyquery.weights.v1";
type WeightStore = Record<string, Record<string, number>>;

function readStore(): WeightStore {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) ?? "{}") as WeightStore;
  } catch {
    return {};
  }
}

export function learnedWeights(): LearnedWeight[] {
  const store = readStore();
  return Object.entries(store).flatMap(([entry_id, tokens]) =>
    Object.entries(tokens).map(([token, weight]) => ({ entry_id, token, weight })),
  );
}

/** Votes nudge ranking for this question's words, bounded to ±5 like the original DB trigger. */
export function recordVote(question: string, entryId: string, vote: 1 | -1) {
  const store = readStore();
  const tokens = (store[entryId] ??= {});
  for (const t of new Set(tokenize(question))) {
    tokens[t] = Math.max(-5, Math.min(5, (tokens[t] ?? 0) + vote));
  }
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(store));
  } catch {
    /* storage blocked: vote still shows as recorded for this session */
  }
}
