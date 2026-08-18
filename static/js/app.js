/* ==========================================================================
   Core app shell: navigation, shared state, profile, gamification,
   digital twin, goal tracker, opportunity radar.
   ========================================================================== */

const Store = {
  key: 'aether_profile_v1',
  gkey: 'aether_gamify_v1',
  goalsKey: 'aether_goals_v1',
  roadmapKey: 'aether_roadmap_v1',

  getProfile() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch { return {}; }
  },
  saveProfile(p) { localStorage.setItem(this.key, JSON.stringify(p)); },

  getGamify() {
    try { return JSON.parse(localStorage.getItem(this.gkey)) || { xp: 0, level: 1, streak: 0, badges: [], lastVisit: null }; }
    catch { return { xp: 0, level: 1, streak: 0, badges: [], lastVisit: null }; }
  },
  saveGamify(g) { localStorage.setItem(this.gkey, JSON.stringify(g)); },

  getGoals() { try { return JSON.parse(localStorage.getItem(this.goalsKey)) || []; } catch { return []; } },
  saveGoals(g) { localStorage.setItem(this.goalsKey, JSON.stringify(g)); },

  getRoadmap() { try { return JSON.parse(localStorage.getItem(this.roadmapKey)) || null; } catch { return null; } },
  saveRoadmap(r) { localStorage.setItem(this.roadmapKey, JSON.stringify(r)); },
};

const CAREER_NAMES = [
  "AI Engineer", "Data Scientist", "ML Engineer", "Software Engineer",
  "Full Stack Developer", "Frontend Developer", "Data Analyst", "Cloud Engineer",
  "DevOps Engineer", "Cybersecurity Analyst", "Mobile App Developer",
  "Game Developer", "Blockchain Developer", "Product Manager",
];

function populateCareerSelects() {
  const selects = ['compare-career-select', 'whatif-career', 'roadmap-career',
    'skillgap-career', 'salary-career', 'interview-career'];
  selects.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = CAREER_NAMES.map((c) => `<option value="${c}">${c}</option>`).join('');
  });
}

/* ---------------------------- navigation ---------------------------- */

const TITLES = {
  dashboard: ['Career Digital Twin', 'A live snapshot of your career readiness'],
  profile: ['Smart Student Profile', 'Everything Aether uses to personalize your guidance'],
  recommend: ['AI Career Recommendation Engine', 'Ranked, explainable career matches'],
  'compare-me': ['You vs Career', 'Your profile against the ideal profile'],
  whatif: ['"What If?" Career Simulator', 'Model hypothetical skill and project growth'],
  pathgen: ['AI Career Path Generator', 'Explore branching paths from one interest'],
  roadmap: ['Personalized Learning Roadmap', 'Your step-by-step path forward'],
  skillgap: ['Skill Gap Analysis', 'What separates you from your target career'],
  goals: ['AI Goal Tracker', 'Milestones for your stated career goal'],
  jobmatch: ['Job Description Analyzer', 'Match your profile against a real listing'],
  salary: ['Salary Estimator & Career Growth', 'Expected ranges and growth trajectory'],
  radar: ['Career Opportunity Radar', 'Where the market is heading'],
  chat: ['24/7 AI Career Chatbot', 'Context-aware mentorship'],
  interview: ['AI Mock Interview', 'Practice and get scored'],
  quiz: ['AI-Generated Skill Quiz', 'Adaptive difficulty assessments'],
  resume: ['AI Resume Assistant', 'Instant review and ATS-style score'],
  projects: ['Project Generator', 'Ideas tailored to your profile'],
  portfolio: ['Portfolio Strength Analyzer', 'How strong is your project portfolio?'],
};

function showPanel(name) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`panel-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
  const t = TITLES[name];
  if (t) {
    document.getElementById('topbar-title').textContent = t[0];
    document.getElementById('topbar-sub').textContent = t[1];
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'dashboard') renderDigitalTwin();
  if (name === 'radar') renderRadar();
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

/* ---------------------------- profile form ---------------------------- */

function wireChipGroup(containerId, selectedValues) {
  const el = document.getElementById(containerId);
  if (!el) return;
  [...el.children].forEach((chip) => {
    if (selectedValues.includes(chip.dataset.val)) chip.classList.add('selected');
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
  });
}

function getChipValues(containerId) {
  const el = document.getElementById(containerId);
  return [...el.children].filter((c) => c.classList.contains('selected')).map((c) => c.dataset.val);
}

function loadProfileIntoForm() {
  const p = Store.getProfile();
  document.getElementById('p-name').value = p.name || '';
  document.getElementById('p-age').value = p.age || '';
  document.getElementById('p-education').value = p.education || 'Undergraduate';
  document.getElementById('p-degree').value = p.degree || '';
  document.getElementById('p-year').value = p.year || '';
  document.getElementById('p-cgpa').value = p.cgpa || '';
  document.getElementById('p-goals').value = p.goals || '';
  document.getElementById('p-projects').value = p.num_projects || 0;
  document.getElementById('p-internship').value = p.has_internship ? 'yes' : 'no';

  wireChipGroup('chip-skills', p.skills || []);
  wireChipGroup('chip-interests', p.interests || []);
  wireChipGroup('chip-personality', p.personality || []);
}

function collectProfileFromForm() {
  return {
    name: document.getElementById('p-name').value.trim(),
    age: document.getElementById('p-age').value,
    education: document.getElementById('p-education').value,
    degree: document.getElementById('p-degree').value.trim(),
    year: document.getElementById('p-year').value.trim(),
    cgpa: document.getElementById('p-cgpa').value,
    goals: document.getElementById('p-goals').value.trim(),
    num_projects: parseInt(document.getElementById('p-projects').value || '0', 10),
    has_internship: document.getElementById('p-internship').value === 'yes',
    skills: getChipValues('chip-skills'),
    interests: getChipValues('chip-interests'),
    personality: getChipValues('chip-personality'),
  };
}

document.getElementById('save-profile-btn').addEventListener('click', () => {
  const profile = collectProfileFromForm();
  Store.saveProfile(profile);
  addXP(15, 'profile_saved');
  const msg = document.getElementById('profile-saved-msg');
  msg.textContent = '✓ Saved';
  setTimeout(() => (msg.textContent = ''), 2500);
  renderDigitalTwin();
  renderNextBestAction();
});

/* ---------------------------- gamification ---------------------------- */

function addXP(amount, badgeKey) {
  const g = Store.getGamify();
  const today = new Date().toDateString();
  if (g.lastVisit !== today) {
    g.streak = g.lastVisit === new Date(Date.now() - 86400000).toDateString() ? g.streak + 1 : 1;
    g.lastVisit = today;
  }
  g.xp += amount;
  g.level = Math.max(1, Math.floor(g.xp / 100) + 1);
  if (badgeKey && !g.badges.includes(badgeKey)) g.badges.push(badgeKey);
  Store.saveGamify(g);
  renderGamifyBar();
}

const BADGES = [
  { key: 'profile_saved', emoji: '🧑‍🎓', label: 'Profile Set' },
  { key: 'recommend_run', emoji: '✦', label: 'Explorer' },
  { key: 'roadmap_built', emoji: '↝', label: 'Planner' },
  { key: 'interview_done', emoji: '🎤', label: 'Interview Ready' },
  { key: 'quiz_done', emoji: '✓', label: 'Quiz Master' },
  { key: 'streak_7', emoji: '🔥', label: '7-Day Streak' },
];

function renderGamifyBar() {
  const g = Store.getGamify();
  document.getElementById('xp-val').textContent = g.xp;
  document.getElementById('level-val').textContent = g.level;
  document.getElementById('streak-val').textContent = g.streak;

  const grid = document.getElementById('badge-grid');
  if (grid) {
    grid.innerHTML = BADGES.map((b) => {
      const unlocked = g.badges.includes(b.key) || (b.key === 'streak_7' && g.streak >= 7);
      return `<div class="badge-tile ${unlocked ? 'unlocked' : ''}"><span class="emoji">${b.emoji}</span>${b.label}</div>`;
    }).join('');
  }
}

/* ---------------------------- next best action ---------------------------- */

function renderNextBestAction() {
  const p = Store.getProfile();
  const el = document.getElementById('next-action-text');
  if (!p.skills || p.skills.length === 0) {
    el.textContent = 'Fill in your Student Profile — it powers every other feature.';
    return;
  }
  if (!Store.getRoadmap()) {
    el.textContent = 'Build a Learning Roadmap for your top career match to get a concrete next step.';
    return;
  }
  if (Store.getGoals().length === 0) {
    el.textContent = 'Set a career goal in the Goal Tracker to break it into weekly milestones.';
    return;
  }
  el.textContent = 'Take a Mock Interview this week to check where you stand.';
}

/* ---------------------------- digital twin ---------------------------- */

async function renderDigitalTwin() {
  const p = Store.getProfile();
  const hasProfile = p.skills && p.skills.length > 0;

  document.getElementById('twin-portfolio').textContent = hasProfile
    ? Math.min(100, (p.num_projects || 0) * 12 + (p.skills.length * 4) + (p.has_internship ? 15 : 0))
    : '--';

  if (!hasProfile) {
    document.getElementById('twin-readiness').textContent = '--';
    document.getElementById('twin-top-career').textContent = '--';
    document.getElementById('twin-top-score').textContent = 'Complete your profile first';
    document.getElementById('twin-breakdown').innerHTML = '<div class="empty-state">No profile data yet.</div>';
    return;
  }

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    });
    const data = await res.json();
    const top = data.recommendations[0];

    const skillsScore = Math.min(100, p.skills.length * 15);
    const projectsScore = Math.min(100, (p.num_projects || 0) * 20);
    const readiness = Math.round((top.match * 0.5) + (skillsScore * 0.25) + (projectsScore * 0.25));

    document.getElementById('twin-readiness').textContent = readiness;
    document.getElementById('twin-top-career').textContent = top.career;
    document.getElementById('twin-top-score').textContent = `${top.match}% match`;

    const rows = [
      ['Career Match', top.match],
      ['Skills Breadth', skillsScore],
      ['Project Experience', projectsScore],
      ['Academic Standing', Math.min(100, Math.round((parseFloat(p.cgpa) || 6) / 10 * 100))],
    ];
    document.getElementById('twin-breakdown').innerHTML = rows.map(([label, val]) => meterRow(label, val)).join('');
  } catch (e) {
    document.getElementById('twin-breakdown').innerHTML = `<div class="empty-state">Could not load: ${e.message}</div>`;
  }
}

function meterRow(label, value, cls) {
  const barClass = cls || (value >= 70 ? '' : value >= 40 ? 'warn' : 'bad');
  return `<div class="meter-row">
    <div class="meter-label"><span>${label}</span><span>${value}%</span></div>
    <div class="meter-track"><div class="meter-fill ${barClass}" style="width:${value}%"></div></div>
  </div>`;
}

/* ---------------------------- goal tracker ---------------------------- */

const GOAL_TEMPLATES = {
  'ai engineer': ['Learn Python', 'Learn SQL', 'Learn Machine Learning', 'Learn Deep Learning', 'Build 3 Projects', 'Build Portfolio', 'Apply for Internships'],
  'data scientist': ['Learn Python', 'Learn Statistics', 'Learn SQL', 'Learn Machine Learning', 'Build 2 Projects', 'Build Portfolio', 'Apply for Internships'],
  default: ['Learn Core Fundamentals', 'Pick a Specialization', 'Build 2-3 Projects', 'Build a Portfolio / Resume', 'Practice Mock Interviews', 'Apply for Internships / Jobs'],
};

document.getElementById('add-goal-btn').addEventListener('click', () => {
  const text = document.getElementById('goal-text').value.trim();
  if (!text) return;
  const key = Object.keys(GOAL_TEMPLATES).find((k) => text.toLowerCase().includes(k)) || 'default';
  const milestones = GOAL_TEMPLATES[key].map((m) => ({ text: m, done: false }));
  const goals = Store.getGoals();
  goals.push({ goal: text, milestones, created: Date.now() });
  Store.saveGoals(goals);
  addXP(10);
  renderGoals();
  renderNextBestAction();
});

function renderGoals() {
  const goals = Store.getGoals();
  const el = document.getElementById('goal-list');
  if (!el) return;
  if (goals.length === 0) { el.innerHTML = '<div class="empty-state">Add a goal to generate milestones.</div>'; return; }

  el.innerHTML = goals.map((g, gi) => {
    const doneCount = g.milestones.filter((m) => m.done).length;
    const pct = Math.round((doneCount / g.milestones.length) * 100);
    return `<div style="margin-bottom:18px;">
      <div style="font-weight:800; font-size:14px; margin-bottom:6px;">🎯 ${g.goal}</div>
      ${meterRow('Progress', pct)}
      <div style="margin-top:8px;">
        ${g.milestones.map((m, mi) => `
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; padding:5px 0; color:${m.done ? 'var(--good)' : 'var(--text-mid)'}; cursor:pointer;">
            <input type="checkbox" data-gi="${gi}" data-mi="${mi}" class="goal-check" ${m.done ? 'checked' : ''}>
            <span style="${m.done ? 'text-decoration:line-through;' : ''}">${m.text}</span>
          </label>`).join('')}
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.goal-check').forEach((cb) => {
    cb.addEventListener('change', () => {
      const goals = Store.getGoals();
      goals[cb.dataset.gi].milestones[cb.dataset.mi].done = cb.checked;
      Store.saveGoals(goals);
      if (cb.checked) addXP(5);
      renderGoals();
    });
  });
}

/* ---------------------------- opportunity radar ---------------------------- */

async function renderRadar() {
  const grid = document.getElementById('radar-grid');
  if (grid.dataset.loaded) return;
  const res = await fetch('/api/radar');
  const data = await res.json();
  const sections = [
    ['🔥 High Demand', data.high_demand, 'bad'],
    ['📈 Growing', data.growing, 'good'],
    ['⚠️ Competitive', data.competitive, 'warn'],
    ['🚀 Emerging', data.emerging, ''],
  ];
  grid.innerHTML = sections.map(([title, items]) => `
    <div class="card">
      <h3>${title}</h3>
      ${items.map((i) => `<div class="badge" style="display:block; margin-bottom:8px;">${i}</div>`).join('')}
    </div>`).join('');
  grid.dataset.loaded = '1';
}

/* ---------------------------- init ---------------------------- */

populateCareerSelects();
loadProfileIntoForm();
renderGamifyBar();
renderNextBestAction();
renderGoals();
renderDigitalTwin();
