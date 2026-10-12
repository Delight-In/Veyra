import React, { useState, useEffect, useRef } from 'react';
import { SimulationConfig } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { Play, RotateCcw, Volume2, VolumeX, Award, HelpCircle, CheckCircle, Zap, Compass, Activity, Globe } from 'lucide-react';

interface SimulationSandboxProps {
  config?: SimulationConfig;
  nodeTitle?: string;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({ config, nodeTitle }) => {
  const { language, t } = useLanguage();
  const { markChallengeSolved, completedSimulationChallenges } = useStudy();

  const simType = config?.type || 'projectile';

  // -------------------------------------------------------------
  // SIMULATION 1: PROJECTILE MOTION STATE & CANVAS
  // -------------------------------------------------------------
  const [angle, setAngle] = useState<number>(45);
  const [velocity, setVelocity] = useState<number>(37);
  const [gravity, setGravity] = useState<number>(9.8);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [targetDistance] = useState<number>(140); // 140 meters target
  const [targetHit, setTargetHit] = useState<boolean>(false);
  const [showComplement, setShowComplement] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const projectileStateRef = useRef<{
    t: number;
    points: { x: number; y: number }[];
    complementPoints: { x: number; y: number }[];
  }>({ t: 0, points: [], complementPoints: [] });

  // Physics calculations
  const rad = (angle * Math.PI) / 180;
  const timeOfFlight = (2 * velocity * Math.sin(rad)) / gravity;
  const maxHeight = (Math.pow(velocity * Math.sin(rad), 2)) / (2 * gravity);
  const range = (Math.pow(velocity, 2) * Math.sin(2 * rad)) / gravity;

  // Sound generator
  const playBeep = (freq: number, duration: number = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext autoplay restrictions or unsupported
    }
  };

  const fireProjectile = () => {
    if (isFiring) return;
    setIsFiring(true);
    setTargetHit(false);
    playBeep(220, 0.2);

    projectileStateRef.current = {
      t: 0,
      points: [{ x: 0, y: 0 }],
      complementPoints: showComplement ? [{ x: 0, y: 0 }] : []
    };

    const startTime = performance.now();
    const timeScale = 0.85; // realistic physics pacing

    const animate = (now: number) => {
      const elapsed = ((now - startTime) / 1000) * timeScale;
      const currentT = elapsed;

      // Current projectile position
      const radCurrent = (angle * Math.PI) / 180;
      const x = velocity * Math.cos(radCurrent) * currentT;
      const y = Math.max(0, velocity * Math.sin(radCurrent) * currentT - 0.5 * gravity * Math.pow(currentT, 2));

      projectileStateRef.current.t = currentT;
      projectileStateRef.current.points.push({ x, y });

      // Complementary angle points
      if (showComplement) {
        const compAngle = 90 - angle;
        const radComp = (compAngle * Math.PI) / 180;
        const cx = velocity * Math.cos(radComp) * currentT;
        const cy = Math.max(0, velocity * Math.sin(radComp) * currentT - 0.5 * gravity * Math.pow(currentT, 2));
        projectileStateRef.current.complementPoints.push({ x: cx, y: cy });
      }

      drawProjectileCanvas();

      if (currentT < timeOfFlight && y > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Landing event
        setIsFiring(false);
        // Check target hit within ±4 meters
        if (Math.abs(range - targetDistance) <= 4.5) {
          setTargetHit(true);
          playBeep(659.25, 0.4); // E5 note
          markChallengeSolved('c1');
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const resetSimulation = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsFiring(false);
    setTargetHit(false);
    projectileStateRef.current = { t: 0, points: [], complementPoints: [] };
    drawProjectileCanvas();
  };

  const drawProjectileCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Deep scientific laboratory background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090D16');
    bgGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping: origin at (50, height - 50)
    const originX = 55;
    const originY = height - 55;
    const scale = Math.min((width - 110) / 200, (height - 90) / 80);

    // High-tech Grid Lines & Axis
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let gy = 10; gy <= 70; gy += 10) {
      const py = originY - gy * scale;
      ctx.beginPath();
      ctx.moveTo(originX, py);
      ctx.lineTo(width - 20, py);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${gy}m`, originX - 32, py + 3);
    }

    // Vertical grid lines
    for (let gx = 0; gx <= 200; gx += 20) {
      const px = originX + gx * scale;
      ctx.beginPath();
      ctx.moveTo(px, 30);
      ctx.lineTo(px, originY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${gx}m`, px - 10, originY + 20);
    }

    // Ground platform line
    const groundGrad = ctx.createLinearGradient(0, originY, width, originY);
    groundGrad.addColorStop(0, '#38bdf8');
    groundGrad.addColorStop(0.5, '#6366f1');
    groundGrad.addColorStop(1, '#a855f7');
    ctx.strokeStyle = groundGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, originY);
    ctx.lineTo(width - 20, originY);
    ctx.stroke();

    // Target Flag and Radar Base at 140m
    const targetX = originX + targetDistance * scale;

    // Radar pulse on ground
    ctx.strokeStyle = targetHit ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(targetX, originY, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Target Pole & Flag
    ctx.strokeStyle = targetHit ? '#22c55e' : '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(targetX, originY);
    ctx.lineTo(targetX, originY - 40);
    ctx.stroke();

    ctx.fillStyle = targetHit ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(targetX, originY - 40);
    ctx.lineTo(targetX + 24, originY - 30);
    ctx.lineTo(targetX, originY - 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`Target (140m)`, targetX - 30, originY - 46);

    // Cannon Barrel at origin
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(-rad);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -6, 32, 12);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(28, -7, 5, 14); // Muzzle tip
    ctx.restore();

    // Cannon Base Turret
    ctx.beginPath();
    ctx.arc(originX, originY, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Theoretical Parabolic Trajectory
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let simT = 0; simT <= timeOfFlight; simT += 0.04) {
      const px = originX + velocity * Math.cos(rad) * simT * scale;
      const py = originY - (velocity * Math.sin(rad) * simT - 0.5 * gravity * Math.pow(simT, 2)) * scale;
      if (simT === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak Apex Indicator
    const apexX = originX + (range / 2) * scale;
    const apexY = originY - maxHeight * scale;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
    ctx.beginPath();
    ctx.arc(apexX, apexY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`Apex: ${maxHeight.toFixed(1)}m`, apexX - 22, apexY - 8);

    // Draw Complementary Trajectory if toggled
    if (showComplement) {
      const compRad = ((90 - angle) * Math.PI) / 180;
      const compTof = (2 * velocity * Math.sin(compRad)) / gravity;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let simT = 0; simT <= compTof; simT += 0.04) {
        const px = originX + velocity * Math.cos(compRad) * simT * scale;
        const py = originY - (velocity * Math.sin(compRad) * simT - 0.5 * gravity * Math.pow(simT, 2)) * scale;
        if (simT === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Live Animated Particle Trail
    const pts = projectileStateRef.current.points;
    if (pts.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(originX + pts[0].x * scale, originY - pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(originX + pts[i].x * scale, originY - pts[i].y * scale);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Projectile Cannonball
      const lastPt = pts[pts.length - 1];
      const ballX = originX + lastPt.x * scale;
      const ballY = originY - lastPt.y * scale;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer Glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawProjectileCanvas();
  }, [angle, velocity, gravity, showComplement]);

  // -------------------------------------------------------------
  // SIMULATION 2: WAVE SYNTHESIZER STATE & AUDIO
  // -------------------------------------------------------------
  const [waveFreq, setWaveFreq] = useState<number>(440);
  const [waveAmp, setWaveAmp] = useState<number>(55);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const toggleWaveAudio = () => {
    if (isPlayingAudio) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(waveFreq, audioCtx.currentTime);
        gain.gain.setValueAtTime(waveAmp / 350, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        audioContextRef.current = audioCtx;
        oscillatorRef.current = osc;
        setIsPlayingAudio(true);
      } catch (err) {
        console.error('Audio start error:', err);
      }
    }
  };

  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(waveFreq, audioContextRef.current.currentTime);
    }
    if (waveFreq === 440) {
      markChallengeSolved('wc1');
    }
  }, [waveFreq]);

  // Wave Canvas Renderer
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (simType !== 'wave_synth') return;
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Dark oscilloscope background
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center Reference Axis
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Sine Wave with Cyan Glow
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const tVal = (x / width) * 4 * Math.PI * (waveFreq / 200) + phase;
        const y = centerY - Math.sin(tVal) * waveAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Harmonic Cosine Reference Wave
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const tVal = (x / width) * 4 * Math.PI * (waveFreq / 200) + phase;
        const y = centerY - Math.cos(tVal) * (waveAmp * 0.7);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.05;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [simType, waveFreq, waveAmp]);

  // -------------------------------------------------------------
  // SIMULATION 3: ORBITAL GRAVITY & PLANETARY DYNAMICS
  // -------------------------------------------------------------
  const [starMass, setStarMass] = useState<number>(100);
  const [orbitalSpeed, setOrbitalSpeed] = useState<number>(30);
  const [orbitalRadius, setOrbitalRadius] = useState<number>(120);
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (simType !== 'gravity_orbit') return;
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;
    const trail: { x: number; y: number }[] = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Space background with stars
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Starfield grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
      ctx.lineWidth = 1;
      for (let r = 50; r <= 220; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbital radius circle
      const r = orbitalRadius;
      const speedFactor = (orbitalSpeed / 30) * Math.sqrt(starMass / 100);
      angle += 0.02 * speedFactor;

      const satX = centerX + r * Math.cos(angle);
      const satY = centerY + r * Math.sin(angle);

      trail.push({ x: satX, y: satY });
      if (trail.length > 90) trail.shift();

      // Draw Orbit Trail
      if (trail.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        trail.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Central Star with Corona
      const starRadius = Math.max(16, Math.min(32, starMass / 4));
      const coronaGrad = ctx.createRadialGradient(centerX, centerY, starRadius * 0.4, centerX, centerY, starRadius * 2.2);
      coronaGrad.addColorStop(0, '#fef08a');
      coronaGrad.addColorStop(0.3, '#f59e0b');
      coronaGrad.addColorStop(0.7, '#ea580c');
      coronaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting Satellite / Planet
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(satX, satY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gravitational Force Vector
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(satX + (centerX - satX) * 0.35, satY + (centerY - satY) * 0.35);
      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [simType, starMass, orbitalSpeed, orbitalRadius]);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-6 shadow-card space-y-6">
      {/* Simulation Header with Lab Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>LIVE COMPUTATIONAL LAB</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              HTML5 Canvas & Web Audio
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {nodeTitle || (simType === 'projectile' 
              ? (language === 'hi' ? 'प्रक्षेप्य गति एवं गुरुत्वाकर्षण लैब' : 'Kinematics & Parabolic Trajectory Simulator')
              : (language === 'hi' ? 'त्रिकोणमितीय तरंग सिंथेसाइज़र' : 'Harmonic Wave & Audio Synthesizer'))}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {simType === 'projectile' && (
            <button
              onClick={resetSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('simulationsSection.reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER SIMULATION ACCORDING TO TYPE */}
      {simType === 'projectile' ? (
        <div className="space-y-6">
          {/* Scientific Canvas Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090D16]">
            <canvas
              ref={canvasRef}
              width={780}
              height={380}
              className="w-full h-auto block"
            />

            {/* Target Hit Notification Banner */}
            {targetHit && (
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-md animate-bounce">
                <CheckCircle className="w-5 h-5" />
                <span className="font-extrabold text-xs tracking-wide">
                  {language === 'hi' ? '🎯 सटीक निशाना! लक्ष्य भेदा गया (+75 XP)' : '🎯 Target Hit at 140m! (+75 XP)'}
                </span>
              </div>
            )}
          </div>

          {/* Precision Telemetry HUD Readout Deck */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                {language === 'hi' ? 'क्षैतिज परास (Range)' : 'Horizontal Range (R)'}
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {range.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">u² sin(2θ) / g</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                {language === 'hi' ? 'अधिकतम ऊंचाई (Apex)' : 'Peak Height (H)'}
              </span>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {maxHeight.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">u² sin²θ / 2g</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                {language === 'hi' ? 'उड्डयन काल (Time)' : 'Flight Time (T)'}
              </span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {timeOfFlight.toFixed(1)} <span className="text-xs text-slate-400 font-normal">s</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">2u sinθ / g</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                {language === 'hi' ? 'लक्ष्य दूरी (Target)' : 'Target Distance'}
              </span>
              <div className="text-xl font-extrabold text-rose-500 font-mono mt-0.5">
                140.0 <span className="text-xs text-slate-400 font-normal">m</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {language === 'hi' ? 'सहनशीलता: ±4m' : 'Tolerance: ±4m'}
              </span>
            </div>
          </div>

          {/* Interactive Control Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            {/* Angle Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'प्रक्षेपण कोण (θ)' : 'Launch Angle (θ)'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/50">
                  {angle}°
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                value={angle}
                disabled={isFiring}
                onChange={e => setAngle(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-1">
                <span>5°</span>
                <span className="text-indigo-500 font-bold">45° ({language === 'hi' ? 'अधिकतम परास' : 'Max Range'})</span>
                <span>85°</span>
              </div>
            </div>

            {/* Velocity Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'प्रारंभिक वेग (u)' : 'Launch Speed (u)'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/50">
                  {velocity} m/s
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={velocity}
                disabled={isFiring}
                onChange={e => setVelocity(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-1">
                <span>15 m/s</span>
                <span>60 m/s</span>
              </div>
            </div>

            {/* Gravity Planet Presets */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'गुरुत्वीय त्वरण (g)' : 'Gravitational Field (g)'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/50">
                  {gravity} m/s²
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setGravity(1.6)}
                  className={`py-1.5 px-2 text-xs rounded-xl font-bold border transition-all ${gravity === 1.6 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  🌕 {language === 'hi' ? 'चांद' : 'Moon'}
                </button>
                <button
                  type="button"
                  onClick={() => setGravity(9.8)}
                  className={`py-1.5 px-2 text-xs rounded-xl font-bold border transition-all ${gravity === 9.8 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  🌍 {language === 'hi' ? 'पृथ्वी' : 'Earth'}
                </button>
                <button
                  type="button"
                  onClick={() => setGravity(24.8)}
                  className={`py-1.5 px-2 text-xs rounded-xl font-bold border transition-all ${gravity === 24.8 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  🪐 {language === 'hi' ? 'बृहस्पति' : 'Jupiter'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fireProjectile}
                disabled={isFiring}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isFiring 
                    ? 'bg-slate-500 cursor-not-allowed opacity-80' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25 active:scale-95'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {isFiring 
                    ? (language === 'hi' ? 'प्रक्षेप्य गतिमान है...' : 'Cannonball in Flight...') 
                    : (language === 'hi' ? 'तोप से फायर करें' : 'Fire Projectile Cannon')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowComplement(!showComplement)}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-colors ${
                  showComplement 
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {language === 'hi' 
                  ? `पूरक कोण (${90 - angle}°) आवरण` 
                  : `Overlay Complementary (${90 - angle}°)`}
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center sm:text-right">
              {language === 'hi' ? 'गैलीलियो ऑर्थोगोनल किनेमेटिक्स इंजन' : "Galileo's Orthogonal Kinematics Engine"}
            </div>
          </div>

          {/* Guided Challenges Section */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5 font-devanagari">
              <Award className="w-4 h-4 text-amber-600" />
              <span>{t('classroom.whatsToTry')}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950 dark:text-amber-200/90 font-medium">
              <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${completedSimulationChallenges.includes('c1') ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-800'}`}>
                  {completedSimulationChallenges.includes('c1') ? '✓' : '1'}
                </span>
                <span className="font-devanagari">
                  {language === 'hi' 
                    ? '140m लक्ष्य भेदें (सुझाव: θ = 45° और v = 37 m/s सेट करें)।' 
                    : 'Hit the target flag at 140m (Try θ = 45° and speed = 37 m/s).'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold">2</span>
                <span className="font-devanagari">
                  {language === 'hi' 
                    ? 'पूरक कोण दबाकर 30° व 60° दोनों को एक ही स्थान पर गिरते देखें!' 
                    : 'Compare 30° vs 60°: verify identical range theorem!'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : simType === 'gravity_orbit' ? (
        /* GRAVITY ORBIT SIMULATOR */
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060913] shadow-2xl">
            <canvas
              ref={orbitCanvasRef}
              width={780}
              height={360}
              className="w-full h-auto block"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-amber-950/80 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-800/60 font-devanagari">
                {language === 'hi' ? 'केंद्रीय तारा द्रव्यमान' : 'Central Star Mass'}: {starMass} M☉
              </span>
              <span className="px-3 py-1 bg-sky-950/80 text-sky-300 text-xs font-mono font-bold rounded-lg border border-sky-800/60 font-devanagari">
                {language === 'hi' ? 'कक्षीय वेग' : 'Orbital Velocity'}: {orbitalSpeed} km/s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'केंद्रीय द्रव्यमान (Star Mass)' : 'Central Mass (M)'}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-sm bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/50">
                  {starMass} M☉
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={starMass}
                onChange={e => setStarMass(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'कक्षीय गति (Velocity)' : 'Orbital Velocity (v)'}
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-mono text-sm bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200/50">
                  {orbitalSpeed} km/s
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={orbitalSpeed}
                onChange={e => setOrbitalSpeed(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'कक्षा त्रिज्या (Orbital Radius)' : 'Semi-Major Axis (r)'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/50">
                  {orbitalRadius} AU
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                value={orbitalRadius}
                onChange={e => setOrbitalRadius(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
            <span className="font-semibold">
              Newton's Universal Gravitation: F = G·(M·m) / r² • Centripetal Balance: v = √(G·M / r)
            </span>
            <span className="font-mono text-[10px] text-sky-500">
              {language === 'hi' ? 'केप्लरियन कक्षीय यांत्रिकी' : 'Keplerian Orbital Mechanics'}
            </span>
          </div>
        </div>
      ) : (
        /* WAVE SYNTHESIZER SIMULATOR */
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090D16]">
            <canvas
              ref={waveCanvasRef}
              width={780}
              height={320}
              className="w-full h-auto block"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-cyan-950/80 text-cyan-300 text-xs font-mono font-bold rounded-lg border border-cyan-800/60 font-devanagari">
                {language === 'hi' ? 'मूल तरंग' : 'Fundamental'}: y = {waveAmp}·sin(2π·{waveFreq}t)
              </span>
              <span className="px-3 py-1 bg-purple-950/80 text-purple-300 text-xs font-mono font-bold rounded-lg border border-purple-800/60 font-devanagari">
                {language === 'hi' ? 'कोसाइन हार्मोनिक' : 'Cosine Harmonic'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'आवृत्ति (Frequency / Pitch)' : 'Frequency (Pitch)'}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200/50">
                  {waveFreq} Hz
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="880"
                value={waveFreq}
                onChange={e => setWaveFreq(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-1">
                <span>100 Hz ({language === 'hi' ? 'बास' : 'Bass'})</span>
                <span className="text-cyan-500 font-bold">440 Hz ({language === 'hi' ? 'कंसर्ट ए' : 'Concert A'})</span>
                <span>880 Hz ({language === 'hi' ? 'ट्रेबल' : 'Treble'})</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'आयाम (Amplitude / Volume)' : 'Amplitude (Volume)'}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200/50">
                  {waveAmp} px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={waveAmp}
                onChange={e => setWaveAmp(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleWaveAudio}
              className={`px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all shadow-md ${
                isPlayingAudio 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25' 
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/25'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>
                {isPlayingAudio 
                  ? (language === 'hi' ? 'ध्वनि बंद करें' : 'Mute Wave Audio') 
                  : (language === 'hi' ? 'ध्वनि सुनें (Synthesize Frequency)' : 'Play Frequency Pitch')}
              </span>
            </button>
            <div className="text-xs text-slate-400 font-mono">
              {language === 'hi' ? 'वेब ऑडियो एपीआई सक्रिय' : 'Web Audio API Oscillator Active'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
