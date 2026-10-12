import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode } from '../../types';
import { initialNodes } from '../../data/initialNodes';
import { ClassroomView } from '../classroom/ClassroomView';
import { api } from '../../services/api';
import { 
  FileText, CreditCard, Sparkles, Plus, 
  CheckCircle2, X, ArrowRight, Lock, BookOpen, 
  ChevronDown, Search
} from 'lucide-react';

interface ClassroomPageProps {
  activeNode: ContentNode | null;
  onNavigateCourses: () => void;
  onNavigateContentStudio?: () => void;
}

export const ClassroomPage: React.FC<ClassroomPageProps> = ({ 
  activeNode, 
  onNavigateCourses,
  onNavigateContentStudio 
}) => {
  const { currentUser } = useAuth();
  const { getNodeById, nodes, updateNode } = useContent();
  const { language } = useLanguage();

  // 1. Role Gate: /classroom is EXCLUSIVELY accessible to created admins and super admins
  const isAuthorized = !!currentUser && currentUser.role !== 'learner' && currentUser.role !== 'parent';

  // Read URL search params for ?node= or ?id=
  const getUrlNodeId = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('node') || params.get('id');
    }
    return null;
  };

  // Find optimal default node: assigned branch topic, or first available topic
  const findDefaultNode = (): ContentNode => {
    if (activeNode) return activeNode;
    const urlId = getUrlNodeId();
    if (urlId) {
      const found = getNodeById(urlId);
      if (found) return found;
    }
    // If admin has assignedNodeId, look for that or its topics
    if (currentUser?.assignedNodeId) {
      const assigned = getNodeById(currentUser.assignedNodeId);
      if (assigned) return assigned;
      const assignedTopic = nodes.find(n => n.path.split('.').includes(currentUser.assignedNodeId!));
      if (assignedTopic) return assignedTopic;
    }
    // Fall back to projectile motion simulation topic or first lesson
    return (
      getNodeById('node_sim_projectile') ||
      getNodeById('node_motion_1d') ||
      nodes.find(n => n.type === 'topic' || n.type === 'lesson') ||
      nodes[0] ||
      initialNodes[0]
    );
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    const urlId = getUrlNodeId();
    if (urlId) return urlId;
    if (activeNode?.id) return activeNode.id;
    return findDefaultNode().id;
  });

  // Modals for Note and File Card (Flashcard) Creation
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Note form state
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteMarkdown, setNoteMarkdown] = useState<string>('');
  const [noteTakeaways, setNoteTakeaways] = useState<string[]>(['']);

  // Flashcard form state
  const [cardFrontEn, setCardFrontEn] = useState<string>('');
  const [cardFrontHi, setCardFrontHi] = useState<string>('');
  const [cardBackEn, setCardBackEn] = useState<string>('');
  const [cardBackHi, setCardBackHi] = useState<string>('');
  const [cardHintEn, setCardHintEn] = useState<string>('');
  const [cardHintHi, setCardHintHi] = useState<string>('');

  // Synchronize when activeNode or URL changes
  useEffect(() => {
    const urlId = getUrlNodeId();
    if (urlId) {
      setSelectedNodeId(urlId);
    } else if (activeNode) {
      setSelectedNodeId(activeNode.id);
    }
  }, [activeNode]);

  // Live node lookup from nodes state so all creations & edits are immediately visible
  const targetNode = (selectedNodeId ? (getNodeById(selectedNodeId) || nodes.find(n => n.id === selectedNodeId)) : null)
    || (activeNode ? (getNodeById(activeNode.id) || nodes.find(n => n.id === activeNode.id) || activeNode) : null)
    || findDefaultNode();

  // Populate Note modal when opened
  const handleOpenNoteModal = () => {
    if (targetNode) {
      setNoteTitle(targetNode.notes?.title || targetNode.translations[language]?.title || targetNode.translations.en?.title || 'Topic Revision Notes');
      setNoteMarkdown(targetNode.notes?.contentMarkdown || targetNode.translations[language]?.body || targetNode.translations.en?.body || '');
      setNoteTakeaways(targetNode.notes?.keyTakeaways && targetNode.notes.keyTakeaways.length > 0 ? targetNode.notes.keyTakeaways : ['']);
    }
    setModalFeedback(null);
    setShowNoteModal(true);
  };

  // Save Note to Target Node
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNode) return;

    const cleanTakeaways = noteTakeaways.map(t => t.trim()).filter(Boolean);
    const updatedNotes = {
      title: noteTitle.trim() || 'Topic Revision Notes',
      contentMarkdown: noteMarkdown.trim(),
      keyTakeaways: cleanTakeaways
    };

    const updatedNode = {
      ...targetNode,
      notes: updatedNotes
    };

    updateNode(updatedNode);

    // Call dedicated backend endpoint
    api.content.updateNotes(targetNode.id, updatedNotes).catch(err => {
      console.warn('Backend note save notice:', err?.message);
    });

    setModalFeedback('Topic note successfully saved!');
    setTimeout(() => {
      setModalFeedback(null);
      setShowNoteModal(false);
    }, 1200);
  };

  // Save File Card (Flashcard) to Target Node
  const handleSaveFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNode || !cardFrontEn.trim() || !cardBackEn.trim()) return;

    const newCard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      front: {
        en: cardFrontEn.trim(),
        hi: cardFrontHi.trim() || cardFrontEn.trim()
      },
      back: {
        en: cardBackEn.trim(),
        hi: cardBackHi.trim() || cardBackEn.trim()
      },
      hint: (cardHintEn.trim() || cardHintHi.trim()) ? {
        en: cardHintEn.trim(),
        hi: cardHintHi.trim() || cardHintEn.trim()
      } : undefined
    };

    const existingCards = targetNode.flashcards || [];
    const updatedNode = {
      ...targetNode,
      flashcards: [...existingCards, newCard]
    };

    updateNode(updatedNode);

    // Call dedicated backend endpoint
    api.content.addFlashcard(targetNode.id, newCard).catch(err => {
      console.warn('Backend flashcard notice:', err?.message);
    });

    setModalFeedback('File card (flashcard) added to topic!');
    setTimeout(() => {
      setModalFeedback(null);
      setShowFlashcardModal(false);
      setCardFrontEn('');
      setCardFrontHi('');
      setCardBackEn('');
      setCardBackHi('');
      setCardHintEn('');
      setCardHintHi('');
    }, 1200);
  };

  // If user is a student or unauthenticated, block access to /classroom
  if (!isAuthorized) {
    return (
      <div className="py-20 text-center space-y-5 max-w-lg mx-auto px-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-3xl shadow-sm">
          <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {language === 'hi' ? 'केवल व्यवस्थापक एवं निर्माता' : 'Administrators & Creators Only'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'hi' ? 'कक्षा संपादन स्टूडियो' : 'Classroom Authoring Studio'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'hi'
              ? 'कक्षा स्टूडियो केवल अधिकृत व्यवस्थापकों के लिए नोट्स और फ़ाइल कार्ड (फ्लैशकार्ड) बनाने के लिए आरक्षित है। शिक्षार्थी सभी शोध आलेख व ब्लॉग, ब्लॉग पृष्ठ पर देख सकते हैं।'
              : 'Classroom Studio is reserved for authorized administrators to author topic notes, file cards (flashcards), and curriculum materials. Learners can explore all research articles and blogs under Blogs.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateCourses}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <span>{language === 'hi' ? 'ब्लॉग देखें' : 'Read Blogs & Articles'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // List of all topic/lesson nodes for topic switcher
  const selectableTopics = nodes.filter(n => n.type === 'topic' || n.type === 'lesson' || n.type === 'unit');

  return (
    <div className="max-w-5xl mx-auto w-full py-2 sm:py-4 space-y-6">
      {/* 1. CREATED ADMIN STUDIO ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-devanagari">
                {language === 'hi' ? 'कक्षा स्टूडियो' : 'Classroom Studio'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {targetNode.id}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-devanagari">
              {targetNode.translations[language]?.title || targetNode.translations.en?.title || targetNode.id}
            </h2>
          </div>
        </div>

        {/* Action Buttons: Create Note, Create File Card, Full Studio */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-devanagari">
          {/* Topic Switcher Dropdown */}
          <div className="relative">
            <select
              value={targetNode.id}
              onChange={(e) => {
                setSelectedNodeId(e.target.value);
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', `/classroom?node=${encodeURIComponent(e.target.value)}`);
                }
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {selectableTopics.map(top => (
                <option key={top.id} value={top.id}>
                  {top.translations[language]?.title || top.translations.en?.title || top.id}
                </option>
              ))}
            </select>
          </div>

          {/* + Create / Edit Note */}
          <button
            type="button"
            onClick={handleOpenNoteModal}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '+ नया नोट बनाएं' : '+ Create Note'}</span>
          </button>

          {/* + Create File Card */}
          <button
            type="button"
            onClick={() => setShowFlashcardModal(true)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '+ फ़ाइल कार्ड बनाएं' : '+ Create File Card'}</span>
          </button>

          {/* Full Studio Editor */}
          {onNavigateContentStudio && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', `/content?edit=${encodeURIComponent(targetNode.id)}`);
                }
                onNavigateContentStudio();
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>{language === 'hi' ? 'पूर्ण स्टूडियो' : 'Full Studio'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CLASSROOM VIEW WITH ACTIVE NODE */}
      <ClassroomView
        initialNode={targetNode}
        onNavigateCourses={onNavigateCourses}
      />

      {/* 3. MODAL: CREATE / EDIT TOPIC NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-devanagari">
                  {language === 'hi'
                    ? `"${targetNode.translations[language]?.title || targetNode.translations.en?.title || targetNode.id}" के लिए नोट्स`
                    : `Create / Edit Notes for "${targetNode.translations.en?.title || targetNode.id}"`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{modalFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'नोट का शीर्षक' : 'Note Title'}
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. न्यूटन के गति के नियम एवं घर्षण सारांश' : "e.g. Newton's Laws & Friction Summary Notes"}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'अध्ययन नोट्स (Markdown व LaTeX सूत्र)' : 'Study Notes (Markdown & LaTeX Formulas)'}
                </label>
                <textarea
                  value={noteMarkdown}
                  onChange={(e) => setNoteMarkdown(e.target.value)}
                  rows={6}
                  placeholder={language === 'hi' 
                    ? `समीकरणों के साथ व्यवस्थित नोट्स लिखें:\n### गति का पहला नियम\nकोई वस्तु तब तक विरामावस्था या सरल रेखा में एकसमान गति में रहती है जब तक उस पर कोई बाह्य बल न लगे।\n\n### गति का समीकरण:\n$v = u + at$\n$s = ut + \\frac{1}{2}at^2$`
                    : `Write structured notes with equations:\n### First Law of Motion\nAn object continues in its state of rest or uniform motion unless acted upon by an external net force.\n\n### Equation of Motion:\n$v = u + at$\n$s = ut + \\frac{1}{2}at^2$`}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  required
                />
              </div>

              {/* Key Principles Takeaway Bullets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-devanagari">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    {language === 'hi' ? 'आवश्यक प्रमुख सिद्धांत (बुलेट सारांश)' : 'Essential Key Principles (Bullet Takeaways)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoteTakeaways(prev => [...prev, ''])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? '+ नया बुलेट जोड़ें' : 'Add Bullet'}</span>
                  </button>
                </div>

                {noteTakeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={takeaway}
                      onChange={(e) => {
                        const updated = [...noteTakeaways];
                        updated[idx] = e.target.value;
                        setNoteTakeaways(updated);
                      }}
                      placeholder={language === 'hi' ? 'उदा. जड़त्व द्रव्यमान के समानुपाती होता है।' : 'e.g. Inertia is directly proportional to mass.'}
                      className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {noteTakeaways.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNoteTakeaways(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 font-devanagari">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs"
                >
                  {language === 'hi' ? 'नोट सहेजें' : 'Save Note to Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CREATE FILE CARD (FLASHCARD) */}
      {showFlashcardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-devanagari">
                  {language === 'hi'
                    ? `"${targetNode.translations[language]?.title || targetNode.translations.en?.title || targetNode.id}" में फ़ाइल कार्ड जोड़ें`
                    : `Add File Card to "${targetNode.translations.en?.title || targetNode.id}"`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFlashcardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{modalFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveFlashcard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'कार्ड का मुख पृष्ठ (अंग्रेजी प्रश्न/प्रेरक)' : 'Card Front (Prompt / Question in English)'}
                </label>
                <input
                  type="text"
                  value={cardFrontEn}
                  onChange={(e) => setCardFrontEn(e.target.value)}
                  placeholder="e.g. State Newton's Second Law of Motion in mathematical terms."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'कार्ड का मुख पृष्ठ (हिन्दी प्रश्न - वैकल्पिक)' : 'Card Front (हिन्दी - वैकल्पिक)'}
                </label>
                <input
                  type="text"
                  value={cardFrontHi}
                  onChange={(e) => setCardFrontHi(e.target.value)}
                  placeholder="उदा. न्यूटन के गति के दूसरे नियम को गणितीय रूप में बताएं।"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'कार्ड का पृष्ठ भाग (अंग्रेजी उत्तर/समाधान)' : 'Card Back (Answer / Solution in English)'}
                </label>
                <textarea
                  value={cardBackEn}
                  onChange={(e) => setCardBackEn(e.target.value)}
                  rows={3}
                  placeholder="e.g. F = ma (Force equals mass times acceleration), where F is net force in Newtons."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  {language === 'hi' ? 'कार्ड का पृष्ठ भाग (हिन्दी उत्तर - वैकल्पिक)' : 'Card Back (हिन्दी - वैकल्पिक)'}
                </label>
                <textarea
                  value={cardBackHi}
                  onChange={(e) => setCardBackHi(e.target.value)}
                  rows={3}
                  placeholder="उदा. बल = द्रव्यमान × त्वरण (F = ma)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                    {language === 'hi' ? 'संकेत (अंग्रेजी)' : 'Hint (English)'}
                  </label>
                  <input
                    type="text"
                    value={cardHintEn}
                    onChange={(e) => setCardHintEn(e.target.value)}
                    placeholder="e.g. Relates Force and Acceleration"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                    {language === 'hi' ? 'संकेत (हिन्दी)' : 'संकेत (हिन्दी)'}
                  </label>
                  <input
                    type="text"
                    value={cardHintHi}
                    onChange={(e) => setCardHintHi(e.target.value)}
                    placeholder="उदा. बल और त्वरण का सम्बंध"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 font-devanagari">
                <button
                  type="button"
                  onClick={() => setShowFlashcardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  {language === 'hi' ? 'फ़ाइल कार्ड जोड़ें' : 'Add File Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
