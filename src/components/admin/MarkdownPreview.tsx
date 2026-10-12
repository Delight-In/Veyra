import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  emptyPlaceholder?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  content,
  emptyPlaceholder = 'Live rendered notes and theory will appear here...'
}) => {
  if (!content.trim()) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-xs italic bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        {emptyPlaceholder}
      </div>
    );
  }

  // Lightweight native Markdown parser for educational text, tables, math, checklists
  const parseMarkdown = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockLines: string[] = [];

    let inTable = false;
    let tableRows: string[][] = [];

    const flushCodeBlock = () => {
      if (inCodeBlock) {
        elements.push(
          <div key={key++} className="my-4 rounded-2xl bg-slate-950 p-4 sm:p-5 border border-slate-800 overflow-x-auto text-sm sm:text-base font-mono text-emerald-400 shadow-sm">
            {codeBlockLang && (
              <div className="text-xs text-slate-500 uppercase font-bold tracking-widest pb-2 mb-2 border-b border-slate-800/80">
                {codeBlockLang}
              </div>
            )}
            <pre className="whitespace-pre leading-relaxed">{codeBlockLines.join('\n')}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(1).filter(r => !r.every(c => c.match(/^:?-+:?$/)));

        elements.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-sm sm:text-base text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-700">{col.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 sm:p-3.5 text-slate-700 dark:text-slate-300">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start / end
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          flushTable();
          inCodeBlock = true;
          codeBlockLang = line.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Empty line
      if (!line.trim()) {
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 tracking-tight">
            {line.replace('# ', '')}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
        continue;
      }

      // Math block $$ ... $$
      if (line.startsWith('$$') && line.endsWith('$$')) {
        const mathContent = line.replace(/\$\$/g, '').trim();
        elements.push(
          <div key={key++} className="my-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center font-mono text-indigo-950 dark:text-indigo-200 text-base sm:text-lg font-semibold shadow-xs">
            {mathContent}
          </div>
        );
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={key++} className="my-4 pl-4 py-2 border-l-4 border-indigo-500 text-slate-600 dark:text-slate-300 italic text-base sm:text-lg bg-slate-50/60 dark:bg-slate-800/30 rounded-r-xl leading-relaxed">
            {line.replace('> ', '')}
          </blockquote>
        );
        continue;
      }

      // Checklist item
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const isChecked = line.startsWith('- [x] ');
        elements.push(
          <div key={key++} className="flex items-center gap-3 my-2.5 text-base sm:text-lg text-slate-800 dark:text-slate-200">
            <input type="checkbox" checked={isChecked} readOnly className="w-4 h-4 rounded text-indigo-600" />
            <span className={isChecked ? 'line-through text-slate-400' : ''}>
              {line.replace(/- \[[ x]\] /, '')}
            </span>
          </div>
        );
        continue;
      }

      // Bullet list item
      if (line.startsWith('* ') || line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="ml-6 list-disc text-base sm:text-lg text-slate-800 dark:text-slate-200 my-2 leading-relaxed">
            {line.replace(/^(\*|-)\s+/, '')}
          </li>
        );
        continue;
      }

      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={key++} className="ml-6 list-decimal text-base sm:text-lg text-slate-800 dark:text-slate-200 my-2 leading-relaxed">
            {line.replace(/^\d+\.\s+/, '')}
          </li>
        );
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---') {
        elements.push(<hr key={key++} className="my-6 border-slate-200 dark:border-slate-800" />);
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={key++} className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed sm:leading-loose my-3.5 font-normal">
          {line}
        </p>
      );
    }

    flushCodeBlock();
    flushTable();

    return elements;
  };

  return (
    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
      {parseMarkdown(content)}
    </div>
  );
};
