import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Sparkles, Compass, BookOpen, Users, Award, Heart, Cpu, Zap, Flame, 
  ShieldCheck, Layers, ArrowRight, GraduationCap, Laptop, Code, Atom, 
  CheckCircle2, BarChart3, Brain, Globe2, Sliders, Play, Volume2, Shield, Lock
} from 'lucide-react';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const [activePillar, setActivePillar] = useState<'simulations' | 'multilingual' | 'spaced_repetition'>('simulations');

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-6 px-4 sm:px-6 lg:px-8">
      {/* 1. HERO HEADER */}
      <section className="text-center space-y-5 max-w-4xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          <span>{language === 'hi' ? 'हमारा विज़न, आर्किटेक्चर एवं संस्थापक' : 'OUR VISION, ARCHITECTURE & FOUNDER'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
          {language === 'hi' ? (
            <>
              सहज विज्ञान एवं आधुनिक तकनीक से{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">
                हर विद्यार्थी का सशक्तिकरण
              </span>
            </>
          ) : (
            <>
              Empowering Every Learner Through{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">
                Intuitive Science & Technology
              </span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari max-w-3xl mx-auto">
          {t('about.subtitle')}
        </p>

        {/* Quick Highlights / Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">60 FPS</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'कैनवास सिमुलेशन इंजन' : 'Canvas Physics Engine'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono">{language === 'hi' ? '100% संवादात्मक' : '100% Active'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'सक्रिय संज्ञानात्मक महारत' : 'Cognitive Mastery'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{language === 'hi' ? 'SM-2 एल्गोरिदम' : 'SM-2 Algorithm'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'सक्रिय स्मरण फ्लैशकार्ड' : 'Spaced Repetition Recall'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-lg sm:text-xl font-black text-amber-500 dark:text-amber-400 font-mono">{language === 'hi' ? 'बहुभाषी' : 'Multilingual'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'शून्य भाषाई बाधा' : 'Native Phonetics & Labs'}</div>
          </div>
        </div>
      </section>

      {/* 2. FOUNDER PROFILE: PRIYANKA */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
          {/* Avatar & Visual Badge */}
          <div className="flex flex-col items-center flex-shrink-0 space-y-3">
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center text-center p-3">
                  <Atom className="w-12 h-12 text-indigo-400 animate-spin-slow mb-1" />
                  <span className="font-extrabold text-white text-base tracking-wide">Priyanka</span>
                  <span className="text-[10px] text-indigo-300 font-mono">{language === 'hi' ? 'भौतिकी एवं आईटी' : 'Physics & IT'}</span>
                </div>
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {language === 'hi' ? 'संस्थापक' : 'Founder'}
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700/60 text-indigo-200">
                {language === 'hi' ? '🎓 बी.एससी. भौतिकी (ऑनर्स)' : '🎓 B.Sc. Physics (Hons)'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-700/60 text-purple-200">
                {language === 'hi' ? '💻 आईटी (IT) क्षेत्र' : '💻 IT Sector'}
              </span>
            </div>
          </div>

          {/* Bio & Academic Vision */}
          <div className="space-y-4 text-center lg:text-left flex-1">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-indigo-400">
                {t('about.creatorTitle')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {t('about.creatorName')}
              </h2>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? 'भौतिक विज्ञान (ऑनर्स) स्नातक' : 'Graduated in Physics Honours'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                  <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                  {language === 'hi' ? 'आईटी (IT) क्षेत्र में कार्यरत' : 'Working in IT Sector'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-devanagari">
              {t('about.creatorBio')}
            </p>

            {/* Founder's Philosophy Quote Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              {language === 'hi' ? (
                <>
                  "विज्ञान केवल समीकरणों और याद करने का विषय नहीं है। जब एक विद्यार्थी कंप्यूटर स्क्रीन पर गुरुत्वाकर्षण, क्वांटम अवस्थाओं या प्रोजेक्टाइल को लाइव गति देते हुए देखता है, तब सच्ची वैज्ञानिक जिज्ञासा और अंतर्ज्ञान का जन्म होता है। यही वेयरा का मूल उद्देश्य है।"
                  <span className="block not-italic font-bold text-white mt-1.5">— प्रियंका (संस्थापक, वेयरा)</span>
                </>
              ) : (
                <>
                  "Education should never be about memorizing static symbols from dry blackboards. When learners can dynamically manipulate gravity fields, observe wave superposition, and test algorithms in real-time, genuine scientific intuition is unlocked."
                  <span className="block not-italic font-bold text-white mt-1.5">— Priyanka (Founder, Veyra)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM STORY & MISSION */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {language === 'hi' ? 'वेयरा की उत्पत्ति' : 'The Genesis of Veyra'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('about.storyTitle')}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
          {t('about.storyText')}
        </p>

        {/* Comparison: Traditional vs. Veyra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
            <h3 className="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <span>⚠️</span>
              {language === 'hi' ? 'पारंपरिक शिक्षा की चुनौतियां' : 'Traditional Educational Pitfalls'}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{language === 'hi' ? 'निष्क्रिय वीडियो और नीरस व्याख्यान जहां विद्यार्थी केवल दर्शक बना रहता है।' : 'Passive pre-recorded lectures where students remain passive viewers.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{language === 'hi' ? 'जटिल सूत्रों का अंधाधुंध रट्टा बिना किसी दृश्य या प्रायोगिक बोध के।' : 'Blind rote memorization of equations without kinetic or visual intuition.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{language === 'hi' ? 'कठिन भाषाई शब्दावली के कारण अवधारणात्मक समझ में बाधा।' : 'Rigid linguistic barriers alienating learners from high-level STEM concepts.'}</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
            <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {language === 'hi' ? 'वेयरा (Veyra) का वैज्ञानिक समाधान' : 'Veyra\'s Active Engineering Solution'}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{language === 'hi' ? '60 FPS लाइव इन-ब्राउज़र सिमुलेशन जहां हर पैरामीटर को सीधे बदला जा सकता है।' : '60 FPS in-browser physics simulations where variables react instantaneously.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{language === 'hi' ? 'एबिंगहॉस विस्मृति वक्र को मात देने वाला SM-2 स्पेस्ड रिपीटिशन कार्ड्स।' : 'SM-2 spaced repetition cards mathematically defeating forgetting curves.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{language === 'hi' ? 'सटीक उच्चारण और बहुभाषी तकनीकी शब्दावली का बिना रुकावट अनुभव।' : 'Equal fidelity in technical phonetics and multilingual scientific expressions.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. THE CORE PLATFORM PILLARS (DEEP DIVE) */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
            {language === 'hi' ? 'इंजीनियरिंग एवं शिक्षाशास्त्र' : 'ENGINEERING & PEDAGOGY'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {language === 'hi' ? 'वेयरा के तीन प्रमुख तकनीकी स्तम्भ' : 'The Three Architectural Pillars of Veyra'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'hi'
              ? 'प्रत्येक सुविधा को संज्ञानात्मक विज्ञान और कंप्यूटर विज्ञान के आधुनिक सिद्धांतों पर गढ़ा गया है।'
              : 'Every capability is built upon cognitive science research and high-performance computing.'}
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActivePillar('simulations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePillar === 'simulations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '1. काइनेटिक सिमुलेटर (60 FPS)' : '1. Kinetic Physics Engine'}</span>
          </button>
          <button
            onClick={() => setActivePillar('multilingual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePillar === 'multilingual'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '2. बहुभाषी ध्वनिविज्ञान' : '2. Multilingual Phonetics'}</span>
          </button>
          <button
            onClick={() => setActivePillar('spaced_repetition')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePillar === 'spaced_repetition'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '3. स्पेस्ड रिपीटिशन (SM-2)' : '3. Spaced Repetition (SM-2)'}</span>
          </button>
        </div>

        {/* Pillar Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card">
          {activePillar === 'simulations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in fade-in">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {language === 'hi' ? 'रीयल-टाइम संगणना' : 'Real-Time Computation'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? '60 FPS कैनवास सिमुलेशन एवं प्रक्षेप्य गति' : '60 FPS In-Browser Kinematic Physics'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
                  {language === 'hi'
                    ? 'प्रियंका के भौतिकी पृष्ठभूमि के आधार पर, वेयरा में समीकरण केवल पृष्ठ पर नहीं लिखे होते। छात्र पृथ्वी, चंद्रमा, मंगल और बृहस्पति जैसे विभिन्न गुरुत्वाकर्षण क्षेत्रों में प्रक्षेप्य कोण, प्रारंभिक वेग और दूरी के अनुसार तात्कालिक प्रक्षेप्य पथ का अवलोकन करते हैं।'
                    : 'Grounded in fundamental physics principles, equations in Veyra are living computational graphs. Learners manipulate projectile angles, launch velocities, and gravitational bodies across Earth, Moon, Mars, and Jupiter to build authentic kinematic intuition.'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {language === 'hi' ? 'गतिकी अवकल समीकरण सॉल्वर' : 'Kinematic Differential Solvers'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {language === 'hi' ? 'लाइव परास: R = v₀²·sin(2θ)/g' : 'Real-time Range: R = v₀²·sin(2θ)/g'}
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>{language === 'hi' ? 'काइनेटिक इंजन टेलीमेट्री' : 'Kinematic Engine Telemetry'}</span>
                  <span className="text-emerald-400 font-bold">● 60 FPS</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>{language === 'hi' ? 'गुरुत्वाकर्षण: पृथ्वी (9.80 m/s²) | चंद्रमा (1.62 m/s²)' : 'Gravity: Earth (9.80 m/s²) | Moon (1.62 m/s²)'}</div>
                  <div>{language === 'hi' ? 'अधिकतम ऊंचाई' : 'Max Altitude'}: H_max = v₀²·sin²θ / 2g</div>
                  <div>{language === 'hi' ? 'उड्डयन काल' : 'Flight Duration'}: T = 2·v₀·sinθ / g</div>
                  <div className="text-emerald-400 pt-1">
                    {language === 'hi' ? 'प्रक्षेप्य स्थिति: dt=0.04s आयलर संख्यात्मक चरण द्वारा हल' : 'Trajectory Status: Solved via dt=0.04s numerical Euler step'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePillar === 'multilingual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in fade-in">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {language === 'hi' ? 'भाषाई सेतु' : 'Linguistic Bridge'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'बहुभाषी ध्वनिविज्ञान एवं मानक वैज्ञानिक शब्दावली' : 'High-Fidelity Multilingual Phonetics'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
                  {language === 'hi'
                    ? 'जटिल शब्दों जैसे "क्वांटम सुपरपोजिशन", "सार्वभौमिक गुरुत्वाकर्षण" और "बाइनरी सर्च ट्री" को अपनी चुनी हुई भाषा में उच्चारण के साथ सुनें। वेयरा भाषा को बाधा नहीं, बल्कि ज्ञान तक पहुंचने का सशक्त सेतु बनाती है।'
                    : 'Technical terms like Quantum Superposition and Universal Gravitation feature native technical phonetics and side-by-side global definitions, eliminating the cognitive burden when transitioning between regional languages and international literature.'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {language === 'hi' ? 'वेब स्पीच एपीआई वाचन' : 'Web Speech API Synthesis'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {language === 'hi' ? 'शून्य संज्ञानात्मक अनुवाद अवरोध' : 'Zero Cognitive Translation Penalty'}
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  {language === 'hi' ? 'वैज्ञानिक ध्वनिविज्ञान नमूना' : 'Scientific Phonetics Sample'}
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-purple-200/80 dark:border-purple-800 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Quantum Superposition (क्वांटम सुपरपोजिशन)</div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'सटीक तकनीकी शब्दावली के साथ द्वि-ध्वन्यात्मक वाक् संश्लेषण।' : 'Dual-phonetic speech synthesis with accurate terminology.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePillar === 'spaced_repetition' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in fade-in">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {language === 'hi' ? 'सक्रिय स्मरण प्रतिधारण' : 'Active Recall Retention'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'SM-2 स्पेस्ड रिपीटिशन फ्लैशकार्ड इंजन' : 'SM-2 Spaced Repetition Flashcard Engine'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
                  {language === 'hi'
                    ? 'वैज्ञानिक शोध से प्रमाणित है कि मानव मस्तिष्क पढ़ी हुई सामग्री का 70% एक सप्ताह के भीतर भूल जाता है (एबिंगहॉस विस्मृति वक्र)। वेयरा का एल्गोरिदम छात्र की रेटिंग के आधार पर कार्ड्स को ठीक उसी समय दोबारा प्रस्तुत करता है जब स्मरण शक्ति कमजोर होने वाली होती है।'
                    : 'Based on Piotr Wozniak\'s SuperMemo-2 algorithm, cards calculate interval schedules (1 day, 6 days, 16 days) to interrupt the forgetting curve at optimal recall junctures.'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {language === 'hi' ? 'अंतर्ग्रथित सक्रिय स्मरण' : 'Interleaved Active Recall'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {language === 'hi' ? 'स्मृति प्रतिधारण गुणक: 4.2x' : 'Memory Retention Multiplier: 4.2x'}
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-center">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {language === 'hi' ? 'SM-2 पुनरावलोकन आवर्तन' : 'SM-2 Review Cadence'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 text-rose-600">
                    {language === 'hi' ? '🔴 कठिन (1 दिन)' : '🔴 Hard (1d)'}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 text-amber-600">
                    {language === 'hi' ? '🟡 ठीक (6 दिन)' : '🟡 Good (6d)'}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 text-emerald-600">
                    {language === 'hi' ? '🟢 सिद्ध (16 दिन)' : '🟢 Mastered (16d)'}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </section>

      {/* 5. PRIVACY & SAFETY PRINCIPLES */}
      <section className="bg-slate-50 dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'सुरक्षा, गोपनीयता एवं संस्थागत गवर्नेंस' : 'Safety, Privacy & Institutional Governance'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'डीपीडीपी अधिनियम 2023 और सुरक्षित डिजिटल शिक्षण वातावरण के पूर्णतः अनुरूप' : 'Engineered in compliance with the Digital Personal Data Protection (DPDP) Act 2023.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'hi' ? 'शून्य डोपामाइन विज्ञापन जाल' : 'Zero Dopamine Ad Traps'}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              {language === 'hi' ? 'कोई विज्ञापन नहीं, कोई ट्रैकिंग कुकीज नहीं। केवल शुद्ध, अबाधित शिक्षण अनुभव।' : 'No targeted behavioral advertising, no gambling loops, and no third-party data tracking.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'hi' ? 'कक्षा सुरक्षा एवं डेटा गोपनीयता' : 'Data Privacy & Protection'}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              {language === 'hi' ? 'सभी शिक्षण सत्र, व्यक्तिगत नोट्स और प्रगति रिकॉर्ड एन्क्रिप्टेड और सुरक्षित रहते हैं।' : 'All learning sessions, personal notes, and progress records are strictly encrypted and private.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-500" />
              <span>{language === 'hi' ? 'शाखा-विशिष्ट भूमिका नियंत्रण' : 'Subtree-Scoped RBAC'}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              {language === 'hi' ? 'सुपर एडमिन, विषय विशेषज्ञ और अनुवादकों के लिए शाखा-आधारित सुरक्षित अनुमतियां।' : 'Granular branch-level authorization ensuring verified curriculum standards across branches.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION NAVIGATION */}
      <section className="bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl border border-indigo-800/60">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-400">
            {language === 'hi' ? 'अपनी खोज शुरू करें' : 'START YOUR DISCOVERY'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {language === 'hi' ? 'ज्ञान की नई दुनिया में कदम रखिए' : 'Experience the Future of Conceptual Learning'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-devanagari">
            {language === 'hi'
              ? 'सुपर एडमिन शोध आलेख पढ़ें या सीधे लाइव सिमुलेटर और कोडिंग वातावरण में प्रयोग शुरू करें।'
              : 'Read research articles and super admin blogs, or dive straight into live kinetic sandboxes, simulations, and code engines.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('blogs')}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-105"
              >
                <BookOpen className="w-4 h-4" />
                <span>{language === 'hi' ? 'आलेख व ब्लॉग देखें (Blogs)' : 'Read Blogs & Articles'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('landing')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 hover:scale-105"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-current" />
                <span>{language === 'hi' ? 'मुख्य पृष्ठ पर जाएँ (Home)' : 'Back to Home'}</span>
              </button>

              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 hover:scale-105"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                <span>{language === 'hi' ? 'संपर्क करें (Contact)' : 'Contact Us'}</span>
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
