import React, { useState, useMemo, useEffect } from 'react';
import { AppMode, Word, Range } from './types';
import { WORD_LIST } from './constants';
import { WordListView, ChoiceQuiz, TypingQuiz, ReviewScreen } from './components/QuizComponents';
import { Settings, BookOpen, Key, Shuffle, Layers, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.START);
  const [range, setRange] = useState<Range>({ start: 1, end: WORD_LIST.length });
  const [quizQueue, setQuizQueue] = useState<Word[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [mistakeIds, setMistakeIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // --- Derived State ---
  const currentWord = quizQueue[currentQueueIndex];
  const progress = quizQueue.length > 0 ? ((currentQueueIndex) / quizQueue.length) * 100 : 0;

  // --- Helpers ---
  const getWordsInRange = () => {
    return WORD_LIST.filter(w => w.id >= range.start && w.id <= range.end);
  };

  const startMode = (newMode: AppMode) => {
    let queue = getWordsInRange();
    
    if (newMode === AppMode.RANDOM_CHOICE || newMode === AppMode.MIXED) {
      // Shuffle for random modes
      queue = [...queue].sort(() => Math.random() - 0.5);
    } else if (newMode === AppMode.SEQUENTIAL_CHOICE || newMode === AppMode.TYPING) {
      // Ensure sorted by ID for sequential
      queue = [...queue].sort((a, b) => a.id - b.id);
    }

    setQuizQueue(queue);
    setCurrentQueueIndex(0);
    setScore(0);
    // Note: We do NOT clear mistakeIds here to allow accumulation, or we could clear it. 
    // Requirement #6 says "Display words mistaken in 2~5". Let's accumulate for the session.
    // If user wants to clear, they can refresh.
    setMode(newMode);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setMistakeIds(prev => Array.from(new Set([...prev, currentWord.id])));
    }

    if (currentQueueIndex < quizQueue.length - 1) {
      setCurrentQueueIndex(prev => prev + 1);
    } else {
      // Quiz Complete
      setTimeout(() => {
        alert(`クイズ終了！ スコア: ${score + (isCorrect ? 1 : 0)}/${quizQueue.length}`);
        setMode(AppMode.START);
      }, 500);
    }
  };

  const handleMixedAnswer = (isCorrect: boolean) => {
    handleAnswer(isCorrect);
  };

  // Determine sub-mode for Mixed Mode (randomly pick Typing or Choice)
  const isMixedTyping = useMemo(() => {
     return Math.random() > 0.5;
  }, [currentQueueIndex, mode]); // Re-roll when index changes

  // --- Renderers ---

  const renderStartScreen = () => {
    const totalWords = WORD_LIST.length;
    const options = Array.from({ length: totalWords }, (_, i) => i + 1);

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">英単語マスター</h1>
          <p className="text-slate-500 text-center mb-8">出題範囲とモードを選択してください</p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-slate-700 w-12">開始:</span>
              <select 
                value={range.start}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRange(prev => ({ ...prev, start: val, end: Math.max(val, prev.end) }));
                }}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10 border"
              >
                {options.map(n => <option key={`s-${n}`} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="hidden sm:block text-slate-300">→</div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-slate-700 w-12">終了:</span>
              <select 
                value={range.end}
                onChange={(e) => {
                   const val = Number(e.target.value);
                   setRange(prev => ({ ...prev, end: val, start: Math.min(val, prev.start) }));
                }}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10 border"
              >
                {options.map(n => <option key={`e-${n}`} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => startMode(AppMode.LIST_VIEW)} className="p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-xl flex items-center gap-3 transition-all group">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100"><BookOpen size={20} /></div>
              <span className="font-bold text-slate-700 group-hover:text-indigo-700">1. 単語一覧</span>
            </button>

            <button onClick={() => startMode(AppMode.RANDOM_CHOICE)} className="p-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl flex items-center gap-3 transition-all group">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100"><Shuffle size={20} /></div>
              <div className="text-left">
                <span className="font-bold text-slate-700 group-hover:text-blue-700 block">2. ランダムクイズ</span>
                <span className="text-xs text-slate-400">英語 → 日本語</span>
              </div>
            </button>

            <button onClick={() => startMode(AppMode.TYPING)} className="p-4 bg-white border-2 border-slate-200 hover:border-purple-500 hover:text-purple-600 rounded-xl flex items-center gap-3 transition-all group">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100"><Key size={20} /></div>
              <div className="text-left">
                <span className="font-bold text-slate-700 group-hover:text-purple-700 block">3. タイピング</span>
                <span className="text-xs text-slate-400">日本語 → 英語</span>
              </div>
            </button>

            <button onClick={() => startMode(AppMode.SEQUENTIAL_CHOICE)} className="p-4 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 rounded-xl flex items-center gap-3 transition-all group">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100"><Layers size={20} /></div>
              <div className="text-left">
                <span className="font-bold text-slate-700 group-hover:text-emerald-700 block">4. 順番通りクイズ</span>
                <span className="text-xs text-slate-400">No.{range.start}から順番に</span>
              </div>
            </button>

            <button onClick={() => startMode(AppMode.MIXED)} className="p-4 bg-white border-2 border-slate-200 hover:border-orange-500 hover:text-orange-600 rounded-xl flex items-center gap-3 transition-all group sm:col-span-2">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100"><Settings size={20} /></div>
              <span className="font-bold text-slate-700 group-hover:text-orange-700">5. ミックスモード (ランダム & 入力)</span>
            </button>
            
            <button onClick={() => setMode(AppMode.REVIEW)} className="p-4 bg-white border-2 border-slate-200 hover:border-rose-500 hover:text-rose-600 rounded-xl flex items-center gap-3 transition-all group sm:col-span-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100"><AlertCircle size={20} /></div>
              <div className="text-left flex-1 flex justify-between items-center">
                 <span className="font-bold text-slate-700 group-hover:text-rose-700">6. 間違えた単語の復習</span>
                 {mistakeIds.length > 0 && <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">{mistakeIds.length}</span>}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.START:
        return renderStartScreen();
      
      case AppMode.LIST_VIEW:
        return <WordListView words={getWordsInRange()} />;

      case AppMode.RANDOM_CHOICE:
      case AppMode.SEQUENTIAL_CHOICE:
        if (!currentWord) return <div>Done</div>;
        return (
          <ChoiceQuiz 
            currentWord={currentWord} 
            allWords={WORD_LIST} 
            onAnswer={handleAnswer} 
            modeLabel={mode === AppMode.RANDOM_CHOICE ? "ランダムクイズ" : "順番通りクイズ"} 
          />
        );

      case AppMode.TYPING:
        if (!currentWord) return <div>Done</div>;
        return (
          <TypingQuiz 
            currentWord={currentWord} 
            onAnswer={handleAnswer} 
          />
        );

      case AppMode.MIXED:
        if (!currentWord) return <div>Done</div>;
        if (isMixedTyping) {
          return <TypingQuiz currentWord={currentWord} onAnswer={handleMixedAnswer} />;
        } else {
          return <ChoiceQuiz currentWord={currentWord} allWords={WORD_LIST} onAnswer={handleMixedAnswer} modeLabel="ミックスモード" />;
        }

      case AppMode.REVIEW:
        return <ReviewScreen mistakeIds={mistakeIds} onRetry={() => setMode(AppMode.START)} />;
        
      default:
        return <div>Unknown Mode</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode !== AppMode.START && (
              <button 
                onClick={() => setMode(AppMode.START)}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <span className="font-bold text-xl tracking-tight text-slate-900">LinguaMaster</span>
          </div>
          {mode !== AppMode.START && mode !== AppMode.REVIEW && mode !== AppMode.LIST_VIEW && (
             <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm font-medium text-slate-500">
                  {currentQueueIndex + 1} / {quizQueue.length}
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex items-start justify-center">
        <div className="w-full">
           {renderContent()}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} LinguaMaster Quiz. Powered by React & Gemini.</p>
      </footer>
    </div>
  );
}