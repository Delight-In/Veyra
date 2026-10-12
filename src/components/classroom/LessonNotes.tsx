import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Save, Download, FileText, Check, Sparkles, Volume2, Bookmark, CheckCircle2, ListChecks } from 'lucide-react';
import { speakWithIndianAccent, preloadSpeechVoices } from '../../utils/speechVoice';

interface LessonNotesProps {
  nodeId: string;
  nodeTitle: string;
  instructorNotes?: {
    title?: string;
    contentMarkdown?: string;
    keyTakeaways?: string[];
  };
  nodeSummary?: string;
}

export const LessonNotes: React.FC<LessonNotesProps> = ({ 
  nodeId, 
  nodeTitle,
  instructorNotes,
  nodeSummary
}) => {
  const { getNotes, saveNotes } = useStudy();
  const { language, t } = useLanguage();

  const [notes, setNotes] = useState<string>('');
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [isSpeakingNotes, setIsSpeakingNotes] = useState<boolean>(false);

  useEffect(() => {
    preloadSpeechVoices();
    setNotes(getNotes(nodeId));
  }, [nodeId]);

  const handleSave = () => {
    saveNotes(nodeId, notes);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleDownload = () => {
    const combinedContent = `=== ${nodeTitle} Official Study Notes ===\n` +
      `${instructorNotes?.title || nodeTitle}\n\n` +
      `${instructorNotes?.contentMarkdown || 'No official notes text.'}\n\n` +
      `Key Takeaways:\n` +
      `${(instructorNotes?.keyTakeaways || []).map(k => `* ${k}`).join('\n')}\n\n` +
      `=== Student Scratchpad Notes ===\n` +
      `${notes || '(No student personal notes recorded)'}\n`;

    const element = document.createElement('a');
    const file = new Blob([combinedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${nodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}_master_notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported in this browser.');
      return;
    }

    if (isSpeakingNotes) {
      window.speechSynthesis.cancel();
      setIsSpeakingNotes(false);
      return;
    }

    const intro = language === 'hi' ? 'नमस्ते दोस्तों! ' : 'Namaste! ';
    const takeawaysPrefix = language === 'hi' ? 'मुख्य सिद्धांत: ' : 'Key takeaways: ';
    const textToRead = intro + `${instructorNotes?.title || nodeTitle}. ` +
      `${instructorNotes?.contentMarkdown || nodeSummary || ''}. ` +
      (instructorNotes?.keyTakeaways?.length ? `${takeawaysPrefix}${instructorNotes.keyTakeaways.join(language === 'hi' ? '। ' : '. ')}` : '');

    setIsSpeakingNotes(true);
    speakWithIndianAccent(textToRead, {
      lang: language === 'hi' ? 'hi' : 'en',
      rate: 0.92,
      onEnd: () => setIsSpeakingNotes(false),
      onError: () => setIsSpeakingNotes(false),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. OFFICIAL INSTRUCTOR NOTES & KEY TAKEAWAYS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {language === 'hi' ? 'आधिकारिक विषय अध्ययन नोट्स' : 'OFFICIAL TOPIC STUDY NOTES'}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {instructorNotes?.title || (language === 'hi' ? `${nodeTitle} - मुख्य नोट्स` : `${nodeTitle} - Master Notes`)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReadAloud}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isSpeakingNotes
                  ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title={language === 'hi' ? 'नोट्स को बोलकर सुनें' : 'Read official notes aloud'}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeakingNotes ? (language === 'hi' ? 'वाचन रोकें' : 'Stop Reading') : (language === 'hi' ? 'नोट्स सुनें' : 'Listen Notes')}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              title={language === 'hi' ? 'नोट्स डाउनलोड करें (.txt)' : 'Download Notes (.txt)'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'डाउनलोड' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-devanagari space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="whitespace-pre-wrap">
            {instructorNotes?.contentMarkdown || nodeSummary || (
              language === 'hi' 
                ? 'इस विषय के लिए आधिकारिक अध्ययन नोट्स उपलब्ध हैं। मुख्य बिंदुओं का सारांश नीचे देखें।'
                : 'Comprehensive conceptual notes and formulation analysis for this module.'
            )}
          </div>
        </div>

        {/* Key Takeaways */}
        {instructorNotes?.keyTakeaways && instructorNotes.keyTakeaways.length > 0 && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2.5">
            <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'hi' ? 'महत्वपूर्ण निष्कर्ष एवं सूत्र' : 'Key Takeaways & Essential Concepts'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {instructorNotes.keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. STUDENT PERSONAL STUDY SCRATCHPAD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'व्यक्तिगत अध्ययन नोटबुक (स्क्रैचपैड)' : 'My Personal Study Notepad'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === 'hi' ? 'अपने व्यक्तिगत नोट्स यहाँ लिखें, यह स्वतः सुरक्षित हो जाएगा।' : 'Write your personal reflections and problem solutions. Auto-persisted.'}
              </p>
            </div>
          </div>

          {justSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सहेजा गया!' : 'Saved!'}</span>
            </span>
          )}
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={language === 'hi' ? 'इस विषय पर अपने व्यक्तिगत नोट्स, सूत्र और विचार यहाँ दर्ज करें...' : 'Record your thoughts, derivations, questions, and revision notes here...'}
          className="w-full h-44 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed resize-y"
        />

        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{notes.length} {language === 'hi' ? 'अक्षर' : 'characters'}</span>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'नोट्स सहेजें' : 'Save My Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

