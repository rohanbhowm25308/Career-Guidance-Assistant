/* ==========================================================================
   AI skill testing, resume assistant, project generator, portfolio strength.
   ========================================================================== */

/* ---------------------------- quiz ---------------------------- */

let quizState = { questions: [], answers: [] };

document.getElementById('run-quiz-btn').addEventListener('click', async () => {
  const topic = document.getElementById('quiz-topic').value.trim() || 'Python';
  const level = document.getElementById('quiz-level').value;
  const count = parseInt(document.getElementById('quiz-count').value || '5', 10);
  const out = document.getElementById('quiz-output');
  out.innerHTML = '<div class="empty-state loading-dots">Generating quiz</div>';
  try {
    const data = await postJSON('/api/quiz', { topic, level, count });
    if (data.error) throw new Error(data.error);
    quizState = { questions: data.questions, answers: new Array(data.questions.length).fill(null) };
    renderQuiz();
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

function renderQuiz() {
  const out = document.getElementById('quiz-output');
  out.innerHTML = quizState.questions.map((q, qi) => `
    <div style="margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--line);">
      <div style="font-weight:700; font-size:13.5px; margin-bottom:8px;">${qi + 1}. ${q.question}</div>
      ${q.options.map((opt, oi) => `
        <label style="display:flex; gap:8px; align-items:center; padding:5px 0; font-size:13px; color:var(--text-mid); cursor:pointer;">
          <input type="radio" name="q${qi}" value="${oi}" class="quiz-opt" data-qi="${qi}">
          ${opt}
        </label>`).join('')}
      <div class="quiz-explain" id="explain-${qi}" style="display:none; font-size:12px; color:var(--text-dim); margin-top:6px; padding:8px; background:var(--bg-panel-2); border-radius:8px;"></div>
    </div>`).join('') + `<button class="btn" id="grade-quiz-btn">Submit Quiz</button><div id="quiz-score" style="margin-top:12px;"></div>`;

  document.getElementById('grade-quiz-btn').addEventListener('click', gradeQuiz);
}

function gradeQuiz() {
  let correct = 0;
  quizState.questions.forEach((q, qi) => {
    const picked = document.querySelector(`input[name="q${qi}"]:checked`);
    const val = picked ? parseInt(picked.value, 10) : -1;
    quizState.answers[qi] = val;
    if (val === q.correct_index) correct++;
    const ex = document.getElementById(`explain-${qi}`);
    ex.style.display = 'block';
    ex.innerHTML = (val === q.correct_index ? '✅ Correct. ' : `❌ Correct answer: ${q.options[q.correct_index]}. `) + q.explanation;
  });
  const pct = Math.round((correct / quizState.questions.length) * 100);
  document.getElementById('quiz-score').innerHTML = `<div class="badge ${pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad'}" style="font-size:14px; padding:8px 16px;">Score: ${correct}/${quizState.questions.length} (${pct}%)</div>`;
  addXP(15, 'quiz_done');
}

/* ---------------------------- resume assistant ---------------------------- */

document.getElementById('run-resume-btn').addEventListener('click', async () => {
  const text = document.getElementById('resume-text').value.trim();
  const out = document.getElementById('resume-output');
  const card = document.getElementById('resume-output-card');
  card.style.display = 'block';
  if (!text) { out.innerHTML = '<div class="empty-state">Paste your resume text first.</div>'; return; }
  out.innerHTML = '<div class="empty-state loading-dots">Reviewing resume</div>';
  try {
    const profile = Store.getProfile();
    const data = await postJSON('/api/resume-review', { resume_text: text, career: (profile.goals || '') });
    if (data.error) throw new Error(data.error);
    out.innerHTML = `
      <div style="font-family:var(--font-display); font-size:30px; margin-bottom:14px;">Resume Score: ${data.resume_score}/100</div>
      ${meterRow('Skills', data.skills)}
      ${meterRow('Projects', data.projects)}
      ${meterRow('Experience', data.experience)}
      ${meterRow('ATS Score', data.ats_score)}
      <h3 style="margin-top:16px;">Improvement Tips</h3>
      <ul style="font-size:13px; color:var(--text-mid); padding-left:18px;">
        ${data.improvement_tips.map((t) => `<li style="margin-bottom:6px;">${t}</li>`).join('')}
      </ul>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- project generator ---------------------------- */

document.getElementById('run-projectgen-btn').addEventListener('click', async () => {
  const out = document.getElementById('projectgen-output');
  const profile = Store.getProfile();
  if (!profile.skills || profile.skills.length === 0) { out.innerHTML = '<div class="empty-state">Save your profile first.</div>'; return; }
  out.innerHTML = '<div class="empty-state loading-dots">Designing a project for you</div>';
  try {
    const data = await postJSON('/api/project-idea', { profile });
    if (data.error) throw new Error(data.error);
    out.innerHTML = `
      <div style="font-weight:800; font-size:15px; margin-bottom:6px;">${data.title}</div>
      <span class="badge">${data.difficulty}</span>
      <div style="margin-top:10px; font-size:12.5px; color:var(--text-mid);"><b>Tech:</b> ${(data.technologies || []).join(', ')}</div>
      <div style="margin-top:6px; font-size:12.5px; color:var(--text-mid);"><b>Dataset:</b> ${data.dataset}</div>
      <div style="margin-top:10px;"><b style="font-size:12.5px;">Features:</b>
        <ul style="font-size:12.5px; color:var(--text-mid); padding-left:18px;">${(data.features || []).map((f) => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div style="margin-top:10px;"><b style="font-size:12.5px;">Roadmap:</b>
        <ul style="font-size:12.5px; color:var(--text-mid); padding-left:18px;">${(data.roadmap || []).map((f) => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div style="margin-top:10px; font-size:12.5px; color:var(--text-mid);"><b>Expected Outcome:</b> ${data.expected_outcome}</div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- project to career ---------------------------- */

document.getElementById('run-p2c-btn').addEventListener('click', async () => {
  const project = document.getElementById('project-desc').value.trim();
  const out = document.getElementById('p2c-output');
  if (!project) { out.innerHTML = '<div class="empty-state">Describe a project first.</div>'; return; }
  out.innerHTML = '<div class="empty-state loading-dots">Analyzing</div>';
  try {
    const data = await postJSON('/api/project-to-career', { project });
    if (data.error) throw new Error(data.error);
    out.innerHTML = Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => meterRow(k, v)).join('');
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});

/* ---------------------------- portfolio strength ---------------------------- */

document.getElementById('run-portfolio-btn').addEventListener('click', async () => {
  const p = Store.getProfile();
  const out = document.getElementById('portfolio-output');
  out.innerHTML = '<div class="empty-state loading-dots">Analyzing portfolio</div>';
  try {
    const data = await postJSON('/api/portfolio-strength', {
      num_projects: p.num_projects || 0, num_skills: (p.skills || []).length, has_internship: p.has_internship,
    });
    out.innerHTML = `
      <div style="font-family:var(--font-display); font-size:34px; margin-bottom:10px;">Portfolio Strength: ${data.score}/100</div>
      ${meterRow('Strength', data.score)}
      <div class="card" style="margin-top:14px; background:var(--bg-panel-2);">💡 ${data.tip}</div>`;
  } catch (e) {
    out.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});
