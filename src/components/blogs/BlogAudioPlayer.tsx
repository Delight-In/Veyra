import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../../types';
import { SpeechParagraph } from '../../utils/blogSpeech';
import { 
  getAvailableVoicesForLanguage, 
  getActiveIndianVoiceLabel, 
  isHindiVoice, 
  isIndianEnglishVoice 
} from '../../utils/speechVoice';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, 
  Volume2, VolumeX, X, Globe, Gauge, Mic, 
  ChevronDown, Check, Sparkles, Headphones 
} from 'lucide-react';

interface BlogAudioPlayerProps {
  blog: BlogPost;
  selectedLanguage: 'en' | 'hi';
  onLanguageChange: (lang: 'en' | 'hi') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentParagraphIndex: number;
  totalParagraphs: number;
  currentParagraph?: SpeechParagraph;
  onSelectParagraph: (index: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  preferredVoiceName?: string;
  onSelectVoice: (voiceName: string) => void;
  onRestart: () => void;
}

export const BlogAudioPlayer: React.FC<BlogAudioPlayerProps> = ({
  blog,
  selectedLanguage,
  onLanguageChange,
  isPlaying,
  onTogglePlay,
  onStop,
  currentParagraphIndex,
  totalParagraphs,
  currentParagraph,
  onSelectParagraph,
  playbackSpeed,
  onChangeSpeed,
  preferredVoiceName,
  onSelectVoice,
  onRestart
}) => {
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState<boolean>(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceMenuRef = useRef<HTMLDivElement | null>(null);

  // Load available voices for active language
  useEffect(() => {
    const updateVoices = () => {
      const list = getAvailableVoicesForLanguage(selectedLanguage);
      setAvailableVoices(list);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    }
  }, [selectedLanguage]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setIsVoiceMenuOpen(false);
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const progressPercent = totalParagraphs > 0 
    ? Math.min(100, Math.round(((currentParagraphIndex + 1) / totalParagraphs) * 100))
    : 0;

  const displayTitle = selectedLanguage === 'hi' && blog.hindiTitle 
    ? blog.hindiTitle 
    : blog.title;

  const currentVoiceLabel = getActiveIndianVoiceLabel(selectedLanguage, preferredVoiceName);

  return (
    <div 
      ref={voiceMenuRef}
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[96%] max-w-4xl z-50 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#090D18]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-3 sm:p-4 space-y-2.5">
        
        {/* Top Bar: Blog Info + Dual-Language Selector + Close */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Blog Meta */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <Headphones className="w-5 h-5" />
              {isPlaying && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Veyra Audio
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedLanguage === 'hi' ? 'अनुच्छेद' : 'Paragraph'} {currentParagraphIndex + 1}/{totalParagraphs}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {displayTitle}
              </h4>
            </div>
          </div>

          {/* Right Action: Language Switcher + Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dual Language Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedLanguage === 'hi'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Listen in Hindi"
              >
                <span>🇮🇳</span>
                <span>हिन्दी</span>
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedLanguage === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Listen in English"
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onStop}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Bar: Interactive Progress Scrubber */}
        <div className="space-y-1">
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetIdx = Math.min(totalParagraphs - 1, Math.floor(ratio * totalParagraphs));
              onSelectParagraph(targetIdx);
            }}
            className="group relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer overflow-hidden transition-all hover:h-2.5"
            title="Click to seek paragraph"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="truncate max-w-[280px] sm:max-w-md">
              {currentParagraph?.sectionTitle 
                ? `${selectedLanguage === 'hi' ? 'खंड' : 'Section'}: ${currentParagraph.sectionTitle}` 
                : 'Introduction'}
            </span>
            <span className="font-bold">{progressPercent}%</span>
          </div>
        </div>

        {/* Live Subtitle snippet */}
        {currentParagraph?.spokenText && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans line-clamp-2">
            <span className="text-amber-500 dark:text-amber-400 font-bold mr-1.5">
              {isPlaying ? '▶' : '⏸'}
            </span>
            {currentParagraph.spokenText}
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Left: Voice Selection Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setIsVoiceMenuOpen(!isVoiceMenuOpen);
                setIsSpeedMenuOpen(false);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              title="Change Voice Engine"
            >
              <Mic className="w-3 h-3 text-amber-500" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {currentVoiceLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Voice Dropdown */}
            {isVoiceMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  {selectedLanguage === 'hi' ? 'उपलब्ध हिन्दी ध्वनियाँ' : 'Available English Voices'}
                </div>
                
                {availableVoices.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">
                    Using browser default engine
                  </div>
                ) : (
                  availableVoices.map((v) => {
                    const isSelected = preferredVoiceName 
                      ? preferredVoiceName === v.name 
                      : false;
                    const isIndian = isIndianEnglishVoice(v) || isHindiVoice(v);
                    return (
                      <button
                        key={v.name}
                        onClick={() => {
                          onSelectVoice(v.name);
                          setIsVoiceMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="truncate flex items-center gap-1.5">
                          <span>{isIndian ? '🇮🇳' : '🎙️'}</span>
                          <span className="truncate">{v.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Center: Transport Controls (Previous, Play/Pause, Next) */}
          <div className="flex items-center gap-2">
            {/* Restart */}
            <button
              onClick={onRestart}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Skip Previous */}
            <button
              onClick={() => onSelectParagraph(Math.max(0, currentParagraphIndex - 1))}
              disabled={currentParagraphIndex === 0}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Paragraph"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary */}
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause Narration' : 'Play Narration'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            {/* Skip Next */}
            <button
              onClick={() => onSelectParagraph(Math.min(totalParagraphs - 1, currentParagraphIndex + 1))}
              disabled={currentParagraphIndex >= totalParagraphs - 1}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Paragraph"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Playback Speed Control */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSpeedMenuOpen(!isSpeedMenuOpen);
                setIsVoiceMenuOpen(false);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
              title="Playback Speed"
            >
              <Gauge className="w-3 h-3 text-emerald-500" />
              <span>{playbackSpeed}x</span>
            </button>

            {/* Speed Options Popover */}
            {isSpeedMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 space-y-1">
                {[0.8, 0.9, 1.0, 1.2, 1.4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      onChangeSpeed(spd);
                      setIsSpeedMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-xl text-xs font-mono font-bold flex items-center justify-between ${
                      playbackSpeed === spd
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{spd}x</span>
                    {playbackSpeed === spd && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
