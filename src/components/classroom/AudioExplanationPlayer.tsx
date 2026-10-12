import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Play, Pause, RotateCcw, 
  Sparkles, Globe, Headphones, FastForward, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { speakWithIndianAccent, preloadSpeechVoices, getActiveIndianVoiceLabel } from '../../utils/speechVoice';

interface AudioExplanationPlayerProps {
  audioData?: {
    audioUrl?: string;
    narrationTitle?: string;
    scriptEn?: string;
    scriptHi?: string;
    durationSeconds?: number;
  };
  nodeTitle: string;
  defaultText?: string;
}

export const AudioExplanationPlayer: React.FC<AudioExplanationPlayerProps> = ({ 
  audioData, 
  nodeTitle,
  defaultText 
}) => {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<'hi' | 'en'>('hi');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(audioData?.durationSeconds || 120);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scriptHindi = audioData?.scriptHi || 
    `नमस्ते दोस्तों! आज के इस विशेष पाठ में हम ${nodeTitle} के मूलभूत सिद्धांतों को गहराई से समझेंगे। भौतिकी और विज्ञान की यह संकल्पना हमारे दैनिक जीवन और उन्नत अनुसंधान दोनों में अत्यंत महत्वपूर्ण है। आइए इस विषय को चरणबद्ध तरीके से समझें।`;

  const scriptEnglish = audioData?.scriptEn || 
    `Namaste and welcome! In this audio masterclass, we break down the core principles of ${nodeTitle}. This fundamental topic connects real-world phenomena with mathematical formulation. Follow along with the interactive audio walkthrough.`;

  const activeScript = selectedLanguage === 'hi' ? scriptHindi : scriptEnglish;
  const sentences = activeScript.split(/(?<=[।.\n])/).filter(s => s.trim().length > 0);

  // Preload voices & stop speech on unmount
  useEffect(() => {
    preloadSpeechVoices();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (audioData?.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Fallback: Web Speech Synthesis API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      synthRef.current = speakWithIndianAccent(activeScript, {
        lang: selectedLanguage,
        rate: playbackSpeed,
        onBoundary: (e) => {
          if (e.name === 'sentence' || e.charIndex !== undefined) {
            const charPos = e.charIndex;
            let cumulative = 0;
            for (let i = 0; i < sentences.length; i++) {
              cumulative += sentences[i].length;
              if (charPos < cumulative) {
                setActiveSentenceIndex(i);
                break;
              }
            }
          }
        },
        onEnd: () => {
          setIsPlaying(false);
          setActiveSentenceIndex(0);
        },
        onError: () => {
          setIsPlaying(false);
          setActiveSentenceIndex(0);
        }
      });
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    } else if (isPlaying) {
      // Re-trigger speech with updated rate
      handleTogglePlay();
      setTimeout(handleTogglePlay, 50);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {language === 'hi' ? 'ऑडियो मास्टरक्लास' : 'AUDIO MASTERCLASS'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-devanagari">
                {language === 'hi' ? 'भारतीय द्विभाषी ध्वनि इंजन' : 'Indian Speech Synthesis Engine'}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-devanagari">
              {audioData?.narrationTitle || (language === 'hi' ? `ऑडियो व्याख्या: ${nodeTitle}` : `Audio Explanation: ${nodeTitle}`)}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                🇮🇳 {getActiveIndianVoiceLabel(selectedLanguage)}
              </span>
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
              setSelectedLanguage(selectedLanguage === 'hi' ? 'en' : 'hi');
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:border-amber-400"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{selectedLanguage === 'hi' ? '🇮🇳 हिन्दी व्याख्या' : '🇮🇳 Indian English'}</span>
          </button>
        </div>
      </div>

      {/* Main Audio Controls Deck */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-4">
        {audioData?.audioUrl && (
          <audio
            ref={audioRef}
            src={audioData.audioUrl}
            onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main Play/Pause Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white font-devanagari">
                {isPlaying 
                  ? (language === 'hi' ? 'भारतीय ऑडियो मास्टरक्लास सक्रिय है' : 'Playing Indian Accent Masterclass') 
                  : (language === 'hi' ? 'ऑडियो व्याख्या तैयार है' : 'Indian Audio Explanation Ready')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-devanagari">
                {selectedLanguage === 'hi' 
                  ? (language === 'hi' ? 'स्पष्ट देवनागरी ध्वनि उच्चारण (भारतीय लहजा)' : 'Clear Devanagari Pronunciation') 
                  : (language === 'hi' ? 'स्पष्ट भारतीय अंग्रेजी व्याख्या' : 'Genuine Indian Accent Narration')}
              </div>
            </div>
          </div>

          {/* Speed & Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeedChange}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 transition-colors"
            >
              {language === 'hi' ? 'गति' : 'Speed'}: {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Audio Wave / Progress bar */}
        <div className="space-y-1.5 pt-2">
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
              style={{
                width: isPlaying ? `${Math.min(100, ((activeSentenceIndex + 1) / Math.max(1, sentences.length)) * 100)}%` : '0%'
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isPlaying ? (language === 'hi' ? 'लाइव ऑडियो स्ट्रीम' : 'Live Audio Stream') : '00:00'}</span>
            <span>{language === 'hi' ? 'वाक्य' : 'Sentence'} {activeSentenceIndex + 1} {language === 'hi' ? 'कुल' : 'of'} {sentences.length}</span>
          </div>
        </div>
      </div>

      {/* Synchronized Script Teleprompter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-devanagari">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'hi' ? 'इंटरैक्टिव वाचन प्रतिलिपि एवं मुख्य अंश' : 'Interactive Spoken Transcript & Highlights'}</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-devanagari">
            {language === 'hi' ? 'पंक्ति पर ध्यान केंद्रित करने हेतु क्लिक करें' : 'Click any line to focus'}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 max-h-64 overflow-y-auto space-y-3">
          {sentences.map((sent, idx) => {
            const isSentenceActive = isPlaying && idx === activeSentenceIndex;
            return (
              <p
                key={idx}
                onClick={() => setActiveSentenceIndex(idx)}
                className={`text-sm leading-relaxed p-2 rounded-xl transition-all cursor-pointer ${
                  isSentenceActive
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-400/50'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${selectedLanguage === 'hi' ? 'font-devanagari text-base' : ''}`}
              >
                {sent}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};
