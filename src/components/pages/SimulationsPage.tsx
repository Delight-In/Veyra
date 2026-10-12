import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ContentNode } from '../../types';
import { 
  Atom, 
  FlaskConical, 
  Dna, 
  Binary, 
  Landmark, 
  History, 
  Globe2, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Zap, 
  Compass, 
  ArrowRight,
  Target,
  Layers,
  ChevronDown,
  Activity
} from 'lucide-react';

interface SimulationsPageProps {
  onOpenClassroom?: (node?: ContentNode) => void;
  onNavigate?: (page: string) => void;
}

export const SimulationsPage: React.FC<SimulationsPageProps> = ({ onOpenClassroom, onNavigate }) => {
  const { language } = useLanguage();
  const { openAuthModal, currentUser } = useAuth();

  // Quick Anchor Navigator
  const scrollToSim = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =========================================================================
  // SIMULATION 1: PHYSICS — OPTICS & REFRACTION (SNELL'S LAW & DISPERSION)
  // =========================================================================
  const [incidenceAngle, setIncidenceAngle] = useState<number>(45); // degrees
  const [refractiveIndexN2, setRefractiveIndexN2] = useState<number>(1.5); // Glass default
  const [mediumLabel, setMediumLabel] = useState<string>('Crown Glass (n = 1.50)');
  const [showDispersion, setShowDispersion] = useState<boolean>(true);
  const opticsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const n1 = 1.0; // Air
  const sinTheta1 = Math.sin((incidenceAngle * Math.PI) / 180);
  const sinTheta2 = (n1 * sinTheta1) / refractiveIndexN2;
  const isTotalInternalReflection = sinTheta2 > 1.0;
  const refractionAngle = isTotalInternalReflection ? 0 : Math.asin(sinTheta2) * (180 / Math.PI);
  const criticalAngle = refractiveIndexN2 > n1 ? Math.asin(n1 / refractiveIndexN2) * (180 / Math.PI) : 90;

  useEffect(() => {
    const canvas = opticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midX = width / 2;
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Medium 1 (Air) - Top Half
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, midY);

    // Medium 2 - Bottom Half
    ctx.fillStyle = refractiveIndexN2 > 1.8 ? '#082f49' : refractiveIndexN2 > 1.4 ? '#111827' : '#0c4a6e';
    ctx.fillRect(0, midY, width, midY);

    // Medium boundary interface line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Normal line (dashed)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Incident Ray (Light Green Laser Beam)
    const rayLength = 170;
    const theta1Rad = (incidenceAngle * Math.PI) / 180;
    const startX = midX - rayLength * Math.sin(theta1Rad);
    const startY = midY - rayLength * Math.cos(theta1Rad);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(midX, midY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Reflected Ray
    const reflectX = midX + rayLength * Math.sin(theta1Rad);
    const reflectY = midY - rayLength * Math.cos(theta1Rad);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(reflectX, reflectY);
    ctx.stroke();

    // Refracted Rays
    if (isTotalInternalReflection) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(reflectX, reflectY);
      ctx.stroke();
    } else {
      if (showDispersion) {
        const wavelengths = [
          { color: '#ef4444', nMod: refractiveIndexN2 - 0.03 },
          { color: '#22c55e', nMod: refractiveIndexN2 },
          { color: '#3b82f6', nMod: refractiveIndexN2 + 0.04 },
        ];

        wavelengths.forEach(wl => {
          const sTheta2 = (n1 * sinTheta1) / wl.nMod;
          const theta2Rad = Math.asin(Math.min(1, sTheta2));
          const endX = midX + rayLength * Math.sin(theta2Rad);
          const endY = midY + rayLength * Math.cos(theta2Rad);

          ctx.strokeStyle = wl.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = wl.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });
      } else {
        const theta2Rad = (refractionAngle * Math.PI) / 180;
        const endX = midX + rayLength * Math.sin(theta2Rad);
        const endY = midY + rayLength * Math.cos(theta2Rad);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Canvas Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Medium 1: Air (n₁ = 1.00)', 16, 28);
    ctx.fillText(`Medium 2: ${mediumLabel}`, 16, midY + 28);
    ctx.fillText(`θ₁ = ${incidenceAngle}°`, midX - 55, midY - 30);
    if (!isTotalInternalReflection) {
      ctx.fillText(`θ₂ = ${refractionAngle.toFixed(1)}°`, midX + 20, midY + 45);
    } else {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('TOTAL INTERNAL REFLECTION', midX + 20, midY + 45);
    }
  }, [incidenceAngle, refractiveIndexN2, mediumLabel, showDispersion, refractionAngle, isTotalInternalReflection]);

  // =========================================================================
  // SIMULATION 2: PHYSICS — PROJECTILE KINEMATICS & GRAVITY FIELDS
  // =========================================================================
  const [projAngle, setProjAngle] = useState<number>(45);
  const [projVelocity, setProjVelocity] = useState<number>(35);
  const [projGravity, setProjGravity] = useState<number>(9.8);
  const [isFiringProj, setIsFiringProj] = useState<boolean>(false);
  const projCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const projAnimFrameRef = useRef<number | null>(null);
  const projPathRef = useRef<{ x: number; y: number }[]>([]);

  const radProj = (projAngle * Math.PI) / 180;
  const flightTime = (2 * projVelocity * Math.sin(radProj)) / projGravity;
  const maxHeight = Math.pow(projVelocity * Math.sin(radProj), 2) / (2 * projGravity);
  const projRange = (Math.pow(projVelocity, 2) * Math.sin(2 * radProj)) / projGravity;

  const drawProjectileCanvas = (currentPoints: { x: number; y: number }[] = []) => {
    const canvas = projCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Deep space/field background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Ground plane
    const groundY = height - 50;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, width, 50);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Scale factor to fit inside canvas width
    const maxExpectedRange = 250;
    const scale = (width - 120) / maxExpectedRange;
    const originX = 50;
    const originY = groundY;

    // Cannon Barrel
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(-radProj);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -6, 32, 12);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(28, -7, 5, 14);
    ctx.restore();

    // Cannon Turret Base
    ctx.beginPath();
    ctx.arc(originX, originY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw theoretical parabolic trajectory (dashed)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let t = 0; t <= flightTime; t += 0.04) {
      const px = originX + projVelocity * Math.cos(radProj) * t * scale;
      const py = originY - (projVelocity * Math.sin(radProj) * t - 0.5 * projGravity * Math.pow(t, 2)) * scale;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Apex Indicator
    const apexX = originX + (projRange / 2) * scale;
    const apexY = originY - maxHeight * scale;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(apexX, apexY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`Apex: ${maxHeight.toFixed(1)}m`, apexX - 25, apexY - 8);

    // Landing marker
    const landX = originX + projRange * scale;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(landX, originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Range: ${projRange.toFixed(1)}m`, landX - 30, originY + 22);

    // Animated Cannonball Trail
    const pts = currentPoints.length > 0 ? currentPoints : projPathRef.current;
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

      const lastPt = pts[pts.length - 1];
      const ballX = originX + lastPt.x * scale;
      const ballY = originY - lastPt.y * scale;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const fireProjectile = () => {
    if (isFiringProj) return;
    setIsFiringProj(true);
    projPathRef.current = [];

    const startTime = performance.now();
    const timeScale = 0.9;

    const animate = (now: number) => {
      const elapsed = ((now - startTime) / 1000) * timeScale;
      const x = projVelocity * Math.cos(radProj) * elapsed;
      const y = Math.max(0, projVelocity * Math.sin(radProj) * elapsed - 0.5 * projGravity * Math.pow(elapsed, 2));

      projPathRef.current.push({ x, y });
      drawProjectileCanvas(projPathRef.current);

      if (elapsed < flightTime && y > 0) {
        projAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsFiringProj(false);
      }
    };

    projAnimFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    drawProjectileCanvas();
    return () => {
      if (projAnimFrameRef.current) cancelAnimationFrame(projAnimFrameRef.current);
    };
  }, [projAngle, projVelocity, projGravity]);

  // =========================================================================
  // SIMULATION 3: CHEMISTRY — MOLECULAR GAS KINETICS & PRESSURE (IDEAL GAS)
  // =========================================================================
  const [gasTemperature, setGasTemperature] = useState<number>(300); // Kelvin
  const [gasVolume, setGasVolume] = useState<number>(10); // Litres
  const [moleculeCount] = useState<number>(45);
  const chemistryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }[]>([]);

  const calculatedPressure = (0.0821 * moleculeCount * gasTemperature) / (gasVolume * 150);

  useEffect(() => {
    const canvas = chemistryCanvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const baseSpeed = Math.sqrt(gasTemperature / 300) * 1.8;
    particlesRef.current = Array.from({ length: moleculeCount }, () => ({
      x: 30 + Math.random() * (width - 60),
      y: 30 + Math.random() * (height - 60),
      vx: (Math.random() - 0.5) * baseSpeed * 2.5,
      vy: (Math.random() - 0.5) * baseSpeed * 2.5,
      radius: 4,
      color: gasTemperature > 450 ? '#ef4444' : gasTemperature > 250 ? '#06b6d4' : '#3b82f6'
    }));

    let animFrame: number;
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const containerWidth = 200 + (gasVolume / 20) * (width - 240);
      const containerLeft = (width - containerWidth) / 2;
      const containerTop = 30;
      const containerBottom = height - 30;

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(containerLeft, containerTop, containerWidth, containerBottom - containerTop);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(containerLeft, containerTop, containerWidth, containerBottom - containerTop);

      ctx.fillStyle = '#334155';
      ctx.fillRect(containerLeft + containerWidth - 10, containerTop, 10, containerBottom - containerTop);

      const speedScale = Math.sqrt(gasTemperature / 300);
      particlesRef.current.forEach(p => {
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;

        if (p.x - p.radius < containerLeft) {
          p.x = containerLeft + p.radius;
          p.vx = Math.abs(p.vx);
        } else if (p.x + p.radius > containerLeft + containerWidth - 10) {
          p.x = containerLeft + containerWidth - 10 - p.radius;
          p.vx = -Math.abs(p.vx);
        }

        if (p.y - p.radius < containerTop) {
          p.y = containerTop + p.radius;
          p.vy = Math.abs(p.vy);
        } else if (p.y + p.radius > containerBottom) {
          p.y = containerBottom - p.radius;
          p.vy = -Math.abs(p.vy);
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
      });

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [gasTemperature, gasVolume, moleculeCount]);

  // =========================================================================
  // SIMULATION 4: BIOLOGY — DNA DOUBLE HELIX & BASE PAIRING REPLICATION
  // =========================================================================
  const [dnaUnzipProgress, setDnaUnzipProgress] = useState<number>(40);
  const [selectedCodon, setSelectedCodon] = useState<string>('ATG');
  const dnaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const codonsMap: Record<string, { aminoAcid: string; hindi: string; role: string }> = {
    'ATG': { aminoAcid: 'Methionine (Start Codon)', hindi: 'मेथियोनाइन (प्रारंभ कोडॉन)', role: 'Signals initiation of protein translation' },
    'GAG': { aminoAcid: 'Glutamic Acid (Acidic)', hindi: 'ग्लूटामिक एसिड', role: 'Forms active catalytic enzyme pockets' },
    'TGG': { aminoAcid: 'Tryptophan (Aromatic)', hindi: 'ट्रिप्टोफैन', role: 'Essential neurotransmitter precursor' },
    'TAA': { aminoAcid: 'Ochre (Stop Codon)', hindi: 'स्टॉप कोडॉन', role: 'Terminates ribosome mRNA reading' },
  };

  useEffect(() => {
    const canvas = dnaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const steps = 24;
    const centerY = height / 2;
    const unzipSplitX = (width * dnaUnzipProgress) / 100;

    const basePairs = [
      { top: 'A', bot: 'T', colTop: '#ef4444', colBot: '#3b82f6', bonds: 2 },
      { top: 'G', bot: 'C', colTop: '#22c55e', colBot: '#eab308', bonds: 3 },
      { top: 'T', bot: 'A', colTop: '#3b82f6', colBot: '#ef4444', bonds: 2 },
      { top: 'C', bot: 'G', colTop: '#eab308', colBot: '#22c55e', bonds: 3 },
    ];

    for (let i = 0; i < steps; i++) {
      const x = 30 + (i / steps) * (width - 60);
      const phase = (i * Math.PI) / 4;
      const isUnzipped = x < unzipSplitX;

      const spread = isUnzipped ? 45 + (1 - x / unzipSplitX) * 35 : 30;
      const topY = centerY - Math.sin(phase) * spread - (isUnzipped ? 30 : 0);
      const botY = centerY + Math.sin(phase) * spread + (isUnzipped ? 30 : 0);

      const pair = basePairs[i % basePairs.length];

      if (!isUnzipped) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, botY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = pair.colTop;
      ctx.beginPath();
      ctx.arc(x, topY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pair.colBot;
      ctx.beginPath();
      ctx.arc(x, botY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(pair.top, x - 3, topY + 3);
      ctx.fillText(pair.bot, x - 3, botY + 3);
    }

    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(unzipSplitX, centerY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Helicase', unzipSplitX - 18, centerY + 3);
  }, [dnaUnzipProgress]);

  // =========================================================================
  // SIMULATION 5: CODE & ALGORITHMS — INTERACTIVE FLOWCHART STEPPER (BINARY SEARCH)
  // =========================================================================
  const [searchTarget, setSearchTarget] = useState<number>(42);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [algoArray] = useState<number[]>([12, 19, 24, 31, 38, 42, 56, 67, 78, 89, 95]);
  const [lowIdx, setLowIdx] = useState<number>(0);
  const [highIdx, setHighIdx] = useState<number>(10);
  const [midIdx, setMidIdx] = useState<number>(5);
  const [searchStatus, setSearchStatus] = useState<'running' | 'found' | 'not_found'>('running');

  const flowchartNodes = [
    { id: 0, labelEn: 'Start Binary Search', labelHi: 'बाइनरी सर्च प्रारंभ', code: 'low = 0, high = N - 1' },
    { id: 1, labelEn: 'Check Condition (low <= high)', labelHi: 'शर्त जांच: low <= high', code: 'while (low <= high)' },
    { id: 2, labelEn: 'Compute Midpoint Index', labelHi: 'मध्य सूचकांक की गणना', code: 'mid = Math.floor((low + high) / 2)' },
    { id: 3, labelEn: 'Compare arr[mid] == target', labelHi: 'तुलना: क्या arr[mid] == target?', code: 'if (arr[mid] === target)' },
    { id: 4, labelEn: 'Branch Left / Right Half', labelHi: 'आधे भाग में विभाजन', code: 'low = mid + 1 OR high = mid - 1' },
    { id: 5, labelEn: 'Target Found at Index', labelHi: 'लक्ष्य मिल गया (+Index)', code: 'return mid (Located)' },
  ];

  const resetBinarySearch = (newTarget: number = searchTarget) => {
    setSearchTarget(newTarget);
    setLowIdx(0);
    setHighIdx(algoArray.length - 1);
    setMidIdx(Math.floor((0 + algoArray.length - 1) / 2));
    setCurrentStepIndex(0);
    setSearchStatus('running');
  };

  const stepForwardBinarySearch = () => {
    if (searchStatus !== 'running') return;

    if (currentStepIndex === 0) {
      setCurrentStepIndex(1);
    } else if (currentStepIndex === 1) {
      if (lowIdx > highIdx) {
        setSearchStatus('not_found');
        return;
      }
      setCurrentStepIndex(2);
    } else if (currentStepIndex === 2) {
      const calculatedMid = Math.floor((lowIdx + highIdx) / 2);
      setMidIdx(calculatedMid);
      setCurrentStepIndex(3);
    } else if (currentStepIndex === 3) {
      if (algoArray[midIdx] === searchTarget) {
        setCurrentStepIndex(5);
        setSearchStatus('found');
      } else {
        setCurrentStepIndex(4);
      }
    } else if (currentStepIndex === 4) {
      if (algoArray[midIdx] < searchTarget) {
        setLowIdx(midIdx + 1);
      } else {
        setHighIdx(midIdx - 1);
      }
      setCurrentStepIndex(1);
    }
  };

  // =========================================================================
  // SIMULATION 6: POLITICS & CIVICS FLOWCHART — LEGISLATIVE BILL TO LAW
  // =========================================================================
  const [billStage, setBillStage] = useState<number>(2);
  const [isAmended, setIsAmended] = useState<boolean>(true);
  const [isJudiciallyReviewed, setIsJudiciallyReviewed] = useState<boolean>(false);

  const billFlowchartSteps = [
    {
      step: 0,
      titleEn: '1. Drafting & First Reading',
      titleHi: '1. मसौदा एवं प्रथम वाचन',
      descEn: 'Introduction of the proposed Legislative Bill in Parliament by Ministers or MPs.',
      descHi: 'संसद में मंत्रियों अथवा सांसदों द्वारा प्रस्तावित विधेयक का प्रस्तुतीकरण।',
      actors: 'Ministry, Law Commission'
    },
    {
      step: 1,
      titleEn: '2. Standing Committee Scrutiny',
      titleHi: '2. स्थायी समिति समीक्षा',
      descEn: 'Department-related Standing Committee examines public submissions, constitutional sanity, and financial implications.',
      descHi: 'संसदीय समिति द्वारा जन-सुझाव, संवैधानिक वैधता और वित्तीय प्रभावों की विस्तृत जांच।',
      actors: 'Bipartisan Parliamentary Committee'
    },
    {
      step: 2,
      titleEn: '3. Second Reading & Clause Debate',
      titleHi: '3. द्वितीय वाचन एवं खंडवार बहस',
      descEn: 'Clause-by-clause voting, proposed amendments accepted or voted down by voice and division votes.',
      descHi: 'प्रत्येक धारा पर खुली बहस, सांसदों द्वारा संशोधन प्रस्ताव एवं मत-विभाजन।',
      actors: 'House of the People (Lok Sabha / Commons)'
    },
    {
      step: 3,
      titleEn: '4. Upper House Concurrence',
      titleHi: '4. उच्च सदन सहमति',
      descEn: 'Transmitted to Rajya Sabha / Senate. Reviewed, passed with or without recommended changes.',
      descHi: 'राज्य सभा / सीनेट द्वारा संघीय हितों की रक्षा और अंतिम सहमति।',
      actors: 'Council of States (Rajya Sabha / Senate)'
    },
    {
      step: 4,
      titleEn: '5. Presidential / Royal Assent',
      titleHi: '5. राष्ट्रपति / संप्रभु की स्वीकृति',
      descEn: 'Formal executive signing. Bill becomes an Act of Parliament and is gazetted into law.',
      descHi: 'राष्ट्रपति के हस्ताक्षर के साथ विधेयक आधिकारिक अधिनियम बनकर सरकारी गजट में अधिसूचित होता है।',
      actors: 'Head of State (President)'
    },
    {
      step: 5,
      titleEn: '6. Judicial Review & Constitutional Scrutiny',
      titleHi: '6. न्यायिक समीक्षा (Judicial Review)',
      descEn: 'Supreme Court tests the Act against Fundamental Rights and the Basic Structure Doctrine.',
      descHi: 'सर्वोच्च न्यायालय द्वारा मूल अधिकारों और संविधान के मूल ढांचे के आलोक में वैधता का परीक्षण।',
      actors: 'Supreme Court Constitutional Bench'
    }
  ];

  // =========================================================================
  // SIMULATION 7: HISTORY TIMELINE FLOWCHART — GLOBAL CIVILIZATIONAL LEAP
  // =========================================================================
  const [selectedEraIndex, setSelectedEraIndex] = useState<number>(3);

  const historyMilestones = [
    {
      id: 'ancient',
      period: 'c. 3000 – 600 BCE',
      titleEn: 'Urbanization & Metallurgical Surpluses',
      titleHi: 'नगरीकरण एवं धातुकर्म क्रांति',
      location: 'Indus Valley, Mesopotamia, Nile & Yellow River',
      causeEn: 'Irrigation agriculture generated caloric surplus, enabling specialized craftspeople, standardized weights, and civic architecture.',
      causeHi: 'सिंचाई आधारित कृषि ने अधिशेष भोजन पैदा किया, जिससे शिल्पकार, मानकीकृत माप-तौल और नगर नियोजन संभव हुआ।',
      catalysts: ['Harappan Grid Cities', 'Bronze Smelting', 'Cuneiform & Brahmi Scripts']
    },
    {
      id: 'classical',
      period: 'c. 500 BCE – 400 CE',
      titleEn: 'Silk Road & Philosophical Codification',
      titleHi: 'रेशम मार्ग एवं दार्शनिक युग',
      location: 'Magadha, Hellenic Mediterranean, Han Dynasty, Rome',
      causeEn: 'Cross-continental overland trade routes fostered philosophical syntheses: Buddhist logic, Greek geometry, and Roman civil jurisprudence.',
      causeHi: 'महाद्वीपीय व्यापार मार्गों ने बौद्ध दर्शन, यूनानी ज्यामिति और विधिशास्त्र का परस्पर आदान-प्रदान सुगम बनाया।',
      catalysts: ['Aryabhata & Zero System', 'Silk Road Caravans', 'Alexandrian Library']
    },
    {
      id: 'islamic-medieval',
      period: 'c. 750 – 1400 CE',
      titleEn: 'Golden Age of Translation & Algebra',
      titleHi: 'अनुवाद एवं बीजगणित का स्वर्ण युग',
      location: 'Baghdad (House of Wisdom), Nalanda, Cordoba',
      causeEn: 'Systematic preservation and advancement of Indian trigonometry, Persian astronomy, and Arabic algebraic mathematics.',
      causeHi: 'भारतीय त्रिकोणमिति और यूनानी ज्ञान का संरक्षण एवं अल-ख्वारिज्मी द्वारा बीजगणित का व्यवस्थित विकास।',
      catalysts: ['Al-Jabr (Algebra)', 'Optics Treatises (Alhazen)', 'Nalanda Monastic University']
    },
    {
      id: 'scientific-rev',
      period: 'c. 1543 – 1780 CE',
      titleEn: 'Scientific Revolution & The Printing Press',
      titleHi: 'वैज्ञानिक क्रांति एवं मुद्रण क्रांति',
      location: 'Europe & Global Trading Ports',
      causeEn: 'Empirical experimentation supplanted dogmatic authority; movable type decentralized scientific debate; calculus formalized mechanics.',
      causeHi: 'वैज्ञानिक प्रयोगों ने स्थापित रूढ़िवादिता को चुनौती दी; चल-टाइप मुद्रण ने ज्ञान के प्रसार को जन-सुलभ बनाया।',
      catalysts: ['Newtonian Mechanics', 'Gutenberg Press', 'Heliocentric Astronomy']
    },
    {
      id: 'industrial',
      period: 'c. 1760 – 1914 CE',
      titleEn: 'Thermodynamics & Industrial Mechanization',
      titleHi: 'ऊष्मागतिकी एवं औद्योगिक यंत्रीकरण',
      location: 'Britain, Western Europe, North America, Global Railways',
      causeEn: 'Fossil fuel energy engines transformed human muscle and beast labor into gigawatt steam power, spawning global transit networks.',
      causeHi: 'भाप के इंजन ने मानवीय श्रम को तीव्र यंत्रीकृत ऊर्जा में बदलकर वैश्विक रेलमार्गों और कारखानों की नींव रखी।',
      catalysts: ['Watt Steam Engine', 'Maxwell Electromagnetism', 'Telegraph Network']
    },
    {
      id: 'digital-ai',
      period: '1947 CE – Present',
      titleEn: 'Silicon Transistors, Internet & Cognitive AI',
      titleHi: 'सिलिकॉन ट्रांजिस्टर, इंटरनेट एवं स्वायत्त एआई',
      location: 'Global Digital Web',
      causeEn: 'Information theory and semiconductor lithography compressed knowledge exchange latency to zero, enabling planetary real-time learning.',
      causeHi: 'सूचना सिद्धांत और सेमीकंडक्टर क्रांति ने ज्ञान प्रसार के समय को शून्य कर वैश्विक डिजिटल समाज की रचना की।',
      catalysts: ['Turing Computing', 'Fiber Optics & Web', 'Large Language Models']
    }
  ];

  // =========================================================================
  // SIMULATION 8: GLOBAL ECONOMICS — MACRO TRADE, CENTRAL BANK & INFLATION
  // =========================================================================
  const [interestRate, setInterestRate] = useState<number>(4.5);
  const [supplyChainFriction, setSupplyChainFriction] = useState<number>(25);
  const [energyPriceIndex, setEnergyPriceIndex] = useState<number>(110);

  const calculatedInflation = (2.2 + (supplyChainFriction * 0.05) + ((energyPriceIndex - 100) * 0.04) - (interestRate * 0.45)).toFixed(2);
  const calculatedGdpGrowth = (4.8 - (interestRate * 0.35) - (supplyChainFriction * 0.03)).toFixed(2);
  const calculatedUnemployment = (3.5 + (interestRate * 0.28) + (supplyChainFriction * 0.01)).toFixed(2);
  const calculatedFxStrength = (100 + (interestRate * 3.8) - (parseFloat(calculatedInflation) * 2.1)).toFixed(1);

  return (
    <div className="space-y-12 pb-20 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO INTRO BANNER */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-indigo-500/20 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'hi' ? 'वेयरा लाइव सिमुलेशन श्रृंखला' : 'Veyra Live Simulation Series'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {language === 'hi'
              ? 'इंटरैक्टिव सिमुलेशन एवं फ्लोचार्ट्स'
              : 'Interactive Simulations & Dynamic Flowcharts'}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl font-devanagari">
            {language === 'hi'
              ? 'सभी सिमुलेशन और फ्लोचार्ट्स नीचे क्रमबद्ध रूप से प्रस्तुत हैं। बिना किसी क्लिक या टैब के, सीधे स्क्रॉल करें और प्रकाशिकी, प्रक्षेप्य गति, गैस अणु, डीएनए, कोडिंग फ्लोचार्ट, संसद में कानून निर्माण, इतिहास की समय-रेखा तथा वैश्विक अर्थशास्त्र का सीधा अनुभव प्राप्त करें।'
              : 'All 8 interactive simulations and dynamic flowcharts are displayed sequentially below. Scroll through each live laboratory to experiment with ray optics, projectile mechanics, gas molecules, DNA replication, algorithmic flowcharts, constitutional governance, world historical transitions, and global macroeconomics.'}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STICKY QUICK JUMP ANCHOR STRIP */}
      {/* ========================================================================= */}
      <nav className="sticky top-16 z-30 py-2.5 px-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="font-bold text-slate-400 font-mono text-[11px] shrink-0 uppercase mr-1">
            {language === 'hi' ? 'त्वरित जंप:' : 'Jump to:'}
          </span>
          {[
            { id: 'sim-optics', labelEn: '1. Optics Refraction', labelHi: '1. प्रकाशिकी अपवर्तन' },
            { id: 'sim-projectile', labelEn: '2. Kinematics Projectile', labelHi: '2. प्रक्षेप्य गति' },
            { id: 'sim-gas', labelEn: '3. Gas Kinetics (PV=nRT)', labelHi: '3. गैस गतिज (PV=nRT)' },
            { id: 'sim-dna', labelEn: '4. DNA Helicase', labelHi: '4. डीएनए हेलीकेस' },
            { id: 'sim-algo', labelEn: '5. Algo Flowchart', labelHi: '5. एल्गोरिदम फ्लोचार्ट' },
            { id: 'sim-civics', labelEn: '6. Civics Law Flowchart', labelHi: '6. नागरिक शास्त्र विधेयक' },
            { id: 'sim-history', labelEn: '7. History Timeline', labelHi: '7. इतिहास समय-रेखा' },
            { id: 'sim-economics', labelEn: '8. Global Economics', labelHi: '8. वैश्विक अर्थशास्त्र' },
          ].map(anchor => (
            <button
              key={anchor.id}
              onClick={() => scrollToSim(anchor.id)}
              className="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all text-[11px]"
            >
              {language === 'hi' ? anchor.labelHi : anchor.labelEn}
            </button>
          ))}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. SIMULATIONS IN SERIES (ALL VISIBLE DIRECTLY) */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 1: PHYSICS RAY OPTICS & DISPERSION */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-optics" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                LAB 01 • PHYSICS • RAY OPTICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Snell's Law: n₁·sin(θ₁) = n₂·sin(θ₂)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'प्रकाश अपवर्तन, पूर्ण आंतरिक परावर्तन एवं वर्ण-विक्षेपण' : 'Optical Refraction, Total Internal Reflection & Dispersion'}
            </h2>
          </div>
          <button
            onClick={() => {
              setIncidenceAngle(45);
              setRefractiveIndexN2(1.5);
              setMediumLabel('Crown Glass (n = 1.50)');
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-[#090D16]">
            <canvas
              ref={opticsCanvasRef}
              width={700}
              height={380}
              className="w-full h-auto block"
            />
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'नियंत्रक पैरामीटर' : 'Optic Parameters'}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'आपतन कोण (θ₁)' : 'Incidence Angle (θ₁)'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                  {incidenceAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                value={incidenceAngle}
                onChange={e => setIncidenceAngle(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                <span>0° ({language === 'hi' ? 'अभिलंब' : 'Normal'})</span>
                <span className="text-amber-500">{language === 'hi' ? 'क्रांतिक' : 'Critical'}: {criticalAngle.toFixed(1)}°</span>
                <span>85°</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'hi' ? 'माध्यम 2 (n₂)' : 'Target Medium 2 (n₂)'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { nameEn: 'Water', nameHi: 'जल', n: 1.33, label: 'Water (n = 1.33)' },
                  { nameEn: 'Crown Glass', nameHi: 'क्राउन ग्लास', n: 1.50, label: 'Crown Glass (n = 1.50)' },
                  { nameEn: 'Flint Glass', nameHi: 'फ्लिंट ग्लास', n: 1.66, label: 'Flint Glass (n = 1.66)' },
                  { nameEn: 'Diamond', nameHi: 'हीरा (Diamond)', n: 2.42, label: 'Diamond (n = 2.42)' }
                ].map(m => (
                  <button
                    key={m.nameEn}
                    onClick={() => {
                      setRefractiveIndexN2(m.n);
                      setMediumLabel(m.label);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      refractiveIndexN2 === m.n
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {language === 'hi' ? m.nameHi : m.nameEn} <span className="font-mono text-[10px] text-slate-400">({m.n})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'वर्ण-विक्षेपण (Dispersion)' : 'Wavelength Dispersion'}
              </span>
              <button
                onClick={() => setShowDispersion(!showDispersion)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  showDispersion ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {showDispersion ? (language === 'hi' ? 'सक्रिय' : 'Enabled') : (language === 'hi' ? 'निष्क्रिय' : 'Off')}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{language === 'hi' ? 'अपवर्तन कोण (θ₂):' : 'Refracted Angle (θ₂):'}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {isTotalInternalReflection ? (language === 'hi' ? 'पूर्ण आंतरिक परावर्तन' : 'Total Internal Reflection') : `${refractionAngle.toFixed(2)}°`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{language === 'hi' ? 'फेज गति (v):' : 'Phase Speed (v):'}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {(3e8 / refractiveIndexN2 / 1e8).toFixed(2)} × 10⁸ m/s
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 2: PHYSICS PROJECTILE KINEMATICS */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-projectile" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                LAB 02 • PHYSICS • CLASSICAL MECHANICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Range: R = u²·sin(2θ)/g</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'प्रक्षेप्य गति एवं गुरुत्वाकर्षण क्षेत्र सॉल्वर' : 'Projectile Kinematics & Planetary Gravity Simulator'}
            </h2>
          </div>
          <button
            onClick={fireProjectile}
            disabled={isFiringProj}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isFiringProj ? (language === 'hi' ? 'उड़ान में...' : 'In Flight...') : (language === 'hi' ? 'प्रक्षेपण करें (Fire Cannon)' : 'Fire Cannon')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-[#090D16]">
            <canvas
              ref={projCanvasRef}
              width={700}
              height={380}
              className="w-full h-auto block"
            />
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'प्रक्षेपण नियंत्रण' : 'Launch Controls'}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'प्रक्षेपण कोण (θ)' : 'Launch Angle (θ)'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                  {projAngle}°
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                value={projAngle}
                onChange={e => setProjAngle(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'प्रारंभिक वेग (u)' : 'Launch Speed (u)'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                  {projVelocity} m/s
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="55"
                value={projVelocity}
                onChange={e => setProjVelocity(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'hi' ? 'गुरुत्वाकर्षण क्षेत्र (g)' : 'Gravitational Field (g)'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { nameEn: 'Earth', nameHi: 'पृथ्वी', g: 9.8 },
                  { nameEn: 'Moon', nameHi: 'चंद्रमा', g: 1.6 },
                  { nameEn: 'Mars', nameHi: 'मंगल', g: 3.7 },
                ].map(p => (
                  <button
                    key={p.nameEn}
                    onClick={() => setProjGravity(p.g)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      projGravity === p.g
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {language === 'hi' ? p.nameHi : p.nameEn} <span className="font-mono text-[9px] block text-slate-400">{p.g} m/s²</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">{language === 'hi' ? 'अधिकतम ऊंचाई' : 'Max Height'}</span>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{maxHeight.toFixed(1)} m</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">{language === 'hi' ? 'उड्डयन काल' : 'Flight Time'}</span>
                <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{flightTime.toFixed(1)} s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 3: CHEMISTRY MOLECULAR GAS KINETICS */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-gas" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                LAB 03 • CHEMISTRY • THERMODYNAMICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">P·V = n·R·T</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'आणविक गैस गतिज सिद्धांत एवं मैक्सवेल-बोल्ट्ज़मान गैस नियम' : 'Molecular Gas Kinetics & Maxwell-Boltzmann Pressure'}
            </h2>
          </div>
          <button
            onClick={() => {
              setGasTemperature(300);
              setGasVolume(10);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-[#090D16]">
            <canvas
              ref={chemistryCanvasRef}
              width={700}
              height={380}
              className="w-full h-auto block"
            />
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'थर्मोडायनामिक नियंत्रण' : 'Thermodynamic Controls'}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'तापमान (T in Kelvin)' : 'Temperature (T)'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                  {gasTemperature} K
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="650"
                value={gasTemperature}
                onChange={e => setGasTemperature(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                <span>100 K ({language === 'hi' ? 'शीतल' : 'Cold'})</span>
                <span>300 K ({language === 'hi' ? 'सामान्य' : 'Room'})</span>
                <span className="text-rose-500">650 K ({language === 'hi' ? 'उच्च ऊर्जा' : 'High Energy'})</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'आयतन (Chamber Volume V)' : 'Chamber Volume (V)'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                  {gasVolume} L
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                value={gasVolume}
                onChange={e => setGasVolume(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                {language === 'hi' ? 'गणना किया गया दबाव (Pressure)' : 'Calculated Chamber Pressure (P)'}
              </span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {calculatedPressure.toFixed(2)} <span className="text-xs text-slate-400 font-normal">atm</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {calculatedPressure > 1.2
                  ? (language === 'hi' ? 'दीवारों से अणुओं की तीव्र टक्करों के कारण उच्च दबाव उत्पन्न होता है।' : 'High wall collision frequency leads to elevated macroscopic pressure.')
                  : (language === 'hi' ? 'कम गतिज ऊर्जा के कारण प्रति टक्कर संवेग हस्तांतरण घट जाता है।' : 'Low molecular kinetic energy reduces momentum transfer per wall collision.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 4: BIOLOGY DNA REPLICATION */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-dna" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                LAB 04 • BIOLOGY • MOLECULAR GENETICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">A=T (2 H-Bonds) | G≡C (3 H-Bonds)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'डीएनए हेलिक्स प्रतिकृति, हेलीकेस विखंडन एवं जेनेटिक कोडॉन' : 'DNA Helicase Replication Fork & mRNA Codon Reader'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-[#090D16]">
            <canvas
              ref={dnaCanvasRef}
              width={700}
              height={380}
              className="w-full h-auto block"
            />
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'एंजाइम नियंत्रण' : 'Enzyme Controls'}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'हेलीकेस विखंडन प्रगति' : 'Helicase Unzipping Progress'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50">
                  {dnaUnzipProgress}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={dnaUnzipProgress}
                onChange={e => setDnaUnzipProgress(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'hi' ? 'कोडॉन ट्रांसलेशन इंस्पेक्टर' : 'Codon Inspector'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(codonsMap).map(codon => (
                  <button
                    key={codon}
                    onClick={() => setSelectedCodon(codon)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                      selectedCodon === codon
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-mono text-sm">{codon}</div>
                    <div className="text-[10px] text-slate-400 truncate">{codonsMap[codon].aminoAcid.split(' ')[0]}</div>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 mt-2">
                <div className="font-bold text-xs text-purple-600 dark:text-purple-400">
                  {language === 'hi' ? codonsMap[selectedCodon].hindi : codonsMap[selectedCodon].aminoAcid}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {codonsMap[selectedCodon].role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 5: CODE & ALGORITHMS FLOWCHART */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-algo" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                LAB 05 • COMPUTER SCIENCE • ALGORITHMIC FLOWCHART
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Time Complexity: O(log N)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'बाइनरी सर्च एल्गोरिदम का इंटरैक्टिव फ्लोचार्ट एवं निष्पादन' : 'Binary Search Live Algorithm Flowchart & State Stepper'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetBinarySearch()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'पुनरारंभ' : 'Restart'}</span>
            </button>
            <button
              onClick={stepForwardBinarySearch}
              disabled={searchStatus !== 'running'}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'अगला कदम (Step Next)' : 'Step Forward'}</span>
            </button>
          </div>
        </div>

        {/* Sorted Array Visualizer */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SORTED ARRAY [N = 11]</span>
            <span className="text-blue-400 font-bold">Target Value: {searchTarget}</span>
          </div>
          <div className="grid grid-cols-11 gap-1.5">
            {algoArray.map((val, idx) => {
              const isMid = idx === midIdx;
              const isLow = idx === lowIdx;
              const isHigh = idx === highIdx;
              const isEliminated = idx < lowIdx || idx > highIdx;
              const isTargetFound = searchStatus === 'found' && idx === midIdx;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    isTargetFound
                      ? 'bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-300 font-black'
                      : isMid
                      ? 'bg-blue-600 text-white border-blue-400 font-extrabold shadow-lg'
                      : isEliminated
                      ? 'bg-slate-800/40 text-slate-600 border-slate-800/80 line-through'
                      : 'bg-slate-800 text-slate-200 border-slate-700 font-bold'
                  }`}
                >
                  <div className="text-xs font-mono">{val}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">
                    {isMid ? 'MID' : isLow ? 'LOW' : isHigh ? 'HIGH' : `[${idx}]`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flowchart Nodes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            {language === 'hi' ? 'फ्लोचार्ट निष्पादन नोड्स' : 'Flowchart Execution Nodes'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {flowchartNodes.map(node => {
              const isActive = currentStepIndex === node.id;
              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-2xl border transition-all relative ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-500 animate-ping" />
                  )}
                  <span className="text-[10px] font-mono text-slate-400 font-bold">NODE {node.id + 1}</span>
                  <div className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                    {language === 'hi' ? node.labelHi : node.labelEn}
                  </div>
                  <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block mt-2 bg-blue-500/10 p-1 rounded">
                    {node.code}
                  </code>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 6: POLITICS & CIVICS FLOWCHART */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-civics" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                LAB 06 • CIVICS & CONSTITUTIONAL LAW • STATUTORY FLOWCHART
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Articles 107–111 & Judicial Review</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'संसद में कानून बनने का संवैधानिक प्रवाह (Bill to Act Flowchart)' : 'Constitutional Flowchart: How a Legislative Bill Becomes Law'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {billFlowchartSteps.map((step, idx) => {
              const isSelected = billStage === idx;
              const isCompleted = billStage > idx;

              return (
                <div
                  key={step.step}
                  onClick={() => setBillStage(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 shadow-md ring-2 ring-amber-500/40'
                      : isCompleted
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                    isCompleted ? 'bg-emerald-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {language === 'hi' ? step.titleHi : step.titleEn}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
                      {language === 'hi' ? step.descHi : step.descEn}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block pt-1">
                      Actors: {step.actors}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'संवैधानिक संतुलन' : 'Constitutional Triad'}
            </h3>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{language === 'hi' ? 'विधायिका (Legislature)' : 'Legislature'}</span>
                <span className="text-amber-500">{language === 'hi' ? 'मसौदा एवं बहस' : 'Drafts & Debates'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{language === 'hi' ? 'कार्यपालिका (Executive)' : 'Executive'}</span>
                <span className="text-emerald-500">{language === 'hi' ? 'स्वीकृति एवं अधिसूचना' : 'Assent & Promulgation'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{language === 'hi' ? 'न्यायपालिका (Judiciary)' : 'Judiciary'}</span>
                <span className="text-blue-500">{language === 'hi' ? 'न्यायिक समीक्षा (मूल ढांचा)' : 'Judicial Review (Ultra Vires)'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'hi' ? 'संविधान पीठ परिदृश्य' : 'Constitutional Branch Scenarios'}
              </span>
              <button
                onClick={() => setIsAmended(!isAmended)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                  isAmended
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {isAmended 
                  ? (language === 'hi' ? '✓ समिति के संशोधन सम्मिलित' : '✓ Committee Amendments Incorporated') 
                  : (language === 'hi' ? '○ बिना संशोधन के पारित' : '○ Passed Without Amendments')}
              </button>

              <button
                onClick={() => setIsJudiciallyReviewed(!isJudiciallyReviewed)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                  isJudiciallyReviewed
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {isJudiciallyReviewed 
                  ? (language === 'hi' ? '✓ संविधान के मूल ढांचे के तहत परीक्षित' : '✓ Tested Under Basic Structure Doctrine') 
                  : (language === 'hi' ? '○ न्यायिक समीक्षा याचिका की प्रतीक्षा' : '○ Awaiting Judicial Petition')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 7: HISTORY TIMELINE FLOWCHART */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-history" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                LAB 07 • GLOBAL CIVILIZATIONS • CAUSAL FLOWCHART
              </span>
              <span className="text-[10px] text-slate-400 font-mono">From Caloric Surplus to Silicon AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'विश्व इतिहास की कारण-प्रभाव समय-रेखा (Civilizational Leap)' : 'World History Causal Timeline: How Humanity Scaled Knowledge'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {historyMilestones.map((milestone, idx) => {
            const isSelected = selectedEraIndex === idx;
            return (
              <button
                key={milestone.id}
                onClick={() => setSelectedEraIndex(idx)}
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 ring-2 ring-rose-500/50 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-mono text-rose-500 font-bold block">{milestone.period}</span>
                <div className="font-bold text-xs text-slate-900 dark:text-white mt-1 line-clamp-2">
                  {language === 'hi' ? milestone.titleHi : milestone.titleEn}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">
                {historyMilestones[selectedEraIndex].period} • {historyMilestones[selectedEraIndex].location}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {language === 'hi' ? historyMilestones[selectedEraIndex].titleHi : historyMilestones[selectedEraIndex].titleEn}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-devanagari">
            {language === 'hi' ? historyMilestones[selectedEraIndex].causeHi : historyMilestones[selectedEraIndex].causeEn}
          </p>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              {language === 'hi' ? 'युगांतरकारी उत्प्रेरक (Catalysts):' : 'Civilizational Catalysts:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {historyMilestones[selectedEraIndex].catalysts.map(cat => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  ★ {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* SERIES ITEM 8: GLOBAL ECONOMICS SIMULATOR */}
      {/* ------------------------------------------------------------------------- */}
      <section id="sim-economics" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-card space-y-6 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                LAB 08 • MACROECONOMICS • GLOBAL MONETARY DYNAMICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Taylor Rule & Supply Shock Modeling</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {language === 'hi' ? 'वैश्विक समष्टि अर्थशास्त्र: केंद्रीय बैंक ब्याज दरें, आपूर्ति श्रृंखला एवं मुद्रास्फीति' : 'Global Macroeconomics: Central Bank Rates, FX & Inflation Shocks'}
            </h2>
          </div>
          <button
            onClick={() => {
              setInterestRate(4.5);
              setSupplyChainFriction(25);
              setEnergyPriceIndex(110);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-1">
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                {language === 'hi' ? 'वैश्विक मुद्रास्फीति दर' : 'Global Inflation Rate'}
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {calculatedInflation}%
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === 'hi' ? 'ऊर्जा मूल्य सूचकांक और आपूर्ति श्रृंखला व्यवधान बनाम मौद्रिक सख्ती द्वारा संचालित।' : 'Driven by energy price indices and supply chain friction vs monetary tightening.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                {language === 'hi' ? 'वार्षिक वास्तविक जीडीपी वृद्धि' : 'Annual Real GDP Growth'}
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {calculatedGdpGrowth}%
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === 'hi' ? 'उच्च ब्याज दरें व्यावसायिक पूंजी निवेश और उपभोक्ता खर्च को धीमा करती हैं।' : 'High interest rates dampen commercial capital investments and consumer spending.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                {language === 'hi' ? 'बेरोजगारी दर' : 'Unemployment Rate'}
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {calculatedUnemployment}%
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === 'hi' ? 'मुद्रास्फीति नियंत्रण और रोजगार सृजन के बीच फिलिप्स वक्र संतुलन।' : 'Phillips curve equilibrium trade-off between disinflation and labor hiring.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                {language === 'hi' ? 'विदेशी मुद्रा भंडार सूचकांक' : 'Reserve FX Index'}
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {calculatedFxStrength}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === 'hi' ? 'अंतरराष्ट्रीय पूंजी प्रवाह उच्च जोखिम-समायोजित सरकारी बॉन्ड प्रतिफल की ओर आकर्षित होता है।' : 'Cross-border capital inflows chase higher risk-adjusted sovereign bond yields.'}
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {language === 'hi' ? 'वैश्विक मैक्रो स्लाइडर्स' : 'Macro Policy Levers'}
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'केंद्रीय बैंक नीति दर (Repo)' : 'Central Bank Policy Rate'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50">
                  {interestRate}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.25"
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'सप्लाई चेन व्यवधान' : 'Supply Chain Bottlenecks'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50">
                  {supplyChainFriction}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={supplyChainFriction}
                onChange={e => setSupplyChainFriction(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'ऊर्जा एवं कच्चा तेल सूचकांक' : 'Energy & Crude Oil Index'}
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50">
                  {energyPriceIndex}
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="180"
                value={energyPriceIndex}
                onChange={e => setEnergyPriceIndex(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
