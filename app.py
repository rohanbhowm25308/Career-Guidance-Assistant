"""
AI Career Guidance Assistant — Backend
Flask + the Groq API (groq.com — fast open-model inference) for the
generative features, with a transparent rule-based scoring engine for the
deterministic ones (recommendation matching, skill-gap, salary estimation,
roadmap building).

Run:
    pip install -r requirements.txt
    cp .env.example .env      # then add your GROQ_API_KEY
    python app.py
"""

import os
import json
import re
from datetime import datetime

import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# --- Groq config ---------------------------------------------------------
# Groq's API is OpenAI-compatible: https://api.groq.com/openai/v1/chat/completions
# Get a key at https://console.groq.com/keys — keys look like "gsk_...".
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


# ---------------------------------------------------------------------------
# Groq helper
# ---------------------------------------------------------------------------

# Groq retires/renames models fairly often. If the configured model 404s,
# fall back to trying these known-current model IDs once before giving up,
# so a Groq-side deprecation doesn't silently break the whole app.
GROQ_FALLBACK_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]


def _call_groq_once(model, system_prompt, user_prompt, max_tokens):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    try:
        resp = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Could not reach the Groq API: {e}")
    return resp


def ask_groq(system_prompt, user_prompt, max_tokens=1000):
    """Call the Groq chat-completions API. Returns plain text (or raises).

    If GROQ_MODEL has been retired on Groq's side (404), automatically
    retries with a short list of known-current model IDs before failing.
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "Missing GROQ_API_KEY. Add it to your .env file to enable "
            "the AI-generated features (chatbot, interview, quizzes, resume "
            "review, project ideas). Get a key at https://console.groq.com/keys"
        )

    models_to_try = [GROQ_MODEL] + [m for m in GROQ_FALLBACK_MODELS if m != GROQ_MODEL]
    last_error = None

    for i, model in enumerate(models_to_try):
        resp = _call_groq_once(model, system_prompt, user_prompt, max_tokens)

        if resp.status_code == 401:
            raise RuntimeError("Groq API rejected the key (401 Unauthorized). Check GROQ_API_KEY in .env.")

        if resp.status_code == 404:
            last_error = (f"Groq model '{model}' not found (404). "
                          f"See https://console.groq.com/docs/models for current model names.")
            continue  # try the next fallback model

        if resp.status_code == 400:
            try:
                detail = resp.json().get("error", {}).get("message", resp.text)
            except Exception:
                detail = resp.text
            raise RuntimeError(f"Groq API rejected the request (400): {detail}")

        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("Groq API returned no choices.")
        text = (choices[0].get("message", {}).get("content") or "").strip()

        if i > 0:
            # We had to fall back — surface this once via server logs so it's
            # visible, without interrupting the reply itself.
            print(f"[Groq] '{GROQ_MODEL}' unavailable, used fallback '{model}' instead. "
                  f"Consider updating GROQ_MODEL in .env.")
        return text

    raise RuntimeError(last_error or "All configured Groq models are unavailable.")


def ask_groq_json(system_prompt, user_prompt, max_tokens=1200):
    """Ask Groq for strict JSON and parse it, stripping code fences if present."""
    raw = ask_groq(system_prompt + "\n\nRespond with ONLY valid JSON. No prose, no markdown fences.",
                    user_prompt, max_tokens=max_tokens)
    cleaned = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Static career knowledge base (used by the deterministic engine)
# ---------------------------------------------------------------------------

CAREERS = {
    "AI Engineer": {
        "skills": ["python", "ai", "cloud computing", "data science"],
        "interests": ["ai", "machine learning engineering", "research"],
        "personality": ["problem solver", "analytical thinker", "research-oriented"],
        "base_salary": (900000, 2800000),
        "growth": ["Intern", "Junior AI Engineer", "AI Engineer", "Senior AI Engineer", "AI Architect"],
        "demand": "Very High", "difficulty": "High", "trend": "Growing",
    },
    "Data Scientist": {
        "skills": ["python", "sql", "data science", "ai"],
        "interests": ["data science", "ai", "research", "finance"],
        "personality": ["analytical thinker", "research-oriented", "detail-oriented"],
        "base_salary": (800000, 2500000),
        "growth": ["Intern", "Junior Data Analyst", "Data Scientist", "Senior Data Scientist", "Lead Data Scientist"],
        "demand": "High", "difficulty": "High", "trend": "Competitive",
    },
    "ML Engineer": {
        "skills": ["python", "ai", "cloud computing", "data science"],
        "interests": ["ai", "machine learning engineering", "software development"],
        "personality": ["problem solver", "analytical thinker", "team player"],
        "base_salary": (850000, 2600000),
        "growth": ["Intern", "Junior ML Engineer", "ML Engineer", "Senior ML Engineer", "ML Architect"],
        "demand": "Very High", "difficulty": "High", "trend": "Growing",
    },
    "Software Engineer": {
        "skills": ["python", "java", "c++", "javascript"],
        "interests": ["software development", "full stack development"],
        "personality": ["problem solver", "team player", "creative thinker"],
        "base_salary": (600000, 2000000),
        "growth": ["Intern", "SDE 1", "SDE 2", "Senior SDE", "Staff Engineer"],
        "demand": "High", "difficulty": "Medium", "trend": "Stable",
    },
    "Full Stack Developer": {
        "skills": ["javascript", "typescript", "react", "node.js", "sql"],
        "interests": ["full stack development", "frontend development", "web development"],
        "personality": ["problem solver", "creative thinker", "adaptability"],
        "base_salary": (550000, 1900000),
        "growth": ["Intern", "Junior Full Stack Dev", "Full Stack Developer", "Senior Full Stack Developer", "Tech Lead"],
        "demand": "Very High", "difficulty": "Medium", "trend": "Growing",
    },
    "Frontend Developer": {
        "skills": ["javascript", "typescript", "react", "html/css"],
        "interests": ["frontend development", "design", "web development"],
        "personality": ["creative thinker", "detail-oriented", "team player"],
        "base_salary": (500000, 1700000),
        "growth": ["Intern", "Junior Frontend Dev", "Frontend Developer", "Senior Frontend Developer", "UI Architect"],
        "demand": "High", "difficulty": "Medium", "trend": "Stable",
    },
    "Data Analyst": {
        "skills": ["python", "sql", "data science", "communication"],
        "interests": ["data science", "finance"],
        "personality": ["analytical thinker", "detail-oriented", "team player"],
        "base_salary": (450000, 1200000),
        "growth": ["Intern", "Junior Analyst", "Data Analyst", "Senior Analyst", "Analytics Manager"],
        "demand": "High", "difficulty": "Medium", "trend": "Stable",
    },
    "Cloud Engineer": {
        "skills": ["cloud computing", "python", "devops"],
        "interests": ["cloud computing", "devops", "software development"],
        "personality": ["problem solver", "analytical thinker", "adaptability"],
        "base_salary": (700000, 2200000),
        "growth": ["Intern", "Cloud Support Engineer", "Cloud Engineer", "Senior Cloud Engineer", "Cloud Architect"],
        "demand": "High", "difficulty": "Medium", "trend": "Growing",
    },
    "DevOps Engineer": {
        "skills": ["cloud computing", "devops", "python", "sql"],
        "interests": ["devops", "cloud computing", "software development"],
        "personality": ["problem solver", "adaptability", "detail-oriented"],
        "base_salary": (700000, 2300000),
        "growth": ["Intern", "Support Engineer", "DevOps Engineer", "Senior DevOps Engineer", "Platform Architect"],
        "demand": "Very High", "difficulty": "Medium", "trend": "Growing",
    },
    "Cybersecurity Analyst": {
        "skills": ["cloud computing", "python", "communication"],
        "interests": ["cybersecurity"],
        "personality": ["analytical thinker", "problem solver", "detail-oriented"],
        "base_salary": (600000, 1900000),
        "growth": ["Intern", "SOC Analyst", "Security Analyst", "Senior Security Engineer", "CISO"],
        "demand": "Very High", "difficulty": "High", "trend": "Emerging",
    },
    "Mobile App Developer": {
        "skills": ["java", "javascript", "typescript"],
        "interests": ["mobile development", "software development"],
        "personality": ["creative thinker", "problem solver", "detail-oriented"],
        "base_salary": (500000, 1800000),
        "growth": ["Intern", "Junior Mobile Dev", "Mobile App Developer", "Senior Mobile Developer", "Mobile Architect"],
        "demand": "High", "difficulty": "Medium", "trend": "Stable",
    },
    "Game Developer": {
        "skills": ["c++", "c", "python"],
        "interests": ["game development", "design", "software development"],
        "personality": ["creative thinker", "problem solver", "adaptability"],
        "base_salary": (450000, 1600000),
        "growth": ["Intern", "Junior Game Dev", "Game Developer", "Senior Game Developer", "Lead Game Developer"],
        "demand": "Medium", "difficulty": "High", "trend": "Stable",
    },
    "Blockchain Developer": {
        "skills": ["rust", "go", "javascript", "python"],
        "interests": ["blockchain", "software development"],
        "personality": ["problem solver", "analytical thinker", "research-oriented"],
        "base_salary": (700000, 2400000),
        "growth": ["Intern", "Junior Blockchain Dev", "Blockchain Developer", "Senior Blockchain Developer", "Protocol Architect"],
        "demand": "Medium", "difficulty": "High", "trend": "Emerging",
    },
    "Product Manager": {
        "skills": ["communication", "leadership", "sql"],
        "interests": ["product management", "design", "software development"],
        "personality": ["leader", "creative thinker", "team player"],
        "base_salary": (900000, 3000000),
        "growth": ["Intern", "APM", "Product Manager", "Senior PM", "Director of Product"],
        "demand": "Medium", "difficulty": "High", "trend": "Stable",
    },
}

ROADMAP_STEPS = {
    "AI Engineer": ["Python", "NumPy + Pandas", "Machine Learning", "Deep Learning", "Generative AI",
                    "MLOps & Cloud", "Portfolio Projects", "Internship", "AI Engineer"],
    "Data Scientist": ["Python", "Statistics", "SQL", "Pandas + Visualization", "Machine Learning",
                        "A/B Testing", "Portfolio Projects", "Internship", "Data Scientist"],
    "ML Engineer": ["Python", "Data Structures", "Machine Learning", "Deep Learning", "Model Deployment",
                     "Cloud (AWS/GCP)", "Portfolio Projects", "Internship", "ML Engineer"],
    "Software Engineer": ["Programming Fundamentals", "Data Structures & Algorithms", "Git & Version Control",
                           "Web Development", "Databases", "System Design", "Projects", "Internship", "SDE"],
    "Full Stack Developer": ["HTML/CSS/JS", "Frontend Framework (React)", "Node.js + APIs", "Databases (SQL/NoSQL)",
                              "Authentication & Deployment", "System Design Basics", "Projects", "Internship", "Full Stack Developer"],
    "Frontend Developer": ["HTML/CSS", "JavaScript", "TypeScript", "React", "Responsive & Accessible UI",
                            "Performance & Testing", "Projects", "Internship", "Frontend Developer"],
    "Data Analyst": ["Excel", "SQL", "Python", "Statistics", "Data Visualization",
                      "Business Acumen", "Projects", "Internship", "Data Analyst"],
    "Cloud Engineer": ["Linux Fundamentals", "Networking", "Python", "AWS/Azure/GCP", "Docker & Kubernetes",
                        "CI/CD", "Projects", "Certification", "Cloud Engineer"],
    "DevOps Engineer": ["Linux & Shell Scripting", "Networking", "Git & CI/CD", "Docker & Kubernetes",
                         "Infrastructure as Code", "Cloud Platform (AWS/Azure/GCP)", "Projects", "Certification", "DevOps Engineer"],
    "Cybersecurity Analyst": ["Networking", "Linux", "Security Fundamentals", "Ethical Hacking",
                               "SIEM Tools", "Cloud Security", "Certifications (CEH/Security+)", "Internship", "Security Analyst"],
    "Mobile App Developer": ["Programming Fundamentals", "Mobile UI Basics", "Android/iOS Framework", "APIs & Local Storage",
                              "State Management", "App Store Deployment", "Projects", "Internship", "Mobile App Developer"],
    "Game Developer": ["Programming Fundamentals", "C++", "Game Engine (Unity/Unreal)", "Physics & Graphics",
                        "Game Design Principles", "Multiplayer/Networking Basics", "Projects", "Internship", "Game Developer"],
    "Blockchain Developer": ["Programming Fundamentals", "Blockchain Basics", "Smart Contracts", "Rust or Solidity",
                              "Consensus Mechanisms", "Security Auditing Basics", "Projects", "Internship", "Blockchain Developer"],
    "Product Manager": ["Product Fundamentals", "User Research", "Analytics & SQL", "Wireframing",
                         "Agile & Roadmapping", "Communication", "Case Studies", "Internship", "APM"],
}

SKILL_KEYS = [
    "python", "java", "c", "c++", "javascript", "typescript", "rust", "go", "ruby", "php",
    "sql", "html/css", "react", "node.js", "ai", "data science", "cloud computing", "devops",
    "communication", "leadership",
]


def normalize_list(items):
    return [str(i).strip().lower() for i in (items or []) if str(i).strip()]


def score_career(profile, career_name, career):
    """Transparent weighted-match scoring: skills 45%, interests 25%,
    personality 20%, academics 10%. Returns (score, reasons)."""
    skills = normalize_list(profile.get("skills"))
    interests = normalize_list(profile.get("interests"))
    personality = normalize_list(profile.get("personality"))
    cgpa = float(profile.get("cgpa") or 0)

    def overlap(a, b):
        if not b:
            return 0
        hit = len(set(a) & set(b))
        return hit / len(b)

    skill_score = overlap(skills, career["skills"])
    interest_score = overlap(interests, career["interests"])
    personality_score = overlap(personality, career["personality"])
    academic_score = min(cgpa / 10, 1.0) if cgpa else 0.6  # neutral default

    total = (skill_score * 0.45 + interest_score * 0.25 +
             personality_score * 0.20 + academic_score * 0.10)
    match_pct = round(total * 100)
    match_pct = max(35, min(match_pct, 98))  # keep it human/realistic

    matched_skills = sorted(set(skills) & set(career["skills"]))
    matched_interests = sorted(set(interests) & set(career["interests"]))
    matched_traits = sorted(set(personality) & set(career["personality"]))

    reasons = []
    if matched_skills:
        reasons.append(f"you already have {', '.join(matched_skills)}")
    if matched_interests:
        reasons.append(f"a stated interest in {', '.join(matched_interests)}")
    if matched_traits:
        reasons.append(f"a {', '.join(matched_traits)} personality profile")
    if cgpa >= 7.5:
        reasons.append("strong academic performance")

    explanation = (
        f"You received this recommendation because {', '.join(reasons)}."
        if reasons else
        "This is a general-interest match based on the limited profile data provided — "
        "add more skills and interests for a sharper recommendation."
    )

    missing_skills = sorted(set(career["skills"]) - set(skills))
    return match_pct, explanation, missing_skills


# ---------------------------------------------------------------------------
# Routes — pages
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Routes — deterministic engine (no API key required)
# ---------------------------------------------------------------------------

@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    profile = request.json or {}
    results = []
    for name, career in CAREERS.items():
        pct, explanation, missing = score_career(profile, name, career)
        results.append({
            "career": name, "match": pct, "explanation": explanation,
            "missing_skills": missing, "demand": career["demand"],
            "difficulty": career["difficulty"], "trend": career["trend"],
        })
    results.sort(key=lambda r: r["match"], reverse=True)
    return jsonify({"recommendations": results})


@app.route("/api/roadmap", methods=["POST"])
def api_roadmap():
    data = request.json or {}
    career = data.get("career", "AI Engineer")
    duration = data.get("duration", "6-month")
    steps = ROADMAP_STEPS.get(career, ROADMAP_STEPS["AI Engineer"])
    return jsonify({"career": career, "duration": duration, "steps": steps})


@app.route("/api/skill-gap", methods=["POST"])
def api_skill_gap():
    data = request.json or {}
    profile = data.get("profile", {})
    career_name = data.get("career", "AI Engineer")
    career = CAREERS.get(career_name, CAREERS["AI Engineer"])
    pct, explanation, missing = score_career(profile, career_name, career)
    have = sorted(set(normalize_list(profile.get("skills"))) & set(career["skills"]))
    return jsonify({
        "career": career_name, "match": pct,
        "have": have, "missing": missing,
    })


@app.route("/api/salary", methods=["POST"])
def api_salary():
    data = request.json or {}
    career_name = data.get("career", "AI Engineer")
    experience = float(data.get("experience", 0) or 0)
    career = CAREERS.get(career_name, CAREERS["AI Engineer"])
    lo, hi = career["base_salary"]
    growth_factor = 1 + min(experience, 12) * 0.14
    est_lo = round(lo * growth_factor)
    est_hi = round(hi * growth_factor)
    return jsonify({
        "career": career_name, "experience": experience,
        "estimate_low_inr": est_lo, "estimate_high_inr": est_hi,
        "growth_path": career["growth"],
    })


@app.route("/api/compare", methods=["GET"])
def api_compare():
    rows = [{
        "career": name, "difficulty": c["difficulty"],
        "demand": c["demand"], "trend": c["trend"],
        "salary_low": c["base_salary"][0], "salary_high": c["base_salary"][1],
    } for name, c in CAREERS.items()]
    return jsonify({"careers": rows})


@app.route("/api/whatif", methods=["POST"])
def api_whatif():
    """Recompute a career match after hypothetically adding skills/projects."""
    data = request.json or {}
    profile = dict(data.get("profile", {}))
    career_name = data.get("career", "AI Engineer")
    add_skills = normalize_list(data.get("add_skills"))
    add_projects = int(data.get("add_projects", 0) or 0)

    career = CAREERS.get(career_name, CAREERS["AI Engineer"])
    baseline, _, _ = score_career(profile, career_name, career)

    profile["skills"] = list(set(normalize_list(profile.get("skills")) + add_skills))
    boosted, _, _ = score_career(profile, career_name, career)
    boosted = min(98, boosted + add_projects * 3)  # small project bonus

    return jsonify({"career": career_name, "baseline_match": baseline, "projected_match": boosted})


@app.route("/api/radar", methods=["GET"])
def api_radar():
    return jsonify({
        "high_demand": ["Generative AI", "AI Agents", "Cloud Security"],
        "growing": ["AI Engineering", "MLOps", "Cybersecurity"],
        "competitive": ["Data Science", "Product Management"],
        "emerging": ["AI Agents", "Quantum Computing Basics", "Edge AI"],
    })


@app.route("/api/job-match", methods=["POST"])
def api_job_match():
    """Keyword-based matching between profile skills and a pasted job description."""
    data = request.json or {}
    profile = data.get("profile", {})
    jd_text = (data.get("job_description") or "").lower()
    skills = normalize_list(profile.get("skills"))

    known_skill_terms = SKILL_KEYS + [
        "tensorflow", "pytorch", "aws", "azure", "gcp", "docker", "kubernetes",
        "nlp", "computer vision", "django", "flask", "excel", "swift", "kotlin",
        "power bi", "tableau", "git", "linux", "deep learning", "generative ai", "llm", "mlops",
        "solidity", "unity", "unreal engine",
    ]
    # Word-boundary matching — plain substring checks would let short terms like
    # "c" or "go" false-positive inside unrelated words ("experience", "google").
    def term_in_text(term, text):
        pattern = r"(?<![a-z0-9])" + re.escape(term) + r"(?![a-z0-9])"
        return re.search(pattern, text) is not None

    required = sorted({t for t in known_skill_terms if term_in_text(t, jd_text)})
    matched = sorted(set(required) & set(skills))
    missing = sorted(set(required) - set(skills))
    match_pct = round(100 * len(matched) / len(required)) if required else 50
    return jsonify({
        "required_skills": required, "matched": matched, "missing": missing,
        "match_percent": match_pct,
    })


@app.route("/api/portfolio-strength", methods=["POST"])
def api_portfolio_strength():
    data = request.json or {}
    num_projects = int(data.get("num_projects", 0) or 0)
    num_skills = int(data.get("num_skills", 0) or 0)
    has_internship = bool(data.get("has_internship"))
    score = min(100, num_projects * 12 + num_skills * 4 + (15 if has_internship else 0))
    tip = "Add one Generative AI or end-to-end deployed project to strengthen your profile." \
        if num_projects < 4 else "Solid portfolio — focus on polishing your top 2 projects for interviews."
    return jsonify({"score": score, "tip": tip})


# ---------------------------------------------------------------------------
# Routes — Groq-backed generative features (require GROQ_API_KEY)
# ---------------------------------------------------------------------------

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.json or {}
    message = data.get("message", "")
    profile = data.get("profile", {})
    history = data.get("history", [])  # list of {role, content}

    system = (
        "You are an expert, encouraging AI career mentor inside a student career-guidance "
        "platform. Give specific, actionable advice tailored to the student's profile below. "
        "Keep answers focused and practical (roughly 80-180 words unless asked for more detail). "
        f"\n\nStudent profile: {json.dumps(profile)}"
    )
    convo = "\n".join(f"{h.get('role','user')}: {h.get('content','')}" for h in history[-6:])
    prompt = f"{convo}\nstudent: {message}" if convo else message

    try:
        reply = ask_groq(system, prompt, max_tokens=600)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/interview/question", methods=["POST"])
def api_interview_question():
    data = request.json or {}
    mode = data.get("mode", "Technical")
    career = data.get("career", "AI Engineer")
    profile = data.get("profile", {})
    asked = data.get("asked", [])

    system = (
        f"You are conducting a {mode} mock interview for the role of {career}. "
        "Ask exactly one interview question appropriate to the candidate's profile and level. "
        "Do not answer it yourself. Do not repeat any previously asked question."
    )
    prompt = f"Candidate profile: {json.dumps(profile)}\nAlready asked: {asked}\nAsk the next question now."
    try:
        question = ask_groq(system, prompt, max_tokens=200)
        return jsonify({"question": question})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/interview/feedback", methods=["POST"])
def api_interview_feedback():
    data = request.json or {}
    qa_pairs = data.get("qa_pairs", [])
    career = data.get("career", "AI Engineer")

    system = (
        f"You are an interview coach scoring a completed mock interview for a {career} role. "
        "Score 0-100 on: technical_knowledge, communication, confidence, problem_solving. "
        "Also give an overall_score (0-100) and 2-3 sentences of constructive feedback."
    )
    prompt = "Transcript:\n" + "\n".join(
        f"Q: {qa.get('question','')}\nA: {qa.get('answer','')}" for qa in qa_pairs
    )
    schema_hint = (
        '{"technical_knowledge": 0, "communication": 0, "confidence": 0, '
        '"problem_solving": 0, "overall_score": 0, "feedback": ""}'
    )
    try:
        result = ask_groq_json(system, prompt + f"\n\nJSON shape: {schema_hint}")
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz", methods=["POST"])
def api_quiz():
    data = request.json or {}
    topic = data.get("topic", "Python")
    level = data.get("level", "Beginner")
    count = int(data.get("count", 5))

    system = (
        "You generate multiple-choice skill-assessment quizzes for students. "
        "Each question has exactly 4 options and one correct answer index (0-3)."
    )
    prompt = (
        f"Generate {count} {level}-level multiple choice questions about {topic}. "
        'JSON shape: {"questions": [{"question": "", "options": ["","","",""], '
        '"correct_index": 0, "explanation": ""}]}'
    )
    try:
        result = ask_groq_json(system, prompt, max_tokens=1500)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/resume-review", methods=["POST"])
def api_resume_review():
    data = request.json or {}
    resume_text = data.get("resume_text", "")
    target_career = data.get("career", "")

    system = (
        "You are an ATS-aware resume reviewer for students/early-career candidates. "
        "Score 0-100 on: skills, projects, experience, ats_score, and an overall resume_score. "
        "Give 3 short, specific improvement_tips."
    )
    prompt = (
        f"Target career: {target_career or 'general'}\nResume text:\n{resume_text}\n\n"
        'JSON shape: {"resume_score": 0, "skills": 0, "projects": 0, "experience": 0, '
        '"ats_score": 0, "improvement_tips": ["", "", ""]}'
    )
    try:
        result = ask_groq_json(system, prompt, max_tokens=900)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/project-idea", methods=["POST"])
def api_project_idea():
    data = request.json or {}
    profile = data.get("profile", {})

    system = "You generate one tailored student project idea based on a skills/interests profile."
    prompt = (
        f"Profile: {json.dumps(profile)}\n"
        'JSON shape: {"title": "", "difficulty": "", "technologies": [], "dataset": "", '
        '"features": [], "roadmap": [], "expected_outcome": ""}'
    )
    try:
        result = ask_groq_json(system, prompt, max_tokens=800)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/project-to-career", methods=["POST"])
def api_project_to_career():
    data = request.json or {}
    project_text = data.get("project", "")

    system = (
        "Given a short project description, estimate how strongly it supports each of these "
        "careers, as a percentage 0-100: Data Scientist, ML Engineer, Data Analyst, AI Engineer."
    )
    prompt = (
        f"Project: {project_text}\n"
        'JSON shape: {"Data Scientist": 0, "ML Engineer": 0, "Data Analyst": 0, "AI Engineer": 0}'
    )
    try:
        result = ask_groq_json(system, prompt, max_tokens=300)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "time": datetime.utcnow().isoformat(),
        "ai_configured": bool(GROQ_API_KEY),
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
