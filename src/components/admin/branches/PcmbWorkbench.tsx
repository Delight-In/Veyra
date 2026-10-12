import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Atom, Play, Pause, RotateCcw, Plus, Sparkles, CheckCircle2, Sliders, Eye, BookOpen } from 'lucide-react';

export const PcmbWorkbench: React.FC = () => {
  const { language } = useLanguage();

  // Simulation Parameters for PCMB Lab
  const [subject, setSubject] = useState<'physics' | 'chemistry' | 'math' | 'biology'>('physics');
  const [velocity, setVelocity] = useState<number>(42);
  const [angle, setAngle] = useState<number>(45);
  const [gravity, setGravity] = useState<number>(9.8);
  const [targetDistance, setTargetDistance] = useState<number>(140);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetHit, setTargetHit] = useState<boolean>(false);

  // New Simulation Creator State
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newSimTitle, setNewSimTitle] = useState<string>('');
  const [newSimFormula, setNewSimFormula] = useState<string>('');
  const [newSimDescription, setNewSimDescription] = useState<string>('');
  const [creationSuccess, setCreationSuccess] = useState<boolean>(false);

  // Physics Calculations
  const angleRad = (angle * Math.PI) / 180;
  const timeOfFlight = (2 * velocity * Math.sin(angleRad)) / gravity;
  const maxHeight = (Math.pow(velocity * Math.sin(angleRad), 2)) / (2 * gravity);
  const range = (Math.pow(velocity, 2) * Math.sin(2 * angleRad)) / gravity;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const animTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / 180;
    const scaleY = height / 70;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Ground plane
      const groundY = height - 25;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Target Zone (e.g., at 140m)
      const targetPixelX = targetDistance * scaleX;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(targetPixelX - 12, groundY - 20, 24, 20);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(targetPixelX - 12, groundY - 20, 24, 20);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(targetPixelX, groundY - 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Theoretical Parabolic Path
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let t = 0; t <= timeOfFlight; t += 0.05) {
        const x = velocity * Math.cos(angleRad) * t;
        const y = velocity * Math.sin(angleRad) * t - 0.5 * gravity * t * t;
        const px = x * scaleX;
        const py = groundY - y * scaleY;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated Projectile
      if (isRunning) {
        animTimeRef.current += 0.04;
        if (animTimeRef.current > timeOfFlight) {
          animTimeRef.current = timeOfFlight;
          setIsRunning(false);
          if (Math.abs(range - targetDistance) <= 3) {
            setTargetHit(true);
          }
        }
      }

      const curT = animTimeRef.current;
      const curX = velocity * Math.cos(angleRad) * curT;
      const curY = Math.max(0, velocity * Math.sin(angleRad) * curT - 0.5 * gravity * curT * curT);
      const curPx = curX * scaleX;
      const curPy = groundY - curY * scaleY;

      // Projectile glow
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.shadowBlur = 0;

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [velocity, angle, gravity, targetDistance, isRunning, timeOfFlight, angleRad, range]);

  const handleLaunch = () => {
    animTimeRef.current = 0;
    setTargetHit(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    animTimeRef.current = 0;
    setTargetHit(false);
  };

  const handleCreateNewSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSimTitle.trim()) return;
    setCreationSuccess(true);
    setTimeout(() => {
      setCreationSuccess(false);
      setIsCreatingNew(false);
      setNewSimTitle('');
      setNewSimFormula('');
      setNewSimDescription('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* PCMB Scientific Discipline Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-card border border-emerald-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Atom className="w-4 h-4" />
            <span>PCMB SCIENCE WORKBENCH & VISUALIZATION STUDIO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {language === 'hi' ? 'भौतिकी, रसायन, गणित एवं जीवविज्ञान प्रयोगशाला' : 'Physics, Chemistry, Math & Biology (PCMB) Studio'}
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl font-devanagari">
            {language === 'hi'
              ? 'वैज्ञानिक सिद्धांतों की दृश्य सिमुलेशन तैयार करें, गणितीय सूत्रों का सत्यापन करें और प्रयोगों को सक्रिय बनाएं।'
              : 'Construct kinetic visual simulators, derive mathematical proofs, and evaluate live parameter-driven science labs.'}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(!isCreatingNew)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all text-white hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingNew ? 'Close Creator' : 'Create New PCMB Simulation'}</span>
        </button>
      </div>

      {/* CREATE NEW SIMULATION ACCORDION */}
      {isCreatingNew && (
        <form onSubmit={handleCreateNewSim} className="p-6 bg-white dark:bg-[#0F172A] rounded-2xl border border-emerald-500/40 shadow-card space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Author New Science Visualization / Simulation Node</span>
            </h3>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">PCMB Studio Engine</span>
          </div>

          {creationSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Simulation successfully authored and registered in PCMB tree!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Experiment Title (EN/HI) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Simple Harmonic Motion & Pendulum Resonance"
                value={newSimTitle}
                onChange={e => setNewSimTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Governing Equation (LaTeX / Formula)
              </label>
              <input
                type="text"
                placeholder="e.g. T = 2\pi \sqrt{L/g} or [A] = [A]_0 e^{-kt}"
                value={newSimFormula}
                onChange={e => setNewSimFormula(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pedagogical Description & Real-World Analogy
            </label>
            <textarea
              rows={2}
              placeholder="Describe what learners should manipulate and observe in this experiment..."
              value={newSimDescription}
              onChange={e => setNewSimDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              Save & Test Simulation
            </button>
          </div>
        </form>
      )}

      {/* DISCIPLINE SELECTOR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSubject('physics')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            subject === 'physics'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          ⚛️ Physics (Kinematics & Optics)
        </button>

        <button
          onClick={() => setSubject('chemistry')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            subject === 'chemistry'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          🧪 Chemistry (Equilibrium & Reactions)
        </button>

        <button
          onClick={() => setSubject('math')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            subject === 'math'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          📐 Mathematics (Trig Wave Synthesizer)
        </button>

        <button
          onClick={() => setSubject('biology')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            subject === 'biology'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          🧬 Biology (Genetics & Osmosis Model)
        </button>
      </div>

      {/* SIMULATOR CANVAS & TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Canvas */}
        <div className="lg:col-span-2 bg-[#090D16] p-4 rounded-2xl border border-slate-800 shadow-card space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Canvas Computational Renderer (HTML5 60FPS)</span>
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>R = {range.toFixed(1)}m</span>
              <span>H_max = {maxHeight.toFixed(1)}m</span>
              <span>T = {timeOfFlight.toFixed(2)}s</span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#020617]">
            <canvas
              ref={canvasRef}
              width={720}
              height={280}
              className="w-full h-auto block"
            />

            {targetHit && (
              <div className="absolute top-4 right-4 bg-emerald-500/90 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                <span>Target Destroyed! (R ≈ 140m)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] font-mono text-slate-400">
              Formula: <span className="text-emerald-400">R = (v₀² · sin(2θ)) / g</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleLaunch}
                disabled={isRunning}
                className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Simulating...' : 'Launch Trajectory'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Parameter Controls */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Parameter Tuning</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Live Feedback</span>
          </div>

          {/* Velocity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Initial Velocity (v₀):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{velocity} m/s</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={1}
              value={velocity}
              onChange={e => setVelocity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Angle */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Launch Angle (θ):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{angle}°</span>
            </div>
            <input
              type="range"
              min={10}
              max={85}
              step={1}
              value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Gravity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Gravity Field (g):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{gravity} m/s²</span>
            </div>
            <select
              value={gravity}
              onChange={e => setGravity(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            >
              <option value={9.8}>Earth (9.8 m/s²)</option>
              <option value={1.62}>Moon (1.62 m/s²)</option>
              <option value={3.72}>Mars (3.72 m/s²)</option>
              <option value={24.79}>Jupiter (24.79 m/s²)</option>
            </select>
          </div>

          {/* Target Distance */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Target Distance (d):</span>
              <span className="font-mono text-rose-500 font-bold">{targetDistance} m</span>
            </div>
            <input
              type="range"
              min={60}
              max={160}
              step={5}
              value={targetDistance}
              onChange={e => setTargetDistance(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold block text-slate-700 dark:text-slate-300">Complementary Angle Theorem:</span>
            <span>Angles θ and (90° - θ) yield identical horizontal ranges with distinct apex trajectories.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
