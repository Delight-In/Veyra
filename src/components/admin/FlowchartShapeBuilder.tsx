import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ArrowDown, ChevronDown, ChevronUp, Copy, Eye, 
  Code2, RotateCcw, ArrowRight, CornerDownRight, Maximize2, 
  Minimize2, ZoomIn, ZoomOut, MoveVertical, Layers, Check
} from 'lucide-react';

export type FlowchartShapeType = 'oval' | 'rect' | 'parallelogram' | 'diamond' | 'circle';
export type FlowchartNodeSize = 'sm' | 'md' | 'lg' | 'wide';

export interface FlowchartNode {
  id: string;
  shape: FlowchartShapeType;
  label: string;
  size?: FlowchartNodeSize;
  customWidth?: number; // In pixels (180 to 560px)
  targetId?: string; // Next node it points to
  edgeLabel?: string; // Optional edge label e.g. "Yes", "No", "Next"
  secondaryTargetId?: string; // For diamond decision alternate branch
  secondaryEdgeLabel?: string;
}

interface FlowchartShapeBuilderProps {
  initialMermaidCode?: string;
  initialCaption?: string;
  onChange: (data: { mermaidCode: string; caption?: string; flowchartType?: string }) => void;
}

export const NODE_SIZE_CONFIG: Record<FlowchartNodeSize, {
  label: string;
  defaultWidth: number;
  containerClass: string;
  textClass: string;
}> = {
  sm: {
    label: 'Compact',
    defaultWidth: 220,
    containerClass: 'py-2 px-3',
    textClass: 'text-[11px]'
  },
  md: {
    label: 'Standard',
    defaultWidth: 320,
    containerClass: 'py-3.5 px-4',
    textClass: 'text-xs font-bold'
  },
  lg: {
    label: 'Large',
    defaultWidth: 420,
    containerClass: 'py-5 px-6',
    textClass: 'text-sm font-bold'
  },
  wide: {
    label: 'Extra Wide',
    defaultWidth: 520,
    containerClass: 'py-5 px-8',
    textClass: 'text-base font-bold'
  }
};

// Initial 5-shape dummy flowchart demonstrating all core educational & engineering symbols
export const DUMMY_FIVE_SHAPE_NODES: FlowchartNode[] = [
  {
    id: 'start_node',
    shape: 'oval',
    size: 'md',
    customWidth: 320,
    label: 'Start: Launch Projectile System',
    targetId: 'input_params',
    edgeLabel: 'Initialize'
  },
  {
    id: 'input_params',
    shape: 'parallelogram',
    size: 'md',
    customWidth: 340,
    label: 'Input: Launch Angle (θ) & Velocity (v₀)',
    targetId: 'calc_components',
    edgeLabel: 'Feed Data'
  },
  {
    id: 'calc_components',
    shape: 'rect',
    size: 'lg',
    customWidth: 420,
    label: 'Calculate: vx = v₀·cos(θ), vy = v₀·sin(θ) - g·t',
    targetId: 'check_altitude',
    edgeLabel: 'Compute Step'
  },
  {
    id: 'check_altitude',
    shape: 'diamond',
    size: 'md',
    customWidth: 330,
    label: 'Check: Is vertical velocity vy ≥ 0?',
    targetId: 'ascent_state',
    edgeLabel: 'Yes (Rising)',
    secondaryTargetId: 'descent_state',
    secondaryEdgeLabel: 'No (Falling)'
  },
  {
    id: 'ascent_state',
    shape: 'circle',
    size: 'sm',
    customWidth: 260,
    label: 'Checkpoint: Ascending Phase',
    targetId: 'output_telemetry',
    edgeLabel: 'Track Coordinates'
  },
  {
    id: 'descent_state',
    shape: 'circle',
    size: 'sm',
    customWidth: 260,
    label: 'Checkpoint: Descending Phase',
    targetId: 'output_telemetry',
    edgeLabel: 'Track Coordinates'
  },
  {
    id: 'output_telemetry',
    shape: 'parallelogram',
    size: 'md',
    customWidth: 350,
    label: 'Output: Print Max Height & Landing Range',
    targetId: 'end_node',
    edgeLabel: 'Final Log'
  },
  {
    id: 'end_node',
    shape: 'oval',
    size: 'md',
    customWidth: 320,
    label: 'End: Trajectory Simulation Complete',
    targetId: undefined
  }
];

export const SHAPE_CONFIG: Record<FlowchartShapeType, {
  name: string;
  role: string;
  description: string;
  badgeClass: string;
  mermaidSyntax: (id: string, label: string) => string;
}> = {
  oval: {
    name: 'Oval',
    role: 'Start / End (Terminal)',
    description: 'Represents the entry point or terminal boundary of the system.',
    badgeClass: 'rounded-full border border-sky-400/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    mermaidSyntax: (id, label) => `${id}(["${label}"])`
  },
  rect: {
    name: 'Rectangle',
    role: 'Process / Action',
    description: 'Represents computation, formula evaluation, or procedural execution.',
    badgeClass: 'rounded-md border border-indigo-400/50 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    mermaidSyntax: (id, label) => `${id}["${label}"]`
  },
  parallelogram: {
    name: 'Parallelogram',
    role: 'Data Input / Output',
    description: 'Represents variable intake, sensor input, or telemetry display.',
    badgeClass: 'skew-x-[-8deg] rounded-sm border border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    mermaidSyntax: (id, label) => `${id}[/"${label}"/]`
  },
  diamond: {
    name: 'Diamond',
    role: 'Decision / Conditional',
    description: 'Evaluates logical conditions or thresholds to branch execution.',
    badgeClass: 'rounded-sm border border-amber-400/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    mermaidSyntax: (id, label) => `${id}{"${label}"}`
  },
  circle: {
    name: 'Circle',
    role: 'Connector / State Checkpoint',
    description: 'Represents an inspection checkpoint, state juncture, or junction point.',
    badgeClass: 'rounded-full aspect-square border border-rose-400/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    mermaidSyntax: (id, label) => `${id}(("${label}"))`
  }
};

export const FlowchartShapeBuilder: React.FC<FlowchartShapeBuilderProps> = ({
  initialMermaidCode,
  initialCaption = 'Interactive Educational Process Flowchart',
  onChange
}) => {
  const [nodes, setNodes] = useState<FlowchartNode[]>(() => {
    return DUMMY_FIVE_SHAPE_NODES;
  });

  const [caption, setCaption] = useState(initialCaption);
  const [direction, setDirection] = useState<'TD' | 'LR'>('TD');
  const [activeTab, setActiveTab] = useState<'visual' | 'nodes' | 'code'>('visual');
  const [manualCode, setManualCode] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);

  // In-between insertion active index tracker
  const [insertingAfterIndex, setInsertingAfterIndex] = useState<number | null>(null);
  const [isInsertingAtTop, setIsInsertingAtTop] = useState(false);

  // Global visual zoom scale (0.75 to 1.5)
  const [canvasZoom, setCanvasZoom] = useState<number>(1);

  // Compile nodes to Mermaid syntax
  const compileToMermaid = (nodeList: FlowchartNode[], dir: 'TD' | 'LR'): string => {
    const lines: string[] = [`graph ${dir}`];
    
    // 1. Declare all nodes with appropriate shape brackets
    nodeList.forEach(node => {
      const cleanLabel = (node.label || 'Untitled').replace(/"/g, "'");
      const syntax = SHAPE_CONFIG[node.shape].mermaidSyntax(node.id, cleanLabel);
      lines.push(`    ${syntax}`);
    });

    lines.push('');

    // 2. Declare connections and branches
    nodeList.forEach(node => {
      if (node.targetId) {
        if (node.edgeLabel && node.edgeLabel.trim()) {
          lines.push(`    ${node.id} -->|${node.edgeLabel.trim()}| ${node.targetId}`);
        } else {
          lines.push(`    ${node.id} --> ${node.targetId}`);
        }
      }

      // If diamond has secondary branch
      if (node.shape === 'diamond' && node.secondaryTargetId) {
        if (node.secondaryEdgeLabel && node.secondaryEdgeLabel.trim()) {
          lines.push(`    ${node.id} -->|${node.secondaryEdgeLabel.trim()}| ${node.secondaryTargetId}`);
        } else {
          lines.push(`    ${node.id} --> ${node.secondaryTargetId}`);
        }
      }
    });

    return lines.join('\n');
  };

  // Sync to parent whenever nodes or caption changes
  useEffect(() => {
    if (!isManualOverride) {
      const code = compileToMermaid(nodes, direction);
      setManualCode(code);
      onChange({
        mermaidCode: code,
        caption,
        flowchartType: 'process'
      });
    }
  }, [nodes, caption, direction, isManualOverride]);

  const getDefaultLabel = (shapeType: FlowchartShapeType): string => {
    const labels: Record<FlowchartShapeType, string> = {
      oval: 'Terminal / State Milestone',
      rect: 'Action: Compute Mathematical Step',
      parallelogram: 'Data I/O: Input Variables',
      diamond: 'Decision: Verify Constraint Condition',
      circle: 'Connector: Phase Checkpoint'
    };
    return labels[shapeType];
  };

  // 1. Append Shape to the End
  const handleAddShape = (shapeType: FlowchartShapeType) => {
    const newId = `step_${Date.now().toString(36)}`;
    const prevNode = nodes[nodes.length - 1];

    const newNode: FlowchartNode = {
      id: newId,
      shape: shapeType,
      size: 'md',
      customWidth: 320,
      label: getDefaultLabel(shapeType),
      targetId: undefined,
      edgeLabel: shapeType === 'diamond' ? 'Yes' : 'Next'
    };

    let updatedNodes = [...nodes];
    if (prevNode && !prevNode.targetId) {
      updatedNodes = updatedNodes.map((n, idx) => 
        idx === updatedNodes.length - 1 ? { ...n, targetId: newId } : n
      );
    }

    setNodes([...updatedNodes, newNode]);
    setIsManualOverride(false);
  };

  // 2. Insert Shape In-Between Two Steps
  const handleInsertShapeBetween = (indexAfter: number, shapeType: FlowchartShapeType) => {
    const newId = `step_${Date.now().toString(36)}`;
    const prevNode = nodes[indexAfter];
    const nextNode = nodes[indexAfter + 1];

    const newNode: FlowchartNode = {
      id: newId,
      shape: shapeType,
      size: 'md',
      customWidth: 320,
      label: getDefaultLabel(shapeType),
      targetId: nextNode ? nextNode.id : undefined,
      edgeLabel: shapeType === 'diamond' ? 'Yes' : 'Next'
    };

    const updatedNodes = [...nodes];
    if (prevNode) {
      updatedNodes[indexAfter] = {
        ...prevNode,
        targetId: newId
      };
    }

    updatedNodes.splice(indexAfter + 1, 0, newNode);
    setNodes(updatedNodes);
    setInsertingAfterIndex(null);
    setIsManualOverride(false);
  };

  // 3. Insert Shape at the Very Top (Start of flow)
  const handleInsertShapeAtTop = (shapeType: FlowchartShapeType) => {
    const newId = `step_${Date.now().toString(36)}`;
    const firstNode = nodes[0];

    const newNode: FlowchartNode = {
      id: newId,
      shape: shapeType,
      size: 'md',
      customWidth: 320,
      label: getDefaultLabel(shapeType),
      targetId: firstNode ? firstNode.id : undefined,
      edgeLabel: 'Initialize'
    };

    setNodes([newNode, ...nodes]);
    setIsInsertingAtTop(false);
    setIsManualOverride(false);
  };

  const handleUpdateNode = (id: string, updates: Partial<FlowchartNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    setIsManualOverride(false);
  };

  // Node Resize handler
  const handleResizeNode = (id: string, newSize: FlowchartNodeSize) => {
    const defaultW = NODE_SIZE_CONFIG[newSize].defaultWidth;
    handleUpdateNode(id, { size: newSize, customWidth: defaultW });
  };

  // Custom pixel width adjuster
  const handleSetCustomWidth = (id: string, width: number) => {
    let sizeName: FlowchartNodeSize = 'md';
    if (width <= 260) sizeName = 'sm';
    else if (width <= 360) sizeName = 'md';
    else if (width <= 460) sizeName = 'lg';
    else sizeName = 'wide';

    handleUpdateNode(id, { customWidth: width, size: sizeName });
  };

  const handleDeleteNode = (id: string) => {
    const nodeIndex = nodes.findIndex(n => n.id === id);
    const prevNode = nodeIndex > 0 ? nodes[nodeIndex - 1] : null;
    const targetId = nodes[nodeIndex]?.targetId;

    let updated = nodes.filter(n => n.id !== id);

    // Re-wire previous node to point to deleted node's target
    if (prevNode && targetId) {
      updated = updated.map(n => n.id === prevNode.id ? { ...n, targetId } : n);
    }

    // Clean any dangling pointers
    updated = updated.map(n => {
      const copy = { ...n };
      if (copy.targetId === id) copy.targetId = undefined;
      if (copy.secondaryTargetId === id) copy.secondaryTargetId = undefined;
      return copy;
    });

    setNodes(updated);
    setIsManualOverride(false);
  };

  const handleMoveNode = (index: number, delta: number) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const reordered = [...nodes];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setNodes(reordered);
    setIsManualOverride(false);
  };

  const handleDuplicateNode = (node: FlowchartNode) => {
    const newId = `step_${Date.now().toString(36)}`;
    const duplicate: FlowchartNode = {
      ...node,
      id: newId,
      label: `${node.label} (Copy)`,
      targetId: undefined
    };
    setNodes(prev => [...prev, duplicate]);
    setIsManualOverride(false);
  };

  const handleResetDummy = () => {
    setNodes(DUMMY_FIVE_SHAPE_NODES);
    setIsManualOverride(false);
  };

  const handleManualCodeChange = (code: string) => {
    setManualCode(code);
    setIsManualOverride(true);
    onChange({
      mermaidCode: code,
      caption,
      flowchartType: 'process'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Interactive Flowchart Studio
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              5 Shapes • Resizable • In-Between Insert
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build pedagogical diagrams: Circle (checkpoint), Rectangle (process), Parallelogram (data I/O), Diamond (decision), Oval (start/end).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom controls for canvas */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setCanvasZoom(z => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom Out Canvas"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setCanvasZoom(z => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom In Canvas"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDummy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset to educational dummy diagram showing all 5 shapes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'visual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Visual Map
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nodes')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'nodes'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Step Editor ({nodes.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Mermaid Code
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Shape Palette Toolbar - Quick "+ Add Shape to End" */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            Add Flowchart Shape:
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">Flow Direction:</span>
            <button
              type="button"
              onClick={() => setDirection(d => d === 'TD' ? 'LR' : 'TD')}
              className="text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
            >
              {direction === 'TD' ? '↓ Top-to-Bottom' : '→ Left-to-Right'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* 1. Oval */}
          <button
            type="button"
            onClick={() => handleAddShape('oval')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500/50 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 text-center transition-all group"
          >
            <div className="w-10 h-6 rounded-full border-2 border-sky-500 bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-[10px] font-bold text-sky-700 dark:text-sky-300 mb-1.5 group-hover:scale-105 transition-transform">
              ([ ])
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Oval</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Start / End</span>
          </button>

          {/* 2. Rect */}
          <button
            type="button"
            onClick={() => handleAddShape('rect')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-center transition-all group"
          >
            <div className="w-10 h-6 rounded border-2 border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 group-hover:scale-105 transition-transform">
              [ ]
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Rectangle</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Process / Action</span>
          </button>

          {/* 3. Parallelogram */}
          <button
            type="button"
            onClick={() => handleAddShape('parallelogram')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-center transition-all group"
          >
            <div className="w-10 h-6 skew-x-[-12deg] rounded-xs border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1.5 group-hover:scale-105 transition-transform">
              [/ /]
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Parallelogram</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Data Input/Output</span>
          </button>

          {/* 4. Diamond */}
          <button
            type="button"
            onClick={() => handleAddShape('diamond')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-center transition-all group"
          >
            <div className="w-6 h-6 rotate-45 border-2 border-amber-500 bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-300 mb-1.5 group-hover:scale-105 transition-transform">
              <span className="-rotate-45">{'{ }'}</span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Diamond</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Decision Check</span>
          </button>

          {/* 5. Circle */}
          <button
            type="button"
            onClick={() => handleAddShape('circle')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 text-center transition-all group"
          >
            <div className="w-6 h-6 rounded-full border-2 border-rose-500 bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-1.5 group-hover:scale-105 transition-transform">
              (( ))
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Circle</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Connector / State</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'visual' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Interactive Visual Diagram Canvas
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {nodes.length} connected shapes • Click "+ Insert In Between" to insert any shape
            </span>
          </div>

          {/* Top Insert Trigger (Insert before Step 1) */}
          <div className="flex flex-col items-center pt-2">
            {!isInsertingAtTop ? (
              <button
                type="button"
                onClick={() => setIsInsertingAtTop(true)}
                className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Insert Shape at Beginning</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 shadow-md flex items-center gap-1.5 flex-wrap z-10 animate-in fade-in">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pl-1">
                  Insert at Top:
                </span>
                <button type="button" onClick={() => handleInsertShapeAtTop('oval')} className="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold">+ Oval</button>
                <button type="button" onClick={() => handleInsertShapeAtTop('rect')} className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">+ Rect</button>
                <button type="button" onClick={() => handleInsertShapeAtTop('parallelogram')} className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">+ Parallelogram</button>
                <button type="button" onClick={() => handleInsertShapeAtTop('diamond')} className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">+ Diamond</button>
                <button type="button" onClick={() => handleInsertShapeAtTop('circle')} className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold">+ Circle</button>
                <button type="button" onClick={() => setIsInsertingAtTop(false)} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs">✕</button>
              </div>
            )}
          </div>

          {/* Visual Node Flow Canvas with Scalable Zoom */}
          <div 
            className="flex flex-col items-center py-4 space-y-2 transition-transform duration-200 origin-top overflow-x-auto"
            style={{ transform: `scale(${canvasZoom})` }}
          >
            {nodes.map((node, index) => {
              const cfg = SHAPE_CONFIG[node.shape];
              const nodeSize = node.size || 'md';
              const sizeCfg = NODE_SIZE_CONFIG[nodeSize];
              const nodeWidth = node.customWidth || sizeCfg.defaultWidth;
              const secondaryNextNode = node.secondaryTargetId ? nodes.find(n => n.id === node.secondaryTargetId) : undefined;

              return (
                <div key={node.id} className="w-full flex flex-col items-center">
                  {/* Shape Card Render with Dynamic Width and Geometry */}
                  <div 
                    style={{ width: `${nodeWidth}px` }}
                    className={`transition-all relative shadow-xs border ${sizeCfg.containerClass} ${
                      node.shape === 'oval'
                        ? 'rounded-full border-sky-400/80 bg-sky-50/70 dark:bg-sky-950/40'
                        : node.shape === 'rect'
                        ? 'rounded-xl border-indigo-400/80 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : node.shape === 'parallelogram'
                        ? 'rounded-sm skew-x-[-6deg] border-emerald-400/80 bg-emerald-50/70 dark:bg-emerald-950/40'
                        : node.shape === 'diamond'
                        ? 'rounded-2xl border-amber-400/80 bg-amber-50/70 dark:bg-amber-950/40'
                        : 'rounded-full border-rose-400/80 bg-rose-50/70 dark:bg-rose-950/40'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-3 ${
                      node.shape === 'parallelogram' ? 'skew-x-[6deg]' : ''
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                          #{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={node.label}
                            onChange={(e) => handleUpdateNode(node.id, { label: e.target.value })}
                            className={`w-full bg-transparent border-0 p-0 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-0 ${sizeCfg.textClass}`}
                          />
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{cfg.name}</span>
                            <span>•</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{sizeCfg.label} ({nodeWidth}px)</span>
                          </div>
                        </div>
                      </div>

                      {/* Shape Quick Resize Buttons on the Node */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center bg-white/80 dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
                          {(['sm', 'md', 'lg', 'wide'] as FlowchartNodeSize[]).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleResizeNode(node.id, sz)}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase transition-colors ${
                                nodeSize === sz
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                              title={`Set shape size to ${NODE_SIZE_CONFIG[sz].label}`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flow Connector Arrow & In-Between Insert Trigger */}
                  {index < nodes.length - 1 && (
                    <div className="w-full flex flex-col items-center my-1 relative group/insert">
                      {node.edgeLabel && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mb-0.5">
                          {node.edgeLabel}
                        </span>
                      )}
                      <ArrowDown className="w-4 h-4 text-slate-400 group-hover/insert:text-indigo-500 transition-colors" />

                      {/* Interactive In-Between Insert Button */}
                      <div className="my-1">
                        {insertingAfterIndex !== index ? (
                          <button
                            type="button"
                            onClick={() => setInsertingAfterIndex(index)}
                            className="opacity-75 group-hover/insert:opacity-100 px-3 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-xs flex items-center gap-1 transition-all"
                            title={`Insert shape between Step ${index + 1} and Step ${index + 2}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Insert Shape In Between</span>
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 shadow-xl flex items-center gap-1.5 flex-wrap z-20 animate-in fade-in zoom-in-95">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider pl-1">
                              Insert Between #{index + 1} & #{index + 2}:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleInsertShapeBetween(index, 'oval')}
                              className="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold hover:scale-105 transition-transform"
                            >
                              + Oval
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertShapeBetween(index, 'rect')}
                              className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:scale-105 transition-transform"
                            >
                              + Rectangle
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertShapeBetween(index, 'parallelogram')}
                              className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:scale-105 transition-transform"
                            >
                              + Parallelogram
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertShapeBetween(index, 'diamond')}
                              className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold hover:scale-105 transition-transform"
                            >
                              + Diamond
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertShapeBetween(index, 'circle')}
                              className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold hover:scale-105 transition-transform"
                            >
                              + Circle
                            </button>
                            <button
                              type="button"
                              onClick={() => setInsertingAfterIndex(null)}
                              className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Optional Diamond Branch Info */}
                      {node.shape === 'diamond' && secondaryNextNode && (
                        <div className="w-full flex items-center justify-center text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                          <CornerDownRight className="w-3 h-3 mr-1" />
                          Alt Branch: {node.secondaryEdgeLabel || 'No'} → {secondaryNextNode.label}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('nodes')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Open Step Editor to adjust width sliders, connection branching, and shape types →
            </button>
          </div>
        </div>
      )}

      {/* Node List Editor Tab */}
      {activeTab === 'nodes' && (
        <div className="space-y-4">
          {nodes.map((node, index) => {
            const cfg = SHAPE_CONFIG[node.shape];
            const nodeSize = node.size || 'md';
            const nodeWidth = node.customWidth || NODE_SIZE_CONFIG[nodeSize].defaultWidth;

            return (
              <div 
                key={node.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Step {index + 1}
                    </span>
                    
                    {/* Shape Selector Dropdown */}
                    <select
                      value={node.shape}
                      onChange={(e) => handleUpdateNode(node.id, { shape: e.target.value as FlowchartShapeType })}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="oval">Oval (Start / End)</option>
                      <option value="rect">Rectangle (Process / Formula)</option>
                      <option value="parallelogram">Parallelogram (Input / Output)</option>
                      <option value="diamond">Diamond (Decision / Branch)</option>
                      <option value="circle">Circle (Connector / Checkpoint)</option>
                    </select>

                    {/* Shape Size Presets */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      {(['sm', 'md', 'lg', 'wide'] as FlowchartNodeSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleResizeNode(node.id, sz)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize transition-colors ${
                            nodeSize === sz
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {NODE_SIZE_CONFIG[sz].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveNode(index, -1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Step Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === nodes.length - 1}
                      onClick={() => handleMoveNode(index, 1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Step Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateNode(node)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Duplicate Step"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Delete Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Node Label Input */}
                <div>
                  <input
                    type="text"
                    value={node.label}
                    onChange={(e) => handleUpdateNode(node.id, { label: e.target.value })}
                    placeholder="Enter shape text or instruction..."
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Fine Width Slider for Node Resizing */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    Shape Width:
                  </span>
                  <input
                    type="range"
                    min={180}
                    max={540}
                    step={10}
                    value={nodeWidth}
                    onChange={(e) => handleSetCustomWidth(node.id, Number(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {nodeWidth}px
                  </span>
                </div>

                {/* Connections & Edge Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Target Step (Connects To):
                    </label>
                    <select
                      value={node.targetId || ''}
                      onChange={(e) => handleUpdateNode(node.id, { targetId: e.target.value || undefined })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Terminal (No Next Step) --</option>
                      {nodes.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>
                          {n.label} ({SHAPE_CONFIG[n.shape].name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Connection Label / Condition:
                    </label>
                    <input
                      type="text"
                      value={node.edgeLabel || ''}
                      onChange={(e) => handleUpdateNode(node.id, { edgeLabel: e.target.value })}
                      placeholder="e.g. Yes / Next / Compute"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Secondary Branch for Diamond Decisions */}
                {node.shape === 'diamond' && (
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                        Secondary Alternate Branch:
                      </label>
                      <select
                        value={node.secondaryTargetId || ''}
                        onChange={(e) => handleUpdateNode(node.id, { secondaryTargetId: e.target.value || undefined })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- No Alternate Branch --</option>
                        {nodes.filter(n => n.id !== node.id).map(n => (
                          <option key={n.id} value={n.id}>
                            {n.label} ({SHAPE_CONFIG[n.shape].name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                        Alternate Edge Label:
                      </label>
                      <input
                        type="text"
                        value={node.secondaryEdgeLabel || ''}
                        onChange={(e) => handleUpdateNode(node.id, { secondaryEdgeLabel: e.target.value })}
                        placeholder="e.g. No / False"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {/* Inline Insert Step Directly Below */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Insert shape directly below this step:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleInsertShapeBetween(index, 'oval')}
                      className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold hover:bg-sky-100"
                    >
                      + Oval
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertShapeBetween(index, 'rect')}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold hover:bg-indigo-100"
                    >
                      + Rect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertShapeBetween(index, 'parallelogram')}
                      className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100"
                    >
                      + Parallelogram
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertShapeBetween(index, 'diamond')}
                      className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-100"
                    >
                      + Diamond
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertShapeBetween(index, 'circle')}
                      className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold hover:bg-rose-100"
                    >
                      + Circle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raw Mermaid Code View Tab */}
      {activeTab === 'code' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Direct Mermaid Diagram Syntax (Auto-compiled from shapes):</span>
            <span className="font-mono text-[11px]">graph {direction}</span>
          </div>
          <textarea
            value={manualCode}
            onChange={(e) => handleManualCodeChange(e.target.value)}
            rows={12}
            className="w-full font-mono text-xs p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="graph TD..."
          />
          <p className="text-[11px] text-slate-400 italic">
            Directly edits the rendered flowchart. Switching to Visual or adding shapes will synchronize automatically.
          </p>
        </div>
      )}

      {/* Caption & Metadata Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Flowchart Caption / Pedagogy Guide:
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g., Step-by-step logic decision model for Projectile Trajectory"
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};
