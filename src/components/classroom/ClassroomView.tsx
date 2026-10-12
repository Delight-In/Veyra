import React, { useState, useEffect, useRef } from 'react';
import { ContentNode } from '../../types';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { SimulationSandbox } from './SimulationSandbox';
import { QuizEngine } from './QuizEngine';
import { CodingSandbox } from './CodingSandbox';
import { FlowchartViewer } from './FlowchartViewer';
import { CourseAccessGate } from './CourseAccessGate';
import { MarkdownPreview } from '../admin/MarkdownPreview';
import { 
  PlayCircle, BookOpen, HelpCircle, CheckCircle2, 
  ChevronLeft, ChevronRight, FileText, Sparkles,
  Code2, GitBranch, Headphones, Image as ImageIcon, Volume2,
  Pause
} from 'lucide-react';
import { speakWithIndianAccent, preloadSpeechVoices } from '../../utils/speechVoice';

interface ClassroomViewProps {
  initialNode: ContentNode;
  onNavigateCourses: () => void;
  defaultTab?: string;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ 
  initialNode, 
  onNavigateCourses 
}) => {
  const { nodes, getNodeById, getChildNodes } = useContent();
  const { language } = useLanguage();
  const { isCompleted, markCompleted } = useStudy();
  const { canAccessNode } = useAuth();

  const [activeNode, setActiveNode] = useState<ContentNode>(initialNode);

  // Audio explanation narration state (defaults to active user language)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioLang, setAudioLang] = useState<'en' | 'hi'>(language === 'hi' ? 'hi' : 'en');
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [showFullAudioModal, setShowFullAudioModal] = useState<boolean>(false);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudioLang(language === 'hi' ? 'hi' : 'en');
  }, [language]);

  // Sync state reactively whenever initialNode or the global nodes list changes
  useEffect(() => {
    const fresh = getNodeById(initialNode.id) || nodes.find(n => n.id === initialNode.id) || initialNode;
    setActiveNode(fresh);
  }, [initialNode, nodes, getNodeById]);

  // Preload Indian voices and clean up any ongoing TTS on unmount
  useEffect(() => {
    preloadSpeechVoices();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
    };
  }, []);

  // Find siblings / unit peers for peer navigation
  const parentNode = activeNode.parentId ? getNodeById(activeNode.parentId) : null;
  const unitPeers = parentNode ? getChildNodes(parentNode.id) : [activeNode];

  const title = activeNode.translations[language]?.title || activeNode.translations.en?.title || activeNode.id;
  const desc = activeNode.translations[language]?.description || activeNode.translations.en?.description || '';
  const bodyText = activeNode.translations[language]?.body || activeNode.translations.en?.body || desc;

  const completed = isCompleted(activeNode.id);

  // Next and Prev peer handlers
  const currentIndex = unitPeers.findIndex(n => n.id === activeNode.id);
  const prevPeer = currentIndex > 0 ? unitPeers[currentIndex - 1] : null;
  const nextPeer = currentIndex >= 0 && currentIndex < unitPeers.length - 1 ? unitPeers[currentIndex + 1] : null;

  // Check course access permission
  const accessCheck = canAccessNode(activeNode);

  if (!accessCheck.hasAccess) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <CourseAccessGate
          node={activeNode}
          accessCheck={accessCheck}
          onNavigateCourses={onNavigateCourses}
        />
      </div>
    );
  }

  // Build spoken narration script covering what's on the page
  const buildSpokenExplanation = (): string => {
    if (audioLang === 'hi') {
      // 1. Author-configured Hindi script
      if (activeNode.audioExplanation?.scriptHi && activeNode.audioExplanation.scriptHi.trim()) {
        return activeNode.audioExplanation.scriptHi;
      }

      // 2. Prioritize Hindi title and description
      const hiTitle = activeNode.translations.hi?.title || activeNode.translations.en?.title || activeNode.id;
      const hiDesc = activeNode.translations.hi?.description || activeNode.translations.hi?.body || activeNode.translations.en?.description || '';

      const parts = [`नमस्ते दोस्तों! आज का विषय है: ${hiTitle}।`];
      if (hiDesc) parts.push(hiDesc);

      // Revision notes & takeaways
      if (activeNode.notes?.title) {
        parts.push(`अध्ययन नोट्स: ${activeNode.notes.title}।`);
      }
      if (activeNode.notes?.keyTakeaways && activeNode.notes.keyTakeaways.length > 0) {
        parts.push(`मुख्य सिद्धांत: ${activeNode.notes.keyTakeaways.join('। ')}।`);
      }
      return parts.join(' ');
    } else {
      // 1. Author-configured English script
      if (activeNode.audioExplanation?.scriptEn && activeNode.audioExplanation.scriptEn.trim()) {
        return activeNode.audioExplanation.scriptEn;
      }

      const enTitle = activeNode.translations.en?.title || activeNode.translations[language]?.title || activeNode.id;
      const enDesc = activeNode.translations.en?.description || '';

      const parts = [`Namaste and welcome! Today's topic is ${enTitle}.`];
      if (enDesc) parts.push(enDesc);
      if (activeNode.notes?.title) parts.push(`Key Notes: ${activeNode.notes.title}.`);
      if (activeNode.notes?.keyTakeaways && activeNode.notes.keyTakeaways.length > 0) {
        parts.push(`Core Principles: ${activeNode.notes.keyTakeaways.join('. ')}.`);
      }
      return parts.join(' ');
    }
  };

  const scriptText = buildSpokenExplanation();

  // Audio Toggle: Plays hosted audio URL if present, or browser SpeechSynthesis
  const handleToggleAudioExplanation = () => {
    if (activeNode.audioExplanation?.audioUrl) {
      if (!audioElemRef.current) {
        audioElemRef.current = new Audio(activeNode.audioExplanation.audioUrl);
        audioElemRef.current.onended = () => setIsAudioPlaying(false);
      }
      if (isAudioPlaying) {
        audioElemRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioElemRef.current.playbackRate = audioSpeed;
        audioElemRef.current.play();
        setIsAudioPlaying(true);
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }

    setIsAudioPlaying(true);
    speakWithIndianAccent(scriptText, {
      lang: audioLang,
      rate: audioSpeed,
      onEnd: () => setIsAudioPlaying(false),
      onError: () => setIsAudioPlaying(false),
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* 1. PROMINENT AUDIO EXPLANATION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleToggleAudioExplanation}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all hover:scale-101 active:scale-99 ${
              isAudioPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="font-devanagari">{language === 'hi' ? 'ऑडियो व्याख्यान रोकें' : 'Pause Audio Explanation'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="font-devanagari">{language === 'hi' ? '🎧 यह विषय सुनें (ऑडियो)' : '🎧 Explain This Topic (Audio)'}</span>
              </>
            )}
          </button>

          <div className="font-devanagari">
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'hi' ? 'द्विभाषी ऑडियो व्याख्यान' : 'Bilingual Audio Narration'}</span>
              {isAudioPlaying && (
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce h-2" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s] h-3.5" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAudioPlaying 
                ? (language === 'hi' ? 'मौखिक व्याख्यान चल रहा है • साथ-साथ सुनें या नीचे नोट्स पढ़ें' : 'Playing spoken explanation • Listen along or read the notes below')
                : (language === 'hi' ? 'मौखिक व्याख्यान सुनने के लिए क्लिक करें, या अपनी गति से नीचे नोट्स पढ़ें' : 'Click to listen to spoken explanation, or read the notes below at your own pace')}
            </p>
          </div>
        </div>

        {/* Audio Controls: Language toggle & Speed */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => {
                setAudioLang('en');
                if (isAudioPlaying) {
                  window.speechSynthesis?.cancel();
                  setIsAudioPlaying(false);
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                audioLang === 'en'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🇮🇳 Indian English
            </button>
            <button
              type="button"
              onClick={() => {
                setAudioLang('hi');
                if (isAudioPlaying) {
                  window.speechSynthesis?.cancel();
                  setIsAudioPlaying(false);
                }
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                audioLang === 'hi'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🇮🇳 हिन्दी
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {[1, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setAudioSpeed(spd)}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-md transition-colors ${
                  audioSpeed === spd
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowFullAudioModal(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 font-devanagari"
          >
            {language === 'hi' ? 'प्रतिलिपि' : 'Transcript'}
          </button>
        </div>
      </div>

      {/* Transcript Modal */}
      {showFullAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 font-devanagari">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'hi' 
                    ? `ऑडियो व्याख्यान प्रतिलिपि (${audioLang === 'hi' ? 'हिन्दी' : 'अंग्रेजी'})` 
                    : `Audio Explanation Transcript (${audioLang.toUpperCase()})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullAudioModal(false)}
                className="text-xs font-bold p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 max-h-80 overflow-y-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {scriptText}
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowFullAudioModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT: SINGLE-PAGE MASTER NOTE */}
      <article className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-10 md:p-12 shadow-xs space-y-12 animate-in fade-in">
        {/* SECTION 1: TOPIC TITLE & CONCEPTUAL THEORY */}
        <section id="sec-theory" className="space-y-6">
          <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-center gap-2 flex-wrap font-devanagari">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {activeNode.type.toUpperCase()}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {language === 'hi' ? 'लक्षित वर्ग:' : 'Audience:'} {activeNode.targetAgeBand?.toUpperCase() || 'UNIVERSAL'}
              </span>
              <span className="text-xs text-slate-400 pl-1">
                ~{activeNode.estimatedMinutes || 15} {language === 'hi' ? 'मिनट पठन' : 'mins read'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-devanagari">
              {title}
            </h1>
            {desc && (
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal font-devanagari">
                {desc}
              </p>
            )}
          </div>

          {/* Markdown Body Text with LaTeX and Formulas */}
          <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed sm:leading-loose font-devanagari">
            <MarkdownPreview content={bodyText} />
          </div>
        </section>

        {/* SECTION 2: STUDY NOTES, FORMULAS & KEY PRINCIPLES */}
        {activeNode.notes && (
          <section id="sec-notes" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-6 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeNode.notes.title || (language === 'hi' ? 'पुनरीक्षण नोट्स व सूत्र संदर्भ' : 'Revision Notes & Formula Reference')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi' ? 'मुख्य सूत्र, वैज्ञानिक सिद्धांत और त्वरित पुनरीक्षण निष्कर्ष।' : 'Core formulas, principles, and fast review takeaways.'}
                </p>
              </div>
            </div>

            {/* Notes Markdown Content */}
            {activeNode.notes.contentMarkdown && (
              <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed sm:leading-loose">
                <MarkdownPreview content={activeNode.notes.contentMarkdown} />
              </div>
            )}

            {/* Key Takeaways Bullets */}
            {activeNode.notes.keyTakeaways && activeNode.notes.keyTakeaways.length > 0 && (
              <div className="space-y-3 pt-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{language === 'hi' ? 'प्रमुख आवश्यक सिद्धांत:' : 'Essential Key Principles:'}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeNode.notes.keyTakeaways.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-base text-slate-800 dark:text-slate-200 flex items-start gap-2.5 leading-relaxed"
                    >
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: VISUAL LOGIC FLOWCHART */}
        {activeNode.flowchart?.mermaidCode && (
          <section id="sec-flowchart" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-5 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <GitBranch className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'तार्किक निर्णय एवं चरणबद्ध फ़्लोचार्ट' : 'Decision Logic & Step Flowchart'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi' ? 'मानक आकारों के साथ चरणबद्ध तर्क आरेख।' : 'Step-by-step logic graph with circle, rect, parallelogram, diamond, and oval shapes.'}
                </p>
              </div>
            </div>

            <FlowchartViewer
              flowchartData={activeNode.flowchart}
              nodeTitle={title}
            />
          </section>
        )}

        {/* SECTION 4: INTERACTIVE SIMULATION LAB */}
        {activeNode.simulationConfig && (
          <section id="sec-simulation" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-5 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'इंटरैक्टिव भौतिकी एवं कैनवास सिमुलेटर' : 'Interactive Physics & Canvas Simulator'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi' ? 'गतिशील व्यवहार और सदिशों का अवलोकन करने हेतु वास्तविक समय में पैरामीटर बदलें।' : 'Adjust parameters in real-time to observe dynamic behavior and vectors.'}
                </p>
              </div>
            </div>

            <SimulationSandbox
              config={activeNode.simulationConfig}
              nodeTitle={title}
            />
          </section>
        )}

        {/* SECTION 5: LIVE CODING SANDBOX */}
        {activeNode.codingProblem && (
          <section id="sec-code" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-5 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'लाइव कोडिंग चुनौती व स्वतः-परीक्षक' : 'Live Coding Challenge & Autograder'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi'
                    ? `${activeNode.codingProblem.language} में समाधान लिखें और स्वचालित परीक्षण चलाएं।`
                    : `Write solution in ${activeNode.codingProblem.language} and run automated tests.`}
                </p>
              </div>
            </div>

            <CodingSandbox
              problem={activeNode.codingProblem}
              nodeTitle={title}
            />
          </section>
        )}

        {/* SECTION 6: SCIENTIFIC DIAGRAMS & FIGURES */}
        {activeNode.images && activeNode.images.length > 0 && (
          <section id="sec-images" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-5 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'वैज्ञानिक आरेख एवं दृश्य आकृतियाँ' : 'Scientific Diagrams & Visual Figures'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi' ? 'उच्च-रिज़ॉल्यूशन दृश्य संदर्भ और आरेख।' : 'High-resolution visual references and diagrams.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeNode.images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 group shadow-xs">
                  <img src={img.url} alt={img.altText || img.caption || 'Diagram'} className="w-full h-56 object-cover group-hover:scale-102 transition-transform" />
                  {img.caption && (
                    <div className="p-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7: FORMATIVE RETENTION TEST */}
        {activeNode.quizQuestions && activeNode.quizQuestions.length > 0 && (
          <section id="sec-quiz" className="border-t border-slate-100 dark:border-slate-800/80 pt-10 space-y-5 font-devanagari">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'स्मरण परीक्षण एवं ज्ञान जांच' : 'Retention Test & Knowledge Check'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'hi' ? 'वैचारिक समझ सत्यापित करने और तत्काल व्याख्या प्राप्त करने हेतु प्रश्नों के उत्तर दें।' : 'Answer questions to verify conceptual understanding and get instant rationale.'}
                </p>
              </div>
            </div>

            <QuizEngine
              questions={activeNode.quizQuestions}
              onComplete={() => markCompleted(activeNode.id)}
            />
          </section>
        )}

        {/* FOOTER: TOPIC COMPLETION & PEER NAVIGATION */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8 flex items-center justify-between gap-4 font-devanagari">
          {prevPeer ? (
            <button
              type="button"
              onClick={() => setActiveNode(prevPeer)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'पिछला:' : 'Prev:'} {prevPeer.translations[language]?.title || prevPeer.translations.en?.title || prevPeer.id}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={() => markCompleted(activeNode.id)}
            className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
              completed
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{completed ? (language === 'hi' ? '✓ पाठ पूर्ण हुआ!' : '✓ Lesson Completed!') : (language === 'hi' ? 'पाठ पूर्ण चिह्नित करें' : 'Mark Lesson Complete')}</span>
          </button>

          {nextPeer ? (
            <button
              type="button"
              onClick={() => setActiveNode(nextPeer)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? 'अगला:' : 'Next:'} {nextPeer.translations[language]?.title || nextPeer.translations.en?.title || nextPeer.id}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : <div />}
        </div>
      </article>
    </div>
  );
};
