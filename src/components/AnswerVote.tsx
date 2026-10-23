import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { recordVote } from "@/lib/answer";

/** Votes tune ranking for this browser only (stored locally, no account needed). */
export function AnswerVote({ question, entryId }: { question: string; entryId: string }) {
  const [vote, setVote] = useState<1 | -1>();
  function rate(value: 1 | -1) {
    if (vote) return;
    recordVote(question, entryId, value);
    setVote(value);
  }
  const btn =
    "inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-line-soft hover:text-brand disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <div className="flex items-center gap-1 text-subtle">
      <span className="mr-1 text-xs">
        {vote ? (vote === 1 ? "Thanks — noted." : "Got it, I'll rank this lower.") : "Helpful?"}
      </span>
      <button
        type="button"
        aria-label="Helpful answer"
        aria-pressed={vote === 1}
        disabled={!!vote}
        className={`${btn} ${vote === 1 ? "text-brand" : ""}`}
        onClick={() => rate(1)}
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Unhelpful answer"
        aria-pressed={vote === -1}
        disabled={!!vote}
        className={`${btn} ${vote === -1 ? "text-brand" : ""}`}
        onClick={() => rate(-1)}
      >
        <ThumbsDown className="size-3.5" />
      </button>
    </div>
  );
}
