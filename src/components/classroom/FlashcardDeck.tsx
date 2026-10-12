import React, { useState } from 'react';
import { Flashcard } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { RotateCcw, Lightbulb, Check } from 'lucide-react';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const { language, t } = useLanguage();
  const { addXp } = useStudy();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [reviewedCount, setReviewedCount] = useState<number>(0);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500">
          {language === 'hi' ? 'इस विषय के लिए कोई फ्लैशकार्ड उपलब्ध नहीं हैं।' : 'No flashcards available for this topic.'}
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = (_difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    addXp(15);
    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span>
          {language === 'hi' ? 'कार्ड' : 'Card'} {currentIndex + 1} {language === 'hi' ? 'कुल' : 'of'} {cards.length}
        </span>
        <span className="text-indigo-600 dark:text-indigo-400">
          {reviewedCount} {language === 'hi' ? 'कार्ड दोहराए गए' : 'cards reviewed'}
        </span>
      </div>

      {/* 3D Flip Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[220px] bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800/70 dark:to-indigo-950/30 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all select-none relative group"
      >
        <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
          {isFlipped 
            ? (language === 'hi' ? 'उत्तर (Back)' : 'Answer') 
            : (language === 'hi' ? 'प्रश्न (Front)' : 'Question')}
        </div>

        <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 max-w-md font-devanagari">
          {isFlipped 
            ? (currentCard.back[language] || currentCard.back.en) 
            : (currentCard.front[language] || currentCard.front.en)}
        </p>

        <span className="text-[11px] text-slate-400 mt-4 group-hover:text-indigo-500 transition-colors font-devanagari">
          {t('flashcards.clickToFlip')}
        </span>
      </div>

      {/* Hint toggle */}
      {currentCard.hint && (
        <div className="text-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1 hover:underline font-devanagari"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? (currentCard.hint[language] || currentCard.hint.en) : t('flashcards.hint')}
          </button>
        </div>
      )}

      {/* Spaced repetition rating buttons */}
      {isFlipped && (
        <div className="space-y-2 pt-2 animate-in fade-in duration-200">
          <div className="text-center text-xs font-semibold text-slate-500">
            {t('flashcards.ratingPrompt')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleRate('again')}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-bold transition-all text-center"
            >
              {t('flashcards.again')}
            </button>
            <button
              onClick={() => handleRate('hard')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 text-xs font-bold transition-all text-center"
            >
              {t('flashcards.hard')}
            </button>
            <button
              onClick={() => handleRate('good')}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 text-xs font-bold transition-all text-center"
            >
              {t('flashcards.good')}
            </button>
            <button
              onClick={() => handleRate('easy')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs font-bold transition-all text-center"
            >
              {t('flashcards.easy')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
