
import { WORD_LIST } from './data.js';

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

// --- Initialization ---
function init() {
  try {
    if (!app) {
      throw new Error("App root element not found");
    }
    // Initialize range end to list length
    if (!state.range.end || state.range.end > WORD_LIST.length) {
      state.range.end = WORD_LIST.length;
    }
    
    render();
    setupGlobalListeners();
  } catch (e) {
    console.error("Initialization Error:", e);
    if (app) {
      app.innerHTML = `<div class="text-red-600 text-center p-8 font-bold bg-red-50 rounded-xl border border-red-200 m-4">
        起動エラーが発生しました。<br>
        ${e.message}
      </div>`;
    }
  }
}

function setupGlobalListeners() {
  if (headerBackBtn) {
    // Clone to remove existing listeners if any re-init happens
    const newBtn = headerBackBtn.cloneNode(true);
    headerBackBtn.parentNode.replaceChild(newBtn, headerBackBtn);
    
    // Re-select new button
    const currentBtn = document.getElementById('header-back-btn');
    currentBtn.addEventListener('click', () => {
      state.mode = 'START';
      render();
    });
  }
}

// --- Logic Helpers ---

function getWordsInRange() {
  return WORD_LIST.filter(w => w.id >= state.range.start && w.id <= state.range.end);
}

function startMode(mode) {
  try {
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
  } catch (e) {
    console.error("Mode Start Error:", e);
    alert("モード開始時にエラーが発生しました: " + e.message);
  }
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
  
  feedbackContent.className = `p-8 rounded-2xl shadow-2xl transform scale-100 text-center scale-in ${bgColor} text-white`;

  feedbackTitle.textContent = isCorrect ? '正解！ 🎉' : '不正解 😢';
  
  let answerText = "";
  if (state.mode === 'TYPING') {
    answerText = word.en;
  } else if (state.mode === 'MIXED') {
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
  if (!app) return;
  app.innerHTML = ''; // Clear current content

  // Update Header UI
  updateHeader();

  try {
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
        app.innerHTML = '<div class="text-red-500">Error: Unknown Mode</div>';
    }
  } catch (e) {
    console.error("Render Error:", e);
    app.innerHTML = `<div class="text-red-500 text-center p-4">描画エラーが発生しました: ${e.message}</div>`;
  }
}

function updateHeader() {
  const backBtn = document.getElementById('header-back-btn');
  
  if (state.mode === 'START') {
    if(backBtn) backBtn.classList.add('hidden');
    if(progressContainer) progressContainer.classList.add('hidden');
  } else if (state.mode !== 'LIST_VIEW' && state.mode !== 'REVIEW') {
    if(backBtn) backBtn.classList.remove('hidden');
    if(progressContainer) progressContainer.classList.remove('hidden');
    
    const total = state.queue.length;
    const current = state.currentIndex + 1;
    if (progressText) progressText.textContent = `${current} / ${total}`;
    if (progressBar) progressBar.style.width = `${total > 0 ? (state.currentIndex / total) * 100 : 0}%`;
  } else {
    if(backBtn) backBtn.classList.remove('hidden');
    if(progressContainer) progressContainer.classList.add('hidden');
  }
}

// 1. Start Screen
function renderStartScreen() {
  const container = document.createElement('div');
  container.className = "max-w-2xl mx-auto space-y-8 slide-up w-full";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl p-8 shadow-xl border border-slate-200";

  const titleDiv = document.createElement('div');
  titleDiv.innerHTML = `
    <h1 class="text-3xl font-bold text-slate-900 mb-2 text-center">英単語マスター</h1>
    <p class="text-slate-500 text-center mb-8">出題範囲とモードを選択してください</p>
  `;
  card.appendChild(titleDiv);

  // Range Selectors
  const rangeWrapper = document.createElement('div');
  rangeWrapper.className = "flex flex-col sm:flex-row gap-4 items-center justify-center mb-8 p-4 bg-slate-50 rounded-xl";

  const createInput = (label, value, onChange) => {
    const wrap = document.createElement('div');
    wrap.className = "flex items-center gap-2 w-full sm:w-auto";
    const span = document.createElement('span');
    span.className = "font-semibold text-slate-700 w-12";
    span.textContent = label;
    const input = document.createElement('input');
    input.type = "number";
    input.min = 1;
    input.max = WORD_LIST.length;
    input.value = value;
    input.className = "block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-3 border text-center";
    input.onchange = onChange;
    wrap.append(span, input);
    return { wrap, input };
  };

  const startObj = createInput('開始:', state.range.start, (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > WORD_LIST.length) val = WORD_LIST.length;
    state.range.start = val;
    if (state.range.end < state.range.start) {
      state.range.end = state.range.start;
      // Assuming endObj is available via closure or DOM update
      const endInput = rangeWrapper.querySelector('input:last-of-type');
      if (endInput) endInput.value = state.range.end;
    }
  });

  const arrow = document.createElement('div');
  arrow.className = "hidden sm:block text-slate-300 font-bold";
  arrow.textContent = "→";

  const endObj = createInput('終了:', state.range.end, (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > WORD_LIST.length) val = WORD_LIST.length;
    state.range.end = val;
    if (state.range.start > state.range.end) {
      state.range.start = state.range.end;
      const startInput = rangeWrapper.querySelector('input:first-of-type');
      if (startInput) startInput.value = state.range.start;
    }
  });

  rangeWrapper.append(startObj.wrap, arrow, endObj.wrap);
  card.appendChild(rangeWrapper);

  // Buttons
  const btnGrid = document.createElement('div');
  btnGrid.className = "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const createBtn = (iconSVG, title, sub, colorClass, onClick) => {
    const btn = document.createElement('button');
    // Extract color name e.g. "text-indigo-600" -> "indigo"
    const colorName = colorClass.split('-')[1]; 
    
    btn.className = `p-4 bg-white border-2 border-slate-200 hover:border-${colorName}-500 rounded-xl flex items-center gap-3 transition-all group w-full text-left`;
    btn.onclick = onClick;
    
    const iconContainer = document.createElement('div');
    iconContainer.className = `p-2 bg-${colorName}-50 ${colorClass} rounded-lg group-hover:bg-${colorName}-100`;
    iconContainer.innerHTML = iconSVG;

    const textContainer = document.createElement('div');
    textContainer.className = "flex-1";
    
    const mainText = document.createElement('span');
    mainText.className = `font-bold text-slate-700 block group-hover:text-${colorName}-700`;
    mainText.textContent = title;
    
    textContainer.appendChild(mainText);
    if (sub) {
        const subText = document.createElement('span');
        subText.className = "text-xs text-slate-400 block";
        subText.textContent = sub;
        textContainer.appendChild(subText);
    }

    btn.append(iconContainer, textContainer);
    return btn;
  };

  const icons = {
    book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    shuffle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    key: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    layers: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    alert: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  btnGrid.appendChild(createBtn(icons.book, "1. 単語一覧", null, "text-indigo-600", () => startMode('LIST_VIEW')));
  btnGrid.appendChild(createBtn(icons.shuffle, "2. ランダムクイズ", "英語 → 日本語", "text-blue-600", () => startMode('RANDOM_CHOICE')));
  btnGrid.appendChild(createBtn(icons.key, "3. タイピング", "日本語 → 英語", "text-purple-600", () => startMode('TYPING')));
  btnGrid.appendChild(createBtn(icons.layers, "4. 順番通りクイズ", `No.${state.range.start}から順番に`, "text-emerald-600", () => startMode('SEQUENTIAL_CHOICE')));
  
  const mixedBtn = createBtn(icons.settings, "5. ミックスモード", "ランダム & 入力", "text-orange-600", () => startMode('MIXED'));
  mixedBtn.classList.add("sm:col-span-2");
  btnGrid.appendChild(mixedBtn);

  const reviewBtn = createBtn(icons.alert, "6. 間違えた単語の復習", `${state.mistakes.length} 単語`, "text-rose-600", () => {
    if(state.mistakes.length === 0) {
        alert("間違えた単語はありません。");
        return;
    }
    state.mode = 'REVIEW';
    render();
  });
  reviewBtn.classList.add("sm:col-span-2");
  btnGrid.appendChild(reviewBtn);

  card.appendChild(btnGrid);
  container.appendChild(card);
  app.appendChild(container);
}

// 2. List View (with Search)
function renderListView() {
  const queue = getWordsInRange();
  const container = document.createElement('div');
  container.className = "w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 slide-up";

  // Header
  const header = document.createElement('div');
  header.className = "bg-indigo-600 p-4";
  header.innerHTML = `<h2 class="text-xl font-bold text-white text-center">単語一覧 (${state.range.start} - ${state.range.end})</h2>`;
  container.appendChild(header);

  // Search Bar
  const searchContainer = document.createElement('div');
  searchContainer.className = "p-4 border-b border-slate-200 bg-slate-50";
  searchContainer.innerHTML = `
    <div class="relative max-w-md mx-auto">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
        </div>
        <input type="text" id="word-search-input" class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm" placeholder="単語を検索 (英語 / 日本語)...">
    </div>
  `;
  container.appendChild(searchContainer);

  // Table Container
  const tableContainer = document.createElement('div');
  tableContainer.className = "overflow-x-auto";
  
  const table = document.createElement('table');
  table.className = "w-full text-left text-sm text-slate-600";
  table.innerHTML = `
    <thead class="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
      <tr>
        <th class="px-6 py-3">No.</th>
        <th class="px-6 py-3">日本語</th>
        <th class="px-6 py-3">英語</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100" id="word-list-tbody">
      <!-- Rows will be injected here -->
    </tbody>
  `;
  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
  app.appendChild(container);

  // Logic for filtering rows without full re-render
  const tbody = table.querySelector('#word-list-tbody');
  const searchInput = searchContainer.querySelector('#word-search-input');

  const renderRows = (filterText) => {
    const term = filterText.toLowerCase();
    const filtered = queue.filter(w => 
        w.en.toLowerCase().includes(term) || 
        w.ja.includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500">検索結果が見つかりませんでした。</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((word, index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
          <td class="px-6 py-4 font-medium text-slate-900">${word.id}</td>
          <td class="px-6 py-4">${word.ja}</td>
          <td class="px-6 py-4 font-bold text-indigo-600">${word.en}</td>
        </tr>
    `).join('');
  };

  // Initial render of rows
  renderRows("");

  // Event Listener for live search
  searchInput.addEventListener('input', (e) => {
    renderRows(e.target.value);
  });
  
  // Auto-focus search input
  setTimeout(() => searchInput.focus(), 50);
}

// 3. Choice Quiz (Random & Sequential)
function renderChoiceQuiz() {
  const currentWord = state.queue[state.currentIndex];
  if (!currentWord) return;

  const container = document.createElement('div');
  container.className = "w-full max-w-2xl mx-auto slide-up";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200";

  const labelText = state.mode === 'RANDOM_CHOICE' ? "ランダムクイズ" : (state.mode === 'MIXED' ? "ミックスモード (選択)" : "順番通りクイズ");

  const header = document.createElement('div');
  header.className = "bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center";
  header.innerHTML = `
    <p class="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">${labelText}</p>
    <h2 class="text-5xl font-extrabold text-white mb-4 drop-shadow-md">${currentWord.en}</h2>
  `;
  card.appendChild(header);

  const optionsGrid = document.createElement('div');
  optionsGrid.className = "p-8 grid grid-cols-1 md:grid-cols-2 gap-4";

  // Generate Distractors
  const distractors = WORD_LIST
    .filter(w => w.id !== currentWord.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  const choices = [...distractors, currentWord].sort(() => 0.5 - Math.random());

  choices.forEach(option => {
    const btn = document.createElement('button');
    btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md active:scale-95";
    btn.textContent = option.ja;
    btn.onclick = () => {
      // Disable all buttons
      const allBtns = optionsGrid.querySelectorAll('button');
      allBtns.forEach(b => b.disabled = true);
      
      const isCorrect = option.id === currentWord.id;
      
      // Highlight
      if (isCorrect) {
        btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-green-500 border-green-600 text-white scale-105";
      } else {
        btn.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-red-100 border-red-200 text-red-400 opacity-50";
        // Highlight correct one
        allBtns.forEach(b => {
          if (b.textContent === currentWord.ja) {
             b.className = "p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2 bg-green-500 border-green-600 text-white scale-105";
          }
        });
      }

      handleAnswer(isCorrect, currentWord);
    };
    optionsGrid.appendChild(btn);
  });

  card.appendChild(optionsGrid);
  container.appendChild(card);
  app.appendChild(container);
}

// 4. Typing Quiz
function renderTypingQuiz() {
  const currentWord = state.queue[state.currentIndex];
  if (!currentWord) return;

  const container = document.createElement('div');
  container.className = "w-full max-w-2xl mx-auto slide-up";

  const card = document.createElement('div');
  card.className = "bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200";

  const labelText = state.mode === 'MIXED' ? "ミックスモード (入力)" : "タイピングチャレンジ";

  const header = document.createElement('div');
  header.className = "bg-gradient-to-r from-purple-500 to-pink-600 p-8 text-center";
  header.innerHTML = `
    <p class="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-2">${labelText}</p>
    <h2 class="text-4xl font-extrabold text-white mb-2">${currentWord.ja}</h2>
    <p class="text-white/80 text-sm">英単語を入力してください</p>
  `;
  card.appendChild(header);

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

// 5. Mixed Quiz
function renderMixedQuiz() {
  if (Math.random() > 0.5) {
    renderTypingQuiz();
  } else {
    renderChoiceQuiz();
  }
}

// 6. Review Screen
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
    const retryBtn = document.getElementById('retry-btn');
    if(retryBtn) retryBtn.onclick = () => {
      state.mode = 'START';
      render();
    };
    return;
  }

  container.innerHTML = `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
      <h2 class="text-2xl font-bold text-amber-900">復習</h2>
      <p class="text-amber-700 mb-4">${mistakesList.length} 個の単語を間違えました。</p>
      <button id="clear-mistakes-btn" class="px-4 py-2 bg-white border border-amber-300 text-amber-600 rounded-lg font-bold hover:bg-amber-100 hover:text-amber-800 transition-colors inline-flex items-center gap-2 text-sm shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        履歴を消去
      </button>
    </div>
    <div id="mistake-list" class="grid grid-cols-1 gap-4"></div>
  `;

  const clearBtn = container.querySelector('#clear-mistakes-btn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('間違えた単語の履歴をすべて消去しますか？')) {
        state.mistakes = [];
        render();
      }
    };
  }

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
    list.appendChild(item);
  });

  app.appendChild(container);
}

// Start the app
init();
