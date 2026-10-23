// Self-check for the matcher: `npm run check:answers`. Fails if a known question routes to the wrong entry.
import assert from "node:assert/strict";

import { answerQuestion, autocomplete } from "../src/lib/answer";
import { knowledgeBase } from "../src/lib/knowledge-base";

const cases: [string, string][] = [
  ["how do i reverse a list", "lists-reverse"],
  ["what is a decorator", "decorators"],
  ["how to format a float to 2 decimals", "fstrings-format"],
  ["check if string is palindrome", "reverse-palindrome"],
  ["fibonacci series program", "fibonacci"],
  ["is 17 a prime number how to check", "prime-numbers"],
  ["difference between append and extend", "list-methods"],
  ["merge two dicts", "merge-sort-dicts"],
  ["what is a dataclass", "dataclasses"],
  ["NoneType object has no attribute", "error-attribute"],
  ["ModuleNotFoundError no module named requests", "error-module-not-found"],
  ["how to read json file", "json"],
  ["what is pandas", "pandas-basics"],
  ["what does break do", "while-break-continue"],
  ["what is a dictionry", "dicts"],
  ["classmethod vs staticmethod", "classmethod-staticmethod"],
];

const ids = new Set<string>();
for (const e of knowledgeBase) {
  assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
  ids.add(e.id);
}

let failed = 0;
for (const [q, id] of cases) {
  const a = answerQuestion(q);
  if (a.entryId !== id) {
    failed += 1;
    console.log(`FAIL "${q}" -> ${a.entryId ?? "fallback"} (${a.confidence}), expected ${id}`);
  }
}
assert.equal(
  answerQuestion("weather in paris tomorrow").matched,
  false,
  "nonsense should fall back",
);
assert.ok(autocomplete("revers").length > 0, "autocomplete finds prefixes");

const t = performance.now();
for (let i = 0; i < 200; i += 1) answerQuestion("how do i handle exceptions in python");
console.log(
  `${knowledgeBase.length} entries, avg ${((performance.now() - t) / 200).toFixed(2)}ms per answer`,
);
assert.equal(failed, 0, `${failed} routing failures`);
console.log("ok");
