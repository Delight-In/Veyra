import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ContentNode } from '../../types';
import { 
  Sparkles, Brain, Atom, Code2, Globe2, ShieldCheck, Zap, 
  CheckCircle2, ArrowRight, Play, BookOpen, Layers, Award, 
  TrendingUp, Compass, Sliders, Users, Lock, ChevronRight, BarChart3, Clock
} from 'lucide-react';

interface BenefitsPageProps {
  onOpenClassroom?: (node?: ContentNode) => void;
  onNavigate?: (page: string) => void;
}

export const BenefitsPage: React.FC<BenefitsPageProps> = ({ onOpenClassroom, onNavigate }) => {
  const { language } = useLanguage();
  const { currentUser, openAuthModal } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string>('physics');

  const domains = [
    {
      id: 'physics',
      icon: Atom,
      color: 'indigo',
      titleEn: 'Physics & Natural Sciences',
      titleHi: 'भौतिकी एवं प्राकृतिक विज्ञान',
      whatYouLearnEn: 'Projectile kinematics under varied gravitational fields (Earth, Moon, Mars, Jupiter), harmonic wave oscillations, Newtonian gravitation, energy conservation, optics ray-tracing, and quantum superposition states.',
      whatYouLearnHi: 'विभिन्न गुरुत्वाकर्षण क्षेत्रों (पृथ्वी, चंद्रमा, मंगल, बृहस्पति) में प्रक्षेप्य गति, आवर्त तरंग दोलन, न्यूटन का सार्वभौमिक गुरुत्वाकर्षण, गतिज व स्थितिज ऊर्जा संरक्षण, प्रकाशिकी किरण-आरेख और क्वांटम सुपरपोजिशन अवस्थाएं।',
      simulationHookEn: '60 FPS Canvas Numerical Solver: Change angle (θ), launch speed (v₀), and gravity (g) to see trajectories solved in real time.',
      simulationHookHi: '60 FPS कैनवास संख्यात्मक सॉल्वर: प्रक्षेप्य कोण (θ), गति (v₀) और गुरुत्वाकर्षण (g) बदलकर प्रक्षेप्य पथ का लाइव अवलोकन करें।',
      outcomesEn: ['Intuitive grasp of kinematics before memorizing formulas', 'Competitive exam clarity for JEE, NEET, and Olympiads', 'Deep conceptual confidence in Newtonian and Modern Physics'],
      outcomesHi: ['सूत्र याद करने से पहले गतिज विज्ञान का सहज अंतर्ज्ञान', 'जेईई, नीट और ओलंपियाड के लिए गहरी वैचारिक स्पष्टता', 'न्यूटनियन एवं आधुनिक भौतिकी में अटूट आत्मविश्वास']
    },
    {
      id: 'math',
      icon: TrendingUp,
      color: 'purple',
      titleEn: 'Mathematics & Intuitive Calculus',
      titleHi: 'गणित एवं व्यावहारिक कैलकुलस',
      whatYouLearnEn: 'Calculus derivatives as instantaneous physical rates of change, trigonometric wave synthesis y(t) = A·sin(2πft + φ), slope geometry, quadratic curves, and vector transformations.',
      whatYouLearnHi: 'तात्कालिक परिवर्तन की दर के रूप में कैलकुलस अवकलन (Derivatives), त्रिकोणमितीय तरंग संश्लेषण, ढलान ज्यामिति, परवलयिक वक्र और सदिश बीजगणित।',
      simulationHookEn: 'Interactive Rate-of-Change Visualizer: Watch slope tangents track dynamically along curves without memorizing abstract proofs first.',
      simulationHookHi: 'लाइव ढलान विश्लेषक: अमूर्त प्रमेयों को रटने से पहले वक्रों पर गतिशील स्पर्शरेखा (Tangent) का व्यावहारिक अनुभव।',
      outcomesEn: ['Visual understanding of rates of change and integrals', 'Strong foundation for calculus, algebra, and geometry', 'Elimination of math anxiety through visual proof demonstrations'],
      outcomesHi: ['परिवर्तन की दर और समाकलन की दृश्य समझ', 'कैलकुलस, बीजगणित और ज्यामिति की सुदृढ़ नींव', 'दृश्य प्रमाणों द्वारा गणित के भय का पूर्ण निवारण']
    },
    {
      id: 'cs',
      icon: Code2,
      color: 'emerald',
      titleEn: 'Computer Science & Algorithms',
      titleHi: 'कंप्यूटर विज्ञान एवं एल्गोरिदम',
      whatYouLearnEn: 'Hierarchical node structures (Binary Search Trees, graphs), asymptotic time complexity analysis O(n log n), in-browser algorithm execution, memory heap profiling, and distributed consensus (Raft).',
      whatYouLearnHi: 'नोड-आधारित डेटा संरचनाएं (द्विआधारी खोज वृक्ष, ग्राफ़), समय जटिलता विश्लेषण, ब्राउज़र में लाइव कोड रनर, और वितरित सिस्टम आर्किटेक्चर।',
      simulationHookEn: 'Client-Side In-Browser IDE: Write, execute, and profile algorithms instantly with zero server wait-times.',
      simulationHookHi: 'इन-ब्राउज़र कोड रनर: बिना किसी सर्वर विलंब के तुरंत एल्गोरिदम चलाएं और समय जटिलता का सटीक माप देखें।',
      outcomesEn: ['Direct preparation for modern IT industry software roles', 'Algorithmic problem-solving and clean code discipline', 'Mastery of foundational and enterprise computer systems'],
      outcomesHi: ['आधुनिक आईटी उद्योग की सॉफ्टवेयर भूमिकाओं हेतु सीधी तैयारी', 'एल्गोरिदम समस्या समाधान और स्वच्छ कोड अनुशासन', 'बुनियादी एवं एंटरप्राइज कंप्यूटर सिस्टम्स में महारत']
    },
    {
      id: 'chemistry',
      icon: Sliders,
      color: 'amber',
      titleEn: 'Chemistry & Molecular States',
      titleHi: 'रसायन विज्ञान एवं आणविक अवस्थाएं',
      whatYouLearnEn: 'Dynamic chemical equilibrium, stoichiometry balancers, kinetic gas theory, phase transitions, and electron valence models.',
      whatYouLearnHi: 'रासायनिक साम्यावस्था (Equilibrium), रससमीकरणमिति (Stoichiometry), गतिज गैस सिद्धांत, प्रावस्था संक्रमण और इलेक्ट्रॉन संरचना।',
      simulationHookEn: 'Live Reaction Balancers: Adjust pressure and temperature sliders to observe Le Chatelier shifts in real time.',
      simulationHookHi: 'लाइव अभिक्रिया नियंत्रक: तापमान और दबाव के स्लाइडर बदलकर ला शातेलिए के नियम का प्रत्यक्ष अवलोकन करें।',
      outcomesEn: ['Predictive chemical reaction reasoning', 'Mastery of molecular kinematics and thermodynamics', 'Clear board exam and competitive entrance foundations'],
      outcomesHi: ['रासायनिक अभिक्रियाओं का भविष्यसूचक तर्क', 'आणविक गतिज विज्ञान और ऊष्मागतिकी में दक्षता', 'बोर्ड परीक्षा और प्रतियोगी प्रवेश परीक्षाओं की मजबूत नींव']
    },
    {
      id: 'humanities',
      icon: Globe2,
      color: 'sky',
      titleEn: 'Economics, Humanities & Arts',
      titleHi: 'अर्थशास्त्र, मानविकी एवं कला',
      whatYouLearnEn: 'Microeconomic supply-demand price discovery, macroeconomic fiscal flows, historical civilizations timeline charts, and critical rhetoric.',
      whatYouLearnHi: 'मांग-आपूर्ति मूल्य निर्धारण, व्यापक आर्थिक राजकोषीय प्रवाह, ऐतिहासिक सभ्यताओं का समय-चक्र और वैश्विक अर्थशास्त्र।',
      simulationHookEn: 'Economic Flow Modelers: Simulate market shocks, inflation elasticity, and resource allocations dynamically.',
      simulationHookHi: 'आर्थिक प्रवाह मॉडलर: बाजार में मांग-आपूर्ति के उतार-चढ़ाव और मुद्रास्फीति का व्यावहारिक अध्ययन।',
      outcomesEn: ['Comprehensive multidisciplinary worldview', 'Critical analytical reasoning across human societies', 'Understanding global trade, currencies, and civilizational dynamics'],
      outcomesHi: ['व्यापक बहु-विषयक वैश्विक दृष्टिकोण', 'मानव समाजों में गहन विश्लेषणात्मक चिंतन', 'वैश्विक व्यापार, मुद्राओं और सभ्यतागत गतिशीलता की समझ']
    },
    {
      id: 'kids',
      icon: Users,
      color: 'pink',
      titleEn: 'Wonder Zone (Young Learners 5–8 yrs)',
      titleHi: 'वंडर ज़ोन (बाल वैज्ञानिक 5-8 वर्ष)',
      whatYouLearnEn: 'Interactive solar system planetary journeys, tactile animal biology, multilingual phonic number counting, and gentle inquiry puzzles.',
      whatYouLearnHi: 'सौर मंडल की इंटरैक्टिव यात्रा, पशु जीवविज्ञान, बहुभाषी ध्वनि उच्चारण के साथ संख्या गणना और सहज जिज्ञासा पहेलियां।',
      simulationHookEn: 'Tactile Playgrounds: Large colorful controls with zero commercial ads and zero dopamine addiction loops.',
      simulationHookHi: 'सुरक्षित बाल अन्वेषण: बड़े रंगीन बटन, बिना विज्ञापन का सुरक्षित वातावरण और खेल-खेल में बुनियादी शिक्षा।',
      outcomesEn: ['Sparking lifelong scientific wonder and curiosity', 'Foundational bilingual phonetics and numeracy', 'Healthy screen time protected by DPDP Act 2023 parent gates'],
      outcomesHi: ['आजीवन वैज्ञानिक विस्मय और जिज्ञासा की चिंगारी', 'बुनियादी द्विभाषी ध्वनिविज्ञान एवं अंक ज्ञान', 'डीपीडीपी अधिनियम 2023 अभिभावक द्वार द्वारा सुरक्षित स्क्रीन समय']
    }
  ];

  const currentDomainData = domains.find(d => d.id === selectedDomain) || domains[0];

  const benefitsList = [
    {
      icon: Brain,
      titleEn: 'Authentic Conceptual Intuition',
      titleHi: 'वास्तविक वैचारिक अंतर्ज्ञान (No Rote Memorization)',
      descEn: 'Never memorize dead formulas again. By varying launch velocities, gravity fields, and wave frequencies on live 60 FPS HTML5 canvases, learners observe cause-and-effect before seeing the equations.',
      descHi: 'सूत्रों का अंधाधुंध रट्टा लगाने से मुक्ति। 60 FPS कैनवास पर वेग, गुरुत्वाकर्षण और तरंगों को बदलकर देखें कि समीकरण कैसे काम करते हैं।'
    },
    {
      icon: Zap,
      titleEn: '4.2x Faster Retention via SM-2 Algorithm',
      titleHi: 'SM-2 स्पेस्ड रिपीटिशन द्वारा 4.2 गुना अधिक स्मृति प्रतिधारण',
      descEn: 'Beat the Ebbinghaus forgetting curve. Our algorithmic spaced repetition system schedules reviews at calibrated intervals (1 day, 6 days, 16 days) precisely before memory decays.',
      descHi: 'एबिंगहॉस विस्मृति वक्र को मात दें। वैज्ञानिक SM-2 एल्गोरिदम ठीक उसी समय कार्ड दोबारा प्रस्तुत करता है जब स्मरण शक्ति कमजोर होने वाली होती है।'
    },
    {
      icon: Globe2,
      titleEn: 'Zero Linguistic Penalty (Native Phonetics)',
      titleHi: 'शून्य भाषाई बाधा (मातृभाषा एवं वैश्विक मानक)',
      descEn: 'High-fidelity technical phonetics in Hindi alongside global English scientific terms. Listen to accurate technical pronunciations without losing touch with international scientific literature.',
      descHi: 'मातृभाषा हिंदी में सटीक उच्चारण और वैश्विक अंग्रेजी शब्दावली का सहज तालमेल। अपनी भाषा में सीखें और अंतरराष्ट्रीय मानकों में पारंगत बनें।'
    },
    {
      icon: Award,
      titleEn: 'Competitive Exam & IT Industry Rigour',
      titleHi: 'प्रतियोगी परीक्षा (JEE/NEET) एवं आईटी उद्योग तैयारी',
      descEn: 'Designed by Priyanka (Physics Honours graduate working in IT), combining physics problem-solving precision for JEE/NEET/Boards with in-browser coding engines demanded by the software industry.',
      descHi: 'भौतिकी और आईटी उद्योग के अनुभवों से निर्मित: जेईई, नीट और बोर्ड परीक्षाओं के लिए गहरी वैचारिक स्पष्टता के साथ सॉफ्टवेयर कोडिंग की मजबूत नींव।'
    },
    {
      icon: ShieldCheck,
      titleEn: 'Cognitive Safety & Parent Oversight (DPDP Act)',
      titleHi: '100% सुरक्षित एवं अभिभावक-पारदर्शी वातावरण',
      descEn: 'Compliant with the Digital Personal Data Protection Act 2023. Zero third-party ads, zero tracking cookies, and transparent study time telemetry verified via simple Student IDs.',
      descHi: 'डीपीडीपी अधिनियम 2023 के पूर्णतः अनुरूप। कोई विज्ञापन नहीं, कोई व्यसनी लूप नहीं। अभिभावक केवल छात्र आईडी द्वारा अध्ययन समय देख सकते हैं।'
    },
    {
      icon: Clock,
      titleEn: '100% Active Hands-On Learning',
      titleHi: '100% सक्रिय प्रायोगिक शिक्षण (Zero Passive Boredom)',
      descEn: 'Replace passive 2-hour recorded videos with interactive checkpoint pauses, living parameter sliders, in-browser code execution, and immediate feedback loops.',
      descHi: '2 घंटे के उबाऊ वीडियो व्याख्यानों के स्थान पर सक्रिय सिमुलेटर, लाइव कोड रनर और इंटरैक्टिव चेकपॉइंट्स के साथ प्रत्येक क्षण सक्रिय अध्ययन।'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-6 px-4 sm:px-6 lg:px-8">
      {/* 1. HERO INTRODUCTION */}
      <section className="text-center space-y-5 max-w-4xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          <span>{language === 'hi' ? 'पाठ्यक्रम परिचय एवं विद्यार्थी लाभ' : 'CURRICULUM INTRODUCTION & LEARNER BENEFITS'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
          {language === 'hi' ? (
            <>
              आप क्या सीखेंगे और{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">
                आपको क्या लाभ मिलेंगे
              </span>
            </>
          ) : (
            <>
              What You Will Learn &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">
                The Tangible Benefits You Gain
              </span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari max-w-3xl mx-auto">
          {language === 'hi'
            ? 'नीरस रट्टामार प्रणाली और निष्क्रिय वीडियो व्याख्यानों को अलविदा कहें। वेयरा के बहु-विषयक पाठ्यक्रम, 60 FPS लाइव सिमुलेशन और वैज्ञानिक स्मृति तकनीक से अपनी वास्तविक सीखने की क्षमता को अनलॉक करें।'
            : 'Say goodbye to passive 2-hour video lectures and dry formula memorization. Discover the multidisciplinary roadmap of Veyra, the physical intuition you will develop, and the measurable cognitive benefits you gain.'}
        </p>

        {/* Value Proposition Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-0.5">
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{language === 'hi' ? 'सहज अंतर्ज्ञान' : 'Intuition-First'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'रटने से पहले प्रयोग' : 'Simulate Before Formulas'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-0.5">
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">{language === 'hi' ? '4.2x प्रतिधारण' : '4.2x Retention'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'SM-2 स्पेस्ड रिपीटिशन' : 'Spaced Memory Decay Fix'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-0.5">
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{language === 'hi' ? 'बहुभाषी' : 'Multilingual'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'शून्य भाषाई रुकावट' : 'Bilingual Phonetics'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-0.5">
            <div className="text-xl font-black text-amber-500 dark:text-amber-400 font-mono">{language === 'hi' ? '100% सक्रिय' : '100% Active'}</div>
            <div className="text-[11px] font-semibold text-slate-500">{language === 'hi' ? 'शून्य निष्क्रिय वीडियो' : 'Interactive Labs & IDE'}</div>
          </div>
        </div>
      </section>

      {/* 2. WHAT YOU WILL LEARN: DISCIPLINE ROADMAP */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-card space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span>{language === 'hi' ? 'विषयवार पाठ्यक्रम परिचय' : 'DISCIPLINE ROADMAP'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'वेयरा पर आप क्या सीखेंगे?' : 'What You Will Master Across Disciplines'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === 'hi'
                ? 'विभिन्न ज्ञान शाखाओं का अन्वेषण करने के लिए नीचे दिए गए विषयों पर क्लिक करें:'
                : 'Select any discipline below to preview the core conceptual curriculum and interactive mechanics:'}
            </p>
          </div>
        </div>

        {/* Domain Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          {domains.map((dom) => {
            const IconComp = dom.icon;
            const isSelected = dom.id === selectedDomain;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-102'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? dom.titleHi : dom.titleEn}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Domain Showcase Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                <currentDomainData.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? currentDomainData.titleHi : currentDomainData.titleEn}
                </h3>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                  {language === 'hi' ? 'अवधारणात्मक दायरा एवं पाठ्यक्रम परिचय' : 'Conceptual Scope & Syllabus Introduction'}
                </span>
              </div>
            </div>

            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-devanagari">
              {language === 'hi' ? currentDomainData.whatYouLearnHi : currentDomainData.whatYouLearnEn}
            </p>
          </div>

          {/* Interactive Simulation Hook */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block uppercase font-mono tracking-wider">
                {language === 'hi' ? 'लाइव प्रयोगात्मक विशेषता' : 'Interactive Laboratory Mechanic'}
              </span>
              <p className="text-xs text-indigo-800 dark:text-indigo-300">
                {language === 'hi' ? currentDomainData.simulationHookHi : currentDomainData.simulationHookEn}
              </p>
            </div>
          </div>

          {/* Core Outcomes */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
              {language === 'hi' ? 'इस विषय से मिलने वाले प्रमुख लाभ:' : 'Key Mastery Outcomes:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {currentDomainData.outcomesEn.map((out, i) => (
                <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{language === 'hi' && (currentDomainData as any).outcomesHi ? (currentDomainData as any).outcomesHi[i] || out : out}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW YOU BENEFIT: 6 CONCRETE ADVANTAGES */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            {language === 'hi' ? 'वेयरा की विशिष्टता' : 'THE VEYRA ADVANTAGE'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {language === 'hi' ? 'वेयरा से आपको क्या लाभ मिलेंगे?' : 'The 6 Core Benefits You Gain'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'hi'
              ? 'पारंपरिक कोचिंग और वीडियो क्लास के मुकाबले वेयरा आपके समय और संज्ञानात्मक ऊर्जा को अधिकतम परिणाम में बदलती है।'
              : 'Engineered to maximize cognitive efficiency, emotional engagement, and actual lifelong retention.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefitsList.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card hover:-translate-y-1 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {language === 'hi' ? item.titleHi : item.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-devanagari">
                    {language === 'hi' ? item.descHi : item.descEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'सत्यापित संज्ञानात्मक आधार' : 'Verified Cognitive Pillar'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. THE 3-STEP VEYRA LEARNING LOOP */}
      <section className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-10 border border-slate-800 shadow-xl space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-400">
            {language === 'hi' ? 'वैज्ञानिक शिक्षण पद्धति' : 'THE METHODOLOGY'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'hi' ? '3-चरणीय संज्ञानात्मक शिक्षण चक्र' : 'The 3-Step Veyra Active Learning Loop'}
          </h2>
          <p className="text-xs text-slate-300">
            {language === 'hi' ? 'हर विषय को रटने के बजाय अंतर्ज्ञान में बदलने की वैज्ञानिक प्रक्रिया:' : 'How any learner transitions from curiosity to permanent mastery:'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-600/40 text-indigo-300 font-mono font-bold text-sm flex items-center justify-center">
              01
            </div>
            <h3 className="font-bold text-base text-white">
              {language === 'hi' ? '1. सिमुलेशन में प्रयोग करें' : '1. Simulate & Manipulate'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-devanagari">
              {language === 'hi'
                ? 'कैनवास पर पैरामीटर बदलें, प्रक्षेप्य दागिए, तरंगों को मिलाइए और भौतिक परिणाम को अपनी आंखों से देखिए।'
                : 'Interact with parameters in 60 FPS sandboxes. Observe cause-and-effect before encountering formulas.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-purple-600/40 text-purple-300 font-mono font-bold text-sm flex items-center justify-center">
              02
            </div>
            <h3 className="font-bold text-base text-white">
              {language === 'hi' ? '2. सूत्र को स्वाभाविक समझें' : '2. Connect the Formula'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-devanagari">
              {language === 'hi'
                ? 'गणितीय समीकरण को याद करने के बजाय समझें कि वह आपके प्रयोग का स्वाभाविक परिणाम है।'
                : 'See the mathematical formulation emerge naturally from observed physical telemetry.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600/40 text-emerald-300 font-mono font-bold text-sm flex items-center justify-center">
              03
            </div>
            <h3 className="font-bold text-base text-white">
              {language === 'hi' ? '3. SM-2 द्वारा कंठस्थ करें' : '3. Retain via Spaced Recall'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-devanagari">
              {language === 'hi'
                ? 'फ्लैशकार्ड पलटकर सक्रिय स्मरण की जांच करें। एल्गोरिदम ठीक उसी समय समीक्षा निर्धारित करता है जब विस्मृति शुरू होती है।'
                : 'Test active recall with SM-2 flashcards. Intelligent intervals lock knowledge into long-term memory.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. ACCESS BANNER / CALL TO ACTION */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 shadow-card">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {language === 'hi' ? 'अपनी सीखने की यात्रा शुरू करने के लिए तैयार हैं?' : 'Ready to Experience Real Conceptual Learning?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-devanagari">
            {currentUser 
              ? (language === 'hi' ? `लॉगिन सक्रिय: ${currentUser.name}। सीधे क्लासरूम में प्रवेश करें या लाइव सिमुलेशन का आनंद लें।` : `Logged in as ${currentUser.name}. You have full access to study modules, simulations, and streak tracking.`)
              : (language === 'hi' ? 'निःशुल्क खाता बनाएं या सीधे होमपेज पर लाइव सिमुलेशन चलाकर देखें।' : 'Create a free account to enter full interactive classrooms or try live physics sandboxes right now.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          {currentUser ? (
            <button
              onClick={() => onOpenClassroom && onOpenClassroom()}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'hi' ? 'मेरी कक्षा में प्रवेश करें (Classroom)' : 'Enter My Classroom'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('register', 'Create an account to start active learning.')}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'निःशुल्क सीखना शुरू करें' : 'Start Learning Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 hover:scale-105"
              >
                <Play className="w-4 h-4 text-emerald-500 fill-current" />
                <span>{language === 'hi' ? 'लाइव सिमुलेटर चलाएं' : 'Try Live Simulation'}</span>
              </button>

              <button
                onClick={() => onNavigate('about')}
                className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>{language === 'hi' ? 'वेयरा के बारे में (About Us)' : 'About Us & Founder'}</span>
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
