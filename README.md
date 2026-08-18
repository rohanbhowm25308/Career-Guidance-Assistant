#  Career Guidance Assistant

> **An AI-powered career intelligence platform that helps students discover the right career, understand their skill gaps, build a personalized roadmap, and take the next best step toward their future.**

 **Live Demo:** https://career-guidance-assistant.onrender.com/
 **GitHub:** https://github.com/rohanbhowm25308/Career-Guidance-Assistant

---

##  About The Project

Choosing a career can be difficult when students don't know which career matches their skills, interests, personality, education, and goals.

**Career Guidance Assistant** is designed to solve this problem by providing an intelligent, personalized career guidance experience.

Instead of giving generic career advice, the platform analyzes a student's profile and provides:

*  Personalized career recommendations
*  AI-powered career mentoring
*  Career compatibility scoring
*  Skill-gap analysis
*  Personalized learning roadmaps
*  What-If career simulation
*  Career Digital Twin
*  Job description analysis
*  AI mock interviews
*  AI resume analysis
*  Adaptive skill quizzes
*  AI project recommendations
*  Portfolio strength analysis
*  Salary and career-growth estimation
*  Gamified career progress tracking

The goal is simple:

> **Understand where you are → Discover where you can go → Identify what you're missing → Build the roadmap → Take your next best action.**

---

## ✨ Key Features

###  Smart Student Profile

Create a personalized career profile using:

* Education
* Degree / Branch
* Semester / Year
* CGPA
* Technical skills
* Interests
* Career personality
* Career goals
* Projects
* Internship experience

---

###  AI Career Recommendation Engine

The career engine analyzes:

**Skills + Interests + Education + Personality + Academic Performance + Goals**

and generates ranked career recommendations with compatibility scores.

Example:

```text
AI Engineer          92%
Machine Learning     89%
Data Scientist       86%
Software Engineer    78%
```

---

###  Career Digital Twin

Create a live snapshot of your career readiness.

The Digital Twin tracks:

* Career readiness
* Portfolio strength
* XP
* Learning progress
* Achievements
* Career match
* Skill development

It gives students a continuously updated picture of their professional growth.

---

###  "What If?" Career Simulator

One of the project's unique features.

Students can simulate possible career improvements.

For example:

```text
Current AI Engineer Match
          ↓
         78%

+ Learn AI / ML
          ↓
         84%

+ Build 3 Projects
          ↓
         89%

+ Improve Communication
          ↓
         92%
```

This helps students understand how different actions can influence their career readiness.

---

###  Skill Gap Analysis

Compare your current skills with the skills required for your target career.

```text
Python              ✅ Strong
SQL                 ⚠ Improve
Machine Learning    ⚠ Improve
Deep Learning       ❌ Missing
Cloud Computing     ❌ Missing
```

The system highlights what you should learn next.

---

###  Personalized Learning Roadmap

Generate a step-by-step roadmap based on:

* Target career
* Current skills
* Skill gaps
* Desired duration
* Learning progress

Students can mark roadmap milestones as completed.

---

###  AI Career Path Generator

Not sure which career path to choose?

Describe your interests and the system generates possible career directions.

Example:

```text
AI
│
├── AI Engineer
│
├── Machine Learning Engineer
│
├── Data Scientist
│
├── Generative AI Engineer
│
└── AI Research
```

---

###  AI Goal Tracker

Set a career goal and break it into actionable milestones.

Example:

```text
Goal: Become an AI Engineer

☑ Learn Python
☑ Learn SQL
☑ Learn Machine Learning
⬜ Learn Deep Learning
⬜ Build AI Projects
⬜ Prepare Resume
⬜ Apply for Internships
```

---

###  Job Description Analyzer

Paste a real job description and analyze:

* Job compatibility
* Required skills
* Missing skills
* Profile match
* Career preparation needs

This helps students understand whether they are ready to apply.

---

###  Salary & Career Growth Estimator

Estimate career salary ranges based on:

* Career role
* Experience
* Student profile

Also provides a career-growth comparison between different career paths.

> **Note:** Salary figures are illustrative estimates and should not be treated as official market salary data.

---

###  Career Opportunity Radar

Explore career areas and understand where different technologies and roles are heading.

This gives students a broader view of career opportunities instead of focusing on only one role.

---

#  AI Career Mentor

A context-aware AI chatbot that acts as a personal career mentor.

Students can ask questions such as:

```text
"Should I learn Python or Java?"

"How can I become an AI Engineer?"

"What skills do I need for a Data Scientist role?"

"Which career is best suited to my profile?"
```

The mentor can use the student's saved profile to provide more personalized guidance.

---

#  AI Mock Interview

Practice interviews before facing real recruiters.

Available interview modes include:

* Technical
* HR
* Behavioral

The system provides AI-generated questions and evaluates the student's responses.

It can help improve:

* Technical knowledge
* Communication
* Answer quality
* Interview confidence

---

#  AI-Generated Skill Quiz

Generate adaptive quizzes based on:

* Topic
* Difficulty level
* Number of questions

The quiz can adjust to different skill levels and help students identify knowledge gaps.

---

#  AI Resume Assistant

Paste your resume and receive an AI-powered review.

The system provides a resume score and ATS-style feedback to help improve the resume.

---

#  AI Project Generator

Don't know what project to build?

The AI can generate project ideas based on the student's:

* Skills
* Interests
* Career target
* Experience level

This helps students build projects that are relevant to their desired career.

---

#  Project → Career Analyzer

A unique feature that connects projects with career opportunities.

For example:

```text
Project:
Customer Segmentation using Machine Learning

Career Compatibility:

Data Scientist          94%
Data Analyst            88%
ML Engineer             82%
AI Engineer             76%
```

This helps students understand how their projects contribute to their career profile.

---

#  Portfolio Strength Analyzer

Analyze the student's current portfolio based on their profile and project experience.

The system helps identify whether the portfolio is strong enough for the student's target career.

---

#  Gamified Career Growth

Career development becomes more engaging through:

* XP
* Levels
* Streaks
* Achievements
* Badges
* Progress tracking

Example:

 Python Explorer
 7-Day Learning Streak
 AI Explorer
 Interview Ready

---

#  Voice Input

The Career Chatbot and Mock Interview support browser-based voice input using the **Web Speech API**.

Users can speak instead of typing when supported by their browser.

---

#  Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Canvas API
* Web Speech API

### Backend

* Python
* Flask
* REST API
* Requests

### AI

* Groq API
* Generative AI
* AI-powered career mentoring
* AI interview generation
* AI quiz generation
* AI resume analysis
* AI project generation

### Career Intelligence

* Rule-based career matching
* Skill-gap analysis
* Career scoring
* Roadmap generation
* Career simulation
* Portfolio analysis
* Gamification

### Deployment

* GitHub
* Render

---

# ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/rohanbhowm25308/Career-Guidance-Assistant.git
```

### 2. Navigate into the project

```bash
cd Career-Guidance-Assistant
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create environment file

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

### 5. Run the application

```bash
python app.py
```

Open:

```text
http://localhost:5000
```

---

#  Environment Variables

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| `GROQ_API_KEY` | API key used for generative AI features |
| `GROQ_MODEL`   | Groq model used by the application      |

**Never commit your real API key to GitHub.**

Use `.env.example` as the template for your environment configuration.

---

#  Deployment

The application is deployed using **Render**.

### Live Application

🌐 https://career-guidance-assistant.onrender.com/

### Source Code

💻 https://github.com/rohanbhowm25308/Career-Guidance-Assistant

---

#  Privacy & Data

The current version stores profile, goal, roadmap, and gamification information in the browser using `localStorage`.

There is no database in the current build.

API credentials should always be stored in environment variables and should never be exposed in frontend code or committed to GitHub.

---

#  Future Enhancements

Planned improvements can include:

*  Real-time internship discovery
*  Live job recommendations
*  Personalized course recommendations
*  Real-time career trend analytics
*  Advanced ML-based career prediction
*  Cloud database integration
*  User authentication
*  Multi-user profiles
*  Mobile application
*  Recruiter dashboard
*  Advanced career analytics
*  AI career accountability agent

---

#  Developed By

**Rohan Bhowmik**

*Aspiring AI/ML • Data Science • Web Development*

Built with passion for **Artificial Intelligence, Machine Learning, Data Science, and innovative technology.**

---

## ⭐ Support the Project

If you like this project, found it useful, or think it can help students discover better career paths:

### ⭐ Give this repository a star!

Your support motivates me to continue improving and building innovative AI-powered projects.

**Thank you for visiting Career Guidance Assistant! 🚀**
