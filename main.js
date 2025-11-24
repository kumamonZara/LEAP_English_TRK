
import { WORD_LIST } from './data.js';
import { explainWord } from './gemini.js';

// --- Application State ---
const state = {
  mode: 'START', // START, LIST_VIEW, RANDOM_CHOICE, TYPING, SEQUENTIAL_CHOICE, MIXED, REVIEW
  range: { start: 1, end: WORD_LIST.length },
  queue: [],
  currentIndex: 0,
  score: 0,
  mistakes: [], // Array of Word IDs
  waitingForFeedback: false
};

// --- DOM Elements ---
const app = document.getElementById('app');
const headerBackBtn = document.getElementById('header-back-btn');
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const feedbackOverlay = document.getElementById('feedback-overlay');
const feedbackContent = document.getElementById('feedback-content');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackMessage = document.getElementById('feedback-message');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close');

// --- Initialization ---
function init() {
  if (!app) {
    console.error("App root not found");
    return;
  }
  // Initialize range end to list length
  state.range.end = WORD_LIST.length;
  render();
  setupGlobalListeners();
}

function setupGlobalListeners() {
  if (headerBackBtn) {
    headerBackBtn.addEventListener('click', () => {
      state.mode = 'START';
      render();
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modalOverlay.classList.add('hidden');
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
    });
  }
}

// --- Logic Helpers ---

function getWordsInRange() {
  return WORD_LIST.filter(w => w.id >= state.range.start && w.id <= state.range.end);
}

function startMode(mode) {
  let queue = getWordsInRange();

  if (queue.length === 0) {
    alert("選択された範囲に単語がありません。");
    return;
  }

  if (mode === 'RANDOM_CHOICE' || mode === 'MIXED') {
    queue = [...queue].sort(() => Math.random() - 0.5);
  } else if (mode === 'SEQUENTIAL_CHOICE' || mode === 'TYPING' || mode === 'LIST_VIEW') {
    queue = [...queue].sort((a, b) => a.id - b.id);
  }

  state.queue = queue;
  state.currentIndex = 0;
  state.score = 0;
  state.mode = mode;
  
  render();
}

function handleAnswer(isCorrect, currentWord) {
  if (state.waitingForFeedback) return;
  state.waitingForFeedback = true;

  // Visual Feedback
  showFeedback(isCorrect, currentWord);

  // Update Score/Mistakes
  if (isCorrect) {
    state.score++;
  } else {
    if (!state.mistakes.includes(currentWord.id)) {
      state.mistakes.push(currentWord.id);
    }
  }

  // Next Question logic
  setTimeout(() => {
    hideFeedback();
    state.waitingForFeedback = false;
    
    if (state.currentIndex < state.queue.length - 1) {
      state.currentIndex++;
      render();
    } else {
      // Quiz Complete
      setTimeout(() => {
        alert(`クイズ終了！\nスコア: ${state.score} / ${state.queue.length}`);
        state.mode = 'START';
        render();
      }, 100);
    }
  }, 1500);
}

function showFeedback(isCorrect, word) {
  if (!feedbackOverlay) return;

  feedbackOverlay.classList.remove('hidden');
  // Force reflow
  void feedbackOverlay.offsetWidth;
  feedbackOverlay.classList.remove('opacity-0');

  const bgColor = isCorrect ? 'bg-green-500' : 'bg-red-500';
  feedbackContent.className = `p-8 rounded-2xl shadow-2xl transform scale-100 text-white text-center scale-in ${bgColor}`;

  feedbackTitle.textContent = isCorrect ? '正解！ 🎉' : '不正解 😢';
  
  // Display logic for correct answer
  let answerText = "";
  // In Typing mode (Jap -> Eng), answer is English.
  // In Choice mode (Eng -> Jap), answer is Japanese.
  if (state.mode === 'TYPING') {
    answerText = word.en;
  } else if (state.mode === 'MIXED') {
    // Check if the current view was typing or choice (infer from DOM or logic)
    // Simplified: Show both to be safe in Mixed mode
    answerText = `${word.en} / ${word.ja}`;
  } else {
    answerText = word.ja;
  }

  feedbackMessage.textContent = isCorrect ? '' : `正解: ${answerText}`;
}

function hideFeedback() {
  if (!feedbackOverlay) return;
  feedbackOverlay.classList.add('opacity-0');
  setTimeout(() => {
    feedbackOverlay.classList.add('hidden');
  }, 300);
}

// --- Renderers ---

function render() {
  window.scrollTo(0, 0);
  app.innerHTML = ''; // Clear current content

  // Update Header UI
  updateHeader();

  switch (state.mode) {
    case 'START':
      renderStartScreen();
      break;
    case 'LIST_VIEW':
      renderListView();
      break;
    case 'RANDOM_CHOICE':
    case 'SEQUENTIAL_CHOICE':
      renderChoiceQuiz();
      break;
    case 'TYPING':
      renderTypingQuiz();
      break;
    case 'MIXED':
      renderMixedQuiz();
      break;
    case 'REVIEW':
      renderReviewScreen();
      break;
    default:
      app.innerHTML = '<div>Error: Unknown Mode</div>';
  }
}

function updateHeader() {
  if (state.mode === 'START') {
    headerBackBtn.classList.add('hidden');
    progressContainer.classList.add('hidden');
  } else if (state.mode !== 'LIST_VIEW' && state.mode !== 'REVIEW') {
    headerBackBtn.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    
    const total = state.queue.length;
    const current = state.currentIndex + 1;
    progressText.textContent = `${current} / ${total}`;
    progressBar.style.width = `${total > 0 ? (state.currentIndex / total) * 100 : 0}%`;
  } else {
    headerBackBtn.classList.remove('hidden');
    progressContainer.classList.add('hidden');
  }
}

// 1. Start Screen
function renderStartScreen() {
  const container = document.createElement('div');
  container.className = "max-w-2xl mx-auto space-y-8 slide-up w-full";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl p-8 shadow-xl border border-slate-200";

  const title = `
    <h1 class="text-3xl font-bold text-slate-900 mb-2 text-center">英単語マスター</h1>
    <p class="text-slate-500 text-center mb-8">出題範囲とモードを選択してください</p>
  `;

  // Range Selectors
  const rangeWrapper = document.createElement('div');
  rangeWrapper.className = "flex flex-col sm:flex-row gap-4 items-center justify-center mb-8 p-4 bg-slate-50 rounded-xl";

  const createSelect = (label, value, onChange) => {
    const wrap = document.createElement('div');
    wrap.className = "flex items-center gap-2 w-full sm:w-auto";
    const span = document.createElement('span');
    span.className = "font-semibold text-slate-700 w-12";
    span.textContent = label;
    const select = document.createElement('select');
    select.className = "block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10 border";
    
    for (let i = 1; i <= WORD_LIST.length; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      if (i === value) opt.selected = true;
      select.appendChild(opt);
    }
    select.onchange = onChange;
    wrap.append(span, select);
    return wrap;
  };

  const startSel = createSelect('開始:', state.range.start, (e) => {
    state.range.start = Number(e.target.value);
    if (state.range.end < state.range.start) {
      state.range.end = state.range.start;
      render();
    }
  });

  const arrow = document.createElement('div');
  arrow.className = "hidden sm:block text-slate-300";
  arrow.textContent = "→";

  const endSel = createSelect('終了:', state.range.end, (e) => {
    state.range.end = Number(e.target.value);
    if (state.range.start > state.range.end) {
      state.range.start = state.range.end;
      render();
    }
  });

  rangeWrapper.append(startSel, arrow, endSel);

  // Buttons
  const btnGrid = document.createElement('div');
  btnGrid.className = "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const createBtn = (icon, title, sub, color, mode) => {
    const btn = document.createElement('button');
    btn.className = `p-4 bg-white border-2 border-slate-200 hover:border-${color}-500 hover:text-${color}-600 rounded-xl flex items-center gap-3 transition-all group w-full text-left`;
    btn.onclick = () => startMode(mode);
    btn.innerHTML = `
      <div class="p-2 bg-${color}-50 text-${color}-600 rounded-lg group-hover:bg-${color}-100 shrink-0">${icon}</div>
      <div>
        <span class="font-bold text-slate-700 group-hover:text-${color}-700 block">${title}</span>
        ${sub ? `<span class="text-xs text-slate-400">${sub}</span>` : ''}
      </div>
    `;
    return btn;
  };

  // Icons
  const icons = {
    book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    shuffle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l-5 5-4-4"/></svg>',
    key: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    layers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'
  };

  btnGrid.append(createBtn(icons.book, '1. 単語一覧', '', 'indigo', 'LIST_VIEW'));
  btnGrid.append(createBtn(icons.shuffle, '2. ランダムクイズ', '英語 → 日本語', 'blue', 'RANDOM_CHOICE'));
  btnGrid.append(createBtn(icons.key, '3. タイピング', '日本語 → 英語', 'purple', 'TYPING'));
  btnGrid.append(createBtn(icons.layers, '4. 順番通りクイズ', `No.${state.range.start}から順番に`, 'emerald', 'SEQUENTIAL_CHOICE'));
  
  const mixBtn = createBtn(icons.settings, '5. ミックスモード', 'ランダム & 入力', 'orange', 'MIXED');
  mixBtn.className += ' sm:col-span-2';
  btnGrid.append(mixBtn);

  // Review Button
  const revBtn = document.createElement('button');
  revBtn.className = "p-4 bg-white border-2 border-slate-200 hover:border-rose-500 hover:text-rose-600 rounded-xl flex items-center gap-3 transition-all group w-full text-left sm:col-span-2";
  revBtn.onclick = () => {
    state.mode = 'REVIEW';
    render();
  };
  
  let mistakeCountHtml = '';
  if (state.mistakes.length > 0) {
    mistakeCountHtml = `<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">${state.mistakes.length}</span>`;
  }
  
  revBtn.innerHTML = `
    <div class="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 shrink-0">${icons.alert}</div>
    <div class="flex-1 flex items-center justify-between">
      <span class="font-bold text-slate-700 group-hover:text-rose-700 block">6. 間違えた単語の復習</span>
      ${mistakeCountHtml}
    </div>
  `;
  btnGrid.append(revBtn);

  card.innerHTML = title;
  card.appendChild(rangeWrapper);
  card.appendChild(btnGrid);
  container.appendChild(card);
  app.appendChild(container);
}

// 2. List View
function renderListView() {
  const container = document.createElement('div');
  container.className = "w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 slide-up";
  container.innerHTML = `
    <div class="bg-indigo-600 p-4">
      <h2 class="text-xl font-bold text-white text-center">単語一覧</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
          <tr>
            <th class="px-6 py-3">No.</th>
            <th class="px-6 py-3">日本語</th>
            <th class="px-6 py-3">英語</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
        </tbody>
      </table>
    </div>
  `;
  
  const tbody = container.querySelector('tbody');
  state.queue.forEach((word, i) => {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
    tr.innerHTML = `
      <td class="px-6 py-4 font-medium text-slate-900">${word.id}</td>
      <td class="px-6 py-4">${word.ja}</td>
      <td class="px-6 py-4 font-bold text-indigo-600">${word.en}</td>
    `;
    tbody.appendChild(tr);
  });
  
  app.appendChild(container);
}

// 3. Choice Quiz (Random & Sequential)
function renderChoiceQuiz() {
  const currentWord = state.queue[state.currentIndex];
  if (!currentWord) return;

  // Create Distractors
  const distractors = WORD_LIST
    .filter(w => w.id !== currentWord.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  const choices = [...distractors, currentWord].sort(() => 0.5 - Math.random());

  const container = document.createElement('div');
  container.className = "w-full max-w-2xl mx-auto";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 slide-up";

  const modeLabel = state.mode === 'MIXED' ? 'ミックスモード' : (state.mode === 'RANDOM_CHOICE' ? 'ランダムクイズ' : '順番通りクイズ');

  card.innerHTML = `
    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
      <p class="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">${modeLabel}</p>
      <h2 class="text-5xl font-extrabold text-white mb-4 drop-shadow-md">${currentWord.en}</h2>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = "p-8 grid grid-cols-1 md:grid-cols-2 gap-4";

  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md active:scale-95";
    btn.textContent = opt.ja;
    btn.onclick = () => {
      // Lock all buttons
      const allBtns = grid.querySelectorAll('button');
      allBtns.forEach(b => b.disabled = true);
      
      const isCorrect = opt.id === currentWord.id;
      
      // Highlight selection
      if (isCorrect) {
        btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-green-500 border-green-600 text-white scale-105";
      } else {
        btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-red-100 border-red-200 text-red-400 opacity-50";
        // Find correct one
        allBtns.forEach(b => {
          if (b.textContent === currentWord.ja) {
            b.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-green-500 border-green-600 text-white scale-105";
          }
        });
      }
      
      handleAnswer(isCorrect, currentWord);
    };
    grid.appendChild(btn);
  });

  card.appendChild(grid);
  container.appendChild(card);
  app.appendChild(container);
}

// 4. Typing Quiz
function renderTypingQuiz() {
  const currentWord = state.queue[state.currentIndex];
  if (!currentWord) return;

  const container = document.createElement('div');
  container.className = "w-full max-w-2xl mx-auto";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 slide-up";

  const modeLabel = state.mode === 'MIXED' ? 'ミックスモード' : 'タイピングチャレンジ';

  card.innerHTML = `
    <div class="bg-gradient-to-r from-purple-500 to-pink-600 p-8 text-center">
      <p class="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-2">${modeLabel}</p>
      <h2 class="text-4xl font-extrabold text-white mb-2">${currentWord.ja}</h2>
      <p class="text-white/80 text-sm">英単語を入力してください</p>
    </div>
  `;

  const formWrap = document.createElement('div');
  formWrap.className = "p-8";
  
  const form = document.createElement('form');
  form.className = "flex flex-col gap-4";
  
  const input = document.createElement('input');
  input.type = "text";
  input.className = "w-full p-4 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all";
  input.placeholder = "回答を入力...";
  input.autocomplete = "off";
  
  const submitBtn = document.createElement('button');
  submitBtn.type = "submit";
  submitBtn.className = "w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  submitBtn.textContent = "回答する";
  submitBtn.disabled = true;

  input.addEventListener('input', () => {
    submitBtn.disabled = input.value.trim() === "";
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const val = input.value.trim().toLowerCase();
    const isCorrect = val === currentWord.en.toLowerCase();
    
    input.disabled = true;
    submitBtn.disabled = true;
    
    handleAnswer(isCorrect, currentWord);
  };

  form.append(input, submitBtn);
  formWrap.appendChild(form);
  card.appendChild(formWrap);
  container.appendChild(card);
  app.appendChild(container);

  setTimeout(() => input.focus(), 50);
}

// 5. Mixed
function renderMixedQuiz() {
  if (Math.random() > 0.5) {
    renderTypingQuiz();
  } else {
    renderChoiceQuiz();
  }
}

// 6. Review
function renderReviewScreen() {
  const mistakesList = WORD_LIST.filter(w => state.mistakes.includes(w.id));
  
  const container = document.createElement('div');
  container.className = "w-full max-w-4xl mx-auto space-y-6 slide-up";

  if (mistakesList.length === 0) {
    container.innerHTML = `
      <div class="text-center p-12 bg-white rounded-2xl shadow-lg">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-2xl font-bold text-slate-900 mb-2">全問正解！</h2>
        <p class="text-slate-600 mb-6">現在、間違えた問題はありません。</p>
        <button id="retry-btn" class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
          メニューに戻る
        </button>
      </div>
    `;
    app.appendChild(container);
    document.getElementById('retry-btn').onclick = () => {
      state.mode = 'START';
      render();
    };
    return;
  }

  container.innerHTML = `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <h2 class="text-2xl font-bold text-amber-900">復習</h2>
      <p class="text-amber-700">${mistakesList.length} 個の単語を間違えました。解説を確認しましょう。</p>
    </div>
    <div id="mistake-list" class="grid grid-cols-1 gap-4"></div>
  `;

  const list = container.querySelector('#mistake-list');
  
  mistakesList.forEach(word => {
    const item = document.createElement('div');
    item.className = "bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4";
    item.innerHTML = `
      <div>
        <div class="flex items-baseline gap-3">
          <span class="text-2xl font-bold text-indigo-600">${word.en}</span>
          <span class="text-slate-500">#${word.id}</span>
        </div>
        <p class="text-lg text-slate-800">${word.ja}</p>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = "flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors";
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
      AI解説を見る
    `;
    btn.onclick = async () => {
      // Show loading modal
      modalContent.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>';
      modalOverlay.classList.remove('hidden');
      
      const text = await explainWord(word.en);
      modalContent.textContent = text;
    };
    
    const actionDiv = document.createElement('div');
    actionDiv.appendChild(btn);
    item.appendChild(actionDiv);
    list.appendChild(item);
  });

  app.appendChild(container);
}

// Start
init();
