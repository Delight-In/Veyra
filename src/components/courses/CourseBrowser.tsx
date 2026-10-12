import React, { useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode, NodeType } from '../../types';
import { CourseCard } from './CourseCard';
import { NodeBreadcrumbs } from './NodeBreadcrumbs';
import { Search, Filter, Layers, Compass, Sparkles, BookOpen } from 'lucide-react';

interface CourseBrowserProps {
  onOpenClassroom: (node: ContentNode) => void;
}

export const CourseBrowser: React.FC<CourseBrowserProps> = ({ onOpenClassroom }) => {
  const { nodes, getChildNodes, getNodeById } = useContent();
  const { language, t } = useLanguage();

  // Active navigation node (null means root level)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');

  const currentNode = currentNodeId ? getNodeById(currentNodeId) : null;
  const currentChildren = getChildNodes(currentNodeId);

  // Search & Filter Resolution
  const filteredNodes = nodes.filter(n => {
    // Only published nodes visible in public browser
    if (n.status !== 'published') return false;

    // Search query matches Hindi or English title/desc
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = (n.translations.en?.title || '').toLowerCase().includes(q) ||
                      (n.translations.en?.description || '').toLowerCase().includes(q);
      const matchHi = (n.translations.hi?.title || '').toLowerCase().includes(q) ||
                      (n.translations.hi?.description || '').toLowerCase().includes(q);
      if (!matchEn && !matchHi) return false;
    } else {
      // If no global search query, respect hierarchical drill-down
      if (currentNodeId) {
        if (n.parentId !== currentNodeId) return false;
      } else {
        const isRoot = n.parentId === null || n.parentId === '';
        const isAdminStandalone = Boolean(n.createdBy && n.createdBy !== 'user_super_admin' && n.depth <= 2);
        if (!isRoot && !isAdminStandalone) return false;
      }
    }

    // Type filter
    if (selectedType !== 'all') {
      if (n.type !== selectedType) return false;
    }

    // Language filter
    if (selectedLangFilter === 'hi' && !n.translations.hi?.title) return false;
    if (selectedLangFilter === 'en' && !n.translations.en?.title) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium font-devanagari"
            >
              <option value="all">{language === 'hi' ? 'प्रकार: सभी सामग्री' : 'Type: Everything'}</option>
              <option value="simulation">{language === 'hi' ? '🔬 सिमुलेशन' : '🔬 Simulations'}</option>
              <option value="video">{language === 'hi' ? '⏱️ वीडियो' : '⏱️ Videos'}</option>
              <option value="lesson">{language === 'hi' ? '📖 पाठ' : '📖 Lessons'}</option>
              <option value="quiz">{language === 'hi' ? '💡 प्रश्नोत्तरी' : '💡 Quizzes'}</option>
            </select>

            {/* Language Filter */}
            <select
              value={selectedLangFilter}
              onChange={e => setSelectedLangFilter(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium font-devanagari"
            >
              <option value="all">{language === 'hi' ? 'भाषा: सभी' : 'Language: All'}</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* Breadcrumb Trail */}
        {currentNodeId && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <NodeBreadcrumbs
              nodeId={currentNodeId}
              onSelectNode={id => setCurrentNodeId(id)}
              onGoHome={() => setCurrentNodeId(null)}
            />
            <button
              onClick={() => setCurrentNodeId(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              {language === 'hi' ? 'मूल सूची पर लौटें' : 'Back to Root Categories'}
            </button>
          </div>
        )}
      </div>

      {/* Course Grid */}
      {filteredNodes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Compass className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
            {language === 'hi' ? 'कोई सामग्री नहीं मिली' : 'No matching topics found'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'hi' 
              ? 'कृपया अपने फ़िल्टर बदलें या भिन्न खोज शब्द दर्ज करें।' 
              : 'Try adjusting your search query or filter settings.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedLangFilter('all');
              setCurrentNodeId(null);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold text-xs"
          >
            {language === 'hi' ? 'सभी फ़िल्टर साफ़ करें' : 'Clear All Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNodes.map(node => {
            const hasKids = getChildNodes(node.id).length > 0;
            return (
              <CourseCard
                key={node.id}
                node={node}
                hasChildren={hasKids}
                onSelect={n => setCurrentNodeId(n.id)}
                onOpenClassroom={n => onOpenClassroom(n)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
