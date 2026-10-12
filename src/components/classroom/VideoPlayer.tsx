import React, { useState, useRef, useEffect } from 'react';
import { VideoData, VideoCheckpoint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { Play, Pause, RotateCcw, FastForward, CheckCircle, HelpCircle, Subtitles, Search, Clock, Sparkles } from 'lucide-react';

interface VideoPlayerProps {
  videoData?: VideoData;
  title: string;
  transcriptText?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoData, title, transcriptText }) => {
  const { language } = useLanguage();
  const { addXp } = useStudy();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(videoData?.durationSeconds || 180);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [answeredCheckpoints, setAnsweredCheckpoints] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);

  // Checkpoints
  const checkpoints = videoData?.checkpoints || [];

  // Listen for time updates and trigger checkpoints
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Look for unhandled checkpoints within 0.8s
    for (const cp of checkpoints) {
      if (
        Math.abs(curr - cp.timestampSeconds) < 0.6 &&
        !answeredCheckpoints.includes(cp.id) &&
        activeCheckpoint?.id !== cp.id
      ) {
        videoRef.current.pause();
        setIsPlaying(false);
        setActiveCheckpoint(cp);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        break;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const submitCheckpointAnswer = () => {
    if (selectedOption === null || !activeCheckpoint) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === activeCheckpoint.correctIndex) {
      addXp(25);
    }
  };

  const continueAfterCheckpoint = () => {
    if (activeCheckpoint) {
      setAnsweredCheckpoints(prev => [...prev, activeCheckpoint.id]);
      setActiveCheckpoint(null);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {language === 'hi' ? 'इंटरैक्टिव वीडियो व्याख्या' : 'INTERACTIVE VIDEO CONCEPT'}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </span>
        </div>
      </div>

      {/* Cinematic Video Viewport */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
        <video
          ref={videoRef}
          src={videoData?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
          poster={videoData?.thumbnailUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-cover"
          playsInline
        />

        {/* Dynamic Subtitle overlay */}
        {showSubtitles && (
          <div className="absolute bottom-16 inset-x-4 text-center pointer-events-none">
            <span className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-lg border border-white/10 font-devanagari">
              {language === 'hi' 
                ? 'प्रक्षेप्य गति में क्षैतिज वेग स्थिर रहता है: vx = v₀ cos(θ)' 
                : 'In projectile motion, horizontal velocity remains constant: vx = v₀ cos(θ)'}
            </span>
          </div>
        )}

        {/* Checkpoint Pause Modal Overlay */}
        {activeCheckpoint && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0F172A] border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{language === 'hi' ? 'संकल्पना जांच (CONCEPT CHECKPOINT)' : 'CONCEPT CHECKPOINT'}</span>
              </div>

              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-4">
                {activeCheckpoint.question[language]}
              </h3>

              <div className="space-y-2 mb-4">
                {activeCheckpoint.options[language].map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === activeCheckpoint.correctIndex;
                  let optStyle = 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/50';

                  if (isAnswerSubmitted) {
                    if (isCorrect) optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30';
                    else if (isSelected && !isCorrect) optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30';
                  } else if (isSelected) {
                    optStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/30';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition-all ${optStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswerSubmitted ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">
                      {language === 'hi' ? 'व्याख्या:' : 'Scientific Explanation:'}
                    </span>
                    {activeCheckpoint.explanation[language]}
                  </div>
                  <button
                    onClick={continueAfterCheckpoint}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all"
                  >
                    {language === 'hi' ? 'वीडियो जारी रखें' : 'Continue Video'}
                  </button>
                </div>
              ) : (
                <button
                  disabled={selectedOption === null}
                  onClick={submitCheckpointAnswer}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-sm text-white shadow-md transition-all ${selectedOption === null ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {language === 'hi' ? 'उत्तर जांचें' : 'Check Answer'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 flex flex-col gap-2.5">
          {/* Timeline slider with checkpoint markers */}
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={e => seekTo(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-600/70 rounded-lg cursor-pointer"
            />
            {/* Markers */}
            {checkpoints.map(cp => {
              const pct = (cp.timestampSeconds / duration) * 100;
              const isDone = answeredCheckpoints.includes(cp.id);
              return (
                <div
                  key={cp.id}
                  style={{ left: `${pct}%` }}
                  title={`Checkpoint at ${formatTime(cp.timestampSeconds)}`}
                  className={`absolute w-3 h-3 -top-0.5 rounded-full border-2 border-white cursor-pointer pointer-events-none shadow-sm ${isDone ? 'bg-emerald-400' : 'bg-amber-400'}`}
                />
              );
            })}
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
                className="hover:text-indigo-300 flex items-center gap-1 font-mono"
                title="Back 10s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-10s</span>
              </button>

              <span className="font-mono text-slate-300 text-[11px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Subtitle Toggle */}
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${showSubtitles ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Toggle Subtitles"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'उपशीर्षक' : 'CC'}</span>
              </button>

              {/* Speed dropdown */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={`px-1.5 py-0.5 rounded ${playbackRate === rate ? 'font-bold text-indigo-400 bg-white/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Searchable Video Transcript & Key Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Searchable Transcript */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'hi' ? 'खोजने योग्य ट्रांसक्रिप्ट' : 'SEARCHABLE TRANSCRIPT'}</span>
            </h4>
          </div>
          <input
            type="text"
            placeholder={language === 'hi' ? 'ट्रांसक्रिप्ट में खोजें...' : 'Search keywords in transcript...'}
            value={transcriptSearch}
            onChange={e => setTranscriptSearch(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="text-xs text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto space-y-2 pr-2 leading-relaxed font-devanagari">
            <p>
              <button
                onClick={() => seekTo(5)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline mr-1.5 font-mono"
              >
                [00:05]
              </button>
              {transcriptText || (language === 'hi' 
                ? 'नमस्ते दोस्तों! आज हम प्रक्षेप्य गति (Projectile Motion) को समझेंगे। जब आप किसी गेंद को आगे फेंकते हैं, तो दो स्वतंत्र गतियाँ एक साथ होती हैं...'
                : 'Welcome everyone! Today we are exploring projectile motion. When you throw a ball forward, two independent motions occur simultaneously...')}
            </p>
            <p>
              <button
                onClick={() => seekTo(15)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline mr-1.5 font-mono"
              >
                [00:15]
              </button>
              {language === 'hi'
                ? 'क्षैतिज दिशा में त्वरण शून्य होता है अतः वेग vx = v₀ cos(θ) स्थिर रहता है।'
                : 'Horizontally, acceleration is zero, so velocity vx = v₀ cos(θ) remains constant.'}
            </p>
          </div>
        </div>

        {/* Checkpoint Timeline Progress */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'hi' ? 'वीडियो चेकपॉइंट प्रगति' : 'RETENTION CHECKPOINTS'}</span>
          </h4>
          <div className="space-y-2">
            {checkpoints.map((cp, idx) => {
              const isDone = answeredCheckpoints.includes(cp.id);
              return (
                <div
                  key={cp.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {isDone ? '✓' : idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {formatTime(cp.timestampSeconds)} • {cp.question[language]}
                    </span>
                  </div>
                  <button
                    onClick={() => seekTo(cp.timestampSeconds - 2)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex-shrink-0 ml-2"
                  >
                    {language === 'hi' ? 'कूदें' : 'Seek'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
