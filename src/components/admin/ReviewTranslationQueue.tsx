import React, { useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode } from '../../types';
import { CheckCheck, AlertCircle, FileText, ArrowRight, Save, ThumbsUp } from 'lucide-react';

export const ReviewTranslationQueue: React.FC = () => {
  const { nodes, getPendingReviewNodes, updateNodeStatus, updateNode } = useContent();
  const { language, t } = useLanguage();

  const pendingNodes = getPendingReviewNodes();
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(pendingNodes[0] || null);

  // Translation editing state
  const [editHiTitle, setEditHiTitle] = useState<string>('');
  const [editHiDesc, setEditHiDesc] = useState<string>('');
  const [editHiBody, setEditHiBody] = useState<string>('');
  const [saveAlert, setSaveAlert] = useState<boolean>(false);

  const handleSelectNode = (node: ContentNode) => {
    setSelectedNode(node);
    setEditHiTitle(node.translations.hi?.title || '');
    setEditHiDesc(node.translations.hi?.description || '');
    setEditHiBody(node.translations.hi?.body || '');
    setSaveAlert(false);
  };

  const handleSaveTranslation = () => {
    if (!selectedNode) return;
    const updated: ContentNode = {
      ...selectedNode,
      translations: {
        ...selectedNode.translations,
        hi: {
          language: 'hi',
          title: editHiTitle,
          description: editHiDesc,
          body: editHiBody,
        }
      }
    };
    updateNode(updated);
    setSelectedNode(updated);
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 2000);
  };

  const handleApprove = () => {
    if (!selectedNode) return;
    handleSaveTranslation();
    updateNodeStatus(selectedNode.id, 'published');
    setSelectedNode(null);
  };

  const handleRequestChanges = () => {
    if (!selectedNode) return;
    updateNodeStatus(selectedNode.id, 'draft');
    setSelectedNode(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-amber-900/40">
        <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {t('admin.reviewerTitle')}
        </span>
        <h2 className="text-xl md:text-2xl font-bold mt-2">
          {language === 'hi' ? 'द्विभाषी अनुवाद एवं समीक्षा कतार' : 'Bilingual Translation & Review Queue'}
        </h2>
        <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
          {t('admin.reviewerDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Queue List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {language === 'hi' ? 'समीक्षा हेतु लंबित सामग्री' : 'Awaiting Review'} ({pendingNodes.length})
            </h3>
          </div>

          {pendingNodes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              {language === 'hi' ? 'कोई लंबित समीक्षा नहीं है! सभी पाठ प्रकाशित हैं।' : 'Queue is clear! All lessons are reviewed and published.'}
            </div>
          ) : (
            <div className="space-y-2">
              {pendingNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const hasHindi = !!node.translations.hi?.title;
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${isSelected ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">[{node.type}]</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasHindi ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                        {hasHindi ? 'हिन्दी उपलब्ध' : 'Missing Hindi'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {node.translations.en?.title || node.id}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      By {node.createdBy} • Depth {node.depth}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Node Diff & Translator Editor */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {!selectedNode ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              {language === 'hi' ? 'समीक्षा करने के लिए बाईं ओर से कोई पाठ चुनें।' : 'Select a lesson from the left to inspect and review.'}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                    Path: {selectedNode.path}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedNode.translations.en?.title}
                  </h3>
                </div>
                {saveAlert && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    ✓ Translation Saved
                  </span>
                )}
              </div>

              {/* Side by side diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English source */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">Original English</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedNode.translations.en?.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedNode.translations.en?.description}
                  </p>
                  <div className="text-xs text-slate-500 font-mono bg-white dark:bg-slate-800 p-2 rounded max-h-32 overflow-y-auto">
                    {selectedNode.translations.en?.body || '(No markdown body provided)'}
                  </div>
                </div>

                {/* Hindi editor */}
                <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase font-devanagari">
                    हिन्दी अनुवाद (सम्पादक)
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                      हिंदी शीर्षक:
                    </label>
                    <input
                      type="text"
                      value={editHiTitle}
                      onChange={e => setEditHiTitle(e.target.value)}
                      placeholder="देवनागरी शीर्षक लिखें..."
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                      हिंदी विवरण:
                    </label>
                    <textarea
                      rows={2}
                      value={editHiDesc}
                      onChange={e => setEditHiDesc(e.target.value)}
                      placeholder="संक्षिप्त विवरण..."
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                      हिंदी मुख्य पाठ (Markdown):
                    </label>
                    <textarea
                      rows={4}
                      value={editHiBody}
                      onChange={e => setEditHiBody(e.target.value)}
                      placeholder="विस्तृत व्याख्या..."
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari leading-relaxed"
                    />
                  </div>
                  <button
                    onClick={handleSaveTranslation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {language === 'hi' ? 'अनुवाद सहेजें' : 'Save Hindi Translation'}
                  </button>
                </div>
              </div>

              {/* Review Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleRequestChanges}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-bold text-xs"
                >
                  {t('admin.requestChanges')}
                </button>
                <button
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {t('admin.approve')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
