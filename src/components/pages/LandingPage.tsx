import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useBlogs } from '../../context/BlogContext';
import { api } from '../../services/api';
import { 
  Sparkles, ArrowRight, Play, RotateCcw, Volume2, Code2, Terminal, 
  Cpu, Layers, Target, Compass, BookOpen, Flame, Zap, BarChart3, 
  ShieldCheck, CheckCircle2, ChevronRight, Brain, Globe, HelpCircle, Users, Eye 
} from 'lucide-react';
import { speakWithIndianAccent } from '../../utils/speechVoice';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { publishedBlogs } = useBlogs();

  // ==========================================
  // 0. LIVE PLATFORM VISITOR COUNTER STATE
  // ==========================================
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isVisitorLoading, setIsVisitorLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function recordOrFetchVisitor() {
      try {
        const hasVisitedThisSession = sessionStorage.getItem('veyra_session_visited');
        if (!hasVisitedThisSession) {
          // New visitor checking the platform: record & increment
          const res = await api.stats.recordVisit();
          if (isMounted && res.success && typeof res.count === 'number') {
            setVisitorCount(res.count);
            sessionStorage.setItem('veyra_session_visited', 'true');
            localStorage.setItem('veyra_local_visitor_count', String(res.count));
          }
        } else {
          // Returning in same session: get current count
          const res = await api.stats.getVisitors();
          if (isMounted && res.success && typeof res.count === 'number') {
            setVisitorCount(res.count);
          }
        }
      } catch (err) {
        // Fallback to local visitor counter starting from 0
        const local = Number(localStorage.getItem('veyra_local_visitor_count') || '0');
        const next = sessionStorage.getItem('veyra_session_visited') ? local : local + 1;
        if (!sessionStorage.getItem('veyra_session_visited')) {
          sessionStorage.setItem('veyra_session_visited', 'true');
          localStorage.setItem('veyra_local_visitor_count', String(next));
        }
        if (isMounted) setVisitorCount(next);
      } finally {
        if (isMounted) setIsVisitorLoading(false);
      }
    }

    recordOrFetchVisitor();
    return () => { isMounted = false; };
  }, []);

  // ==========================================
  // 1. KINETIC PHYSICS CANVAS SIMULATOR STATE
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [velocity, setVelocity] = useState<number>(45); // m/s
  const [angle, setAngle] = useState<number>(45); // degrees
  const [gravity, setGravity] = useState<number>(9.8); // m/s^2 (Earth)
  const [gravityName, setGravityName] = useState<string>('Earth');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [targetHit, setTargetHit] = useState<boolean | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Target position on canvas in meters
  const targetDistanceM = 165; 

  // Derived telemetry metrics
  const rad = (angle * Math.PI) / 180;
  const maxHeight = (velocity * velocity * Math.sin(rad) * Math.sin(rad)) / (2 * gravity);
  const maxRange = (velocity * velocity * Math.sin(2 * rad)) / gravity;
  const flightTime = (2 * velocity * Math.sin(rad)) / gravity;

  // Initialize and draw static preview
  useEffect(() => {
    drawCanvas(0, []);
  }, [velocity, angle, gravity, isDarkMode]);

  const drawCanvas = (currentT: number, trajectory: { x: number; y: number }[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = isDarkMode ? '#0B1120' : '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Coordinate grid lines
    ctx.strokeStyle = isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    for (let y = 20; y < height - 30; y += 30) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ground line
    const groundY = height - 30;
    ctx.strokeStyle = isDarkMode ? '#475569' : '#94A3B8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(width - 20, groundY);
    ctx.stroke();

    // Ground distance markers
    ctx.fillStyle = isDarkMode ? '#64748B' : '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const scaleFactor = 1.8; // px per meter
    const startX = 45;

    for (let d = 0; d <= 250; d += 50) {
      const markX = startX + d * scaleFactor;
      if (markX < width - 30) {
        ctx.beginPath();
        ctx.moveTo(markX, groundY);
        ctx.lineTo(markX, groundY + 6);
        ctx.stroke();
        ctx.fillText(`${d}m`, markX, groundY + 18);
      }
    }

    // Draw Target Flag at targetDistanceM
    const targetX = startX + targetDistanceM * scaleFactor;
    if (targetX < width - 20) {
      // Flag pole
      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(targetX, groundY);
      ctx.lineTo(targetX, groundY - 32);
      ctx.stroke();

      // Flag triangle
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.moveTo(targetX, groundY - 32);
      ctx.lineTo(targetX + 16, groundY - 24);
      ctx.lineTo(targetX, groundY - 16);
      ctx.fill();

      // Target ring on ground
      ctx.fillStyle = targetHit ? '#10B981' : '#F43F5E';
      ctx.beginPath();
      ctx.ellipse(targetX, groundY, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = targetHit ? '#10B981' : '#E11D48';
      ctx.fillText(targetHit ? 'BULLSEYE!' : `🎯 ${targetDistanceM}m`, targetX, groundY - 36);
    }

    // Draw Trajectory curve so far
    if (trajectory.length > 1) {
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trajectory[0].x, trajectory[0].y);
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y);
      }
      ctx.stroke();

      // Trajectory glow
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    // Launcher Cannon base
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(startX, groundY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cannon barrel pointing at launch angle
    const barrelLen = 22;
    const barrelEndX = startX + barrelLen * Math.cos(rad);
    const barrelEndY = groundY - barrelLen * Math.sin(rad);
    ctx.strokeStyle = '#4338CA';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    // Draw active Projectile
    if (trajectory.length > 0) {
      const currentPos = trajectory[trajectory.length - 1];
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Glowing aura
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleLaunch = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationResult(null);
    setTargetHit(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - 30;
    const startX = 45;
    const scaleFactor = 1.8;

    const vX = velocity * Math.cos(rad);
    const vY = velocity * Math.sin(rad);

    let tSim = 0;
    const dt = 0.04;
    const path: { x: number; y: number }[] = [];

    const step = () => {
      tSim += dt;
      const xMeters = vX * tSim;
      const yMeters = vY * tSim - 0.5 * gravity * tSim * tSim;

      const pxX = startX + xMeters * scaleFactor;
      const pxY = groundY - yMeters * scaleFactor;

      if (yMeters >= 0 && pxX < canvas.width) {
        path.push({ x: pxX, y: pxY });
        drawCanvas(tSim, path);
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Impact occurred
        const finalX = startX + maxRange * scaleFactor;
        path.push({ x: finalX, y: groundY });
        drawCanvas(flightTime, path);

        const targetX = startX + targetDistanceM * scaleFactor;
        const diffPx = Math.abs(finalX - targetX);
        const diffMeters = Math.abs(maxRange - targetDistanceM);

        if (diffMeters <= 5) {
          setTargetHit(true);
          setSimulationResult(
            language === 'hi' 
              ? `🎯 सटीक निशाना! प्रक्षेप्य ${maxRange.toFixed(1)}m पर उतरा (त्रुटि: ±${diffMeters.toFixed(1)}m)। शानदार भौतिकी गणना!` 
              : `🎯 DIRECT BULLSEYE! Impact at ${maxRange.toFixed(1)}m (error: ±${diffMeters.toFixed(1)}m). Perfect trajectory calculation!`
          );
        } else {
          setTargetHit(false);
          setSimulationResult(
            language === 'hi'
              ? `प्रक्षेप्य ${maxRange.toFixed(1)}m पर गिरा (लक्ष्य: ${targetDistanceM}m)। कोण या वेग समायोजित करके पुनः प्रयास करें!`
              : `Landed at ${maxRange.toFixed(1)}m (target was ${targetDistanceM}m). Adjust angle or velocity to hit the bullseye!`
          );
        }
        setIsSimulating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const handleReset = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsSimulating(false);
    setSimulationResult(null);
    setTargetHit(null);
    drawCanvas(0, []);
  };

  const setCelestialBody = (name: string, gVal: number) => {
    setGravityName(name);
    setGravity(gVal);
    handleReset();
  };

  // ==========================================
  // 2. LIVE IN-BROWSER CODE STUDIO STATE
  // ==========================================
  const [selectedAlgo, setSelectedAlgo] = useState<'binary_search' | 'fibonacci' | 'sieve'>('binary_search');
  const [codeParam, setCodeParam] = useState<number>(42);
  const [codeOutput, setCodeOutput] = useState<string>('Click "Run Live Algorithm" to execute in in-browser engine.');
  const [isCodeRunning, setIsCodeRunning] = useState<boolean>(false);
  const [codeExecutionTime, setCodeExecutionTime] = useState<number | null>(null);

  const algorithms = {
    binary_search: {
      title: 'Binary Search (द्विआधारी खोज)',
      complexity: 'O(log N)',
      lang: 'Python / JS',
      code: `# Binary Search: O(log N) Time Complexity
def binary_search(arr, target):
    low, high, steps = 0, len(arr) - 1, 0
    while low <= high:
        steps += 1
        mid = (low + high) // 2
        if arr[mid] == target:
            return f"Found {target} at index {mid} in {steps} steps!"
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return f"Target {target} not found"`,
      run: (target: number) => {
        const arr = Array.from({ length: 64 }, (_, i) => i * 2); // [0, 2, 4, ... 126]
        let low = 0, high = arr.length - 1, steps = 0;
        const logs: string[] = [`Array: [0, 2, 4, ... 126] (Length: 64)`];
        while (low <= high) {
          steps++;
          const mid = Math.floor((low + high) / 2);
          logs.push(`Step ${steps}: Window [${low}..${high}] -> Checking mid index ${mid} (value: ${arr[mid]})`);
          if (arr[mid] === target) {
            logs.push(`✅ MATCH FOUND! Element ${target} verified at index ${mid} in ${steps} iterations.`);
            return logs.join('\n');
          } else if (arr[mid] < target) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        logs.push(`❌ Target ${target} does not exist in array.`);
        return logs.join('\n');
      }
    },
    fibonacci: {
      title: 'Fibonacci DP Memoization (डायनामिक प्रोग्रामिंग)',
      complexity: 'O(N)',
      lang: 'JavaScript',
      code: `// Memoized Dynamic Programming: O(N)
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}`,
      run: (n: number) => {
        const cleanN = Math.min(Math.max(1, Math.floor(n)), 35);
        const memo: Record<number, number> = {};
        const logs: string[] = [`Computing Fibonacci F(${cleanN}) with Dynamic Programming...`];
        const fib = (k: number): number => {
          if (k in memo) return memo[k];
          if (k <= 1) return k;
          memo[k] = fib(k - 1) + fib(k - 2);
          return memo[k];
        };
        const result = fib(cleanN);
        logs.push(`Memoized cache populated with ${Object.keys(memo).length} sub-problems.`);
        logs.push(`✅ Result: F(${cleanN}) = ${result}`);
        return logs.join('\n');
      }
    },
    sieve: {
      title: 'Sieve of Eratosthenes (अभाज्य संख्या छलनी)',
      complexity: 'O(N log log N)',
      lang: 'Python',
      code: `# Prime Sieve: O(N log log N)
def sieve_of_eratosthenes(limit):
    primes = [True] * (limit + 1)
    p = 2
    while p * p <= limit:
        if primes[p]:
            for i in range(p * p, limit + 1, p):
                primes[i] = False
        p += 1
    return [p for p in range(2, limit + 1) if primes[p]]`,
      run: (limit: number) => {
        const n = Math.min(Math.max(10, Math.floor(limit)), 100);
        const isPrime = new Array(n + 1).fill(true);
        isPrime[0] = isPrime[1] = false;
        for (let p = 2; p * p <= n; p++) {
          if (isPrime[p]) {
            for (let i = p * p; i <= n; i += p) {
              isPrime[i] = false;
            }
          }
        }
        const primes = [];
        for (let i = 2; i <= n; i++) if (isPrime[i]) primes.push(i);
        return `Found ${primes.length} prime numbers up to ${n}:\n[ ${primes.join(', ')} ]\nVerification completed in linear logarithmic time.`;
      }
    }
  };

  const handleRunCode = () => {
    setIsCodeRunning(true);
    const start = performance.now();
    setTimeout(() => {
      const output = algorithms[selectedAlgo].run(codeParam);
      const elapsed = (performance.now() - start).toFixed(2);
      setCodeExecutionTime(parseFloat(elapsed));
      setCodeOutput(output);
      setIsCodeRunning(false);
    }, 280);
  };

  // ==========================================
  // 3. MULTILINGUAL SPEECH SYNTHESIS & PHONETICS
  // ==========================================
  const [activeAudioConcept, setActiveAudioConcept] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const audioConcepts = [
    {
      id: 'gravitation',
      englishTitle: 'Universal Gravitation',
      englishSubtitle: 'Gravitational Force',
      englishDesc: 'The universal attractive force between any two masses, directly proportional to the product of their masses and inversely proportional to the square of the distance between them.',
      englishSpeechText: 'Namaste and welcome! Universal Gravitation: The attractive force between any two masses, directly proportional to the product of their masses and inversely proportional to the square of the distance between them.',
      hindiTitle: 'गुरुत्वाकर्षण बल (Gravitational Force)',
      hindiSubtitle: 'सार्वभौमिक गुरुत्वाकर्षण',
      hindiDesc: 'ब्रह्मांड में किन्हीं दो द्रव्यमानों के मध्य लगने वाला पारस्परिक आकर्षण बल जो उनके द्रव्यमानों के गुणनफल के समानुपाती और दूरी के वर्ग के व्युत्क्रमानुपाती होता है।',
      hindiSpeechText: 'नमस्ते दोस्तों! गुरुत्वाकर्षण बल: ब्रह्मांड में किन्हीं दो द्रव्यमानों के मध्य लगने वाला पारस्परिक आकर्षण बल जो उनके द्रव्यमानों के गुणनफल के समानुपाती होता है।'
    },
    {
      id: 'superposition',
      englishTitle: 'Quantum Superposition State',
      englishSubtitle: 'Quantum Superposition',
      englishDesc: 'The foundational principle of quantum mechanics where a physical system exists simultaneously across multiple quantum states until a measurement is observed.',
      englishSpeechText: 'Namaste and welcome! Quantum Superposition State: The fundamental principle where a physical system exists simultaneously across all possible states until an observation is made.',
      hindiTitle: 'क्वांटम सुपरपोजिशन (Quantum Superposition)',
      hindiSubtitle: 'क्वांटम अवस्था',
      hindiDesc: 'क्वांटम यांत्रिकी का वह सिद्धांत जिसमें कोई कण एक ही समय में कई संभावित अवस्थाओं में तब तक मौजूद रहता है जब तक कि उसका अवलोकन न किया जाए।',
      hindiSpeechText: 'नमस्ते दोस्तों! क्वांटम सुपरपोजिशन: क्वांटम यांत्रिकी का वह सिद्धांत जिसमें कोई कण एक ही समय में कई संभावित अवस्थाओं में तब तक मौजूद रहता है जब तक कि उसका अवलोकन न किया जाए।'
    },
    {
      id: 'bst',
      englishTitle: 'Binary Search Tree Algorithm',
      englishSubtitle: 'Binary Search Tree (BST)',
      englishDesc: 'A node-based hierarchical data structure where every node enforces the invariant that keys in the left subtree are smaller and keys in the right subtree are larger.',
      englishSpeechText: 'Namaste and welcome! Binary Search Tree Algorithm: A node-based hierarchical data structure where left subtree elements are smaller and right subtree elements are larger.',
      hindiTitle: 'द्विआधारी खोज वृक्ष (Binary Search Tree)',
      hindiSubtitle: 'डेटा संरचना',
      hindiDesc: 'एक नोड-आधारित द्विआधारी वृक्ष डेटा संरचना जहां बाएं उप-वृक्ष में केवल छोटे तत्व और दाएं उप-वृक्ष में केवल बड़े तत्व होते हैं।',
      hindiSpeechText: 'नमस्ते दोस्तों! द्विआधारी खोज वृक्ष: एक नोड-आधारित वृक्ष डेटा संरचना जहां बाएं उप-वृक्ष में केवल छोटे तत्व और दाएं उप-वृक्ष में बड़े तत्व होते हैं।'
    }
  ];

  const handleSpeak = (text: string, langTarget: string = language === 'hi' ? 'hi' : 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    const normalizedLang: 'en' | 'hi' = langTarget.toLowerCase().startsWith('hi') ? 'hi' : 'en';
    setIsPlayingAudio(true);
    speakWithIndianAccent(text, {
      lang: normalizedLang,
      rate: 0.92,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // ==========================================
  // 5. SPACED REPETITION FLIP CARD STATE
  // ==========================================
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flashcardRating, setFlashcardRating] = useState<string | null>(null);

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative max-w-5xl mx-auto text-center space-y-5 pt-1 sm:pt-2">
        {/* Glow ambient background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges & Live Visitor Counter */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Prominent Live Platform Visitor Counter */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'दर्शक' : 'Visitors'}:
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs tracking-wider shadow-inner">
              {isVisitorLoading ? '...' : visitorCount.toLocaleString()}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>
              {language === 'hi' 
                ? 'सार्वभौमिक बहु-विषयक मंच • बहुभाषी शिक्षा' 
                : 'Universal Multi-Discipline Matrix • Multilingual Platform'}
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.14]">
          <span>
            {language === 'hi' 
              ? 'आनंद के लिए सीखें — ' 
              : 'Learn For Fun — '}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">
            {language === 'hi' ? 'जो आप जानते हैं, उससे भी आगे देखें' : 'See Beyond What You Know'}
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
          {language === 'hi'
            ? 'केवल विज्ञान या कोडिंग ही नहीं — मानविकी, अर्थशास्त्र, भाषाएं और कला से लेकर भौतिकी सिमुलेटर और सॉफ्टवेयर आर्किटेक्चर तक। प्रत्येक शिक्षार्थी के लिए शून्य निष्क्रिय व्याख्यान और 100% सक्रिय संज्ञानात्मक महारत।'
            : 'Engineered for learning anything across every discipline — from humanities, world economics, and arts to living science simulations and algorithm engines. Built for every learner with zero passive lectures and 100% active cognitive mastery.'}
        </p>

        {/* Call to action & exploration buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('simulations')}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{language === 'hi' ? 'लाइव सिमुलेशन डेमो (Simulations)' : 'Interactive Simulations Demo'}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
          <button
            onClick={() => onNavigate('blogs')}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 hover:scale-105"
          >
            <BookOpen className="w-4 h-4 text-emerald-200" />
            <span>{language === 'hi' ? 'सुपर एडमिन के आलेख (Blogs)' : 'Read Super Admin Blogs'}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>{language === 'hi' ? 'वेयरा के बारे में (About Veyra)' : 'About Veyra'}</span>
          </button>
        </div>

        {/* Multi-discipline quick branch chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {language === 'hi' ? 'पीसीएमबी विज्ञान (गतिज सिमुलेशन)' : 'PCMB Sciences (Kinematic Simulation)'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            {language === 'hi' ? 'कंप्यूटर विज्ञान (इंटरैक्टिव आईडीई)' : 'Computer Science (Interactive IDE)'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {language === 'hi' ? 'मानविकी एवं सामाजिक विज्ञान' : 'Humanities & Social Sciences'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {language === 'hi' ? 'अर्थशास्त्र एवं वाणिज्य' : 'Economics & Commerce'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            {language === 'hi' ? 'गहन वैचारिक स्पष्टता एवं अनुसंधान' : 'Deep Conceptual Clarity & Research'}
          </span>
        </div>
      </section>

      {/* 2. FEATURED BRANCH EXAMPLE 1: KINETIC PHYSICS SANDBOX */}
      <section className="max-w-6xl mx-auto bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Flame className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'विशेष शाखा उदाहरण १ • गतिज विज्ञान इंजन' : 'FEATURED BRANCH EXAMPLE 1 • KINETIC SCIENCE ENGINE'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' 
                ? 'शाखा उदाहरण १: प्रक्षेप्य गति एवं भौतिकी सिमुलेटर' 
                : 'Branch Example 1: Interactive Kinematic Physics Sandbox'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-devanagari">
              {language === 'hi'
                ? 'वेग और कोण बदलें, खगोलीय गुरुत्वाकर्षण चुनें और लक्ष्य भेदने के लिए प्रक्षेप्य दागिए।'
                : 'Adjust launch velocity, angle, and celestial gravity in real-time. Hit the target at 165 meters!'}
            </p>
          </div>

          {/* Celestial Body Gravity Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start">
            <button
              onClick={() => setCelestialBody('Earth', 9.8)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                gravityName === 'Earth' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🌍 {language === 'hi' ? 'पृथ्वी' : 'Earth'} (9.8 m/s²)
            </button>
            <button
              onClick={() => setCelestialBody('Moon', 1.62)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                gravityName === 'Moon' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🌕 {language === 'hi' ? 'चंद्रमा' : 'Moon'} (1.6 m/s²)
            </button>
            <button
              onClick={() => setCelestialBody('Mars', 3.72)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                gravityName === 'Mars' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🔴 {language === 'hi' ? 'मंगल' : 'Mars'} (3.7 m/s²)
            </button>
            <button
              onClick={() => setCelestialBody('Jupiter', 24.79)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                gravityName === 'Jupiter' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🪐 {language === 'hi' ? 'बृहस्पति' : 'Jupiter'} (24.8 m/s²)
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={280}
            className="w-full h-56 sm:h-72 object-cover block"
          />

          {/* Overlaid Target Banner / Result Alert */}
          {simulationResult && (
            <div className={`absolute top-4 left-4 right-4 p-3 rounded-xl border text-xs md:text-sm font-bold flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in ${
              targetHit 
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50' 
                : 'bg-amber-950/90 text-amber-200 border-amber-500/50'
            }`}>
              <span>{simulationResult}</span>
              <button 
                onClick={handleReset}
                className="ml-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase"
              >
                {language === 'hi' ? 'साफ़ करें' : 'Clear'}
              </button>
            </div>
          )}
        </div>

        {/* Real-Time Live Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              {language === 'hi' ? 'अधिकतम ऊंचाई (H_max)' : 'Max Altitude (H_max)'}
            </div>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {maxHeight.toFixed(1)} <span className="text-xs font-normal">{language === 'hi' ? 'मीटर' : 'meters'}</span>
            </div>
            <div className="text-[10px] text-slate-500">v₀²·sin²θ / 2g</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              {language === 'hi' ? 'क्षैतिज परास (R)' : 'Horizontal Range (R)'}
            </div>
            <div className="text-lg font-black text-purple-600 dark:text-purple-400">
              {maxRange.toFixed(1)} <span className="text-xs font-normal">{language === 'hi' ? 'मीटर' : 'meters'}</span>
            </div>
            <div className="text-[10px] text-slate-500">v₀²·sin(2θ) / g</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              {language === 'hi' ? 'उड्डयन काल (T)' : 'Flight Duration (T)'}
            </div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {flightTime.toFixed(2)} <span className="text-xs font-normal">{language === 'hi' ? 'सेकंड' : 'seconds'}</span>
            </div>
            <div className="text-[10px] text-slate-500">2·v₀·sinθ / g</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
              {language === 'hi' ? 'लक्ष्य दूरी' : 'Target Distance'}
            </div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400">
              {targetDistanceM} <span className="text-xs font-normal">{language === 'hi' ? 'मीटर' : 'meters'}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {language === 'hi' ? 'लक्ष्य ध्वज स्थिति' : 'Target flag location'}
            </div>
          </div>
        </div>

        {/* Simulator Controls: Sliders + Launch Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-center">
          {/* Velocity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{language === 'hi' ? 'प्रारंभिक वेग (v₀):' : 'Launch Velocity (v₀):'}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{velocity} m/s</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Angle Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{language === 'hi' ? 'प्रक्षेप कोण (θ):' : 'Launch Angle (θ):'}</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">{angle}°</span>
            </div>
            <input
              type="range"
              min={15}
              max={85}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunch}
              disabled={isSimulating}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSimulating ? (language === 'hi' ? 'सिमुलेशन जारी...' : 'Simulating...') : (language === 'hi' ? 'प्रक्षेप्य दागिए (Launch)' : 'Fire Projectile')}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
              title={language === 'hi' ? 'सिमुलेशन रीसेट करें' : 'Reset Simulation'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. FEATURED BRANCH EXAMPLE 2: IN-BROWSER CODE RUNNER STUDIO */}
      <section className="max-w-6xl mx-auto bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Code2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'विशेष शाखा उदाहरण २ • कंप्यूटर विज्ञान आईडीई' : 'FEATURED BRANCH EXAMPLE 2 • COMPUTER SCIENCE IDE'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' 
                ? 'शाखा उदाहरण २: इन-ब्राउज़र कोड रनर एवं एल्गोरिथम लैब' 
                : 'Branch Example 2: In-Browser Code Runner & Algorithm Studio'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-devanagari">
              {language === 'hi'
                ? 'ब्राउज़र में सीधे प्रोडक्शन-ग्रेड एल्गोरिदम चलाएं और टाइम कॉम्प्लेक्सिटी का लाइव विश्लेषण देखें।'
                : 'Inspect syntax-highlighted algorithmic logic, adjust inputs, and run verified test benchmarks instantly.'}
            </p>
          </div>

          {/* Algorithm Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start">
            <button
              onClick={() => { setSelectedAlgo('binary_search'); setCodeParam(42); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAlgo === 'binary_search' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'hi' ? 'बाइनरी सर्च' : 'Binary Search'}
            </button>
            <button
              onClick={() => { setSelectedAlgo('fibonacci'); setCodeParam(12); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAlgo === 'fibonacci' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'hi' ? 'फिबोनाची डीपी' : 'Fibonacci DP'}
            </button>
            <button
              onClick={() => { setSelectedAlgo('sieve'); setCodeParam(50); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAlgo === 'sieve' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'hi' ? 'प्राइम सीव' : 'Prime Sieve'}
            </button>
          </div>
        </div>

        {/* Code Studio Layout: Left Code Window, Right Terminal Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Code Editor Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#070B14] overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-slate-400 text-[11px] ml-2">
                  {algorithms[selectedAlgo].title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                {algorithms[selectedAlgo].complexity}
              </span>
            </div>

            <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto selection:bg-emerald-900">
              <code>{algorithms[selectedAlgo].code}</code>
            </pre>

            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">
                  {selectedAlgo === 'binary_search' 
                    ? (language === 'hi' ? 'खोज संख्या:' : 'Target Key:') 
                    : selectedAlgo === 'fibonacci' 
                    ? (language === 'hi' ? 'N-वां पद:' : 'N-th Value:') 
                    : (language === 'hi' ? 'अधिकतम सीमा:' : 'Upper Limit:')}
                </span>
                <input
                  type="number"
                  value={codeParam}
                  onChange={(e) => setCodeParam(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded bg-slate-800 text-white font-mono text-xs border border-slate-700 text-center"
                />
              </div>

              <button
                onClick={handleRunCode}
                disabled={isCodeRunning}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isCodeRunning ? (language === 'hi' ? 'संकलन हो रहा है...' : 'Compiling...') : (language === 'hi' ? 'लाइव सिमुलेशन चलाएं' : 'Run Live Simulation')}</span>
              </button>
            </div>
          </div>

          {/* Right: Real-Time Execution Console */}
          <div className="rounded-2xl border border-slate-800 bg-[#070B14] p-4 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'hi' ? 'आउटपुट टर्मिनल' : 'Execution Output Terminal'}</span>
                </div>
                {codeExecutionTime !== null && (
                  <span className="font-mono text-[11px] text-emerald-400">
                    ⏱️ {codeExecutionTime} {language === 'hi' ? 'मिलीसेकंड विलंबता' : 'ms latency'}
                  </span>
                )}
              </div>

              <div className="py-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[160px]">
                {codeOutput}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{language === 'hi' ? 'स्थिति: ' : 'Status: '}{isCodeRunning ? (language === 'hi' ? 'बाइटकोड निष्पादन...' : 'Executing bytecode...') : (language === 'hi' ? 'सफल निष्पादन (Exit Code 0)' : 'Execution Clean (Exit Code 0)')}</span>
              <span className="text-emerald-500 font-semibold">{language === 'hi' ? '100% क्लाइंट-साइड इंजन' : '100% Client-Side Engine'}</span>
            </div>
          </div>
        </div>
      </section>









      {/* 5. MULTILINGUAL AUDIO PRONUNCIATION & PHONETICS ENGINE */}
      <section className="max-w-6xl mx-auto bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'बहुभाषी वैज्ञानिक उच्चारण इंजन' : 'MULTILINGUAL SCIENTIFIC PHONETICS ENGINE'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' 
                ? 'स्पष्ट बहुभाषी वैज्ञानिक उच्चारण एवं शब्दावली' 
                : 'High-Fidelity Multilingual Scientific Phonetics'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'hi'
                ? 'जटिल वैज्ञानिक शब्दों के सटीक बहुभाषी उच्चारण, परिभाषाएं और मानक शब्दावली को अपनी पसंद की भाषा में सुनें।'
                : 'Listen to native technical phonetics and pronunciations side-by-side with global scientific standards in your preferred language.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {isPlayingAudio 
                ? (language === 'hi' ? 'ध्वनि बज रही है...' : 'Playing audio...') 
                : (language === 'hi' ? 'क्लिक करके सुनें' : 'Click to listen')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audioConcepts.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                activeAudioConcept === idx
                  ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 shadow-md'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    {language === 'hi' ? item.englishTitle : item.englishSubtitle}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold font-mono">
                    {language === 'hi' ? 'ऑडियो गाइड' : 'Audio Guide'}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'hi' ? item.hindiTitle : item.englishTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'hi' ? item.hindiDesc : item.englishDesc}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveAudioConcept(idx);
                  const textToSpeak = language === 'hi' ? item.hindiSpeechText : item.englishSpeechText;
                  const langCode = language === 'hi' ? 'hi-IN' : 'en-US';
                  handleSpeak(textToSpeak, langCode);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'उच्चारण सुनें (Listen)' : 'Listen Pronunciation'}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SPACED REPETITION (SM-2) INTERACTIVE FLIP CARD */}
      <section className="max-w-4xl mx-auto bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6 text-center">
        <div className="space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {language === 'hi' ? 'संज्ञानात्मक विज्ञान एवं प्रतिधारण' : 'COGNITIVE SCIENCE & RETENTION'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'hi' 
              ? 'स्मृति प्रतिधारण एवं स्पेस्ड रिपीटिशन (SM-2)' 
              : 'Spaced Repetition Flashcard Engine'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'hi'
              ? 'एबिंगहॉस विस्मृति वक्र को मात देने के लिए सक्रिय स्मरण कार्ड। इसे पलटकर देखें!'
              : 'Beat the Ebbinghaus forgetting curve with intelligent recall intervals. Click to reveal!'}
          </p>
        </div>

        {/* 3D Flip Card Container */}
        <div className="max-w-md mx-auto pt-2">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[200px] p-8 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-500 transition-all flex flex-col items-center justify-center space-y-4 group"
          >
            {!isFlipped ? (
              <div className="space-y-3 animate-in fade-in">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {language === 'hi' ? 'प्रश्न • उत्तर देखने के लिए क्लिक करें' : 'QUESTION • CLICK TO REVEAL'}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? '"यदि किसी गतिमान पिंड का वेग दोगुना कर दिया जाए, तो उसकी गतिज ऊर्जा (Kinetic Energy) में क्या परिवर्तन होगा?"'
                    : '"If the velocity of a moving object is doubled, what happens to its Kinetic Energy?"'}
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  {language === 'hi' ? '[ कार्ड पलटने के लिए क्लिक करें ]' : '[ Click to Flip Card ]'}
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <span>{language === 'hi' ? 'उत्तर •' : 'ANSWER •'}</span>
                  {/* Professional Kinetic Energy Formula Display */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-serif lowercase tracking-normal text-sm shadow-2xs">
                    <span className="italic font-bold">E</span><sub className="text-[10px] font-sans font-semibold">k</sub>
                    <span className="font-sans mx-0.5">=</span>
                    <span className="inline-flex flex-col items-center justify-center text-[10px] leading-none mx-0.5">
                      <span className="border-b border-current px-0.5 pb-0.5 font-sans font-semibold">1</span>
                      <span className="pt-0.5 font-sans font-semibold">2</span>
                    </span>
                    <span className="italic font-bold">m</span>
                    <span className="italic font-bold">v</span><sup className="text-[10px] font-sans font-semibold">2</sup>
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {language === 'hi'
                    ? '"गतिज ऊर्जा 4 गुना (4x) हो जाएगी, क्योंकि गतिज ऊर्जा वेग के वर्ग (v²) के समानुपाती होती है!"'
                    : '"Kinetic energy increases by 4 times (4x), because kinetic energy is proportional to the square of velocity (v²)!"'}
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  {language === 'hi' ? '[ वापस पलटने के लिए क्लिक करें ]' : '[ Click to Flip Back ]'}
                </div>
              </div>
            )}
          </div>

          {/* SM-2 Recall Rating Buttons */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setFlashcardRating(language === 'hi' ? 'कठिन (1 दिन)' : 'Hard (1 day)')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
            >
              🔴 {language === 'hi' ? 'कठिन (1 दिन)' : 'Hard (1 day)'}
            </button>
            <button
              onClick={() => setFlashcardRating(language === 'hi' ? 'मध्यम (6 दिन)' : 'Good (6 days)')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            >
              🟡 {language === 'hi' ? 'मध्यम (6 दिन)' : 'Good (6 days)'}
            </button>
            <button
              onClick={() => setFlashcardRating(language === 'hi' ? 'कंठस्थ (16 दिन)' : 'Mastered (16 days)')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              🟢 {language === 'hi' ? 'कंठस्थ (16 दिन)' : 'Mastered (16 days)'}
            </button>
          </div>

          {flashcardRating && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
              {language === 'hi'
                ? `अगली स्वचालित समीक्षा निर्धारित: ${flashcardRating}`
                : `Next algorithmic review scheduled in: ${flashcardRating}`}
            </p>
          )}
        </div>
      </section>

      {/* 6. VEYRA DISPATCH: STORIES & ESSAYS BY SUPER ADMIN PRIYANKA */}
      <section className="max-w-6xl mx-auto bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'वेयरा डिस्पेच • सुपर एडमिन आलेख' : 'VEYRA DISPATCH • FOUNDER & SUPER ADMIN ESSAYS'}</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black font-serif text-slate-900 dark:text-white mt-1">
              {language === 'hi'
                ? 'सुपर एडमिन प्रियंका द्वारा लिखित शोध आलेख एवं ब्लॉग'
                : 'Articles & Research Written by Super Admin Priyanka'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-devanagari">
              {language === 'hi'
                ? 'सक्रिय 60 FPS सिमुलेशन वास्तुकला, संज्ञानात्मक स्मृति सिद्धांत और कंप्यूटर विज्ञान शिक्षा पर गहन विचार।'
                : 'In-depth essays on 60 FPS kinetic simulation physics, cognitive memory models, and stateful algorithmic execution.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('blogs')}
            className="self-start md:self-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी आलेख पढ़ें (All Stories)' : 'Read All Stories'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishedBlogs.slice(0, 3).map((blog) => (
            <div
              key={blog.id}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', `/blogs?id=${encodeURIComponent(blog.id)}`);
                }
                onNavigate('blogs');
              }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col justify-between space-y-4 group cursor-pointer shadow-xs hover:shadow-lg"
            >
              <div className="space-y-3">
                {blog.coverImage && (
                  <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <img
                    src={blog.authorAvatar}
                    alt={blog.authorName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                  />
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{blog.authorName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400 font-mono">{blog.readingTimeMinutes} min read</span>
                </div>

                <h3 className="font-black font-serif text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                  {blog.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {blog.subtitle || blog.content.slice(0, 100)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {blog.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
                  <span>👏</span>
                  <span>{blog.claps}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. INSTITUTIONAL & PEDAGOGICAL PILLARS (WHY VEYRA) */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
            🧪
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {language === 'hi' ? 'वास्तविक 60 FPS सिमुलेशन' : 'Interactive Kinetic Labs'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-devanagari">
            {language === 'hi'
              ? 'कोई रिकॉर्डेड वीडियो नहीं — सीधे ब्राउज़र में चलने वाले भौतिकी और रासायनिक समीकरण।'
              : 'Interactive canvas physics that react to your parameters with 60 FPS smoothness.'}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            💻
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {language === 'hi' ? 'लाइव इन-ब्राउज़र कोड रनर' : 'Client-Side Code IDE'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-devanagari">
            {language === 'hi'
              ? 'पायथन और जावास्क्रिप्ट में तुरंत परीक्षण और समय जटिलता का सटीक माप।'
              : 'Execute algorithms instantly with live execution logging and zero latency.'}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
            🛡️
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {language === 'hi' ? 'बहुस्तरीय प्रशासनिक नियंत्रण' : 'Multi-Layer Scoped RBAC'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-devanagari">
            {language === 'hi'
              ? 'सुपर एडमिन, पीसीएमबी शाखा, कंप्यूटर साइंस शाखा एवं अनुवादक भूमिकाएं।'
              : 'Institutional governance with subtree-scoped authorization down to subtopics.'}
          </p>
        </div>
      </section>

      {/* 8. EXPLORE CALL-TO-ACTION (ABOUT & CONTACT - NO LOGIN FORMS!) */}
      <section className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 border border-slate-800 text-center space-y-6 shadow-2xl">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
          {language === 'hi' ? 'हमारे शैक्षणिक दृष्टिकोण को जानें' : 'DISCOVER OUR ACADEMIC VISION'}
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
          {language === 'hi' 
            ? 'शिक्षा में क्रांतिकारी बदलाव की ओर एक कदम' 
            : 'Explore Veyra\'s Research & Mission'}
        </h2>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed font-devanagari">
          {language === 'hi'
            ? 'हमारे शैक्षिक अनुसंधान, शिक्षण विधियों या संस्थागत सहयोग के बारे में अधिक जानने के लिए हमारे पेज देखें।'
            : 'Learn about our cognitive load research, DPDP Act 2023 compliance, or reach out to our team.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('simulations')}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{language === 'hi' ? 'लाइव सिमुलेशन देखें (Simulations)' : 'Explore Simulations Demo'}</span>
          </button>

          <button
            onClick={() => onNavigate('about')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Compass className="w-4 h-4" />
            <span>{language === 'hi' ? 'हमारे बारे में जानें (About Us)' : 'Read About Veyra'}</span>
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs md:text-sm border border-white/20 transition-all flex items-center gap-2 hover:scale-105"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'hi' ? 'हमसे संपर्क करें (Contact Team)' : 'Contact Academic Team'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
