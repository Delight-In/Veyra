import React from 'react';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronRight, Home } from 'lucide-react';

interface NodeBreadcrumbsProps {
  nodeId: string;
  onSelectNode: (nodeId: string) => void;
  onGoHome?: () => void;
}

export const NodeBreadcrumbs: React.FC<NodeBreadcrumbsProps> = ({ nodeId, onSelectNode, onGoHome }) => {
  const { getBreadcrumbs } = useContent();
  const { language } = useLanguage();

  const crumbs = getBreadcrumbs(nodeId);

  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 py-2">
      {onGoHome && (
        <>
          <button
            onClick={onGoHome}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मुख्य' : 'Root'}</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
        </>
      )}

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const title = crumb.translations[language]?.title || crumb.translations.en?.title || crumb.id;

        return (
          <React.Fragment key={crumb.id}>
            {isLast ? (
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                {title}
              </span>
            ) : (
              <button
                onClick={() => onSelectNode(crumb.id)}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors truncate max-w-[160px]"
              >
                {title}
              </button>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
