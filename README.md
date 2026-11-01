# quiz (web)

Web app for **Quiz** — learn Greek & Roman gods and world geography from charts,
family trees and cards, then test yourself. Same stack as `dashboard`: Next.js 16
(app router) + MUI 6 on the Minimal kit, SWR + axios, ApexCharts, React Flow + dagre,
framer-motion. Mongolian by default, English via the МН/EN toggle; light/dark mode.

API: `../quiz-backend`.

## Run

```bash
cp .env.example .env.local   # NEXT_PUBLIC_SERVER_URL=http://localhost:4010
npm install                  # .npmrc sets legacy-peer-deps (same as dashboard's yarn)
npm run dev                  # http://localhost:3040
```

## Screens

- `/` — pick a topic
- `/[topic]` — lessons + "Quick quiz" (10 random questions)
- `/[topic]/[lesson]` — intro, visual, "Did you know?", "Test yourself"
- `/[topic]/quiz?lesson=<key>` — full-screen swipe quiz, same interaction as
  sedev's reader (`sections/quiz/quiz-reader.jsx` ≈ sedev `TopicReader`,
  `quiz-story.jsx` ≈ `KeyPointCards` screen mode): a bar per question, swipe
  left/right or tap the sides between questions, swipe up/down between lessons,
  ‹ › on a mouse, ← → ↑ ↓ / 1–4 / Enter / Esc. You can't move past an unanswered
  question. Gods answers show the person's branch of the family tree.
- Gods family tree (`sections/family/`): the whole family laid out with dagre
  (couples → children), tap a god to light up their relatives + see their branch

Visual renderers are in `src/sections/visuals/` — one per `visual.kind` from the
backend's `src/seed/types.ts`. UI strings: `src/locales/strings.js`.

UX rules kept throughout: one main action per screen, big tap targets (≥ 64 px
answers), back button at the top of every inner page, keyboard 1–4 / Enter in
the quiz, chart notes also printed as text (tooltips don't work on phones).
