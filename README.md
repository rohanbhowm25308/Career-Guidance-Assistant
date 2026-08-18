# Aether — AI Career Guidance Assistant

A full-stack career guidance chatbot/dashboard for students: profile-based
career recommendations, a Groq-powered mentor chatbot, mock interviews,
skill quizzes, resume review, roadmaps, salary estimates, and more —
wrapped in an animated holographic dashboard UI.

## Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (Canvas animation for the ambient sphere background, Web Speech API for voice input)
- **Backend:** Python, Flask, `requests` (calls the Groq Cloud API directly, OpenAI-compatible format)
- **AI:** Groq (groq.com) for the generative features; a transparent rule-based
  scoring engine (in `app.py`) for recommendations, skill-gap, salary and
  roadmap logic — no API key needed for those.

## Setup

```bash
cd career-guidance-assistant
pip install -r requirements.txt

cp .env.example .env
# open .env and paste your real key:
# GROQ_API_KEY=gsk_...
```

Get a key at https://console.groq.com/keys if you don't have one — note
this is **Groq** (groq.com, fast open-model inference), not xAI's "Grok".
Keys start with `gsk_`. The default model is `openai/gpt-oss-120b` — Groq
retires models fairly often (they shut down `llama-3.3-70b-versatile` on
Aug 16, 2026, for example), so if you ever see a 404 in the chat, the app
will automatically retry with a couple of known-current fallback models
before giving up. You can also set `GROQ_MODEL` in `.env` directly; see
https://console.groq.com/docs/models for the current list.

## Run

```bash
python app.py
```

Then open **http://localhost:5000** in your browser.

## Deploying to Render

1. Push this repo to GitHub.
2. On [render.com](https://dashboard.render.com), click **New → Web Service** and connect your GitHub repo.
3. Fill in the form:

   | Field | Value |
   |---|---|
   | **Language** | Python 3 |
   | **Branch** | `main` |
   | **Root Directory** | *(leave blank)* |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT` |

4. Scroll down to **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `GROQ_API_KEY` | your real Groq key (`gsk_...`) |
   | `GROQ_MODEL` | `openai/gpt-oss-120b` *(optional — already the code default)* |

   This matters: `.env` is git-ignored on purpose so your key never ends up
   on GitHub, which means Render doesn't have it either unless you add it
   here manually.

5. Click **Create Web Service**. Render builds and deploys automatically;
   future pushes to `main` redeploy it.

## What works without an API key

Everything **except** the features that call Groq directly still works:
Career Recommendations, You vs Career, What-If Simulator, Path Generator,
Roadmap, Skill Gap, Job Description Analyzer, Salary Estimator, Opportunity
Radar, Portfolio Strength, and all gamification.

The **AI Career Chatbot, Mock Interview, Skill Quiz, Resume Assistant, and
Project Generator** call `/api/chat`, `/api/interview/*`, `/api/quiz`,
`/api/resume-review`, `/api/project-idea`, and `/api/project-to-career` —
these need a valid `GROQ_API_KEY` in `.env`. Without one they'll show a
clear inline error in the UI instead of failing silently. If you see a 401,
your key is invalid; a 404 means `GROQ_MODEL` isn't available on your
account; a 400 shows Groq's own error message so you can see exactly what
it rejected.

## Voice input

The Career Chatbot and Mock Interview answer box both have a 🎙️ mic button
that uses the browser's built-in Web Speech API to transcribe speech to
text. It works in Chrome and Edge; unsupported browsers (e.g. Firefox) get
a greyed-out button with an explanatory message instead of silently failing.
It requires microphone permission and (per the Web Speech API spec) an
internet connection, since the browser sends audio to its own speech
service for transcription — this is separate from the Groq API key.

## Project structure

```
career-guidance-assistant/
├── app.py                  # Flask app + all API routes
├── requirements.txt
├── .env.example             # copy to .env and add your key
├── templates/
│   └── index.html           # single-page dashboard shell
└── static/
    ├── css/style.css        # design system (holographic theme)
    └── js/
        ├── background.js    # animated wireframe sphere (canvas)
        ├── app.js            # nav, profile, gamification, digital twin
        ├── career-engine.js  # recommendations, roadmap, skill gap, salary
        ├── mentor.js          # chatbot + mock interview (Groq)
        ├── tools.js            # quiz, resume review, project generator
        └── voice.js             # mic button / speech-to-text (Web Speech API)
```

## Notes

- All profile/goal/roadmap/gamification data is stored in the browser's
  `localStorage` — there's no database in this build. Swap `Store` in
  `app.js` for real API calls if you want server-side persistence.
- Salary figures are illustrative estimates (INR/year), not sourced data.
- `.env` is git-ignored — never commit your real API key.
- The **Skills** chip set has 20 options (Python, Java, C, C++, JavaScript,
  TypeScript, Rust, Go, Ruby, PHP, SQL, HTML/CSS, React, Node.js, AI/ML,
  Data Science, Cloud Computing, DevOps, Communication, Leadership),
  **Interests** has 20 (AI, Data Science, Software Development,
  Cybersecurity, Finance, Healthcare, Design, Research, Web Development,
  Mobile Development, Game Development, Cloud Computing, DevOps, Full Stack
  Development, Frontend Development, ML Engineering, Blockchain, Robotics,
  Product Management, Digital Marketing), and **Career Personality** has 10
  (Problem Solver, Creative Thinker, Leader, Research-Oriented, Analytical
  Thinker, Team Player, Time Management, Critical Thinking, Adaptability,
  Detail-Oriented). The career-matching engine in `app.py` (`CAREERS` dict)
  was expanded to 14 careers so the extra vocabulary actually affects
  match scores, not just the form.
