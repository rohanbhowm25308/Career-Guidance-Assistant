/* ==========================================================================
   Voice input — wires a mic button to a text input/textarea using the
   browser's Web Speech API (SpeechRecognition). Works in Chrome/Edge;
   gracefully disables itself with a message where unsupported (e.g. Firefox).
   ========================================================================== */

function wireVoiceInput(buttonId, targetId, statusId) {
  const btn = document.getElementById(buttonId);
  const target = document.getElementById(targetId);
  const statusEl = statusId ? document.getElementById(statusId) : null;
  if (!btn || !target) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const setStatus = (text, cls) => {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = `mic-status ${cls || ''}`;
  };

  if (!SpeechRecognition) {
    btn.classList.add('unsupported');
    btn.title = 'Voice input isn\'t supported in this browser — try Chrome or Edge.';
    btn.addEventListener('click', () => {
      setStatus('Voice input isn\'t supported in this browser — try Chrome or Edge.', 'error');
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  let listening = false;
  let baseText = '';

  recognition.addEventListener('start', () => {
    listening = true;
    btn.classList.add('listening');
    btn.textContent = '⏺';
    baseText = target.value ? target.value + ' ' : '';
    setStatus('Listening… speak now', 'active');
  });

  recognition.addEventListener('result', (e) => {
    let transcript = '';
    for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
    target.value = (baseText + transcript).trim();
  });

  recognition.addEventListener('error', (e) => {
    const messages = {
      'not-allowed': 'Microphone access was blocked — allow it in your browser settings.',
      'no-speech': 'Didn\'t catch that — try again.',
      'audio-capture': 'No microphone found.',
    };
    setStatus(messages[e.error] || `Voice input error: ${e.error}`, 'error');
  });

  recognition.addEventListener('end', () => {
    listening = false;
    btn.classList.remove('listening');
    btn.textContent = '🎙️';
    if (statusEl && statusEl.classList.contains('active')) setStatus('');
  });

  btn.addEventListener('click', () => {
    if (listening) {
      recognition.stop();
    } else {
      try { recognition.start(); }
      catch { /* already started — ignore */ }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireVoiceInput('chat-mic-btn', 'chat-input', 'chat-mic-status');
  wireVoiceInput('interview-mic-btn', 'interview-answer', 'interview-mic-status');
});
