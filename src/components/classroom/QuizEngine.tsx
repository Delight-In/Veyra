import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { CheckCircle2, XCircle, Award, RotateCcw, HelpCircle } from 'lucide-react';

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete?: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ questions, onComplete }) => {
  const { language, t } = useLanguage();
  const { addXp } = useStudy();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 dark:text-slate-400">
          {language === 'hi' ? 'इस विषय के लिए अभी कोई प्रश्न उपलब्ध नहीं हैं।' : 'No quiz questions currently available for this topic.'}
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correctOptionIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
      addXp(100);
      if (onComplete) onComplete();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('quiz.finalScore')}
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          {t('quiz.scoreText')}: <strong className="text-indigo-600 dark:text-indigo-400 text-xl">{score} / {questions.length} ({percentage}%)</strong>
        </p>
        <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-sm">
          {t('quiz.earnedXp')}
        </div>
        <div className="pt-4">
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            {t('quiz.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span>
          {t('quiz.questionNum')} {currentIndex + 1} {language === 'hi' ? 'कुल' : 'of'} {questions.length}
        </span>
        <span className="text-indigo-600 dark:text-indigo-400">
          {Math.round(((currentIndex) / questions.length) * 100)}% {language === 'hi' ? 'प्रगति' : 'Progress'}
        </span>
      </div>

      {/* Question Prompt */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ.question[language]}
        </h3>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {currentQ.options[language].map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQ.correctOptionIndex;

          let btnClass = 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';

          if (isSubmitted) {
            if (isCorrect) {
              btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30';
            } else if (isSelected && !isCorrect) {
              btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30';
            }
          } else if (isSelected) {
            btnClass = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/30';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isSubmitted}
              className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${btnClass}`}
            >
              <span className="font-medium text-sm md:text-base leading-snug">{opt}</span>
              {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />}
              {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      {/* Immediate Explanation Box */}
      {isSubmitted && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200 space-y-2">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            {selectedOption === currentQ.correctOptionIndex ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {t('quiz.correctNotice')}
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> {t('quiz.incorrectNotice')}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentQ.explanation[language]}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all ${selectedOption === null ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {t('quiz.submitAnswer')}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
          >
            {currentIndex + 1 < questions.length ? t('quiz.nextQuestion') : t('quiz.finalScore')}
          </button>
        )}
      </div>
    </div>
  );
};
