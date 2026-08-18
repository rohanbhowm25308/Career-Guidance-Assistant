/* ==========================================================================
   AI mentor: 24/7 chatbot + mock interview.
   ========================================================================== */

/* ---------------------------- chatbot ---------------------------- */

let chatHistory = [];

function appendMsg(role, text, isError) {
  const win = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = `msg ${role === 'user' ? 'user' : 'ai'} ${isError ? 'error' : ''}`;
  div.textContent = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

async function sendChat(text) {
  if (!text.trim()) return;
  appendMsg('user', text);
  chatHistory.push({ role: 'student', content: text });
  const thinking = appendMsg('ai', 'Thinking…');
  try {
    const data = await postJSON('/api/chat', { message: text, profile: Store.getProfile(), history: chatHistory });
    if (data.error) throw new Error(data.error);
    thinking.textContent = data.reply;
    chatHistory.push({ role: 'mentor', content: data.reply });
    addXP(5);
  } catch (e) {
    thinking.textContent = `⚠ ${e.message}`;
    thinking.classList.add('error');
  }
}

document.getElementById('chat-send-btn').addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  sendChat(input.value);
  input.value = '';
});
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { document.getElementById('chat-send-btn').click(); }
});
document.querySelectorAll('.quick-prompts button').forEach((btn) => {
  btn.addEventListener('click', () => sendChat(btn.dataset.q));
});

/* ---------------------------- mock interview ---------------------------- */

let interviewState = { active: false, mode: '', career: '', questions: [], qaPairs: [] };

document.getElementById('start-interview-btn').addEventListener('click', async () => {
  interviewState = {
    active: true,
    mode: document.getElementById('interview-mode').value,
    career: document.getElementById('interview-career').value,
    questions: [],
    qaPairs: [],
  };
  document.getElementById('interview-card').style.display = 'block';
  document.getElementById('interview-results').style.display = 'none';
  document.getElementById('end-interview-btn').style.display = 'inline-flex';
  await fetchNextQuestion();
});

async function fetchNextQuestion() {
  const qEl = document.getElementById('interview-question');
  qEl.innerHTML = '<span class="loading-dots">Preparing next question</span>';
  try {
    const data = await postJSON('/api/interview/question', {
      mode: interviewState.mode, career: interviewState.career,
      profile: Store.getProfile(), asked: interviewState.questions,
    });
    if (data.error) throw new Error(data.error);
    interviewState.questions.push(data.question);
    qEl.textContent = data.question;
    document.getElementById('interview-answer').value = '';
  } catch (e) {
    qEl.textContent = `⚠ ${e.message}`;
  }
}

document.getElementById('submit-answer-btn').addEventListener('click', async () => {
  const answer = document.getElementById('interview-answer').value.trim();
  const question = interviewState.questions[interviewState.questions.length - 1];
  if (!answer) return;
  interviewState.qaPairs.push({ question, answer });
  await fetchNextQuestion();
});

document.getElementById('end-interview-btn').addEventListener('click', async () => {
  const resultsCard = document.getElementById('interview-results');
  resultsCard.style.display = 'block';
  document.getElementById('interview-scorebars').innerHTML = '<div class="empty-state loading-dots">Scoring your interview</div>';
  document.getElementById('interview-feedback').textContent = '';
  try {
    const data = await postJSON('/api/interview/feedback', { qa_pairs: interviewState.qaPairs, career: interviewState.career });
    if (data.error) throw new Error(data.error);
    document.getElementById('interview-scorebars').innerHTML = [
      ['Technical Knowledge', data.technical_knowledge],
      ['Communication', data.communication],
      ['Confidence', data.confidence],
      ['Problem Solving', data.problem_solving],
      ['Overall Score', data.overall_score],
    ].map(([l, v]) => meterRow(l, v)).join('');
    document.getElementById('interview-feedback').textContent = data.feedback;
    document.getElementById('interview-card').style.display = 'none';
    document.getElementById('end-interview-btn').style.display = 'none';
    addXP(25, 'interview_done');
  } catch (e) {
    document.getElementById('interview-scorebars').innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
});
