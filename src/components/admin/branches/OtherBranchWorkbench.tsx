import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Volume2, Sparkles, BookOpen, Layers, Plus, CheckCircle2, MessageSquare, Globe2 } from 'lucide-react';

export const OtherBranchWorkbench: React.FC = () => {
  const { language, speakText } = useLanguage();

  const [textToRead, setTextToRead] = useState<string>(
    'नमस्ते दोस्तों! आज हम हमारे सौरमंडल के आठ ग्रहों और उनके अद्भुत रहस्यों के बारे में जानेंगे।'
  );
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [flashcardFront, setFlashcardFront] = useState<string>('गुरुत्वाकर्षण (Gravity)');
  const [flashcardBack, setFlashcardBack] = useState<string>('ब्रह्मांड में द्रव्यमान वाले सभी पिंडों के बीच लगने वाला आकर्षण बल।');
  const [cardCreated, setCardCreated] = useState<boolean>(false);

  const handleTestSpeech = () => {
    speakText(textToRead, 'hi');
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardFront.trim() || !flashcardBack.trim()) return;
    setCardCreated(true);
    setTimeout(() => {
      setCardCreated(false);
      setFlashcardFront('');
      setFlashcardBack('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Other / Humanities Discipline Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-card border border-purple-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Globe2 className="w-4 h-4" />
            <span>HUMANITIES, LANGUAGES & NARRATIVE WORKBENCH</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {language === 'hi' ? 'मानविकी, भाषा साहित्य एवं ऑडियो स्टूडियो' : 'Humanities, Languages & Devanagari Audio Studio'}
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl font-devanagari">
            {language === 'hi'
              ? 'देवनागरी ऑडियो व्याख्या तैयार करें, उच्चारण की गति निर्धारित करें और द्विभाषी शब्दावली कार्ड बनाएं।'
              : 'Synthesize Devanagari Hindi educational audio scripts, design vocabulary flashcards, and curate narrative learning modules.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Devanagari Speech Synthesis Studio */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-500" />
              <span>Devanagari Audio Synthesis & Speech Engine</span>
            </h3>
            <span className="text-[10px] font-mono text-purple-500">Web Speech API</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-devanagari">
              हिन्दी ऑडियो स्क्रिप्ट (उच्चारण परीक्षण):
            </label>
            <textarea
              rows={4}
              value={textToRead}
              onChange={e => setTextToRead(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 block">
                Speech Rate: {speechRate}x
              </label>
              <input
                type="range"
                min={0.7}
                max={1.3}
                step={0.1}
                value={speechRate}
                onChange={e => setSpeechRate(Number(e.target.value))}
                className="w-32 accent-purple-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleTestSpeech}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>उच्चारण सुनें (Listen)</span>
            </button>
          </div>
        </div>

        {/* Right: Bilingual Flashcards & Vocabulary Builder */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Bilingual Flashcards & Vocabulary Creator</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Spaced Repetition</span>
          </div>

          {cardCreated && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Flashcard added to humanities deck!</span>
            </div>
          )}

          <form onSubmit={handleCreateCard} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Card Front (Term / Concept)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. प्रकाश संश्लेषण (Photosynthesis)"
                value={flashcardFront}
                onChange={e => setFlashcardFront(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Card Back (Explanation / Definition)
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. पौधों द्वारा सूर्य के प्रकाश, जल और कार्बन डाइऑक्साइड से भोजन बनाने की प्रक्रिया।"
                value={flashcardBack}
                onChange={e => setFlashcardBack(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
              >
                + Add to Humanities Deck
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
