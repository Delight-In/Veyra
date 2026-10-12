import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../../types';
import { useBlogs } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { htmlToMarkdown } from '../../utils/pasteHtmlToMarkdown';
import { api } from '../../services/api';
import { 
  ArrowLeft, Check, Sparkles, Eye, Edit3, Image as ImageIcon, 
  Tag, Clock, Globe, Lock, Share2, Heart, MessageSquare, 
  BookOpen, Code, Quote, List, ListOrdered, Heading1, Heading2, 
  Minus, AlertCircle, Plus, X, UploadCloud, CheckCircle2, ChevronRight,
  Video, Film, Terminal, Copy, ExternalLink, Play, Bold, Italic,
  Camera, Sliders, ChevronDown, Trash2, Link as LinkIcon
} from 'lucide-react';

interface MediumBlogEditorProps {
  initialBlog?: BlogPost | null;
  onClose: () => void;
  onPublished?: (blog: BlogPost) => void;
}

const PRESET_COVERS = [
  {
    name: 'Quantum Particle Vectors',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    tag: 'Physics'
  },
  {
    name: 'Algorithmic Code Matrix',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    tag: 'Computer Science'
  },
  {
    name: 'Neural Memory & Synapses',
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    tag: 'Cognitive Science'
  },
  {
    name: 'Astrophysics & Deep Space',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    tag: 'Astronomy'
  },
  {
    name: 'Laboratory Chemistry Matrix',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    tag: 'Chemistry'
  }
];

const AVAILABLE_TAGS = [
  'Cognitive Science', 'Simulations', 'Physics', 'Computer Science', 
  'Pedagogy', 'Algorithms', 'Mathematics', 'EdTech', 'Learning Theory', 
  'Interactive Labs', 'Artificial Intelligence', 'Academic Research'
];

const CODE_LANGUAGES = [
  'typescript', 'javascript', 'python', 'cpp', 'java', 
  'rust', 'go', 'sql', 'html', 'css', 'json', 'bash'
];

export interface StoryBlock {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'quote' | 'image' | 'code' | 'video' | 'divider';
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  videoUrl?: string;
  videoCaption?: string;
}

export function parseContentToBlocks(raw: string): StoryBlock[] {
  if (!raw || !raw.trim()) {
    return [{
      id: 'block-init',
      type: 'paragraph',
      content: ''
    }];
  }

  const chunks = raw.split(/\n{2,}/);
  const blocks: StoryBlock[] = [];

  chunks.forEach((chunk, index) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const id = `block-${index}-${Date.now().toString(36)}`;

    // 1. Image: ![caption](url)
    const imgMatch = trimmed.match(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/);
    if (imgMatch) {
      blocks.push({
        id,
        type: 'image',
        content: '',
        imageUrl: imgMatch[2].trim(),
        imageCaption: imgMatch[1].trim()
      });
      return;
    }

    // 1b. Direct base64 data URI or standalone image URL
    if (trimmed.startsWith('data:image/') || /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif|svg)$/i.test(trimmed)) {
      blocks.push({
        id,
        type: 'image',
        content: '',
        imageUrl: trimmed,
        imageCaption: ''
      });
      return;
    }

    // 1c. Ignore orphaned raw base64 string
    if (trimmed.length > 80 && !trimmed.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return;
    }

    // 2. Video: [video:URL|caption:CAPTION]
    const videoMatch = trimmed.match(/^\[video:(.*?)(?:\|caption:(.*?))?\]$/);
    if (videoMatch) {
      blocks.push({
        id,
        type: 'video',
        content: '',
        videoUrl: videoMatch[1].trim(),
        videoCaption: videoMatch[2]?.trim() || ''
      });
      return;
    }

    // 3. Code: ```lang\ncode\n```
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```([a-z0-9_-]*)/i);
      const codeLang = langMatch ? langMatch[1] : 'typescript';
      const cleanCode = trimmed.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '');
      blocks.push({
        id,
        type: 'code',
        content: '',
        codeSnippet: cleanCode,
        codeLanguage: codeLang
      });
      return;
    }

    // 4. Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({ id, type: 'h1', content: trimmed.replace(/^# /, '') });
      return;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      blocks.push({ id, type: 'h2', content: trimmed.replace(/^###? /, '') });
      return;
    }

    // 5. Quote
    if (trimmed.startsWith('> ')) {
      blocks.push({ id, type: 'quote', content: trimmed.replace(/^> /, '') });
      return;
    }

    // 6. Divider
    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ id, type: 'divider', content: '---' });
      return;
    }

    // 7. Regular paragraph / text
    blocks.push({ id, type: 'paragraph', content: trimmed });
  });

  if (blocks.length === 0) {
    blocks.push({ id: 'block-empty', type: 'paragraph', content: '' });
  }

  return blocks;
}

export function serializeBlocksToContent(blocks: StoryBlock[]): string {
  return blocks.map(b => {
    switch (b.type) {
      case 'image':
        return `![${b.imageCaption || ''}](${b.imageUrl || ''})`;
      case 'video':
        return `[video:${b.videoUrl || ''}|caption:${b.videoCaption || ''}]`;
      case 'code':
        return `\`\`\`${b.codeLanguage || 'code'}\n${b.codeSnippet || ''}\n\`\`\``;
      case 'h1':
        return `# ${b.content}`;
      case 'h2':
        return `## ${b.content}`;
      case 'quote':
        return `> ${b.content}`;
      case 'divider':
        return `---`;
      case 'paragraph':
      default:
        return b.content;
    }
  }).filter(Boolean).join('\n\n');
}

export const MediumBlogEditor: React.FC<MediumBlogEditorProps> = ({
  initialBlog,
  onClose,
  onPublished
}) => {
  const { saveBlog, publishBlog } = useBlogs();
  const { currentUser, login } = useAuth();

  const [title, setTitle] = useState<string>(initialBlog?.title || '');
  const [subtitle, setSubtitle] = useState<string>(initialBlog?.subtitle || '');
  const [content, setContent] = useState<string>(initialBlog?.content || '');
  const [coverImage, setCoverImage] = useState<string>(initialBlog?.coverImage || PRESET_COVERS[0].url);
  const [coverCaption, setCoverCaption] = useState<string>(initialBlog?.coverImageCaption || '');
  const [tags, setTags] = useState<string[]>(initialBlog?.tags || ['Cognitive Science', 'Simulations']);
  const [featured, setFeatured] = useState<boolean>(initialBlog?.featured || false);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [coverTab, setCoverTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [coverUrlInput, setCoverUrlInput] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [publishSuccessNotice, setPublishSuccessNotice] = useState<string | null>(null);

  // Modals for Medium block inserters
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<string>('typescript');
  const [codeSnippet, setCodeSnippet] = useState<string>('');

  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoCaptionInput, setVideoCaptionInput] = useState<string>('');
  const [videoTab, setVideoTab] = useState<'url' | 'upload'>('url');

  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [imageCaptionInput, setImageCaptionInput] = useState<string>('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [blocks, setBlocks] = useState<StoryBlock[]>(() => parseContentToBlocks(initialBlog?.content || ''));
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Sync initialBlog if changed
  useEffect(() => {
    if (initialBlog) {
      setTitle(initialBlog.title || '');
      setSubtitle(initialBlog.subtitle || '');
      setContent(initialBlog.content || '');
      setBlocks(parseContentToBlocks(initialBlog.content || ''));
      setCoverImage(initialBlog.coverImage || PRESET_COVERS[0].url);
      setCoverCaption(initialBlog.coverImageCaption || '');
      setTags(initialBlog.tags || ['Cognitive Science', 'Simulations']);
      setFeatured(initialBlog.featured || false);
    }
  }, [initialBlog]);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-calculate word count & read time
  const wordCount = (title + ' ' + subtitle + ' ' + content).trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Mark status as dirty on changes
  useEffect(() => {
    setSaveStatus('dirty');
  }, [title, subtitle, content, coverImage, tags, featured]);

  // Synchronize blocks and serialized content markdown
  const updateBlocksAndContent = (newBlocks: StoryBlock[]) => {
    setBlocks(newBlocks);
    const serialized = serializeBlocksToContent(newBlocks);
    setContent(serialized);
    setSaveStatus('dirty');
  };

  const handleUpdateBlockContent = (id: string, text: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content: text } : b);
    updateBlocksAndContent(updated);
  };

  const handleUpdateBlockCaption = (id: string, caption: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, imageCaption: caption } : b);
    updateBlocksAndContent(updated);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    updateBlocksAndContent(updated.length > 0 ? updated : [{ id: `block-${Date.now()}`, type: 'paragraph', content: '' }]);
  };

  const insertVisualImage = (imageUrl: string, imageCaption: string = '') => {
    const newBlock: StoryBlock = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'image',
      content: '',
      imageUrl,
      imageCaption
    };
    const trailingParagraph: StoryBlock = {
      id: `p-${Date.now() + 1}`,
      type: 'paragraph',
      content: ''
    };
    const updated: StoryBlock[] = [...blocks, newBlock, trailingParagraph];
    updateBlocksAndContent(updated);
  };

  const insertVisualCode = (snippet: string, language: string) => {
    const newBlock: StoryBlock = {
      id: `code-${Date.now()}`,
      type: 'code',
      content: '',
      codeSnippet: snippet,
      codeLanguage: language
    };
    const trailingParagraph: StoryBlock = {
      id: `p-${Date.now() + 1}`,
      type: 'paragraph',
      content: ''
    };
    const updated: StoryBlock[] = [...blocks, newBlock, trailingParagraph];
    updateBlocksAndContent(updated);
  };

  const insertVisualVideo = (url: string, caption: string = '') => {
    const newBlock: StoryBlock = {
      id: `vid-${Date.now()}`,
      type: 'video',
      content: '',
      videoUrl: url,
      videoCaption: caption
    };
    const trailingParagraph: StoryBlock = {
      id: `p-${Date.now() + 1}`,
      type: 'paragraph',
      content: ''
    };
    const updated: StoryBlock[] = [...blocks, newBlock, trailingParagraph];
    updateBlocksAndContent(updated);
  };

  // Insert helper right at cursor position (for markdown mode)
  const insertAtCursor = (insertion: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + insertion + content.substring(end);
      setContent(newContent);
      setBlocks(parseContentToBlocks(newContent));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }, 50);
    } else {
      setContent(prev => {
        const next = prev + insertion;
        setBlocks(parseContentToBlocks(next));
        return next;
      });
    }
    setSaveStatus('dirty');
  };

  // Format wrapper helper (for markdown mode & toolbar)
  const handleInsertFormat = (prefix: string, suffix: string = '') => {
    if (editorMode === 'visual') {
      if (prefix === '\n## ') {
        const newBlock: StoryBlock = { id: `h1-${Date.now()}`, type: 'h1', content: 'New Heading 1' };
        updateBlocksAndContent([...blocks, newBlock]);
        return;
      }
      if (prefix === '\n### ') {
        const newBlock: StoryBlock = { id: `h2-${Date.now()}`, type: 'h2', content: 'New Heading 2' };
        updateBlocksAndContent([...blocks, newBlock]);
        return;
      }
      if (prefix === '\n> ') {
        const newBlock: StoryBlock = { id: `quote-${Date.now()}`, type: 'quote', content: 'Pull quote text...' };
        updateBlocksAndContent([...blocks, newBlock]);
        return;
      }
      if (prefix === '\n---\n') {
        const newBlock: StoryBlock = { id: `div-${Date.now()}`, type: 'divider', content: '---' };
        updateBlocksAndContent([...blocks, newBlock]);
        return;
      }
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === 'paragraph') {
        handleUpdateBlockContent(lastBlock.id, (lastBlock.content ? lastBlock.content + ' ' : '') + prefix + 'text' + suffix);
      } else {
        const newBlock: StoryBlock = { id: `p-${Date.now()}`, type: 'paragraph', content: prefix + 'text' + suffix };
        updateBlocksAndContent([...blocks, newBlock]);
      }
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setBlocks(parseContentToBlocks(newContent));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  // =========================================================================
  // FORMATTED COPY/PASTE HANDLER: PRESERVES STRUCTURE & STYLES
  // =========================================================================
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    // 1. Check if user pasted an image file from clipboard (e.g. Snipping Tool or screenshot)
    const items = Array.from(e.clipboardData.items || []);
    const imageItem = items.find(item => item.type.indexOf('image') !== -1);
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = async (uploadEvent) => {
          const dataUrl = uploadEvent.target?.result as string;
          if (dataUrl) {
            let finalUrl = dataUrl;
            try {
              const res = await api.blogs.uploadImage(dataUrl, 'pasted_screenshot.png');
              if (res?.url) finalUrl = res.url;
            } catch {}
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            insertVisualImage(finalUrl, `Pasted Screenshot (${timestamp})`);
            setPublishSuccessNotice('📸 Image pasted directly into story!');
            setTimeout(() => setPublishSuccessNotice(null), 3000);
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 2. Check if rich HTML formatted text is in the clipboard
    const html = e.clipboardData.getData('text/html');
    if (html && html.trim().length > 10) {
      const convertedMarkdown = htmlToMarkdown(html);
      if (convertedMarkdown && convertedMarkdown.trim().length > 0) {
        e.preventDefault();
        if (editorMode === 'visual') {
          const pastedBlocks = parseContentToBlocks(convertedMarkdown);
          updateBlocksAndContent([...blocks, ...pastedBlocks]);
        } else {
          insertAtCursor(convertedMarkdown);
        }
        setPublishSuccessNotice('📋 Text pasted with structure & formatting preserved!');
        setTimeout(() => setPublishSuccessNotice(null), 3500);
        return;
      }
    }
  };

  // =========================================================================
  // FILE UPLOAD HANDLERS
  // =========================================================================
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size exceeds 15MB. Please choose a smaller image.');
      return;
    }

    setPublishSuccessNotice(`Uploading cover image "${file.name}"...`);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        let finalUrl = dataUrl;
        try {
          const res = await api.blogs.uploadImage(dataUrl, file.name);
          if (res?.url) finalUrl = res.url;
        } catch {}
        setCoverImage(finalUrl);
        setSaveStatus('dirty');
        setPublishSuccessNotice(`Cover image uploaded from "${file.name}"`);
        setTimeout(() => setPublishSuccessNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBodyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size exceeds 15MB. Please choose a smaller image.');
      return;
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setPublishSuccessNotice(`Uploading "${file.name}"...`);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        let finalUrl = dataUrl;
        try {
          const res = await api.blogs.uploadImage(dataUrl, file.name);
          if (res?.url) finalUrl = res.url;
        } catch {}
        insertVisualImage(finalUrl, cleanName);
        setPublishSuccessNotice(`Image "${file.name}" inserted into story!`);
        setTimeout(() => setPublishSuccessNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV, etc.).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size exceeds 50MB. For large videos, embedding via YouTube or Vimeo link is recommended.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setVideoUrlInput(dataUrl);
        setPublishSuccessNotice(`Local video "${file.name}" loaded ready to insert!`);
        setTimeout(() => setPublishSuccessNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    files.forEach(file => {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          let finalUrl = dataUrl;
          try {
            const res = await api.blogs.uploadImage(dataUrl, file.name);
            if (res?.url) finalUrl = res.url;
          } catch {}
          insertVisualImage(finalUrl, cleanName);
        }
      };
      reader.readAsDataURL(file);
    });

    setPublishSuccessNotice(`${files.length} image(s) inserted into story.`);
    setTimeout(() => setPublishSuccessNotice(null), 3000);
  };

  // =========================================================================
  // BLOCK INSERTION SUBMISSIONS
  // =========================================================================
  const handleSubmitCodeBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSnippet.trim()) {
      alert('Please enter or paste your code snippet.');
      return;
    }
    insertVisualCode(codeSnippet.trim(), codeLanguage);
    setCodeSnippet('');
    setIsCodeModalOpen(false);
    setPublishSuccessNotice(`Code block (${codeLanguage}) inserted into story!`);
    setTimeout(() => setPublishSuccessNotice(null), 3000);
  };

  const handleSubmitVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) {
      alert('Please enter a video URL or upload a local video file.');
      return;
    }
    insertVisualVideo(videoUrlInput.trim(), videoCaptionInput.trim());
    setVideoUrlInput('');
    setVideoCaptionInput('');
    setIsVideoModalOpen(false);
    setPublishSuccessNotice('Video embed added to story!');
    setTimeout(() => setPublishSuccessNotice(null), 3000);
  };

  const handleSubmitImageModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) {
      alert('Please enter an image URL.');
      return;
    }
    const caption = imageCaptionInput.trim();
    insertVisualImage(imageUrlInput.trim(), caption);
    setImageUrlInput('');
    setImageCaptionInput('');
    setIsImageModalOpen(false);
    setPublishSuccessNotice('Image inserted into story!');
    setTimeout(() => setPublishSuccessNotice(null), 3000);
  };

  // =========================================================================
  // SAVE / PUBLISH ACTIONS
  // =========================================================================
  const handleSaveDraft = () => {
    if (!title.trim()) {
      alert('Please enter a title for your article.');
      return;
    }
    setSaveStatus('saving');
    const saved = saveBlog({
      id: initialBlog?.id,
      title: title.trim(),
      subtitle: subtitle.trim(),
      content,
      coverImage,
      coverImageCaption: coverCaption,
      tags: tags && tags.length > 0 ? tags : ['Cognitive Science', 'EdTech'],
      featured,
      status: initialBlog?.status === 'published' ? 'published' : 'draft',
    });
    setSaveStatus('saved');
    setPublishSuccessNotice(`Draft "${saved.title}" saved successfully to /create-blog API!`);
    setTimeout(() => {
      setPublishSuccessNotice(null);
    }, 2500);
  };

  const handlePublishNow = () => {
    if (!title.trim()) {
      alert('Please enter a title before publishing.');
      return;
    }
    if (!content.trim()) {
      alert('Please write your story content before publishing.');
      return;
    }

    setSaveStatus('saving');
    const saved = saveBlog({
      id: initialBlog?.id,
      title: title.trim(),
      subtitle: subtitle.trim(),
      content,
      coverImage,
      coverImageCaption: coverCaption,
      tags: tags && tags.length > 0 ? tags : ['Cognitive Science', 'EdTech'],
      featured,
      status: 'published'
    });

    publishBlog(saved.id);
    setSaveStatus('saved');
    setIsPublishModalOpen(false);
    setPublishSuccessNotice(`"${saved.title}" has been published publicly on Veyra!`);

    if (onPublished) {
      onPublished(saved);
    }

    setTimeout(() => {
      setPublishSuccessNotice(null);
      onClose();
    }, 800);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      if (tags.length >= 5) {
        alert('You can select up to 5 topics/tags per story.');
        return;
      }
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const t = customTagInput.trim();
    if (t && !tags.includes(t)) {
      if (tags.length >= 5) {
        alert('Maximum 5 tags allowed.');
        return;
      }
      setTags([...tags, t]);
      setCustomTagInput('');
    }
  };

  // Video helper extractor
  const renderVideoEmbed = (videoUrl: string, caption?: string, keyIdx?: number) => {
    // 1. YouTube check
    const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const ytId = ytMatch[1];
      return (
        <figure key={keyIdx} className="my-8 space-y-2">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title={caption || 'Embedded Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {caption && <figcaption className="text-center text-xs text-slate-400 font-sans italic">{caption}</figcaption>}
        </figure>
      );
    }

    // 2. Vimeo check
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoId = vimeoMatch[1];
      return (
        <figure key={keyIdx} className="my-8 space-y-2">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={caption || 'Vimeo Video'}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {caption && <figcaption className="text-center text-xs text-slate-400 font-sans italic">{caption}</figcaption>}
        </figure>
      );
    }

    // 3. Direct video (MP4, WebM, local dataUrl/blob)
    return (
      <figure key={keyIdx} className="my-8 space-y-2">
        <video 
          controls 
          className="w-full rounded-2xl shadow-2xl max-h-[520px] bg-black border border-slate-200 dark:border-slate-800"
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>
        {caption && <figcaption className="text-center text-xs text-slate-400 font-sans italic">{caption}</figcaption>}
      </figure>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080C14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* ========================================================================= */}
      {/* 1. MEDIUM TOP BAR (MINIMALIST & EDITORIAL) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#080C14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back & Publication Meta */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Stories / Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="font-serif font-black text-base tracking-tight text-slate-900 dark:text-white">
                Veyra
              </span>
              <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
              <span className="text-xs text-slate-500 font-medium">
                Draft in <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser?.name || 'Priyanka'}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/80">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saving' ? 'bg-amber-400 animate-ping' : saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
                <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Draft'}</span>
              </span>
            </div>
          </div>

          {/* Right: Telemetry, Preview & Medium Green Publish Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                {readTimeMinutes} min read
              </span>
            </div>

            {/* If not signed in as Super Admin, show 1-click switch button */}
            {currentUser?.role !== 'super_admin' && (
              <button
                type="button"
                onClick={() => login('priyanka@veyra.com')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                title="Switch to Root Author Super Admin"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Super Admin</span>
              </button>
            )}

            {/* Toggle Preview / Editor */}
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isPreviewMode
                  ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPreviewMode ? 'Editor' : 'Preview'}</span>
            </button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Save Draft
            </button>

            {/* Medium Green Publish Button */}
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              title="Open publication drawer & publish story"
            >
              <span>Publish</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </header>

      {/* Success Notification Alert */}
      {publishSuccessNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 text-center animate-in fade-in flex items-center justify-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{publishSuccessNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN STORY CANVAS (DISTRACTION-FREE TYPOGRAPHY) */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {isPreviewMode ? (
          /* ===================================================================== */
          /* PREVIEW MODE: AUTHENTIC MEDIUM ARTICLE LAYOUT */
          /* ===================================================================== */
          <article className="space-y-8 animate-in fade-in">
            {/* Story Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {tags.map(t => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-[1.18] tracking-tight">
                {title || 'Untitled Story'}
              </h1>

              {subtitle && (
                <p className="text-xl sm:text-2xl text-slate-500 dark:text-slate-400 font-sans font-light leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Author Row */}
              <div className="flex items-center gap-3 pt-3 border-t border-b border-slate-100 dark:border-slate-800 py-3.5">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser?.name || 'Priyanka'}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {currentUser?.name || 'Priyanka'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold">
                      Author • Super Admin
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans flex items-center gap-2 mt-0.5">
                    <span>{readTimeMinutes} min read</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Hero Image */}
            {coverImage && (
              <figure className="space-y-2">
                <img
                  src={coverImage}
                  alt={title}
                  className="w-full max-h-[460px] object-cover rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800"
                />
                {coverCaption && (
                  <figcaption className="text-center text-xs text-slate-400 font-sans italic">
                    {coverCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Rendered Story Body with Medium Typography */}
            <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-slate-800 dark:text-slate-200 leading-relaxed space-y-6">
              {content ? (
                content.split('\n\n').map((paragraph, idx) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  // 1. VIDEO EMBED CHECK: [video:URL|caption:CAPTION] or standalone video link
                  const videoTagMatch = trimmed.match(/^\[video:(.*?)(?:\|caption:(.*?))?\]$/);
                  if (videoTagMatch) {
                    return renderVideoEmbed(videoTagMatch[1], videoTagMatch[2], idx);
                  }

                  const isStandaloneVideoUrl = trimmed.match(/^(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)[^\s]+)$/i);
                  if (isStandaloneVideoUrl) {
                    return renderVideoEmbed(isStandaloneVideoUrl[1], '', idx);
                  }

                  // 2. IMAGE EMBED CHECK: ![caption](url)
                  const imgMatch = trimmed.match(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/);
                  if (imgMatch) {
                    const caption = imgMatch[1]?.trim();
                    const src = imgMatch[2]?.trim();
                    return (
                      <figure key={idx} className="my-8 space-y-2">
                        <img
                          src={src}
                          alt={caption || 'Story illustration'}
                          className="w-full max-h-[550px] object-cover rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800"
                        />
                        {caption && (
                          <figcaption className="text-center text-xs text-slate-400 font-sans italic">
                            {caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }

                  // 2b. Direct image URL or base64 data URI
                  if (trimmed.startsWith('data:image/') || /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif|svg)$/i.test(trimmed)) {
                    return (
                      <figure key={idx} className="my-8 space-y-2">
                        <img
                          src={trimmed}
                          alt="Story illustration"
                          className="w-full max-h-[550px] object-cover rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800"
                        />
                      </figure>
                    );
                  }

                  // 2c. Guard against orphan base64 chunks (hide long alphanumeric blocks without spaces)
                  if (trimmed.length > 80 && !trimmed.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
                    return null;
                  }

                  // 3. CODE BOX CHECK: ```lang\ncode\n```
                  if (trimmed.startsWith('```')) {
                    const langMatch = trimmed.match(/^```([a-z0-9_-]*)/i);
                    const lang = langMatch ? langMatch[1] : 'code';
                    const cleanCode = trimmed.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '');
                    return (
                      <div key={idx} className="my-8 rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] shadow-xl">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-2.5">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{lang || 'CODE'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cleanCode);
                              alert('Code copied to clipboard!');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Code</span>
                          </button>
                        </div>
                        <pre className="p-4 sm:p-5 overflow-x-auto text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed">
                          <code>{cleanCode}</code>
                        </pre>
                      </div>
                    );
                  }

                  // 4. HEADERS
                  if (trimmed.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white mt-8 mb-3">
                        {trimmed.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-6 mb-2">
                        {trimmed.replace('### ', '')}
                      </h3>
                    );
                  }

                  // 5. BLOCKQUOTES
                  if (trimmed.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="border-l-4 border-indigo-600 dark:border-indigo-400 pl-5 py-2 my-6 italic text-slate-700 dark:text-slate-300 text-lg bg-indigo-50/30 dark:bg-indigo-950/20 rounded-r-xl">
                        {trimmed.replace(/^> /, '')}
                      </blockquote>
                    );
                  }

                  // 6. DIVIDERS & LISTS
                  if (trimmed.startsWith('---')) {
                    return <hr key={idx} className="my-8 border-slate-200 dark:border-slate-800" />;
                  }
                  if (trimmed.startsWith('- ')) {
                    const items = trimmed.split('\n').map(line => line.replace(/^- /, ''));
                    return (
                      <ul key={idx} className="list-disc pl-6 space-y-1.5 font-sans text-base">
                        {items.map((it, i) => (
                          <li key={i}>{it}</li>
                        ))}
                      </ul>
                    );
                  }

                  // 7. REGULAR PARAGRAPH
                  return (
                    <p key={idx} className="text-base sm:text-lg leading-relaxed font-sans text-slate-800 dark:text-slate-200">
                      {trimmed}
                    </p>
                  );
                })
              ) : (
                <p className="text-slate-400 italic">No content written yet. Switch to Editor to begin your story.</p>
              )}
            </div>

            {/* Author Footer Bio */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser?.name || 'Priyanka'}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <div className="font-black text-base text-slate-900 dark:text-white">
                    Written by {currentUser?.name || 'Priyanka'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Physics Honours & IT Specialist. Founder & Chief Academic Officer at Veyra. Pioneering active learning systems, living simulations, and cognitive science.
                  </p>
                </div>
              </div>
            </div>
          </article>
        ) : (
          /* ===================================================================== */
          /* WRITER / EDITOR MODE: AUTHENTIC MEDIUM MINIMALIST EDITING SURFACE */
          /* ===================================================================== */
          <div className="space-y-6">
            {/* Medium Segmented Floating Toolbar */}
            <div className="sticky top-16 z-20 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-none text-slate-700 dark:text-slate-300">
              
              {/* Group 1: Typography Formatting */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleInsertFormat('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('`', '`')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-mono"
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

              {/* Group 2: Headings & Hierarchy */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n## ', '\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-serif font-black"
                  title="Heading 1 (H1)"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n### ', '\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-serif font-bold"
                  title="Heading 2 (H2)"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n> ', '\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-serif"
                  title="Pull Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

              {/* Group 3: Lists & Divider */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n- ', '\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Bulleted List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n1. ', '\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('\n---\n')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Divider Rule"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

              {/* Group 4: Rich Blocks & Embeds */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-emerald-200/80 dark:border-emerald-800/80 shrink-0"
                  title="Insert image from computer or URL"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200/80 dark:border-indigo-800/80 shrink-0"
                  title="Insert syntax code box"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Code Box</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-purple-200/80 dark:border-purple-800/80 shrink-0"
                  title="Embed YouTube, Vimeo or local video"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

              {/* Group 5: Story Cover Photo */}
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                title="Manage story cover photo"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>{coverImage ? 'Cover Photo' : '+ Add Cover'}</span>
              </button>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

              {/* Group 6: Visual / Markdown Toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setBlocks(parseContentToBlocks(content));
                    setEditorMode('visual');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    editorMode === 'visual'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Medium Visual Story Canvas"
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContent(serializeBlocksToContent(blocks));
                    setEditorMode('markdown');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    editorMode === 'markdown'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Raw Markdown Syntax"
                >
                  Markdown
                </button>
              </div>
            </div>

            {/* Hidden File Inputs for Local Computer Images & Videos */}
            <input
              type="file"
              ref={coverFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCoverFileUpload}
            />
            <input
              type="file"
              ref={bodyFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleBodyImageUpload}
            />
            <input
              type="file"
              ref={videoFileInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleVideoFileUpload}
            />

            {/* Story Cover Image on Canvas */}
            {coverImage ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <img
                  src={coverImage}
                  alt="Story cover"
                  className="w-full h-56 sm:h-80 object-cover"
                />
                {/* Floating Cover Controls */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setIsCoverModalOpen(true)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Cover</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                    title="Remove Cover Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type caption for cover image (optional)..."
                  value={coverCaption}
                  onChange={(e) => setCoverCaption(e.target.value)}
                  className="w-full text-xs text-center p-2.5 bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 outline-none"
                />
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCoverModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Add cover image</span>
                </button>
              </div>
            )}

            {/* Story Title Input (Medium Bold Head) */}
            <input
              type="text"
              required
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-tight tracking-tight focus:ring-0 px-0"
            />

            {/* Story Subtitle Input */}
            <input
              type="text"
              placeholder="Tell your story..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full text-xl sm:text-2xl font-sans font-light text-slate-500 dark:text-slate-400 bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 px-0"
            />


            {/* Main Story Canvas with Drag-and-Drop & Live Visual Blocks */}
            <div 
              className={`relative rounded-2xl transition-all ${
                isDraggingOver 
                  ? 'ring-2 ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 p-2 border-2 border-dashed border-emerald-400' 
                  : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropFile}
            >
              {isDraggingOver && (
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center rounded-2xl z-10 pointer-events-none">
                  <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 animate-bounce" />
                    <span>Drop local image files here to insert into story</span>
                  </div>
                </div>
              )}

              {editorMode === 'visual' ? (
                /* AUTHENTIC MEDIUM WYSIWYG VISUAL CANVAS */
                <div className="space-y-4">
                  {blocks.map((block) => {
                    // 1. IMAGE BLOCK: VISUAL IMAGE DISPLAY
                    if (block.type === 'image') {
                      return (
                        <figure 
                          key={block.id} 
                          className="relative group my-8 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-md"
                        >
                          <div className="relative">
                            <img
                              src={block.imageUrl}
                              alt={block.imageCaption || 'Uploaded illustration'}
                              className="w-full max-h-[520px] object-cover"
                            />
                            {/* Floating Image Control Bar */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {/* Live Caption Input directly below image */}
                          <div className="p-2.5 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder="Type caption for image (optional)..."
                              value={block.imageCaption || ''}
                              onChange={(e) => handleUpdateBlockCaption(block.id, e.target.value)}
                              className="text-xs text-center flex-1 bg-transparent border-none outline-none italic text-slate-500 dark:text-slate-400 focus:text-slate-900 dark:focus:text-white"
                            />
                          </div>
                        </figure>
                      );
                    }

                    // 2. CODE BLOCK: DARK TERMINAL BOX
                    if (block.type === 'code') {
                      return (
                        <div key={block.id} className="relative group my-8 rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] shadow-xl">
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                              </div>
                              <span className="uppercase text-[11px] font-bold text-slate-300">{block.codeLanguage || 'CODE'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(block.codeSnippet || '');
                                  alert('Code copied to clipboard!');
                                }}
                                className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 font-mono"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                                title="Delete Code Box"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={Math.max(4, (block.codeSnippet || '').split('\n').length)}
                            value={block.codeSnippet || ''}
                            onChange={(e) => {
                              const updated = blocks.map(b => b.id === block.id ? { ...b, codeSnippet: e.target.value } : b);
                              updateBlocksAndContent(updated);
                            }}
                            className="w-full p-4 font-mono text-xs sm:text-sm text-emerald-300 bg-transparent outline-none resize-y leading-relaxed"
                          />
                        </div>
                      );
                    }

                    // 3. VIDEO BLOCK
                    if (block.type === 'video') {
                      return (
                        <div key={block.id} className="relative group my-8 space-y-2">
                          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                            {renderVideoEmbed(block.videoUrl || '', block.videoCaption || '', 0)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="italic">{block.videoCaption || 'Embedded Video'}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // 4. HEADING 1
                    if (block.type === 'h1') {
                      return (
                        <div key={block.id} className="relative group my-4">
                          <input
                            type="text"
                            placeholder="Heading 1..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 px-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            title="Delete Heading"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // 5. HEADING 2
                    if (block.type === 'h2') {
                      return (
                        <div key={block.id} className="relative group my-3">
                          <input
                            type="text"
                            placeholder="Heading 2..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 px-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            title="Delete Heading"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // 6. QUOTE
                    if (block.type === 'quote') {
                      return (
                        <div key={block.id} className="relative group my-6 border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-r-xl">
                          <textarea
                            rows={2}
                            placeholder="Pull quote text..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full italic text-lg font-serif text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none resize-none focus:ring-0 px-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            title="Delete Quote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // 7. DIVIDER
                    if (block.type === 'divider') {
                      return (
                        <div key={block.id} className="relative group my-8 flex items-center justify-center">
                          <hr className="w-full border-slate-200 dark:border-slate-800" />
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            title="Delete Divider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // 8. REGULAR PARAGRAPH (DEFAULT)
                    return (
                      <div key={block.id} className="relative group">
                        <textarea
                          rows={Math.max(2, block.content.split('\n').length)}
                          placeholder="Tell your story..."
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          onPaste={handlePaste}
                          className="w-full text-base sm:text-lg font-sans text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 px-0"
                        />
                      </div>
                    );
                  })}

                  {/* Add Paragraph Footer Controls */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        const newBlock: StoryBlock = {
                          id: `p-${Date.now()}`,
                          type: 'paragraph',
                          content: ''
                        };
                        updateBlocksAndContent([...blocks, newBlock]);
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add paragraph</span>
                    </button>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Medium Visual Canvas • Images & media render live
                    </div>
                  </div>
                </div>
              ) : (
                /* RAW MARKDOWN CODE MODE */
                <textarea
                  ref={textareaRef}
                  rows={18}
                  placeholder="Write your article in Medium markdown... Copy-pasting text from Google Docs or websites preserves headings, bold, code and bullet formatting."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setBlocks(parseContentToBlocks(e.target.value));
                  }}
                  onPaste={handlePaste}
                  className="w-full text-base sm:text-lg font-sans text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none resize-y leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 px-0"
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. CODE BOX INSERTER MODAL */}
      {/* ========================================================================= */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Insert Code in Code Box
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCodeBox} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Programming / Syntax Language:
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                >
                  {CODE_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Code Snippet:
                </label>
                <textarea
                  rows={8}
                  placeholder={`// Paste your ${codeLanguage} code snippet here...\nfunction calculateVelocity(distance, time) {\n  return distance / time;\n}`}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-300 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Insert Code Box</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIDEO EMBED MODAL */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Embed Video in Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVideo} className="space-y-4">
              {/* Video Tab Selector */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setVideoTab('url')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    videoTab === 'url' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  YouTube / Vimeo / Web URL
                </button>
                <button
                  type="button"
                  onClick={() => setVideoTab('upload')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    videoTab === 'upload' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Upload from Computer
                </button>
              </div>

              {videoTab === 'url' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paste YouTube, Vimeo, Loom or MP4 URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports any YouTube watch link, youtu.be short link, or direct MP4 URL.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2">
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Select video from your computer (MP4, WebM)
                  </div>
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Choose Video File</span>
                  </button>
                  {videoUrlInput && videoUrlInput.startsWith('data:video') && (
                    <div className="text-emerald-500 text-xs font-bold pt-1">
                      ✓ Video file loaded successfully!
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Video Caption (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Real-time Projectile Simulation Experiment Demonstration"
                  value={videoCaptionInput}
                  onChange={(e) => setVideoCaptionInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Insert Video Embed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INLINE IMAGE INSERTER MODAL */}
      {/* ========================================================================= */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Insert Image at Cursor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Image Source Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  imageTab === 'upload' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Upload from Computer
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  imageTab === 'url' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Paste Image URL
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Select an image file from your device (PNG, JPG, WebP, GIF)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    bodyFileInputRef.current?.click();
                    setIsImageModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Image File</span>
                </button>
                <p className="text-[11px] text-slate-400">
                  Tip: You can also drag and drop images or paste screenshots directly into the editor canvas!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitImageModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Image URL:
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Caption / Description (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Visual illustration of neural activation flow"
                    value={imageCaptionInput}
                    onChange={(e) => setImageCaptionInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert Image</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STORY COVER PHOTO MANAGER MODAL */}
      {/* ========================================================================= */}
      {isCoverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Story Cover Image
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Cover Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setCoverTab('presets')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  coverTab === 'presets' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Curated Presets
              </button>
              <button
                type="button"
                onClick={() => setCoverTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  coverTab === 'upload' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Upload from Computer
              </button>
              <button
                type="button"
                onClick={() => setCoverTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  coverTab === 'url' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Custom URL
              </button>
            </div>

            {/* Tab 1: Curated Scientific Presets */}
            {coverTab === 'presets' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Select a high-resolution hero image curated for scientific research & cognitive education:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {PRESET_COVERS.map(pc => {
                    const isSelected = coverImage === pc.url;
                    return (
                      <div
                        key={pc.url}
                        onClick={() => {
                          setCoverImage(pc.url);
                          setSaveStatus('dirty');
                          setIsCoverModalOpen(false);
                          setPublishSuccessNotice(`Cover photo set to "${pc.name}"`);
                          setTimeout(() => setPublishSuccessNotice(null), 3000);
                        }}
                        className={`group cursor-pointer rounded-2xl overflow-hidden border p-2 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <img
                          src={pc.url}
                          alt={pc.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {pc.tag}
                          </span>
                          <div className="font-bold text-xs text-slate-900 dark:text-white mt-1 truncate">
                            {pc.name}
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              ✓ Currently Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Upload from Computer */}
            {coverTab === 'upload' && (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3">
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Upload high-resolution cover photo from your local files (JPG, PNG, WebP)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    coverFileInputRef.current?.click();
                    setIsCoverModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Cover Image File</span>
                </button>
              </div>
            )}

            {/* Tab 3: Custom Web URL */}
            {coverTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Image URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={coverUrlInput || coverImage}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (coverUrlInput.trim()) {
                        setCoverImage(coverUrlInput.trim());
                        setSaveStatus('dirty');
                        setIsCoverModalOpen(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Apply URL as Cover
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {coverImage ? (
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage('');
                    setSaveStatus('dirty');
                    setIsCoverModalOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Current Cover</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PUBLISH DIALOG MODAL (CHOOSE TAGS & CONFIRM) */}
      {/* ========================================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Story Publication Preview (/create-blog API)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Mini Article Card Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex gap-3">
              {coverImage && (
                <img
                  src={coverImage}
                  alt="Thumbnail"
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="overflow-hidden space-y-1">
                <div className="font-serif font-black text-sm text-slate-900 dark:text-white truncate">
                  {title || 'Untitled Story'}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {subtitle || content.substring(0, 100) || 'Story description...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  By {currentUser?.name || 'Priyanka'} • {readTimeMinutes} min read
                </div>
              </div>
            </div>

            {/* Tag Selection for Medium Taxonomy */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Topics & Tags (Select up to 5 so readers can discover your story):
              </label>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {AVAILABLE_TAGS.map(t => {
                  const isSelected = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTag(t)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? `✓ ${t}` : `+ ${t}`}
                    </button>
                  );
                })}
              </div>

              {/* Add custom tag */}
              <form onSubmit={handleAddCustomTag} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Or enter custom topic tag..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Featured Story Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold">Feature this story at top of the Landing Page & Blogs Feed</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePublishNow}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Publish Now via /create-blog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
