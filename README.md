# PyQuery: your personal Python answer engine

**Try it live: [pyquery.vercel.app](https://pyquery.vercel.app)**

PyQuery is a website where you type a Python question in plain English, like *"how do I reverse a list?"*, and instantly get a short explanation plus example code you can copy.

- **No sign-up.** Open the page and start asking.
- **No AI service behind it.** Answers come from a hand-written knowledge base of **123 Python topics**, so it never invents answers.
- **Honest.** If your question isn't covered, it says so and suggests questions it can answer.
- **Fast.** Answers appear in about 2 milliseconds, because everything runs inside your browser.
- **Works everywhere.** Phone, tablet or desktop, in light or dark mode.

---

## Using the app

| You want to… | Do this |
| --- | --- |
| Ask a question | Type it in the box at the bottom (it starts with `>>>`, like the Python prompt) and press **Enter** or **Ask**. |
| Get help phrasing it | Start typing. Matching questions pop up above the box; pick one with the **↑ ↓** keys and **Enter**, or click it. |
| Browse what it knows | Use the **topic list** (left sidebar on desktop, the 📖 book button on mobile). Type in *Filter topics…* to search it. |
| Copy example code | Click **Copy** on any code block. |
| Explore further | Click a **Related** question under an answer. |
| Teach it | Click 👍 or 👎 under an answer. Your votes push good answers higher next time (saved in your browser only). |
| Start over | Click the ↺ button at the top. |
| Switch theme | Click the ☀/☾ button at the top. |
| Jump to the box | Press **/** anywhere on the page. |

Your conversation is kept when you reload the page. It's stored in your browser and never sent anywhere.

### What it can answer

Python from first steps to intermediate:

- **Basics:** variables, data types, strings, f-strings, operators, input/output
- **Collections:** lists, tuples, dictionaries, sets, slicing, comprehensions
- **Control flow:** if/else, `match`/`case`, loops, `break`/`continue`
- **Functions:** arguments, lambdas, closures, decorators, generators, recursion
- **Classes (OOP):** `__init__`/`self`, inheritance, `@property`, dataclasses, abstract classes
- **Errors:** reading tracebacks, `try`/`except`, and specific errors like `AttributeError` and `ModuleNotFoundError`
- **Standard library:** files, JSON, dates, regex, `collections`, `itertools`, logging, sqlite3
- **Ecosystem:** pip and virtual environments, pandas, NumPy, matplotlib, FastAPI/Flask, web scraping
- **Classic exercises:** Fibonacci, prime numbers, palindromes, factorial, removing duplicates

---

## How it works

There's no server-side AI and no database. When you ask a question, your browser does this:

1. **Clean the question.** It lowercases the text, drops filler words ("what", "the", "how") and trims word endings ("loops" → "loop").
2. **Fix typos.** Misspelled words are matched to the closest known word, so "dictionry" becomes "dictionary".
3. **Understand everyday wording.** Common phrasings are expanded with related terms ("delete" also searches "remove" and "pop").
4. **Score every entry** in the knowledge base on three things:
   - how many important words the question shares with the entry (a standard search technique called TF-IDF),
   - how closely it matches one of the entry's stored phrasings,
   - how similar the letters are, which helps with typos.
5. **Check it's really about Python.** If most of the words are unknown (e.g. "weather in paris tomorrow"), the score is lowered, so off-topic questions aren't forced onto a Python answer.
6. **Answer or admit it doesn't know.** If the best score reaches the confidence threshold (20%), you get that answer with its match percentage. Otherwise you get a "not sure" message with suggestions.

Your 👍/👎 votes add a small, capped bonus or penalty to an entry for the words you used, so the ranking adapts to you over time.

---

## Running it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install            # install dependencies (once)
npm run dev            # start the app; open the URL it prints
```

Other useful commands:

```sh
npm run check:answers  # self-test: sample questions must reach the right answers
npm run build          # build for production
```

## Adding or editing answers

All answers live in plain TypeScript files in `src/lib/`:

- `knowledge-base.ts` — core topics
- `knowledge-base-extra.ts` — everyday questions and more topics
- `knowledge-base-general.ts` — general programming questions
- `knowledge-base-more.ts` — stdlib, OOP extras, specific errors, data tools, classic exercises

Each entry looks like this:

```ts
{
  id: "fibonacci",                         // unique name
  topic: "Classic programs",               // groups it in the topic list
  questions: [                             // different ways people ask it
    "How do I print the Fibonacci sequence?",
    "Write a Fibonacci program in Python",
  ],
  keywords: ["fibonacci", "sequence"],     // extra words that should match
  answer: "Each Fibonacci number is…",     // the explanation shown
  code: "def fibonacci(n): ...",           // optional example code
}
```

After editing, run `npm run check:answers` to confirm nothing broke. Each entry's first question must be unique because it's what the topic list shows.

## Project structure

```
src/
  routes/index.tsx        the page: chat, input box, topic list, theme
  components/
    CodeBlock.tsx         code display with syntax colours and a Copy button
    AnswerVote.tsx        the 👍 / 👎 buttons
  lib/
    knowledge-base*.ts    the questions and answers
    nlp.ts                the matching engine (steps 1–6 above)
    synonyms.ts           everyday-word expansions
    answer.ts             turns a match into an answer; type-ahead, topic list, vote storage
scripts/check-answers.ts  the self-test
```

**Built with:** React 19, TanStack Start, Tailwind CSS 4 and TypeScript. It's hosted on Vercel, which redeploys automatically on every push to `main`.

---

# Product Requirements Document (PRD)

## Project: Personal Python Question-Answering Chatbot

## 1) Product Goal

Build a responsive personal Python question-answering chatbot that helps users ask Python-related questions in natural language and receive accurate answers from a predefined Python knowledge base.

The app must be simple to use, fast, and polished, with a clean frontend, subtle animations, and no authentication required. The purpose of removing signup is to make the mentor able to open and review the application instantly on any device without friction.

## 2) Users & Roles

- Primary user: a student or learner asking Python programming questions.

- Reviewer/mentor: can open the app directly and test it immediately.

- No login, no signup, no user accounts, no role-based permissions.

## 3) Core Product Behavior

- The user enters a Python-related question in natural language.

- The chatbot searches a predefined Python knowledge base using its own NLP logic.

- The app returns the best matching answer along with optional topic and confidence information.

- If the system cannot confidently answer, it should show a helpful fallback response and suggest the kinds of Python questions it can handle.

## 4) Platform Requirements

- Must work on desktop, tablet, and mobile.

- Must be usable from any modern browser on any platform.

- Responsive layout with mobile-first behavior.

- No platform-specific dependency should block access.

- The app should run as a standard web application.

## 5) NLP and Data Requirements

- Use the app’s own NLP logic; do not use external AI APIs.

- Fetch answers from a predefined knowledge base stored in the app’s backend or database.

- Use similarity matching or retrieval-based NLP to map user questions to the closest stored question-answer pair.

- The chatbot should not hallucinate answers outside the knowledge base.

- If confidence is low, return a fallback message instead of guessing.

## 6) Page Structure

### Single-page app layout

- Header with app name and short tagline.

- Main chatbot area with conversation history.

- Input area for typing questions and sending them.

- Optional suggestion chips or sample questions.

- Optional info panel or sidebar for confidence/topic display.

## 7) Screens and Components

### Home / Chat Screen

- Chat history showing user and bot messages.

- Distinct message styles for user and bot.

- Typing/loading state while the answer is being generated.

- Enter-to-send support.

- Clear chat button.

- Sample question buttons.

### UI Components

- Chat window.

- Input bar.

- Message bubbles.

- Optional sample questions section.

- Optional confidence/topic display.

## 8) Design Direction

Create a modern, polished, friendly UI that feels professional but approachable.

- Clean card-based layout.

- Smooth but subtle animations for message appearance, hover states, and loading indicators.

- Gradient or soft accent styling is allowed.

- Use rounded corners, good spacing, and strong visual hierarchy.

- Avoid heavy animations, clutter, or excessive motion.

- Make the interface look impressive enough for a mentor demo.

## 9) Interaction Rules

- No signup or authentication flow at all.

- The chatbot must be instantly usable on open.

- Messages should appear in sequence like a real chat.

- Auto-scroll to the latest message.

- Show clear error handling if the backend is unavailable.

- Keep the experience lightweight and easy to understand.

## 10) Backend Requirements

- Build a backend that exposes an endpoint for asking questions.

- Backend should contain or fetch the Python knowledge base.

- Backend should run the NLP matching logic.

- Frontend should call the backend securely and display results.

- The backend must support deployment in a standard web hosting environment.

## 11) Knowledge Base Requirements

Include a starter Python Q&A knowledge base with beginner to intermediate topics such as:

- Python basics

- Variables

- Data types

- Lists

- Tuples

- Dictionaries

- Sets

- Conditionals

- Loops

- Functions

- OOP basics

- Modules and imports

- Exception handling

- File handling

- Comprehensions

- Common errors

## 12) Output Requirements

Each chatbot response should ideally include:

- Answer text.

- Optional topic name.

- Optional confidence score.

- Helpful fallback text when no match is found.

## 13) Non-Functional Requirements

- Fast response time.

- Clean code structure.

- Easy to deploy.

- Minimal dependencies.

- Maintainable and readable.

- No unnecessary complexity.

- Works reliably across modern browsers.

## 14) Out of Scope

Do not include:

- Login or signup.

- Paid subscriptions.

- External AI or third-party NLP APIs.

- Real-time collaboration.

- Notifications.

- Advanced admin dashboard.

- Over-engineered animations.

- Multi-user accounts.

## 15) Acceptance Criteria

- A user can open the app without signing in.

- A user can type a Python question and receive an answer.

- The chatbot uses its own NLP matching against a predefined knowledge base.

- The UI is responsive and works on mobile and desktop.

- The interface looks polished with subtle animations.

- The app is easy for a mentor to access and review immediately.

- The app gives a fallback response when no confident match exists.

## 16) Build Priority

Build in this order:

1. Create the polished responsive chatbot UI.

2. Add chat interactions and message state.

3. Add the backend question-answer API.

4. Add NLP similarity matching.

5. Connect frontend and backend.

6. Add sample questions, confidence display, and fallback handling.

7. Finalize animations and visual polish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac7bfc56-c69e-4127-9d05-5ca0d186a525).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
