import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { WORD_LIST } from '../constants';
import { explainWord } from '../services/geminiService';
import { Loader2, Volume2, HelpCircle } from 'lucide-react';

// --- Shared Components ---

const Feedback = ({ isCorrect, answer }: { isCorrect: boolean | null; answer: string }) => {
  if (isCorrect === null) return null;
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300 ${isCorrect ? 'bg-green-100/20' : 'bg-red-100/20'}`}>
      <div className={`p-8 rounded-2xl shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-300 ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
        <h2 className="text-4xl font-bold mb-2">{isCorrect ? '正解！ 🎉' : '不正解 😢'}</h2>
        {!isCorrect && <p className="text-xl">正解: {answer}</p>}
      </div>
    </div>
  );
};

// --- Mode 1: List View ---

export const WordListView = ({ words }: { words: Word[] }) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div className="bg-indigo-600 p-4">
        <h2 className="text-xl font-bold text-white text-center">単語一覧</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">No.</th>
              <th className="px-6 py-3">日本語</th>
              <th className="px-6 py-3">英語</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {words.map((word, index) => (
              <tr key={word.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-6 py-4 font-medium text-slate-900">{word.id}</td>
                <td className="px-6 py-4">{word.ja}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">{word.en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Mode 2 & 4: Choice Quiz ---

interface ChoiceQuizProps {
  currentWord: Word;
  allWords: Word[];
  onAnswer: (isCorrect: boolean) => void;
  modeLabel: string;
}

export const ChoiceQuiz = ({ currentWord, allWords, onAnswer, modeLabel }: ChoiceQuizProps) => {
  const [options, setOptions] = useState<Word[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);

  useEffect(() => {
    // Generate distractors
    const distractors = allWords
      .filter((w) => w.id !== currentWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const choices = [...distractors, currentWord].sort(() => 0.5 - Math.random());
    setOptions(choices);
    setAnswered(null);
  }, [currentWord, allWords]);

  const handleSelect = (selectedWord: Word) => {
    if (answered !== null) return;
    const isCorrect = selectedWord.id === currentWord.id;
    setAnswered(isCorrect);
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Feedback isCorrect={answered} answer={currentWord.ja} />
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
          <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">{modeLabel}</p>
          <h2 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">{currentWord.en}</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={answered !== null}
              className={`p-6 rounded-xl text-lg font-bold transition-all duration-200 shadow-sm border-2
                ${answered !== null && option.id === currentWord.id
                  ? 'bg-green-500 border-green-600 text-white scale-105'
                  : answered !== null && option.id !== currentWord.id
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md active:scale-95'
                }`}
            >
              {option.ja}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Mode 3: Typing Quiz ---

interface TypingQuizProps {
  currentWord: Word;
  onAnswer: (isCorrect: boolean) => void;
}

export const TypingQuiz = ({ currentWord, onAnswer }: TypingQuizProps) => {
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput("");
    setAnswered(null);
    inputRef.current?.focus();
  }, [currentWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answered !== null || !input.trim()) return;

    const isCorrect = input.trim().toLowerCase() === currentWord.en.toLowerCase();
    setAnswered(isCorrect);
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Feedback isCorrect={answered} answer={currentWord.en} />
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-8 text-center">
          <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider mb-2">タイピングチャレンジ</p>
          <h2 className="text-4xl font-extrabold text-white mb-2">{currentWord.ja}</h2>
          <p className="text-white/80 text-sm">英単語を入力してください</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={answered !== null}
              placeholder="回答を入力..."
              className="w-full p-4 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || answered !== null}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              回答する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Mode 6: Review Screen ---

interface ReviewScreenProps {
  mistakeIds: number[];
  onRetry: () => void;
}

export const ReviewScreen = ({ mistakeIds, onRetry }: ReviewScreenProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const mistakes = WORD_LIST.filter(w => mistakeIds.includes(w.id));

  const handleExplain = async (word: Word) => {
    if (loadingId) return;
    setLoadingId(word.id);
    setExplanation(null);
    const result = await explainWord(word.en);
    setExplanation(result);
    setLoadingId(null);
  };

  if (mistakes.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl shadow-lg">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">全問正解！</h2>
        <p className="text-slate-600 mb-6">間違えた問題はありません。</p>
        <button onClick={onRetry} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
          メニューに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-amber-900">復習</h2>
        <p className="text-amber-700">{mistakes.length} 個の単語を間違えました。復習しましょう。</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mistakes.map(word => (
          <div key={word.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-indigo-600">{word.en}</span>
                <span className="text-slate-500">#{word.id}</span>
              </div>
              <p className="text-lg text-slate-800">{word.ja}</p>
            </div>
            
            <div className="flex gap-2">
               <button 
                onClick={() => handleExplain(word)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                disabled={loadingId !== null}
              >
                {loadingId === word.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                {loadingId === word.id ? 'Geminiに質問中...' : 'AI解説を見る'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {explanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setExplanation(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-indigo-600">✨</span> Geminiによる解説
            </h3>
            <div className="prose prose-slate text-slate-600 leading-relaxed whitespace-pre-wrap">
              {explanation}
            </div>
            <button 
              onClick={() => setExplanation(null)}
              className="mt-6 w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};