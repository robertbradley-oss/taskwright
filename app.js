import { evaluate } from './scoring.js';
const $ = selector => document.querySelector(selector);
const scenario = document.body.dataset.scenario || 'reset';
const practice = scenario === 'model'
  ? { number: '02', title: 'Check the source', version: 'Fictional Vale L4 scenario, revision 1 (manual revision 1)' }
  : { number: '01', title: 'Verify an AI answer', version: 'Fictional Morrow D2 scenario, revision 2 (manual revision 1)' };
let review;
function show(name) {
  for (const id of ['lesson', 'practice', 'feedback']) {
    $(`#${id}`).hidden = id !== name;
    $(`#step-${id}`).toggleAttribute('aria-current', id === name);
    if (id === name) $(`#step-${id}`).setAttribute('aria-current', 'step');
  }
  $(`#${name}-title`).focus();
}
$('#start').addEventListener('click', () => show('practice'));
$('#back').addEventListener('click', () => show('lesson'));
$('#revise').addEventListener('click', () => show('practice'));
$('#reply').addEventListener('input', () => $('#reply').setCustomValidity(''));
$('#response-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!$('#reply').value.trim()) {
    $('#reply').setCustomValidity('Write a customer reply before reviewing.');
    $('#reply').reportValidity(); return;
  }
  const answers = Object.fromEntries(new FormData(event.currentTarget));
  review = { answers, result: evaluate(answers, scenario) };
  $('#score').textContent = `${review.result.score} / 3 evidence choices correct`;
  $('#criteria').replaceChildren(...review.result.criteria.map(item => {
    const article = document.createElement('article');
    const status = document.createElement('p');
    status.className = item.passed ? 'passed' : 'missed';
    status.textContent = item.passed ? '✓ Met · 1 / 1' : 'Revisit · 0 / 1';
    const title = document.createElement('h3'); title.textContent = item.title;
    const evidence = document.createElement('p'); evidence.textContent = item.evidence;
    article.append(status, title, evidence); return article;
  }));
  $('#saved-reply').textContent = answers.reply;
  document.querySelectorAll('.self-checks input').forEach(input => { input.checked = false; });
  $('#download-status').textContent = '';
  $('#export-panel').hidden = true;
  show('feedback');
});
function reviewText() {
  const checks = [...document.querySelectorAll('.self-checks input')].map(input => `${input.checked ? '[x]' : '[ ]'} ${input.parentElement.textContent.trim()}`).join('\n');
  const choices = ['claim', 'source', 'boundary'].map(key => `${key}: ${document.querySelector(`input[name="${key}"]:checked`).parentElement.textContent.trim()}`).join('\n');
  const text = `Taskwright — Practice ${practice.number}: ${practice.title}\n${practice.version}\n\nEvidence-choice score: ${review.result.score}/3\nWritten reply: ${review.result.writingStatus} (not automatically graded or verified by self-checks).\nSelected choices:\n${choices}\n\n${review.result.criteria.map(c => `${c.title}: ${c.passed ? 'Met' : 'Revisit'}\n${c.evidence}`).join('\n\n')}\n\nCustomer reply:\n${review.answers.reply}\n\nLearner self-review (not scored):\n${checks}\n\nReflection:\n${$('#reflection').value}\n\nLimits: choice-based practice score only. Writing has not been automatically graded. Revisions are not independent assessments; no learning gain is established.\n`;
  return text;
}
$('#show-export').addEventListener('click', () => {
  $('#export-text').value = reviewText();
  $('#export-panel').hidden = false;
  $('#export-text').focus();
  $('#export-text').select();
});
$('#download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([reviewText()], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `taskwright-practice-${practice.number}-review.txt`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#download-status').textContent = 'Review prepared for download.';
});
