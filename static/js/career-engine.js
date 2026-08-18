/* ==========================================================================
   Career engine: recommendations, you-vs-career, what-if simulator,
   path generator, roadmap, skill gap, salary + comparison table.
   ========================================================================== */

async function postJSON(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

/* ---------------------------- recommendations ---------------------------- */

document.getElementById('run-recommend-btn').addEventListener('click', async () => {
  const listEl = document.getElementById('rec-list');
  const profile = Store.getProfile();
  if (!profile.skills || profile.skills.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Save your Student Profile first for a real match.</div>';
    return;
  }
  listEl.innerHTML = '<div class="empty-state loading-dots">Scoring your profile against career paths</div>';
  try {
    const data = await postJSON('/api/recommend', profile);
    listEl.innerHTML = data.recommendations.map((r, i) => `
      <div class="rec-card">
        <div class="rec-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
        <div class="rec-main">
          <div class="name">${r.career}</div>
          <div class="why">${r.explanation}</div>
        </div>
        <div class="rec-score">${r.match}%</div>
      </div>`).join('');
    addXP(20, 'recommend_run');
  } catch (e) {
    listEl.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- you vs career ---------------------------- */

document.getElementById('run-compare-btn').addEventListener('click', async () => {
  const out = document.getElementById('compare-output');
  const career = document.getElementById('compare-career-select').value;
  const profile = Store.getProfile();
  out.innerHTML = '<div class="empty-state loading-dots">Comparing</div>';
  try {
    const data = await postJSON('/api/skill-gap', { profile, career });
    const skillFields = [
      ['Skill Match', data.match],
      ['Skills You Have', Math.min(100, data.have.length * 20)],
      ['Skills Missing (inverse)', Math.max(0, 100 - data.missing.length * 20)],
    ];
    out.innerHTML = `
      <div class="grid cols-2">
        <div>
          <h3 style="margin-top:0;">Your Profile</h3>
          ${skillFields.map(([l, v]) => meterRow(l, v)).join('')}
        </div>
        <div>
          <h3 style="margin-top:0;">Target: ${career}</h3>
          <div style="font-size:12.5px; color:var(--text-mid); margin-bottom:8px;">Have: ${data.have.join(', ') || '—'}</div>
          <div style="font-size:12.5px; color:var(--bad);">Missing: ${data.missing.join(', ') || 'None — great fit!'}</div>
        </div>
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- what if simulator ---------------------------- */

document.querySelectorAll('#whatif-skills .chip').forEach((chip) => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});

document.getElementById('run-whatif-btn').addEventListener('click', async () => {
  const out = document.getElementById('whatif-output');
  const career = document.getElementById('whatif-career').value;
  const add_projects = parseInt(document.getElementById('whatif-projects').value || '0', 10);
  const add_skills = getChipValues('whatif-skills');
  const profile = Store.getProfile();
  out.innerHTML = '<div class="empty-state loading-dots">Simulating</div>';
  try {
    const data = await postJSON('/api/whatif', { profile, career, add_skills, add_projects });
    const delta = data.projected_match - data.baseline_match;
    out.innerHTML = `
      <div style="display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
        <div>
          <div style="color:var(--text-dim); font-size:12px;">CURRENT</div>
          <div style="font-family:var(--font-display); font-size:30px;">${data.baseline_match}%</div>
        </div>
        <div style="font-size:22px; color:var(--text-dim);">→</div>
        <div>
          <div style="color:var(--text-dim); font-size:12px;">PROJECTED</div>
          <div style="font-family:var(--font-display); font-size:30px; color:var(--cyan);">${data.projected_match}%</div>
        </div>
        <div class="badge good">+${delta}%</div>
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- path generator ---------------------------- */

const PATH_TREES = {
  ai: {
    root: 'AI',
    branches: [
      { name: 'AI Engineer', children: ['Generative AI', 'MLOps'] },
      { name: 'Data Scientist', children: ['Machine Learning', 'Analytics'] },
      { name: 'Research', children: ['PhD', 'Applied Research Labs'] },
    ],
  },
  data: {
    root: 'Data',
    branches: [
      { name: 'Data Analyst', children: ['BI Tools', 'SQL Specialist'] },
      { name: 'Data Scientist', children: ['Machine Learning', 'Statistics'] },
      { name: 'Data Engineer', children: ['Pipelines', 'Cloud Data Platforms'] },
    ],
  },
  software: {
    root: 'Software',
    branches: [
      { name: 'Frontend Engineer', children: ['Web Apps', 'Design Systems'] },
      { name: 'Backend Engineer', children: ['APIs', 'Distributed Systems'] },
      { name: 'Full-Stack Engineer', children: ['Startups', 'Product Teams'] },
    ],
  },
  security: {
    root: 'Cybersecurity',
    branches: [
      { name: 'SOC Analyst', children: ['Threat Detection', 'Incident Response'] },
      { name: 'Penetration Tester', children: ['Ethical Hacking', 'Red Team'] },
      { name: 'Cloud Security', children: ['DevSecOps', 'Compliance'] },
    ],
  },
};

document.getElementById('run-pathgen-btn').addEventListener('click', () => {
  const input = document.getElementById('pathgen-input').value.toLowerCase();
  const out = document.getElementById('pathgen-output');
  const key = Object.keys(PATH_TREES).find((k) => input.includes(k)) || 'ai';
  const tree = PATH_TREES[key];
  out.innerHTML = `
    <div style="text-align:center; margin-bottom:18px;">
      <div class="badge" style="font-size:14px; padding:8px 18px;">${tree.root}</div>
    </div>
    <div class="grid cols-3">
      ${tree.branches.map((b) => `
        <div class="card">
          <h3 style="text-align:center;">↓ ${b.name}</h3>
          ${b.children.map((c) => `<div class="badge" style="display:block; text-align:center; margin-top:8px;">${c}</div>`).join('')}
        </div>`).join('')}
    </div>`;
});

/* ---------------------------- roadmap ---------------------------- */

document.getElementById('run-roadmap-btn').addEventListener('click', async () => {
  const career = document.getElementById('roadmap-career').value;
  const duration = document.getElementById('roadmap-duration').value;
  const flow = document.getElementById('roadmap-flow');
  flow.innerHTML = '<div class="empty-state loading-dots">Building roadmap</div>';
  try {
    const data = await postJSON('/api/roadmap', { career, duration });
    const saved = Store.getRoadmap();
    const done = (saved && saved.career === career) ? saved.done : {};
    Store.saveRoadmap({ career, duration, steps: data.steps, done });
    addXP(15, 'roadmap_built');
    renderRoadmapFlow();
    renderNextBestAction();
  } catch (e) {
    flow.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

function renderRoadmapFlow() {
  const flow = document.getElementById('roadmap-flow');
  const r = Store.getRoadmap();
  if (!r) { flow.innerHTML = '<div class="empty-state">Build a roadmap to see it here.</div>'; return; }
  flow.innerHTML = r.steps.map((step, i) => `
    ${i > 0 ? '<div class="roadmap-connector"></div>' : ''}
    <div class="roadmap-step ${r.done[i] ? 'done' : ''}" data-i="${i}">
      <div class="dot"></div><div class="label">${step}</div>
    </div>`).join('');

  flow.querySelectorAll('.roadmap-step').forEach((el) => {
    el.addEventListener('click', () => {
      const r2 = Store.getRoadmap();
      const i = el.dataset.i;
      r2.done[i] = !r2.done[i];
      Store.saveRoadmap(r2);
      if (r2.done[i]) addXP(5);
      renderRoadmapFlow();
    });
  });
}
renderRoadmapFlow();

/* ---------------------------- skill gap ---------------------------- */

document.getElementById('run-skillgap-btn').addEventListener('click', async () => {
  const career = document.getElementById('skillgap-career').value;
  const profile = Store.getProfile();
  const out = document.getElementById('skillgap-output');
  out.innerHTML = '<div class="empty-state loading-dots">Analyzing</div>';
  try {
    const data = await postJSON('/api/skill-gap', { profile, career });
    out.innerHTML = `
      ${meterRow(`Match with ${career}`, data.match)}
      <div class="grid cols-2" style="margin-top:12px;">
        <div>
          <h3 style="margin-top:0;">✅ Skills You Have</h3>
          ${data.have.length ? data.have.map((s) => `<span class="badge good" style="display:inline-block; margin:3px;">${s}</span>`).join('') : '<div class="empty-state">None yet</div>'}
        </div>
        <div>
          <h3 style="margin-top:0;">❌ Missing Skills</h3>
          ${data.missing.length ? data.missing.map((s) => `<span class="badge bad" style="display:inline-block; margin:3px;">${s}</span>`).join('') : '<div class="empty-state">You cover everything!</div>'}
        </div>
      </div>
      ${data.missing.length ? `<div class="card" style="margin-top:14px; background:var(--bg-panel-2);">
        <b style="font-size:13px;">⚠️ Career Risk:</b>
        <span style="font-size:13px; color:var(--text-mid);"> ${career} typically requires ${data.missing[0]} — consider prioritizing it in your roadmap.</span>
      </div>` : ''}
    `;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- job description analyzer ---------------------------- */

document.getElementById('run-jobmatch-btn').addEventListener('click', async () => {
  const jd = document.getElementById('jd-text').value.trim();
  const out = document.getElementById('jobmatch-output');
  if (!jd) { out.innerHTML = '<div class="empty-state">Paste a job description first.</div>'; return; }
  out.innerHTML = '<div class="empty-state loading-dots">Analyzing listing</div>';
  try {
    const data = await postJSON('/api/job-match', { profile: Store.getProfile(), job_description: jd });
    out.innerHTML = `
      <div style="font-family:var(--font-display); font-size:28px; margin-bottom:10px;">🎯 ${data.match_percent}% match</div>
      <div class="grid cols-2">
        <div><h3 style="margin-top:0;">Required &amp; Matched</h3>${data.matched.map((s) => `<span class="badge good" style="display:inline-block; margin:3px;">${s} ✅</span>`).join('') || '<div class="empty-state">No overlap found</div>'}</div>
        <div><h3 style="margin-top:0;">Required &amp; Missing</h3>${data.missing.map((s) => `<span class="badge bad" style="display:inline-block; margin:3px;">${s} ❌</span>`).join('') || '<div class="empty-state">Nothing missing!</div>'}</div>
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- salary + comparison ---------------------------- */

document.getElementById('run-salary-btn').addEventListener('click', async () => {
  const career = document.getElementById('salary-career').value;
  const experience = document.getElementById('salary-exp').value;
  const out = document.getElementById('salary-output');
  out.innerHTML = '<div class="empty-state loading-dots">Estimating</div>';
  try {
    const data = await postJSON('/api/salary', { career, experience });
    out.innerHTML = `
      <div style="font-family:var(--font-display); font-size:26px; margin-bottom:14px;">
        ₹${(data.estimate_low_inr / 100000).toFixed(1)}L – ₹${(data.estimate_high_inr / 100000).toFixed(1)}L / year
      </div>
      <h3>Career Growth Simulator</h3>
      <div class="roadmap-flow">
        ${data.growth_path.map((step, i) => `
          ${i > 0 ? '<div class="roadmap-connector"></div>' : ''}
          <div class="roadmap-step"><div class="dot"></div><div class="label">Year ${i * 2} → ${step}</div></div>`).join('')}
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

async function renderCompareTable() {
  const el = document.getElementById('compare-table');
  if (!el) return;
  const res = await fetch('/api/compare');
  const data = await res.json();
  const stars = (n, max = 5) => '⭐'.repeat(n) + '☆'.repeat(max - n);
  const demandStars = { 'Very High': 5, High: 4, Medium: 3, Low: 2 };
  const diffStars = { High: 2, Medium: 3, Low: 4 };
  el.innerHTML = `
    <table>
      <thead><tr><th>Career</th><th>Difficulty</th><th>Demand</th><th>Salary Potential</th><th>Trend</th></tr></thead>
      <tbody>
        ${data.careers.map((c) => `
          <tr>
            <td>${c.career}</td>
            <td>${stars(diffStars[c.difficulty] || 3)}</td>
            <td>${stars(demandStars[c.demand] || 3)}</td>
            <td>${stars(Math.min(5, Math.round(c.salary_high / 600000)))}</td>
            <td><span class="badge">${c.trend}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}
renderCompareTable();
