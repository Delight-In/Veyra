import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Volume2, VolumeX } from 'lucide-react';

interface TextToSpeechButtonProps {
  text: string;
  className?: string;
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({ text, className = '' }) => {
  const { language, t, speakText, stopSpeaking, isSpeaking } = useLanguage();

  const handleToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      // Strip markdown symbols for natural speech
      const cleanText = text
        .replace(/#{1,6}\s+/g, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/\n/g, ' ');
      speakText(cleanText, language);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        isSpeaking
          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
      } ${className}`}
      title={isSpeaking ? t('common.stopAudio') : t('common.listenAudio')}
    >
      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      <span>{isSpeaking ? t('common.stopAudio') : t('common.listenAudio')}</span>
    </button>
  );
};
