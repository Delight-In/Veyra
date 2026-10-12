import React, { useState } from 'react';
import { 
  GitBranch, ZoomIn, ZoomOut, RotateCcw, Play, CheckCircle2, 
  ChevronRight, ChevronLeft, ArrowDown, Sparkles, Layers, Compass 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FlowchartViewerProps {
  flowchartData?: {
    mermaidCode?: string;
    caption?: string;
    flowchartType?: string;
  };
  nodeTitle: string;
}

interface FlowStep {
  id: string;
  stepNumber: number;
  label: string;
  type: 'start' | 'process' | 'decision' | 'output' | 'finish';
  description: string;
  branchYes?: string;
  branchNo?: string;
}

const DEFAULT_STEPS_EN: FlowStep[] = [
  {
    id: 's1',
    stepNumber: 1,
    label: 'Initial State & Observations',
    type: 'start',
    description: 'Define boundary conditions, identify known parameters and coordinates.'
  },
  {
    id: 's2',
    stepNumber: 2,
    label: 'Theoretical Law Formulation',
    type: 'process',
    description: 'Apply governing conservation laws or algorithmic equations to the system.'
  },
  {
    id: 's3',
    stepNumber: 3,
    label: 'Equilibrium / Threshold Test',
    type: 'decision',
    description: 'Check if constraint boundary condition is satisfied (Condition: F_net == 0 or Val >= Threshold).',
    branchYes: 'Proceed to Stable Solution',
    branchNo: 'Iterate with Differential Delta'
  },
  {
    id: 's4',
    stepNumber: 4,
    label: 'Compute Vector Trajectory',
    type: 'process',
    description: 'Integrate acceleration over time to compute exact velocity and displacement coordinates.'
  },
  {
    id: 's5',
    stepNumber: 5,
    label: 'Optimal Convergence & Output',
    type: 'finish',
    description: 'Verify conservation of momentum/energy and render final state coordinates.'
  }
];

const DEFAULT_STEPS_HI: FlowStep[] = [
  {
    id: 's1',
    stepNumber: 1,
    label: 'प्रारंभिक स्थिति एवं अवलोकन',
    type: 'start',
    description: 'सीमा शर्तें परिभाषित करें, ज्ञात पैरामीटर और निर्देशांक पहचानें।'
  },
  {
    id: 's2',
    stepNumber: 2,
    label: 'सैद्धांतिक नियम सूत्र निरूपण',
    type: 'process',
    description: 'सिस्टम पर नियंत्रणकारी संरक्षण नियम अथवा गणितीय समीकरण लागू करें।'
  },
  {
    id: 's3',
    stepNumber: 3,
    label: 'संतुलन / सीमा परीक्षण',
    type: 'decision',
    description: 'जांचें कि सीमा शर्त संतुष्ट है (शर्त: F_net == 0 या मान >= थ्रेशोल्ड)।',
    branchYes: 'स्थिर समाधान की ओर बढ़ें',
    branchNo: 'डिफरेंशियल डेल्टा के साथ पुनरावृत्ति करें'
  },
  {
    id: 's4',
    stepNumber: 4,
    label: 'वेक्टर प्रक्षेपवक्र की गणना',
    type: 'process',
    description: 'सटीक वेग और विस्थापन निर्देशांक प्राप्त करने हेतु समय के साथ त्वरण का समाकलन करें।'
  },
  {
    id: 's5',
    stepNumber: 5,
    label: 'इष्टतम अभिसरण एवं अंतिम आउटपुट',
    type: 'finish',
    description: 'संवेग एवं ऊर्जा संरक्षण को सत्यापित करें और अंतिम स्थिति प्रस्तुत करें।'
  }
];

function parseMermaidToSteps(mermaid?: string, isHindi: boolean = false): FlowStep[] {
  const defaultSteps = isHindi ? DEFAULT_STEPS_HI : DEFAULT_STEPS_EN;
  if (!mermaid || !mermaid.trim()) return defaultSteps;

  const lines = mermaid.split('\n');
  const nodeMap = new Map<string, { label: string; type: FlowStep['type']; branchYes?: string; branchNo?: string }>();
  const connections: { from: string; to: string; label?: string }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('graph') || line.startsWith('%%') || line.startsWith('flowchart')) continue;

    // Match node definitions with bracket types:
    // Decision: Node{Label}
    // Terminal: Node([Label]) or Node((Label))
    // Process: Node[Label] or Node(Label)
    const nodeRegex = /([A-Za-z0-9_]+)(?:\[\((.*?)\)\]|\(\[(.*?)\]\)|\(\((.*?)\)\)|\{(.*?)\}|\[(.*?)\]|\((.*?)\))/g;
    let match;
    while ((match = nodeRegex.exec(line)) !== null) {
      const id = match[1];
      const label = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || id;
      let type: FlowStep['type'] = 'process';

      if (match[5] !== undefined) {
        // {...}
        type = 'decision';
      } else if (match[3] !== undefined || match[4] !== undefined) {
        // ([...]) or ((...))
        type = label.toLowerCase().includes('start') || label.toLowerCase().includes('initial') || label.includes('प्रारंभ') ? 'start' : 'finish';
      } else if (label.toLowerCase().includes('return') || label.toLowerCase().includes('output') || label.toLowerCase().includes('finish') || label.toLowerCase().includes('end') || label.includes('समाप्त')) {
        type = 'finish';
      }

      if (!nodeMap.has(id)) {
        nodeMap.set(id, { label, type });
      }
    }

    // Match connections: A --> B, A -- Yes --> B, A -->|Yes| B
    const connMatch = line.match(/([A-Za-z0-9_]+)\s*(?:--\s*(.*?)\s*-->|-->\|(.*?)\||-->)\s*([A-Za-z0-9_]+)/);
    if (connMatch) {
      const from = connMatch[1];
      const edgeLabel = connMatch[2] || connMatch[3];
      const to = connMatch[4];
      connections.push({ from, to, label: edgeLabel });

      if (edgeLabel && nodeMap.has(from)) {
        const node = nodeMap.get(from)!;
        if (edgeLabel.toLowerCase().includes('yes') || edgeLabel.toLowerCase().includes('true') || edgeLabel.includes('हाँ')) {
          node.branchYes = isHindi ? `आगे बढ़ें: ${nodeMap.get(to)?.label || to}` : `Proceed to: ${nodeMap.get(to)?.label || to}`;
        } else if (edgeLabel.toLowerCase().includes('no') || edgeLabel.toLowerCase().includes('false') || edgeLabel.includes('नहीं')) {
          node.branchNo = isHindi ? `पुनरावृत्ति: ${nodeMap.get(to)?.label || to}` : `Branch to: ${nodeMap.get(to)?.label || to}`;
        }
      }
    }
  }

  if (nodeMap.size === 0) return defaultSteps;

  const parsedSteps: FlowStep[] = [];
  let stepNum = 1;
  nodeMap.forEach((val, id) => {
    parsedSteps.push({
      id,
      stepNumber: stepNum++,
      label: val.label,
      type: val.type,
      description: val.type === 'decision'
        ? (isHindi ? `तर्क शर्त का मूल्यांकन करें: ${val.label}। सीमा के आधार पर शाखा का चयन करता है।` : `Evaluate logic condition: ${val.label}. Dispatches state based on threshold criteria.`)
        : val.type === 'start'
        ? (isHindi ? `प्रवेश बिंदु: प्रारंभिक पैरामीटर निर्धारित करें और स्थिति आवंटित करें।` : `Entry point: Initialize initial parameters and allocate computational state.`)
        : val.type === 'finish'
        ? (isHindi ? `समापन स्थिति: सत्यापित परिणाम के साथ प्रक्रिया पूर्ण होती है।` : `Output state reached: Execution terminates with verified result.`)
        : (isHindi ? `निष्पादन चरण: प्रक्रिया रूपांतरण एवं गणितीय स्थिति की गणना।` : `Execution stage: Process transformation and compute mathematical state.`),
      branchYes: val.branchYes,
      branchNo: val.branchNo,
    });
  });

  return parsedSteps;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ flowchartData, nodeTitle }) => {
  const { language } = useLanguage();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  const isHindi = language === 'hi';
  const steps = React.useMemo(() => parseMermaidToSteps(flowchartData?.mermaidCode, isHindi), [flowchartData?.mermaidCode, isHindi]);
  const defaultSteps = isHindi ? DEFAULT_STEPS_HI : DEFAULT_STEPS_EN;
  const activeStep = steps[activeStepIndex] || steps[0] || defaultSteps[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {flowchartData?.flowchartType || (isHindi ? 'अवधारणा प्रवाह एवं तर्क संरचना' : 'CONCEPT FLOW & LOGIC ARCHITECTURE')}
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-devanagari">
            {flowchartData?.caption || (isHindi ? `इंटरैक्टिव फ्लोचार्ट: ${nodeTitle}` : `Interactive Flowchart: ${nodeTitle}`)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-devanagari">
            {isHindi 
              ? 'कलनविधि निर्णयों और सैद्धांतिक व्युत्पत्तियों का चरण-दर-चरण दृश्य निरूपण।' 
              : 'Step-by-step visual representation of algorithmic decisions and conceptual derivations.'}
          </p>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title={isHindi ? 'ज़ूम आउट' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title={isHindi ? 'ज़ूम इन' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title={isHindi ? 'ज़ूम रीसेट' : 'Reset Zoom'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'visual' ? 'code' : 'visual')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {viewMode === 'visual' 
              ? (isHindi ? 'मर्मेड कोड देखें' : 'Raw Mermaid') 
              : (isHindi ? 'इंटरैक्टिव मानचित्र' : 'Interactive Map')}
          </button>
        </div>
      </div>

      {viewMode === 'code' ? (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 space-y-2">
          <div className="text-slate-500 text-[10px] uppercase font-bold">
            {isHindi ? 'मर्मेड आरेख परिभाषा:' : 'Mermaid Diagram Definition:'}
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">
{flowchartData?.mermaidCode || `graph TD
    A[Initial State & Parameters] --> B(Theoretical Formulation)
    B --> C{Equilibrium Threshold?}
    C -->|Yes: Converged| D[Compute Vector Trajectory]
    C -->|No: Recalibrate| B
    D --> E((Optimal Convergence & Output))`}
          </pre>
        </div>
      ) : (
        /* Visual Interactive Step Flow Canvas */
        <div className="space-y-6" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
          {/* Active Step Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {activeStep.stepNumber}
                </span>
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 font-devanagari">
                  {activeStep.label}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {activeStep.type === 'start' 
                    ? (isHindi ? 'प्रारंभ' : 'START') 
                    : activeStep.type === 'finish' 
                    ? (isHindi ? 'समाप्त' : 'FINISH') 
                    : activeStep.type === 'decision' 
                    ? (isHindi ? 'निर्णय' : 'DECISION') 
                    : (isHindi ? 'प्रक्रिया' : 'PROCESS')}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 pl-8 leading-relaxed font-devanagari">
                {activeStep.description}
              </p>
            </div>

            {/* Stepper controls */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title={isHindi ? 'पिछला नोड' : 'Previous Node'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={activeStepIndex === steps.length - 1}
                onClick={() => setActiveStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                <span>{isHindi ? 'अगला नोड' : 'Next Node'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Flow Diagram Graph */}
          <div className="relative py-4 flex flex-col items-center space-y-4">
            {steps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;

              return (
                <React.Fragment key={step.id}>
                  {/* Flowchart Node Card */}
                  <div
                    onClick={() => setActiveStepIndex(idx)}
                    className={`cursor-pointer w-full max-w-md p-4 rounded-2xl border transition-all duration-300 relative group ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 shadow-xl scale-105'
                        : isPast
                        ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 opacity-90'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md'
                              : isPast
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white font-devanagari">
                            {step.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-devanagari">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Branch indicators */}
                    {step.type === 'decision' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ {isHindi ? 'हाँ' : 'YES'}: {step.branchYes}
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          ✗ {isHindi ? 'नहीं' : 'NO'}: {step.branchNo}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flow Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="flex flex-col items-center my-1">
                      <div className={`w-0.5 h-6 transition-colors ${idx < activeStepIndex ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <ArrowDown className={`w-4 h-4 -mt-1 transition-colors ${idx < activeStepIndex ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-600'}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
