import React from 'react';
import { 
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Quote, Terminal, Sigma, 
  Table, Minus, Link2, Sparkles, Eye, Columns, Edit3, HelpCircle
} from 'lucide-react';

interface FormattingToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (newValue: string) => void;
  viewMode?: 'write' | 'split' | 'preview';
  onViewModeChange?: (mode: 'write' | 'split' | 'preview') => void;
  showViewToggle?: boolean;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  viewMode = 'write',
  onViewModeChange,
  showViewToggle = true
}) => {
  const insertFormat = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      onChange(value + (value ? '\n\n' : '') + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultPlaceholder;

    const replacement = prefix + selectedText + suffix;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleInsertTable = () => {
    const tableTemplate = 
      '\n| Parameter / Concept | Formula / Rule | Physical Meaning |\n' +
      '| :--- | :--- | :--- |\n' +
      '| Initial Velocity $v_0$ | $v_x = v_0 \\cos\\theta$ | Horizontal component |\n' +
      '| Launch Angle $\\theta$ | $\\theta = 45^\\circ$ | Angle of maximum range |\n\n';
    insertFormat(tableTemplate);
  };

  const handleInsertTakeaway = () => {
    insertFormat('\n* **Key Principle:** ', '', 'Essential rule or boundary condition');
  };

  return (
    <div className="bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1.5 flex flex-wrap items-center justify-between gap-1.5 text-slate-700 dark:text-slate-300">
      {/* Inline Formatting Buttons */}
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => insertFormat('**', '**', 'bold text')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('*', '*', 'italic text')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('~~', '~~', 'strikethrough text')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Strikethrough (~~text~~)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('`', '`', 'inline_code()')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Inline Code (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => insertFormat('# ', '', 'Major Heading')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Heading 1 (# Title)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('## ', '', 'Section Subheading')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Heading 2 (## Subheading)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('### ', '', 'Topic Subsection')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Heading 3 (### Topic)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Lists & Blocks */}
        <button
          type="button"
          onClick={() => insertFormat('\n* ', '', 'Bullet item point')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Bullet List (* Item)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('\n1. ', '', 'Numbered step item')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Numbered List (1. Step)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('\n- [ ] ', '', 'Interactive student task')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Checklist / Task (- [ ] Task)"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('\n> ', '', 'Important note or quote')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Blockquote (> Quote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Math & Code Blocks */}
        <button
          type="button"
          onClick={() => insertFormat('\n$$\n', '\n$$\n', 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold transition-all text-xs flex items-center gap-1"
          title="LaTeX Math Block ($$ formula $$)"
        >
          <Sigma className="w-3.5 h-3.5" />
          <span className="text-[10px]">Math</span>
        </button>

        <button
          type="button"
          onClick={() => insertFormat('\n```python\n', '\n```\n', '# Write calculation code\ndef solve():\n    return True')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs flex items-center gap-1"
          title="Code Block (```language```)"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleInsertTable}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Insert Markdown Data Table"
        >
          <Table className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleInsertTakeaway}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition-all text-xs"
          title="Insert Takeaway Principle"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormat('\n---\n')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          title="Horizontal Section Divider (---)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* View Mode Toggle */}
      {showViewToggle && onViewModeChange && (
        <div className="flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onViewModeChange('write')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'write'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span className="text-[11px]">Write</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('split')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span className="text-[11px]">Split</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('preview')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="text-[11px]">Preview</span>
          </button>
        </div>
      )}
    </div>
  );
};
