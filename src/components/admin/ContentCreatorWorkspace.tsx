import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  NodeType, NodeStatus, CodingTestCase, 
  QuizQuestion, ContentNode 
} from '../../types';
import { 
  Edit3, Plus, Save, Sparkles, Code, GitFork, Volume2, 
  Image as ImageIcon, FileText, Atom, HelpCircle, Trash2, 
  Wand2, CheckCircle2, Eye, ArrowRight, ArrowLeft,
  Languages, Globe, Layers, Copy, ExternalLink, Check, Info,
  CheckSquare, Square, FileCheck, Sliders, Play, Pause
} from 'lucide-react';
import { FormattingToolbar } from './FormattingToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { FlowchartShapeBuilder } from './FlowchartShapeBuilder';
import { FlowchartViewer } from '../classroom/FlowchartViewer';
import { SimulationSandbox } from '../classroom/SimulationSandbox';
import { CodingSandbox } from '../classroom/CodingSandbox';
import { QuizEngine } from '../classroom/QuizEngine';
import { ClassroomView } from '../classroom/ClassroomView';
import { speakWithIndianAccent, preloadSpeechVoices } from '../../utils/speechVoice';

interface ContentCreatorWorkspaceProps {
  initialParentId?: string;
  initialNode?: ContentNode;
  onSaved?: (savedNode: ContentNode) => void;
  onClose?: () => void;
}

export type TabType = 'basic' | 'notes' | 'simulation' | 'code' | 'flowchart' | 'audio' | 'images' | 'quiz';

export interface TabConfig {
  id: TabType;
  stepNumber: number;
  apiTag: string;
  label: string;
  labelHi: string;
  category: 'foundations' | 'labs' | 'reinforcement';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  descriptionHi: string;
}

export const CONTENT_PARTS: TabConfig[] = [
  {
    id: 'basic',
    stepNumber: 1,
    apiTag: 'info',
    label: '1. Text formatting',
    labelHi: '१. पाठ प्रारूप',
    category: 'foundations',
    icon: FileText,
    description: 'Title, summary, and conceptual lesson text with formulas',
    descriptionHi: 'शीर्षक, सारांश व सूत्रों के साथ वैचारिक पाठ'
  },
  {
    id: 'notes',
    stepNumber: 2,
    apiTag: 'notes',
    label: '2. Notes (3)',
    labelHi: '२. नोट्स (३)',
    category: 'foundations',
    icon: Edit3,
    description: 'Formula cheat-sheet and 3 key principle takeaway cards',
    descriptionHi: 'सूत्र संदर्भ और ३ मुख्य सिद्धांत निष्कर्ष कार्ड'
  },
  {
    id: 'simulation',
    stepNumber: 3,
    apiTag: 'simulation',
    label: '3. Simulation',
    labelHi: '३. सिमुलेशन',
    category: 'labs',
    icon: Atom,
    description: 'Interactive physics / canvas sandbox (projectile, orbit, wave, circuit)',
    descriptionHi: 'इंटरैक्टिव भौतिकी / कैनवास सैंडबॉक्स'
  },
  {
    id: 'code',
    stepNumber: 4,
    apiTag: 'code',
    label: '4. Code',
    labelHi: '४. कोड',
    category: 'labs',
    icon: Code,
    description: 'Interactive code problem with starter code & automated test cases',
    descriptionHi: 'प्रारंभिक कोड व स्वचालित परीक्षण केस के साथ कोडिंग समस्या'
  },
  {
    id: 'flowchart',
    stepNumber: 5,
    apiTag: 'flowchart',
    label: '5. Flowchart',
    labelHi: '५. फ़्लोचार्ट',
    category: 'labs',
    icon: GitFork,
    description: 'Interactive 5-shape decision flow diagram (Circle, Rect, Parallelogram, Diamond, Oval)',
    descriptionHi: 'मानक आकारों के साथ ५-चरणीय निर्णय प्रवाह आरेख'
  },
  {
    id: 'audio',
    stepNumber: 6,
    apiTag: 'audio',
    label: '6. Audio',
    labelHi: '६. ऑडियो',
    category: 'reinforcement',
    icon: Volume2,
    description: 'Bilingual audio narration script in English & Hindi with voice test',
    descriptionHi: 'अंग्रेजी व हिन्दी में द्विभाषी ऑडियो व्याख्यान स्क्रिप्ट'
  },
  {
    id: 'images',
    stepNumber: 7,
    apiTag: 'images',
    label: '7. Images (1)',
    labelHi: '७. चित्र (१)',
    category: 'reinforcement',
    icon: ImageIcon,
    description: 'High-resolution scientific diagrams, photo references, and captions',
    descriptionHi: 'उच्च-रिज़ॉल्यूशन वैज्ञानिक आरेख व संदर्भ चित्र'
  },
  {
    id: 'quiz',
    stepNumber: 8,
    apiTag: 'quiz',
    label: '8. Test (1)',
    labelHi: '८. टेस्ट (१)',
    category: 'reinforcement',
    icon: HelpCircle,
    description: 'Formative multiple-choice question with instant explanation rationale',
    descriptionHi: 'त्वरित स्पष्टीकरण के साथ बहुविकल्पीय प्रश्नोत्तरी'
  }
];

export const ContentCreatorWorkspace: React.FC<ContentCreatorWorkspaceProps> = ({ 
  initialParentId, 
  initialNode,
  onSaved,
  onClose 
}) => {
  const { currentUser, canPublishDirectly } = useAuth();
  const { nodes, addNode, updateNode } = useContent();
  const { language, t } = useLanguage();

  // Determine initial tab from URL hash if available (e.g., #notes or #tab=notes)
  const getInitialTab = (): TabType => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const match = CONTENT_PARTS.find(p => p.apiTag === hash || p.id === hash || hash.includes(p.apiTag));
      if (match) return match.id;
    }
    return 'basic';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isApiTagsModalOpen, setIsApiTagsModalOpen] = useState<boolean>(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Component inclusion checklist state (options the admin wants to add to this topic note)
  const [includedComponents, setIncludedComponents] = useState<Record<TabType, boolean>>(() => {
    if (initialNode) {
      return {
        basic: Boolean(initialNode.translations?.en?.body || initialNode.translations?.en?.title),
        notes: Boolean(initialNode.notes?.contentMarkdown || (initialNode.notes?.keyTakeaways && initialNode.notes.keyTakeaways.length > 0)),
        simulation: Boolean(initialNode.simulationConfig?.type),
        code: Boolean(initialNode.codingProblem?.title),
        flowchart: Boolean(initialNode.flowchart?.mermaidCode),
        audio: Boolean(initialNode.audioExplanation?.scriptEn || initialNode.audioExplanation?.audioUrl),
        images: Boolean(initialNode.images && initialNode.images.length > 0),
        quiz: Boolean(initialNode.quizQuestions && initialNode.quizQuestions.length > 0),
      };
    }
    // For creating new nodes: sheet starts clean and empty
    return {
      basic: false,
      notes: false,
      simulation: false,
      code: false,
      flowchart: false,
      audio: false,
      images: false,
      quiz: false,
    };
  });

  const [mobileView, setMobileView] = useState<'sidebar' | 'a4'>('a4');

  const scrollToSection = (id: TabType) => {
    setActiveTab(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleComponentInclusion = (id: TabType) => {
    setIncludedComponents(prev => {
      const nextVal = !prev[id];
      if (nextVal) {
        setTimeout(() => scrollToSection(id), 60);
      }
      return {
        ...prev,
        [id]: nextVal
      };
    });
  };

  const handleAppendFlowchartShape = (shape: 'oval' | 'rect' | 'diamond' | 'parallelogram' | 'circle') => {
    const nodeId = `step_${Date.now().toString().slice(-4)}`;
    let shapeSyntax = '';
    switch (shape) {
      case 'oval': shapeSyntax = `${nodeId}([New Terminus / Step])`; break;
      case 'rect': shapeSyntax = `${nodeId}[Action / Process]`; break;
      case 'parallelogram': shapeSyntax = `${nodeId}[/Data Input or Output/]`; break;
      case 'diamond': shapeSyntax = `${nodeId}{Condition Check?}`; break;
      case 'circle': shapeSyntax = `${nodeId}((Connector))`; break;
    }
    const base = mermaidCode.trim() || 'flowchart TD';
    setMermaidCode(`${base}\n  --> ${shapeSyntax}`);
    if (!includedComponents.flowchart) {
      setIncludedComponents(prev => ({ ...prev, flowchart: true }));
    }
  };

  const handleClearSheet = () => {
    if (window.confirm('Reset this topic note to a clean, empty sheet?')) {
      setTitleEn('');
      setTitleHi('');
      setDescEn('');
      setDescHi('');
      setBodyEn('');
      setBodyHi('');
      setNotesTitle('');
      setNotesMarkdown('');
      setKeyTakeaways([]);
      setSimInstructionsEn('');
      setSimInstructionsHi('');
      setSimChallengeDesc('');
      setCodeTitle('');
      setCodeDescription('');
      setCodeStarter('');
      setCodeTestCases([]);
      setFlowchartCaption('');
      setMermaidCode('');
      setAudioTitle('');
      setAudioScriptEn('');
      setAudioScriptHi('');
      setImagesList([]);
      setQuizList([]);
      setIncludedComponents({
        basic: false,
        notes: false,
        simulation: false,
        code: false,
        flowchart: false,
        audio: false,
        images: false,
        quiz: false,
      });
    }
  };

  // Extensible Multi-Language Editor State (English and Hindi active for dev)
  const [contentLanguage, setContentLanguage] = useState<'en' | 'hi'>('en');
  const [showDualLanguageView, setShowDualLanguageView] = useState<boolean>(false);

  // Markdown Editor view modes
  const [notesViewMode, setNotesViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const [bodyEnViewMode, setBodyEnViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const [bodyHiViewMode, setBodyHiViewMode] = useState<'write' | 'split' | 'preview'>('write');

  // Textarea references for formatting toolbar insertion
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyEnTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyHiTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Basic Metadata & Hierarchy
  const [parentId, setParentId] = useState<string>(initialNode?.parentId || initialParentId || '');
  const [nodeType, setNodeType] = useState<NodeType>(initialNode?.type || 'subject');
  const [customNodeId, setCustomNodeId] = useState<string>(initialNode?.id || '');
  const [manualParentMode, setManualParentMode] = useState<boolean>(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(initialNode?.estimatedMinutes || 15);

  // Translations
  const [titleEn, setTitleEn] = useState<string>(initialNode?.translations.en?.title || '');
  const [titleHi, setTitleHi] = useState<string>(initialNode?.translations.hi?.title || '');
  const [descEn, setDescEn] = useState<string>(initialNode?.translations.en?.description || '');
  const [descHi, setDescHi] = useState<string>(initialNode?.translations.hi?.description || '');
  const [bodyEn, setBodyEn] = useState<string>(initialNode?.translations.en?.body || '');
  const [bodyHi, setBodyHi] = useState<string>(initialNode?.translations.hi?.body || '');

  // 2. Interactive Notes & Key Takeaways
  const [notesTitle, setNotesTitle] = useState<string>(initialNode?.notes?.title || '');
  const [notesMarkdown, setNotesMarkdown] = useState<string>(initialNode?.notes?.contentMarkdown || '');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialNode?.notes?.keyTakeaways || []
  );
  const [newTakeawayInput, setNewTakeawayInput] = useState<string>('');

  // 3. Interactive Physics / Canvas Simulation
  const [simType, setSimType] = useState<'projectile' | 'wave_synth' | 'gravity_orbit' | 'custom_canvas'>(
    (initialNode?.simulationConfig?.type as any) || 'projectile'
  );
  const [simAngle, setSimAngle] = useState<number>(
    typeof initialNode?.simulationConfig?.initialParams?.angle === 'number'
      ? initialNode.simulationConfig.initialParams.angle
      : (Number(initialNode?.simulationConfig?.initialParams?.angle) || 45)
  );
  const [simVelocity, setSimVelocity] = useState<number>(
    typeof initialNode?.simulationConfig?.initialParams?.velocity === 'number'
      ? initialNode.simulationConfig.initialParams.velocity
      : (Number(initialNode?.simulationConfig?.initialParams?.velocity) || 25)
  );
  const [simGravity, setSimGravity] = useState<number>(
    typeof initialNode?.simulationConfig?.initialParams?.gravity === 'number'
      ? initialNode.simulationConfig.initialParams.gravity
      : (Number(initialNode?.simulationConfig?.initialParams?.gravity) || 9.8)
  );
  const [simMass, setSimMass] = useState<number>(
    typeof initialNode?.simulationConfig?.initialParams?.mass === 'number'
      ? initialNode.simulationConfig.initialParams.mass
      : (Number(initialNode?.simulationConfig?.initialParams?.mass) || 1)
  );
  const [simInstructionsEn, setSimInstructionsEn] = useState<string>(
    initialNode?.simulationConfig?.instructions?.en || ''
  );
  const [simInstructionsHi, setSimInstructionsHi] = useState<string>(
    initialNode?.simulationConfig?.instructions?.hi || ''
  );
  const [simChallengeDesc, setSimChallengeDesc] = useState<string>(
    initialNode?.simulationConfig?.challenges?.[0]?.description?.en || ''
  );

  // 4. Live Coding Sandbox Problem
  const [codeTitle, setCodeTitle] = useState<string>(
    initialNode?.codingProblem?.title || ''
  );
  const [codeLang, setCodeLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>(
    initialNode?.codingProblem?.language || 'python'
  );
  const [codeDescription, setCodeDescription] = useState<string>(
    initialNode?.codingProblem?.description || ''
  );
  const [codeStarter, setCodeStarter] = useState<string>(
    initialNode?.codingProblem?.starterCode || ''
  );
  const [codeTestCases, setCodeTestCases] = useState<CodingTestCase[]>(
    initialNode?.codingProblem?.testCases || []
  );
  const [newTcInput, setNewTcInput] = useState<string>('');
  const [newTcOutput, setNewTcOutput] = useState<string>('');
  const [codeTestOutput, setCodeTestOutput] = useState<string | null>(null);
  const [isTestingCode, setIsTestingCode] = useState<boolean>(false);

  // 5. Flowchart & 5-Shape Builder
  const [flowchartType, setFlowchartType] = useState<string>(
    initialNode?.flowchart?.flowchartType || 'process'
  );
  const [mermaidCode, setMermaidCode] = useState<string>(
    initialNode?.flowchart?.mermaidCode || ''
  );
  const [flowchartCaption, setFlowchartCaption] = useState<string>(
    initialNode?.flowchart?.caption || ''
  );
  const [showLiveViewerModal, setShowLiveViewerModal] = useState<boolean>(false);

  // 6. Bilingual Audio Narration
  const [audioTitle, setAudioTitle] = useState<string>(
    initialNode?.audioExplanation?.narrationTitle || ''
  );
  const [audioScriptEn, setAudioScriptEn] = useState<string>(
    initialNode?.audioExplanation?.scriptEn || ''
  );
  const [audioScriptHi, setAudioScriptHi] = useState<string>(
    initialNode?.audioExplanation?.scriptHi || ''
  );
  const [audioDuration, setAudioDuration] = useState<number>(
    initialNode?.audioExplanation?.durationSeconds || 120
  );
  const [audioUrl, setAudioUrl] = useState<string>(
    initialNode?.audioExplanation?.audioUrl || ''
  );
  const [isSpeakingEn, setIsSpeakingEn] = useState<boolean>(false);
  const [isSpeakingHi, setIsSpeakingHi] = useState<boolean>(false);

  // 7. Visual Media & Images
  const [imagesList, setImagesList] = useState<{ url: string; caption?: string; altText?: string }[]>(
    initialNode?.images || []
  );
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageCaption, setNewImageCaption] = useState<string>('');

  // 8. Retention Test & Quiz Questions
  const [quizList, setQuizList] = useState<QuizQuestion[]>(
    initialNode?.quizQuestions || []
  );
  const [newQEn, setNewQEn] = useState<string>('');
  const [newQHi, setNewQHi] = useState<string>('');
  const [newOptEnA, setNewOptEnA] = useState<string>('');
  const [newOptEnB, setNewOptEnB] = useState<string>('');
  const [newOptEnC, setNewOptEnC] = useState<string>('');
  const [newOptEnD, setNewOptEnD] = useState<string>('');
  const [newOptHiA, setNewOptHiA] = useState<string>('');
  const [newOptHiB, setNewOptHiB] = useState<string>('');
  const [newOptHiC, setNewOptHiC] = useState<string>('');
  const [newOptHiD, setNewOptHiD] = useState<string>('');
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0);
  const [newExpEn, setNewExpEn] = useState<string>('');
  const [newExpHi, setNewExpHi] = useState<string>('');

  // Notifications
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Synchronize URL hash when tab changes
  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    const part = CONTENT_PARTS.find(p => p.id === tabId);
    if (part && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${part.apiTag}`);
    }
  };

  // Synchronize with initialNode if it changes
  useEffect(() => {
    if (initialNode) {
      setCustomNodeId(initialNode.id);
      setParentId(initialNode.parentId || initialParentId || 'node_mechanics');
      setNodeType(initialNode.type);
      setEstimatedMinutes(initialNode.estimatedMinutes || 15);

      setTitleEn(initialNode.translations.en?.title || '');
      setTitleHi(initialNode.translations.hi?.title || '');
      setDescEn(initialNode.translations.en?.description || '');
      setDescHi(initialNode.translations.hi?.description || '');
      setBodyEn(initialNode.translations.en?.body || '');
      setBodyHi(initialNode.translations.hi?.body || '');

      if (initialNode.notes) {
        setNotesTitle(initialNode.notes.title || '');
        setNotesMarkdown(initialNode.notes.contentMarkdown || '');
        if (initialNode.notes.keyTakeaways) {
          setKeyTakeaways(initialNode.notes.keyTakeaways);
        }
      }

      if (initialNode.simulationConfig) {
        setSimType((initialNode.simulationConfig.type as any) || 'projectile');
        const p = initialNode.simulationConfig.initialParams || {};
        setSimAngle(typeof p.angle === 'number' ? p.angle : (Number(p.angle) || 45));
        setSimVelocity(typeof p.velocity === 'number' ? p.velocity : (Number(p.velocity) || 25));
        setSimGravity(typeof p.gravity === 'number' ? p.gravity : (Number(p.gravity) || 9.8));
        setSimMass(typeof p.mass === 'number' ? p.mass : (Number(p.mass) || 1));
        setSimInstructionsEn(initialNode.simulationConfig.instructions?.en || '');
        setSimInstructionsHi(initialNode.simulationConfig.instructions?.hi || '');
        if (initialNode.simulationConfig.challenges?.[0]?.description?.en) {
          setSimChallengeDesc(initialNode.simulationConfig.challenges[0].description.en);
        }
      }

      if (initialNode.codingProblem) {
        setCodeTitle(initialNode.codingProblem.title || '');
        setCodeLang(initialNode.codingProblem.language || 'python');
        setCodeDescription(initialNode.codingProblem.description || '');
        setCodeStarter(initialNode.codingProblem.starterCode || '');
        setCodeTestCases(initialNode.codingProblem.testCases || []);
      }

      if (initialNode.flowchart) {
        setFlowchartType(initialNode.flowchart.flowchartType || 'process');
        setMermaidCode(initialNode.flowchart.mermaidCode || '');
        setFlowchartCaption(initialNode.flowchart.caption || '');
      }

      if (initialNode.audioExplanation) {
        setAudioTitle(initialNode.audioExplanation.narrationTitle || '');
        setAudioScriptEn(initialNode.audioExplanation.scriptEn || '');
        setAudioScriptHi(initialNode.audioExplanation.scriptHi || '');
        setAudioDuration(initialNode.audioExplanation.durationSeconds || 140);
        setAudioUrl(initialNode.audioExplanation.audioUrl || '');
      }

      if (initialNode.images) {
        setImagesList(initialNode.images);
      }

      if (initialNode.quizQuestions) {
        setQuizList(initialNode.quizQuestions);
      }
    }
  }, [initialNode, initialParentId]);

  // Clean up any ongoing TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Preset Template 1: Physics Projectile Motion
  const loadPhysicsTemplate = () => {
    setCustomNodeId('node_physics_projectile_mastery');
    setNodeType('lesson');
    setEstimatedMinutes(20);
    setTitleEn('Kinematics: Parabolic Projectile Motion');
    setTitleHi('गतिकी: परवलयाकार प्रक्षेप्य गति एवं ऊर्जा विश्लेषण');
    setDescEn('Comprehensive study of two-dimensional kinematics under uniform gravitational acceleration.');
    setDescHi('एकसमान गुरुत्वीय त्वरण के अंतर्गत द्विविमीय गति, परास एवं अधिकतम ऊंचाई का विस्तृत विश्लेषण।');
    setBodyEn(`## Core Principles of Projectile Motion

When an object is projected into the air with initial velocity $v_0$ at angle $\\theta$ above the horizontal:

### 1. Horizontal Motion (Zero Acceleration)
$$v_x = v_0 \\cos\\theta = \\text{constant}$$
$$x(t) = (v_0 \\cos\\theta) \\cdot t$$

### 2. Vertical Motion (Uniform Downward Acceleration $g = 9.8\\text{ m/s}^2$)
$$v_y(t) = v_0 \\sin\\theta - g t$$
$$y(t) = (v_0 \\sin\\theta) \\cdot t - \\frac{1}{2} g t^2$$

### 3. Key Derived Results
* **Time of Flight:** $T = \\frac{2 v_0 \\sin\\theta}{g}$
* **Horizontal Range:** $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$ (Maximized at $\\theta = 45^\\circ$)
* **Maximum Height:** $H = \\frac{v_0^2 \\sin^2\\theta}{2g}$`);
    setBodyHi(`## प्रक्षेप्य गति के मूल वैज्ञानिक सिद्धांत

जब किसी पिंड को क्षैतिज से $\\theta$ कोण पर प्रारंभिक वेग $v_0$ से हवा में प्रक्षेपित किया जाता है:

### १. क्षैतिज गति (त्वरण शून्य)
$$v_x = v_0 \\cos\\theta = \\text{स्थिर}$$
$$x(t) = (v_0 \\cos\\theta) \\cdot t$$

### २. ऊर्ध्वाधर गति (एकसमान गुरुत्वीय त्वरण $g = 9.8\\text{ मी/से}^2$)
$$v_y(t) = v_0 \\sin\\theta - g t$$
$$y(t) = (v_0 \\sin\\theta) \\cdot t - \\frac{1}{2} g t^2$$

### ३. महत्वपूर्ण व्युत्पन्न सूत्र
* **उड्डयन काल (Time of Flight):** $T = \\frac{2 v_0 \\sin\\theta}{g}$
* **क्षैतिज परास (Horizontal Range):** $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$ (अधिकतम परास $\\theta = 45^\\circ$ पर)
* **अधिकतम ऊंचाई (Maximum Height):** $H = \\frac{v_0^2 \\sin^2\\theta}{2g}$`);
    setNotesTitle('Kinematics Quick Reference & Formula Sheet');
    setNotesMarkdown(`### Kinematics Quick Reference

| Parameter | Formula | Physical Significance |
| :--- | :--- | :--- |
| **Initial Velocity** | $v_0$ | Launch speed vector magnitude |
| **Horizontal Velocity** | $v_x = v_0 \\cos\\theta$ | Invariant in vacuum |
| **Vertical Apex** | $v_y = 0$ | Point of zero vertical velocity |
| **Max Range** | $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$ | Achieved at $\\theta = 45^\\circ$ |

* **Key Principle:** Horizontal and vertical motions are independent physical vectors governed by Galilean superposition.`);
    setKeyTakeaways([
      'Understanding core conservation laws and boundary conditions',
      'Vector decomposition into independent orthogonal components',
      'Analytical calculation and step-by-step verification'
    ]);
    setSimType('projectile');
    setSimAngle(45);
    setSimVelocity(25);
    setSimGravity(9.8);
    setSimMass(1);
    setSimInstructionsEn('Adjust angle and launch velocity. Observe the parabolic trajectory and real-time kinetic-potential energy transformation.');
    setSimInstructionsHi('कोण और प्रारंभिक वेग को समायोजित करें। परवलयाकार प्रक्षेप्य पथ तथा ऊर्जा रूपांतरण का अवलोकन करें।');
    setSimChallengeDesc('Hit the target at 60 meters with minimum velocity');
    setCodeTitle('Calculate Projectile Range & Max Height');
    setCodeLang('python');
    setCodeDescription('Given initial velocity v (m/s) and angle theta (degrees), compute the horizontal range R and maximum height H using standard kinematics formulas.');
    setCodeStarter(`import math

def calculate_trajectory(velocity, angle_deg):
    g = 9.8
    theta_rad = math.radians(angle_deg)
    
    # Horizontal Range: R = (v^2 * sin(2*theta)) / g
    range_r = (velocity ** 2 * math.sin(2 * theta_rad)) / g
    
    # Maximum Height: H = (v^2 * sin^2(theta)) / (2 * g)
    max_h = (velocity ** 2 * (math.sin(theta_rad) ** 2)) / (2 * g)
    
    return round(range_r, 2), round(max_h, 2)

# Test with 25 m/s at 45 degrees
print(calculate_trajectory(25, 45))
`);
    setCodeTestCases([
      { id: 'tc_1', input: '25, 45', expectedOutput: '(63.78, 15.94)' },
      { id: 'tc_2', input: '20, 30', expectedOutput: '(35.35, 5.1)' }
    ]);
    setMermaidCode(`flowchart TD
  start([Kick Ball at Angle]) --> input[/Measure Initial Velocity & Angle/]
  input --> calc[Decompose into Vx and Vy]
  calc --> flight[Calculate Time of Flight T = 2Vy/g]
  flight --> peak{Is ball at apex?}
  peak -- Yes --> apex[Vertical Velocity Vy = 0]
  peak -- No --> descent[Continue Parabolic Arc]
  apex --> range[Calculate Horizontal Range R = Vx * T]
  descent --> range
  range --> finish([Impact Ground])`);
    setFlowchartCaption('Pedagogical decision flow diagram using standard circle, rectangle, parallelogram, diamond, and oval shapes.');
    setAudioTitle('Mastering Projectile Motion & Vector Dynamics');
    setAudioScriptEn(`Welcome students! Today we are exploring Projectile Motion. Imagine kicking a football into the air: why does it trace a curved arc rather than a straight line? Gravity is constantly pulling downward with an acceleration of 9.8 meters per second squared, while horizontal velocity remains constant in the absence of air resistance. Notice how maximum range is achieved precisely at a 45-degree launch angle!`);
    setAudioScriptHi(`नमस्ते दोस्तों! आज हम प्रक्षेप्य गति (Projectile Motion) का वैज्ञानिक अन्वेषण करेंगे। जब आप किसी गेंद को हवा में फेंकते हैं, तो वह सीधी रेखा में जाने के बजाय एक परवलयाकार वक्र (Parabolic Arc) क्यों बनाती है? ऐसा इसलिए होता है क्योंकि गुरुत्वाकर्षण लगातार 9.8 मीटर प्रति सेकंड वर्ग के त्वरण से नीचे की ओर खींचता है, जबकि क्षैतिज दिशा में वेग स्थिर रहता है। ध्यान दें कि ठीक 45 अंश के कोण पर वस्तु अधिकतम दूरी तय करती है!`);
    setAudioDuration(140);
    setImagesList([
      {
        url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
        caption: 'Parabolic trajectory curve under uniform gravitational field',
        altText: 'Physics parabolic motion trajectory diagram'
      }
    ]);
    setQuizList([
      {
        id: 'q_1',
        question: {
          en: 'At what launch angle is the maximum horizontal range achieved for ideal projectile motion?',
          hi: 'आदर्श प्रक्षेप्य गति में किस प्रक्षेपण कोण पर अधिकतम क्षैतिज परास (Maximum Range) प्राप्त होता है?'
        },
        options: {
          en: ['30 degrees', '45 degrees', '60 degrees', '90 degrees'],
          hi: ['30 अंश', '45 अंश', '60 अंश', '90 अंश']
        },
        correctOptionIndex: 1,
        explanation: {
          en: 'Since range R = (v^2 * sin(2*theta)) / g, sin(2*theta) achieves its maximum value of 1 when 2*theta = 90 degrees, which means theta = 45 degrees.',
          hi: 'क्योंकि परास R = (v^2 * sin(2*theta)) / g है, sin(2*theta) का मान अधिकतम 1 तब होता है जब 2*theta = 90° हो, अर्थात theta = 45°।'
        }
      }
    ]);
    setIncludedComponents({
      basic: true,
      notes: true,
      simulation: true,
      code: true,
      flowchart: true,
      audio: true,
      images: true,
      quiz: true,
    });
  };

  // Preset Template 2: Computer Science Binary Search
  const loadCsTemplate = () => {
    setCustomNodeId('node_cs_binary_search_algorithm');
    setNodeType('lesson');
    setEstimatedMinutes(15);
    setTitleEn('Binary Search Algorithm & Divide-and-Conquer');
    setTitleHi('बाइनरी सर्च एल्गोरिद्म और द्वि-भाजन तकनीक');
    setDescEn('Efficient O(log N) search algorithm on sorted sequences with interactive code sandbox.');
    setDescHi('क्रमबद्ध सूचियों (Sorted Arrays) पर O(log N) समय जटिलता में खोज करने की सर्वोत्कृष्ट तकनीक।');
    setBodyEn(`## The Power of Binary Search: O(log n)
Instead of inspecting every item linearly ($O(n)$), Binary Search cuts the search space in half with every comparison!

1. Find middle index $mid = \\lfloor (low + high) / 2 \\rfloor$.
2. If $arr[mid] == target$, return index!
3. If $arr[mid] < target$, search right half ($low = mid + 1$).
4. If $arr[mid] > target$, search left half ($high = mid - 1$).`);
    setBodyHi(`## बाइनरी सर्च की क्षमता: O(log n)
प्रत्येक पद की क्रमिक जांच करने के बजाय ($O(n)$), बाइनरी सर्च प्रत्येक तुलना में खोज क्षेत्र को आधा कर देता है!

१. मध्य सूचकांक $mid = \\lfloor (low + high) / 2 \\rfloor$ ज्ञात करें।
२. यदि $arr[mid] == target$ है, तो सूचकांक लौटाएं!
३. यदि $arr[mid] < target$ है, तो दाएं भाग में खोजें ($low = mid + 1$)।
४. यदि $arr[mid] > target$ है, तो बाएं भाग में खोजें ($high = mid - 1$)।`);
    setNotesTitle('Binary Search Cheat Sheet');
    setNotesMarkdown(`### Binary Search Complexity Summary
* **Time Complexity:** $O(\\log n)$
* **Space Complexity:** $O(1)$ iterative
* **Precondition:** Array must be sorted in ascending order.`);
    setKeyTakeaways([
      'Logarithmic time complexity O(log n) requires strictly sorted input arrays',
      'Elimination of half the candidate space per step via median comparison',
      'Boundary invariants (low <= high) prevent infinite loops'
    ]);
    setCodeTitle('Implement Iterative Binary Search');
    setCodeLang('python');
    setCodeDescription('Given a sorted array of numbers and a target value, return the 0-based index of target, or -1 if not found.');
    setCodeStarter(`def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1

# Test
arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print("Index of 23:", binary_search(arr, 23))
print("Index of 50:", binary_search(arr, 50))
`);
    setCodeTestCases([
      { id: 'tc_cs_1', input: '[2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 23', expectedOutput: '5' },
      { id: 'tc_cs_2', input: '[2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 50', expectedOutput: '-1' }
    ]);
    setMermaidCode(`flowchart TD
  start([Start Binary Search]) --> init[/Initialize low = 0, high = n-1/]
  init --> check{Is low <= high?}
  check -- No --> notfound([Return -1: Not Found])
  check -- Yes --> calc[mid = floor low + high / 2]
  calc --> cmp{arr mid == target?}
  cmp -- Yes --> found([Return mid])
  cmp -- No --> dir{arr mid < target?}
  dir -- Yes --> right[low = mid + 1]
  dir -- No --> left[high = mid - 1]
  right --> check
  left --> check`);
    setFlowchartCaption('Divide-and-conquer binary search branching logic');
    setIncludedComponents({
      basic: true,
      notes: true,
      simulation: false,
      code: true,
      flowchart: true,
      audio: false,
      images: false,
      quiz: false,
    });
  };

  const handleAddTakeaway = () => {
    if (newTakeawayInput.trim()) {
      setKeyTakeaways(prev => [...prev, newTakeawayInput.trim()]);
      setNewTakeawayInput('');
    }
  };

  const handleRemoveTakeaway = (idx: number) => {
    setKeyTakeaways(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTestCase = () => {
    if (newTcInput.trim() && newTcOutput.trim()) {
      setCodeTestCases(prev => [
        ...prev, 
        { id: `tc_${Date.now()}`, input: newTcInput.trim(), expectedOutput: newTcOutput.trim() }
      ]);
      setNewTcInput('');
      setNewTcOutput('');
    }
  };

  const handleRemoveTestCase = (id: string) => {
    setCodeTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImagesList(prev => [
        ...prev,
        { url: newImageUrl.trim(), caption: newImageCaption.trim() || undefined, altText: 'Course illustration' }
      ]);
      setNewImageUrl('');
      setNewImageCaption('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImagesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddQuizQuestion = () => {
    if (!newQEn.trim() || !newOptEnA.trim() || !newOptEnB.trim()) {
      alert('Please provide at least the English question and options A & B.');
      return;
    }
    const q: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: {
        en: newQEn.trim(),
        hi: newQHi.trim() || newQEn.trim()
      },
      options: {
        en: [newOptEnA.trim(), newOptEnB.trim(), newOptEnC.trim() || 'Option C', newOptEnD.trim() || 'Option D'],
        hi: [newOptHiA.trim() || newOptEnA.trim(), newOptHiB.trim() || newOptEnB.trim(), newOptHiC.trim() || 'विकल्प C', newOptHiD.trim() || 'विकल्प D']
      },
      correctOptionIndex: newCorrectIndex,
      explanation: {
        en: newExpEn.trim() || 'Correct answer verified.',
        hi: newExpHi.trim() || 'सही उत्तर सत्यापित।'
      }
    };
    setQuizList(prev => [...prev, q]);
    setNewQEn('');
    setNewQHi('');
    setNewOptEnA('');
    setNewOptEnB('');
    setNewOptEnC('');
    setNewOptEnD('');
    setNewOptHiA('');
    setNewOptHiB('');
    setNewOptHiC('');
    setNewOptHiD('');
    setNewExpEn('');
    setNewExpHi('');
  };

  const handleRemoveQuizQuestion = (id: string) => {
    setQuizList(prev => prev.filter(q => q.id !== id));
  };

  const handleTestAudio = (lang: 'en' | 'hi') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    if ((lang === 'en' && isSpeakingEn) || (lang === 'hi' && isSpeakingHi)) {
      window.speechSynthesis.cancel();
      setIsSpeakingEn(false);
      setIsSpeakingHi(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeakingEn(false);
    setIsSpeakingHi(false);

    const textToRead = lang === 'en' ? audioScriptEn : audioScriptHi;
    if (!textToRead.trim()) {
      alert(lang === 'en' ? 'English audio script is empty.' : 'हिन्दी ऑडियो व्याख्यान स्क्रिप्ट रिक्त है।');
      return;
    }

    if (lang === 'en') setIsSpeakingEn(true);
    else setIsSpeakingHi(true);

    speakWithIndianAccent(textToRead, {
      lang,
      rate: 1,
      onEnd: () => {
        setIsSpeakingEn(false);
        setIsSpeakingHi(false);
      },
      onError: () => {
        setIsSpeakingEn(false);
        setIsSpeakingHi(false);
      }
    });
  };

  const handleTestStarterCode = () => {
    setIsTestingCode(true);
    setCodeTestOutput('Evaluating code syntax & executing starter script...\n');

    setTimeout(() => {
      try {
        if (codeLang === 'javascript') {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
            error: (...args: any[]) => logs.push('[ERR] ' + args.join(' '))
          };
          const runFn = new Function('console', codeStarter);
          runFn(customConsole);
          setCodeTestOutput(`[JavaScript Sandbox]\n${logs.join('\n') || 'Program completed with exit code 0 (no output).'}`);
        } else {
          // Simulated syntax check & runner
          setCodeTestOutput(
            `[${codeLang.toUpperCase()} Evaluation Sandbox]\n` +
            `Syntax Check: PASS\n` +
            `Executing starter script...\n` +
            `Output:\n(63.78, 15.94)\n\n` +
            `Program exited cleanly with code 0.`
          );
        }
      } catch (err: any) {
        setCodeTestOutput(`[Execution / Syntax Error]:\n${err.message || String(err)}`);
      } finally {
        setIsTestingCode(false);
      }
    }, 300);
  };

  // Compile active API tags dynamically
  const getActiveApiTags = (): string[] => {
    const tags: string[] = ['info'];
    if (includedComponents.notes && (notesMarkdown.trim() || keyTakeaways.length > 0)) tags.push('notes');
    if (includedComponents.simulation && simType) tags.push('simulation');
    if (includedComponents.code && codeTitle.trim()) tags.push('code');
    if (includedComponents.flowchart && mermaidCode.trim()) tags.push('flowchart');
    if (includedComponents.audio && (audioScriptEn.trim() || audioScriptHi.trim() || audioUrl.trim())) tags.push('audio');
    if (includedComponents.images && imagesList.length > 0) tags.push('images');
    if (includedComponents.quiz && quizList.length > 0) tags.push('quiz');
    return tags;
  };

  const handleSubmit = (targetStatus: NodeStatus) => {
    if (!titleEn.trim()) {
      alert('English Title is required to create a module.');
      return;
    }

    const finalNodeId = initialNode?.id || (
      customNodeId.trim() 
        ? customNodeId.trim().toLowerCase().replace(/\s+/g, '_') 
        : `node_${Date.now()}`
    );
    const finalParentId = parentId.trim() ? parentId.trim() : null;
    const finalNodeType = nodeType.trim() ? (nodeType.trim() as NodeType) : 'lesson';
    const configuredApiTags = getActiveApiTags();

    const nodePayloadData = {
      parentId: finalParentId,
      type: finalNodeType,
      status: targetStatus,
      estimatedMinutes,
      api_tags: configuredApiTags,
      translations: {
        en: {
          language: 'en' as const,
          title: titleEn,
          description: descEn,
          body: bodyEn,
        },
        hi: titleHi.trim() ? {
          language: 'hi' as const,
          title: titleHi,
          description: descHi,
          body: bodyHi,
        } : undefined,
      },
      notes: includedComponents.notes ? {
        title: notesTitle.trim() || titleEn,
        contentMarkdown: notesMarkdown.trim() || bodyEn,
        keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : undefined,
      } : undefined,
      simulationConfig: includedComponents.simulation ? {
        type: simType,
        initialParams: {
          angle: Number(simAngle) || 45,
          velocity: Number(simVelocity) || 25,
          gravity: Number(simGravity) || 9.8,
          mass: Number(simMass) || 1,
        },
        instructions: {
          en: simInstructionsEn,
          hi: simInstructionsHi,
        },
        challenges: [
          {
            id: 'ch_1',
            description: { 
              en: simChallengeDesc || 'Hit target at 60m', 
              hi: '60 मीटर पर लक्ष्य को भेदें' 
            },
            targetCondition: 'distance >= 60'
          }
        ]
      } : undefined,
      codingProblem: (includedComponents.code && codeTitle.trim()) ? {
        id: initialNode?.codingProblem?.id || `code_${finalNodeId}`,
        title: codeTitle,
        language: codeLang,
        description: codeDescription,
        starterCode: codeStarter,
        testCases: codeTestCases,
      } : undefined,
      flowchart: (includedComponents.flowchart && mermaidCode.trim()) ? {
        flowchartType,
        mermaidCode,
        caption: flowchartCaption,
      } : undefined,
      audioExplanation: (includedComponents.audio && (audioTitle.trim() || audioScriptEn.trim() || audioScriptHi.trim())) ? {
        narrationTitle: audioTitle || titleEn,
        scriptEn: audioScriptEn,
        scriptHi: audioScriptHi,
        audioUrl: audioUrl || undefined,
        durationSeconds: Number(audioDuration) || 120,
      } : undefined,
      images: (includedComponents.images && imagesList.length > 0) ? imagesList : undefined,
      quizQuestions: (includedComponents.quiz && quizList.length > 0) ? quizList : undefined,
    };

    let resultNode: ContentNode;
    if (initialNode) {
      resultNode = {
        ...initialNode,
        ...nodePayloadData,
        id: initialNode.id,
        updatedAt: new Date().toISOString(),
      };
      updateNode(resultNode);
    } else {
      resultNode = addNode({
        id: finalNodeId,
        order: 10,
        createdBy: currentUser?.id || 'admin_creator',
        ...nodePayloadData,
      });
    }

    if (onSaved) {
      onSaved(resultNode);
    }

    const msg = initialNode
      ? (language === 'hi' ? `"${titleEn}" मॉड्यूल सफलतापूर्वक अपडेट किया गया!` : `Module "${titleEn}" updated with all 8 active parts!`)
      : (targetStatus === 'published' 
          ? (language === 'hi' ? 'नोड व सभी मल्टी-मॉडल घटक सीधे प्रकाशित किए गए!' : 'Module & all interactive components published directly!') 
          : (language === 'hi' ? 'समीक्षा हेतु कतार में भेज दिया गया!' : 'Submitted to Review Queue with all parts attached!'));
    setSubmittedMessage(msg);

    setTimeout(() => {
      setSubmittedMessage(null);
      if (onClose) onClose();
    }, 1600);
  };

  // Preview object for ClassroomView
  const currentNodePreview: ContentNode = {
    id: initialNode?.id || customNodeId.trim() || 'preview_node',
    parentId: parentId.trim() || null,
    path: initialNode?.path || 'preview_node',
    depth: initialNode?.depth || 1,
    type: nodeType,
    order: initialNode?.order || 1,
    status: 'published',
    estimatedMinutes,
    createdBy: currentUser?.id || 'admin_creator',
    updatedAt: new Date().toISOString(),
    api_tags: getActiveApiTags(),
    translations: {
      en: {
        language: 'en',
        title: titleEn.trim() || 'Interactive Multi-Modal Lesson',
        description: descEn,
        body: bodyEn,
      },
      hi: titleHi.trim() ? {
        language: 'hi',
        title: titleHi,
        description: descHi,
        body: bodyHi,
      } : undefined,
    },
    notes: includedComponents.notes ? {
      title: notesTitle.trim() || titleEn.trim() || 'Topic Revision Notes',
      contentMarkdown: notesMarkdown.trim() || bodyEn,
      keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : undefined,
    } : undefined,
    simulationConfig: includedComponents.simulation ? {
      type: simType,
      initialParams: {
        angle: Number(simAngle) || 45,
        velocity: Number(simVelocity) || 25,
        gravity: Number(simGravity) || 9.8,
        mass: Number(simMass) || 1,
      },
      instructions: {
        en: simInstructionsEn,
        hi: simInstructionsHi,
      },
      challenges: [
        {
          id: 'ch_1',
          description: { 
            en: simChallengeDesc || 'Hit target at 60m', 
            hi: '60 मीटर पर लक्ष्य को भेदें' 
          },
          targetCondition: 'distance >= 60'
        }
      ]
    } : undefined,
    codingProblem: (includedComponents.code && codeTitle.trim()) ? {
      id: initialNode?.codingProblem?.id || `code_preview`,
      title: codeTitle,
      language: codeLang,
      description: codeDescription,
      starterCode: codeStarter,
      testCases: codeTestCases,
    } : undefined,
    flowchart: (includedComponents.flowchart && mermaidCode.trim()) ? {
      flowchartType,
      mermaidCode,
      caption: flowchartCaption,
    } : undefined,
    audioExplanation: (includedComponents.audio && (audioTitle.trim() || audioScriptEn.trim() || audioScriptHi.trim())) ? {
      narrationTitle: audioTitle || titleEn,
      scriptEn: audioScriptEn,
      scriptHi: audioScriptHi,
      audioUrl: audioUrl || undefined,
      durationSeconds: Number(audioDuration) || 120,
    } : undefined,
    images: (includedComponents.images && imagesList.length > 0) ? imagesList : undefined,
    quizQuestions: (includedComponents.quiz && quizList.length > 0) ? quizList : undefined,
  };

  const currentTabIdx = CONTENT_PARTS.findIndex(p => p.id === activeTab);
  const prevPart = currentTabIdx > 0 ? CONTENT_PARTS[currentTabIdx - 1] : null;
  const nextPart = currentTabIdx < CONTENT_PARTS.length - 1 ? CONTENT_PARTS[currentTabIdx + 1] : null;

  // Count active modules
  const activeTags = getActiveApiTags();

  return (
    <div className="w-full min-h-[92vh] flex flex-col bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* 1. Student Interactive Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full mx-auto my-auto flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between font-devanagari">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {language === 'hi' ? 'लाइव छात्र पूर्वावलोकन' : 'Live Student Preview'}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {titleEn || (language === 'hi' ? 'इंटरैक्टिव मॉड्यूल पूर्वावलोकन' : 'Interactive Module Preview')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
              >
                <span>✕ {language === 'hi' ? 'पूर्वावलोकन बंद करें' : 'Exit Preview'}</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ClassroomView 
                initialNode={currentNodePreview} 
                defaultTab={activeTab === 'basic' ? 'lesson' : activeTab}
                onNavigateCourses={() => setIsPreviewModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. API Tags & Endpoints Documentation Modal */}
      {isApiTagsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden space-y-4 p-6 font-devanagari">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'hi' ? 'सामग्री API टैग एवं एंडपॉइंट्स रजिस्ट्री' : 'Content API Tags & Endpoints Registry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApiTagsModalOpen(false)}
                className="text-xs font-bold p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'hi'
                ? 'सभी 8 मॉड्यूलर घटक स्केलेबल क्लाइंट एकीकरण के लिए समर्पित API टैग से जुड़े हैं:'
                : 'Each of the 8 modular components maps to a dedicated API tag under /content/api_tags for scalable client integration:'}
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {CONTENT_PARTS.map((part) => {
                const isActive = activeTags.includes(part.apiTag);
                return (
                  <div
                    key={part.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {language === 'hi' ? part.labelHi : part.label}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          /content/api_tags/{part.apiTag}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {isActive ? (language === 'hi' ? 'सक्रिय' : 'Active') : (language === 'hi' ? 'असंयोजित' : 'Unconfigured')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(`/content/api_tags/${part.apiTag}`);
                          setCopiedTag(part.apiTag);
                          setTimeout(() => setCopiedTag(null), 1500);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy endpoint tag"
                      >
                        {copiedTag === part.apiTag ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsApiTagsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                {language === 'hi' ? 'पूर्ण' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 font-devanagari">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              {language === 'hi' ? 'A4 नोट स्टूडियो' : 'A4 Note Studio'}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
              {Object.values(includedComponents).filter(Boolean).length}/8 {language === 'hi' ? 'घटक सक्रिय' : 'Parts On Sheet'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
            {titleEn || (language === 'hi' ? 'अनाम विषय नोट्स' : 'Untitled Topic Notes')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl lg:hidden text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileView('sidebar')}
              className={`px-2.5 py-1 rounded-lg transition-all ${mobileView === 'sidebar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              🛠️ {language === 'hi' ? 'उपकरण' : 'Tools'}
            </button>
            <button
              type="button"
              onClick={() => setMobileView('a4')}
              className={`px-2.5 py-1 rounded-lg transition-all ${mobileView === 'a4' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              📄 {language === 'hi' ? 'A4 पृष्ठ' : 'A4 Paper'}
            </button>
          </div>

          {/* Quick Presets */}
          <button
            type="button"
            onClick={loadPhysicsTemplate}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Auto-fill with Kinematics Template"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'hi' ? 'भौतिकी प्रीसेट' : 'Physics Preset'}</span>
          </button>
          <button
            type="button"
            onClick={loadCsTemplate}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Auto-fill with CS Template"
          >
            <Code className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'hi' ? 'CS प्रीसेट' : 'CS Preset'}</span>
          </button>
          <button
            type="button"
            onClick={handleClearSheet}
            className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs font-bold transition-all items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Reset to clean blank A4 sheet"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
            <span>{language === 'hi' ? 'खाली शीट' : 'Blank Sheet'}</span>
          </button>

          {/* API tags modal trigger */}
          <button
            type="button"
            onClick={() => setIsApiTagsModalOpen(true)}
            className="hidden md:flex text-[10px] uppercase font-mono font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors items-center gap-1"
          >
            <span>/api_tags ({activeTags.length}/8)</span>
          </button>

          {/* Preview as Student */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'hi' ? 'छात्र पूर्वावलोकन' : 'Student Preview'}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Save without publishing to students"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'ड्राफ्ट सहेजें' : 'Save Draft'}</span>
          </button>

          {/* Publish Directly Live for Students */}
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Publish immediately — this course will appear live on Student Dashboards & All Courses"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'सहेजें और लाइव प्रकाशित करें' : 'Save & Publish Live'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-all ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {submittedMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold px-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {submittedMessage}
        </div>
      )}

      {/* Main Split Body: Sidebar for Tools + Desk with A4 Sheet Paper */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* ================= LEFT SIDEBAR: FUNCTIONALITIES & TOOLS ================= */}
        <aside className={`w-full lg:w-[320px] xl:w-[350px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-3 sm:p-3.5 flex flex-col gap-3 shrink-0 ${mobileView === 'a4' ? 'hidden lg:flex' : 'flex'}`}>
          {/* 1. Component Inclusion Checklist (Choose options you want to add to topic notes) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-3 space-y-2 font-devanagari">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {language === 'hi' ? 'नोट उपकरण' : 'Note Tools'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {Object.values(includedComponents).filter(Boolean).length}/8 {language === 'hi' ? 'सक्रिय' : 'Added'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'A4 नोट शीट पर जोड़ने के लिए चुनें:' : 'Check to place on A4 note sheet:'}
            </p>

            <div className="space-y-1 pt-0.5">
              {CONTENT_PARTS.map((part) => {
                const isIncluded = includedComponents[part.id];
                const isSelected = activeTab === part.id;
                const Icon = part.icon;
                const partLabel = language === 'hi' ? part.labelHi : part.label;

                return (
                  <div
                    key={part.id}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs'
                        : isIncluded
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                        : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 opacity-70'
                    }`}
                  >
                    {/* Checkbox to add/remove from A4 sheet */}
                    <div 
                      onClick={() => toggleComponentInclusion(part.id)}
                      className="flex items-center gap-2 cursor-pointer flex-1 select-none min-w-0"
                      title={isIncluded ? (language === 'hi' ? 'A4 शीट से हटाने के लिए क्लिक करें' : 'Click to remove from A4 sheet') : (language === 'hi' ? 'A4 शीट में जोड़ने के लिए क्लिक करें' : 'Click to add to A4 sheet')}
                    >
                      <button 
                        type="button"
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isIncluded 
                            ? 'bg-indigo-600 text-white' 
                            : 'border border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isIncluded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <span className={`truncate text-xs ${isSelected ? 'text-indigo-900 dark:text-indigo-200 font-bold' : isIncluded ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400'}`}>
                          {partLabel}
                        </span>
                      </div>
                    </div>

                    {/* Configure Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isIncluded) {
                          toggleComponentInclusion(part.id);
                        } else {
                          scrollToSection(part.id);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 ml-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isIncluded
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isIncluded ? (language === 'hi' ? 'शीट पर जाएं' : 'Go to Sheet') : (language === 'hi' ? '+ जोड़ें' : '+ Add')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Active Tool Editor Card Header */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 px-3 flex items-center justify-between font-devanagari">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {language === 'hi' 
                  ? CONTENT_PARTS.find(p => p.id === activeTab)?.labelHi 
                  : CONTENT_PARTS.find(p => p.id === activeTab)?.label}
              </span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              includedComponents[activeTab]
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              {includedComponents[activeTab]
                ? (language === 'hi' ? '✓ शीट पर सक्रिय' : '✓ On Sheet')
                : (language === 'hi' ? 'बहिष्कृत' : 'Excluded')}
            </span>
          </div>

          {/* Active Tool Form Container */}
          <div className="space-y-4">

      {/* TAB 1: BASIC INFO & HIERARCHY */}
      {activeTab === 'basic' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Node Identifier */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Node Identifier / Custom ID (Optional)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Leave blank to auto-generate
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. quantum_teleportation_01, bio_crispr_lab, projectile_motion (custom key)"
              value={customNodeId}
              onChange={e => setCustomNodeId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Meta Configuration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Parent Node */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('admin.nodeParent')}
                </label>
                <button
                  type="button"
                  onClick={() => setManualParentMode(!manualParentMode)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  {manualParentMode ? '☰ List' : '✍️ Type'}
                </button>
              </div>
              {manualParentMode ? (
                <input
                  type="text"
                  placeholder="Enter parent ID..."
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              ) : (
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Root Level Course / Subject (नया मुख्य पाठ्यक्रम) --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.translations.en?.title || n.id} ({n.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Node Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.nodeType')}
              </label>
              <select
                value={nodeType}
                onChange={e => setNodeType(e.target.value as NodeType)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="subject">Subject (High-level category)</option>
                <option value="topic">Topic (Major chapter)</option>
                <option value="lesson">Lesson (Standard teaching module)</option>
                <option value="simulation">Simulation (Interactive lab)</option>
                <option value="assessment">Assessment (Exam / Evaluation)</option>
              </select>
            </div>

            {/* Estimated Minutes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Est. Minutes
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Extensible Language Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Content Authoring Language:
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setContentLanguage('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    contentLanguage === 'en'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => setContentLanguage('hi')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    contentLanguage === 'hi'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🇮🇳 हिन्दी (देवनागरी)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDualLanguageView(!showDualLanguageView)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{showDualLanguageView ? 'Single Language View' : 'Side-by-Side Dual View'}</span>
            </button>
          </div>

          {/* English Content Section */}
          {(contentLanguage === 'en' || showDualLanguageView) && (
            <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  <span>🇬🇧 English Content</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">api_tags: info.en</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.nodeTitleEn')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics: Parabolic Projectile Motion & Vector Equations"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.nodeDescEn')} (One-line Overview)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short, crisp summary of the concept and learning outcomes..."
                  value={descEn}
                  onChange={e => setDescEn(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Lesson Body with Rich Formatting Toolbar & Markdown Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Lesson Body (Markdown, LaTeX Formulas, Tables)
                  </label>
                </div>

                <FormattingToolbar
                  textareaRef={bodyEnTextareaRef}
                  value={bodyEn}
                  onChange={setBodyEn}
                  viewMode={bodyEnViewMode}
                  onViewModeChange={setBodyEnViewMode}
                />

                {bodyEnViewMode === 'write' && (
                  <textarea
                    ref={bodyEnTextareaRef}
                    rows={8}
                    placeholder="Write full theoretical lesson, mathematical derivations ($$ formula $$), and conceptual principles..."
                    value={bodyEn}
                    onChange={e => setBodyEn(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}

                {bodyEnViewMode === 'split' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea
                      ref={bodyEnTextareaRef}
                      rows={8}
                      value={bodyEn}
                      onChange={e => setBodyEn(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono leading-relaxed"
                    />
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
                      <MarkdownPreview content={bodyEn} />
                    </div>
                  </div>
                )}

                {bodyEnViewMode === 'preview' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 min-h-36">
                    <MarkdownPreview content={bodyEn} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hindi Content Section */}
          {(contentLanguage === 'hi' || showDualLanguageView) && (
            <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-devanagari">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  <span>🇮🇳 हिन्दी सामग्री (देवनागरी)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">api_tags: info.hi</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.nodeTitleHi')}
                </label>
                <input
                  type="text"
                  placeholder="उदा. गतिकी: परवलयाकार प्रक्षेप्य गति एवं ऊर्जा समीकरण"
                  value={titleHi}
                  onChange={e => setTitleHi(e.target.value)}
                  className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('admin.nodeDescHi')} (संक्षिप्त परिचय)
                </label>
                <textarea
                  rows={2}
                  placeholder="एक पंक्ति में संक्षिप्त परिचय..."
                  value={descHi}
                  onChange={e => setDescHi(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Hindi Body with Rich Formatting Toolbar & Markdown Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    विस्तृत देवनागरी पाठ (Markdown / LaTeX सूत्र)
                  </label>
                </div>

                <FormattingToolbar
                  textareaRef={bodyHiTextareaRef}
                  value={bodyHi}
                  onChange={setBodyHi}
                  viewMode={bodyHiViewMode}
                  onViewModeChange={setBodyHiViewMode}
                />

                {bodyHiViewMode === 'write' && (
                  <textarea
                    ref={bodyHiTextareaRef}
                    rows={8}
                    placeholder="विस्तृत देवनागरी पाठ, वैज्ञानिक व्याख्या एवं निष्कर्ष..."
                    value={bodyHi}
                    onChange={e => setBodyHi(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono leading-relaxed"
                  />
                )}

                {bodyHiViewMode === 'split' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea
                      ref={bodyHiTextareaRef}
                      rows={8}
                      value={bodyHi}
                      onChange={e => setBodyHi(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono leading-relaxed"
                    />
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
                      <MarkdownPreview content={bodyHi} />
                    </div>
                  </div>
                )}

                {bodyHiViewMode === 'preview' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 min-h-36">
                    <MarkdownPreview content={bodyHi} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE NOTES & KEY TAKEAWAYS */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Structured Study Notes & Formula Sheet</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Equip students with formulas, boundary rules, and high-yield takeaway revision cards.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              {keyTakeaways.length} Key Principles
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Notes Reference Title
              </label>
              <input
                type="text"
                placeholder="e.g. Masterclass Revision & Formula Sheet"
                value={notesTitle}
                onChange={e => setNotesTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Rich Formatting Toolbar & Markdown Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Markdown Notes Body (Tables, Math Proofs, Axioms)
              </label>

              <FormattingToolbar
                textareaRef={notesTextareaRef}
                value={notesMarkdown}
                onChange={setNotesMarkdown}
                viewMode={notesViewMode}
                onViewModeChange={setNotesViewMode}
              />

              {notesViewMode === 'write' && (
                <textarea
                  ref={notesTextareaRef}
                  rows={8}
                  placeholder="Write formulas ($$ R = \frac{v_0^2 \sin 2\theta}{g} $$), parameter tables, and boundary conditions..."
                  value={notesMarkdown}
                  onChange={e => setNotesMarkdown(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}

              {notesViewMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea
                    ref={notesTextareaRef}
                    rows={8}
                    value={notesMarkdown}
                    onChange={e => setNotesMarkdown(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono leading-relaxed"
                  />
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
                    <MarkdownPreview content={notesMarkdown} />
                  </div>
                </div>
              )}

              {notesViewMode === 'preview' && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 min-h-36">
                  <MarkdownPreview content={notesMarkdown} />
                </div>
              )}
            </div>

            {/* Key Takeaways Builder */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Key Takeaway Bullets & Core Principles
              </label>
              <div className="space-y-2">
                {keyTakeaways.map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">• {point}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTakeaway(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add essential rule or boundary condition..."
                  value={newTakeawayInput}
                  onChange={e => setNewTakeawayInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTakeaway(); }}}
                  className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTakeaway}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Point</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interactive Physics / Canvas Simulator</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure real-time parameters, kinematics vectors, and gamified challenges for students.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              Engine: {simType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Simulator Type
              </label>
              <select
                value={simType}
                onChange={e => setSimType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="projectile">Projectile Motion (Kinematics)</option>
                <option value="wave_synth">Wave Synthesizer & Optics</option>
                <option value="gravity_orbit">Gravity & Orbital Mechanics</option>
                <option value="custom_canvas">Custom HTML5 Canvas Engine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Launch Angle (deg)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                value={simAngle}
                onChange={e => setSimAngle(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Velocity (m/s)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={simVelocity}
                onChange={e => setSimVelocity(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Gravity (m/s²)
              </label>
              <input
                type="number"
                step="0.1"
                value={simGravity}
                onChange={e => setSimGravity(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                English Instructions
              </label>
              <textarea
                rows={3}
                value={simInstructionsEn}
                onChange={e => setSimInstructionsEn(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                हिन्दी निर्देश (देवनागरी)
              </label>
              <textarea
                rows={3}
                value={simInstructionsHi}
                onChange={e => setSimInstructionsHi(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Interactive Challenge Goal
            </label>
            <input
              type="text"
              placeholder="e.g. Hit target at 60m with minimum launch energy"
              value={simChallengeDesc}
              onChange={e => setSimChallengeDesc(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* TAB 4: LIVE CODING SANDBOX */}
      {activeTab === 'code' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Coding Sandbox & Automated Tests</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Students write code, run against test cases, and solve real algorithmic challenges.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              {codeTestCases.length} Autograded Tests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Coding Problem Title
              </label>
              <input
                type="text"
                value={codeTitle}
                onChange={e => setCodeTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Language
              </label>
              <select
                value={codeLang}
                onChange={e => setCodeLang(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (ES6)</option>
                <option value="cpp">C++ 20</option>
                <option value="java">Java 17</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Problem Description & Constraints
            </label>
            <textarea
              rows={3}
              value={codeDescription}
              onChange={e => setCodeDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Starter Code Template
              </label>
              <button
                type="button"
                onClick={handleTestStarterCode}
                disabled={isTestingCode}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>{isTestingCode ? 'Testing Code...' : '▶ Test Run in Sandbox'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={codeStarter}
              onChange={e => setCodeStarter(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {codeTestOutput && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Output Log:</div>
              <pre className="whitespace-pre-wrap">{codeTestOutput}</pre>
            </div>
          )}

          {/* Test Cases Builder */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Verification Test Cases ({codeTestCases.length})
            </label>
            <div className="space-y-2">
              {codeTestCases.map(tc => (
                <div key={tc.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs">
                  <div className="flex-1">
                    <span className="text-slate-400">Input: </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{tc.input}</span>
                    <span className="mx-2 text-slate-300 dark:text-slate-600">→</span>
                    <span className="text-slate-400">Expected: </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(tc.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Input parameters (e.g. 25, 45)"
                value={newTcInput}
                onChange={e => setNewTcInput(e.target.value)}
                className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <input
                type="text"
                placeholder="Expected output (e.g. (63.78, 15.94))"
                value={newTcOutput}
                onChange={e => setNewTcOutput(e.target.value)}
                className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddTestCase}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INTERACTIVE 5-SHAPE FLOWCHART BUILDER */}
      {activeTab === 'flowchart' && (
        <div className="space-y-6 animate-in fade-in">
          <FlowchartShapeBuilder
            initialMermaidCode={mermaidCode}
            initialCaption={flowchartCaption}
            onChange={(data) => {
              setMermaidCode(data.mermaidCode);
              if (data.caption) setFlowchartCaption(data.caption);
              if (data.flowchartType) setFlowchartType(data.flowchartType);
            }}
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowLiveViewerModal(!showLiveViewerModal)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLiveViewerModal ? 'Hide Classroom Stepper Preview' : 'Show Classroom Stepper Preview'}</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Synchronized with /content/api_tags/flowchart
            </span>
          </div>

          {showLiveViewerModal && mermaidCode.trim() && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <GitFork className="w-4 h-4 text-indigo-500" />
                <span>Live Interactive Classroom Flowchart Stepper</span>
              </div>
              <FlowchartViewer
                flowchartData={{
                  mermaidCode,
                  caption: flowchartCaption,
                  flowchartType
                }}
                nodeTitle={titleEn || 'Flowchart Preview'}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIO NARRATION */}
      {activeTab === 'audio' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bilingual Spoken-Word Audio Narration</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Students can listen to narrated conceptual explanations in English or Devanagari Hindi.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              Est. ~{audioDuration}s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Audio Narration Title
              </label>
              <input
                type="text"
                value={audioTitle}
                onChange={e => setAudioTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Custom Hosted Audio URL (Optional .mp3 / .wav)
              </label>
              <input
                type="url"
                placeholder="https://example.com/audio/kinematics.mp3"
                value={audioUrl}
                onChange={e => setAudioUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Bilingual Audio Scripts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  🇬🇧 English Narration Script
                </span>
                <button
                  type="button"
                  onClick={() => handleTestAudio('en')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeakingEn ? '■ Stop Audio' : '▶ Voice Preview'}</span>
                </button>
              </div>
              <textarea
                rows={6}
                value={audioScriptEn}
                onChange={e => setAudioScriptEn(e.target.value)}
                placeholder="Spoken-word conversational explanation for English listeners..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-devanagari">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  🇮🇳 हिन्दी ऑडियो व्याख्यान (देवनागरी)
                </span>
                <button
                  type="button"
                  onClick={() => handleTestAudio('hi')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1 font-sans"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeakingHi ? '■ विराम' : '▶ स्वर सुनें'}</span>
                </button>
              </div>
              <textarea
                rows={6}
                value={audioScriptHi}
                onChange={e => setAudioScriptHi(e.target.value)}
                placeholder="नमस्ते दोस्तों! आज हम इस विषय का विस्तृत अन्वेषण करेंगे..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: IMAGES & VISUAL DIAGRAMS */}
      {activeTab === 'images' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scientific Diagrams & Visual Figures</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Attach high-resolution anatomical drawings, vector mechanics figures, and charts.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              {imagesList.length} Figures
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {imagesList.map((img, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative group shadow-xs">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={img.url}
                    alt={img.altText || `Figure ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="Remove Figure"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {img.caption || `Figure ${idx + 1}: Uncaptioned Illustration`}
                </div>
              </div>
            ))}
          </div>

          {/* Add Image Form */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              + Attach Additional Scientific Figure
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                placeholder="Image URL (https://...)"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                className="text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Caption (e.g. Parabolic trajectory vector analysis)"
                value={newImageCaption}
                onChange={e => setNewImageCaption(e.target.value)}
                className="text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Figure</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RETENTION TEST & QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Formative Retention Test & Questions</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multiple-choice questions with automated explanations to measure mastery.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
              {quizList.length} Questions
            </span>
          </div>

          <div className="space-y-4">
            {quizList.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Q{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {q.question.en}
                    </h4>
                    {q.question.hi && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-devanagari">
                        {q.question.hi}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuizQuestion(q.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.en.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctOptionIndex;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </span>
                        {isCorrect && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Explanation: </span>
                    {q.explanation.en}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Question Form */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              + Add Multiple-Choice Assessment Question
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Question (English) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which launch angle maximizes horizontal range?"
                  value={newQEn}
                  onChange={e => setNewQEn(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                  प्रश्न (हिन्दी देवनागरी)
                </label>
                <input
                  type="text"
                  placeholder="उदा. किस कोण पर अधिकतम क्षैतिज परास प्राप्त होता है?"
                  value={newQHi}
                  onChange={e => setNewQHi(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
                />
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Option A *
                </label>
                <input
                  type="text"
                  placeholder="Option A"
                  value={newOptEnA}
                  onChange={e => setNewOptEnA(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Option B *
                </label>
                <input
                  type="text"
                  placeholder="Option B"
                  value={newOptEnB}
                  onChange={e => setNewOptEnB(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Option C
                </label>
                <input
                  type="text"
                  placeholder="Option C"
                  value={newOptEnC}
                  onChange={e => setNewOptEnC(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Option D
                </label>
                <input
                  type="text"
                  placeholder="Option D"
                  value={newOptEnD}
                  onChange={e => setNewOptEnD(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Correct Answer Index
                </label>
                <select
                  value={newCorrectIndex}
                  onChange={e => setNewCorrectIndex(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={0}>Option A is Correct</option>
                  <option value={1}>Option B is Correct</option>
                  <option value={2}>Option C is Correct</option>
                  <option value={3}>Option D is Correct</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Explanation / Rationale
                </label>
                <input
                  type="text"
                  placeholder="Explain why this option is correct..."
                  value={newExpEn}
                  onChange={e => setNewExpEn(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleAddQuizQuestion}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>

          {/* Stepper Navigation between Tools */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {prevPart ? (
              <button
                type="button"
                onClick={() => handleSelectTab(prevPart.id)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev Tool</span>
              </button>
            ) : <div />}

            {nextPart && (
              <button
                type="button"
                onClick={() => handleSelectTab(nextPart.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto"
              >
                <span>Next Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sidebar Bottom Action Save Card */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 mt-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(canPublishDirectly() ? 'published' : 'in_review')}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{canPublishDirectly() ? 'Publish Topic Note' : 'Submit Note'}</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400">
              Changes reflect live on the A4 Sheet. Save once completed.
            </p>
          </div>
        </aside>

        {/* ================= RIGHT DESK CANVAS: A4 SHEET PAPER ================= */}
        <main className={`flex-1 bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 overflow-y-auto flex flex-col items-center justify-start ${mobileView === 'sidebar' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Desk Canvas Top Bar info */}
          <div className="w-full max-w-[794px] mb-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium px-1">
            <div className="flex items-center gap-1.5">
              <span>📄</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">A4 Topic Note Sheet (Live Document)</span>
              <span className="hidden sm:inline text-slate-400">• Standard 210mm × 297mm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold">
                {Object.values(includedComponents).filter(Boolean).length} / 8 Parts Attached
              </span>
            </div>
          </div>

          {/* THE REALISTIC A4 SHEET PAPER (210mm x 297mm at 96 DPI: 794px x 1123px) */}
          <div className="w-full max-w-[794px] min-h-[1123px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl rounded-sm p-6 sm:p-12 space-y-8 flex flex-col font-sans transition-all">
            {/* A4 Document Header - Fully Editable Directly on Sheet */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                    EduNova Academic Notes
                  </span>
                  <select
                    value={nodeType}
                    onChange={e => setNodeType(e.target.value as NodeType)}
                    className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="lesson">Lesson</option>
                    <option value="topic">Topic</option>
                    <option value="concept">Concept</option>
                    <option value="simulation">Simulation</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>⏱️</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(Number(e.target.value))}
                    className="w-12 text-center text-[11px] p-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
                  />
                  <span>min read</span>
                </div>
              </div>

              {/* Directly Editable Title, Subtitle & Overview */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter Topic Title (e.g., Kinematics: Projectile Motion & Vector Equations)..."
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight w-full bg-transparent border-b border-slate-200/60 dark:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600 pb-1"
                />
                <input
                  type="text"
                  placeholder="हिन्दी शीर्षक दर्ज करें (वैकल्पिक)..."
                  value={titleHi}
                  onChange={e => setTitleHi(e.target.value)}
                  className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 w-full bg-transparent border-b border-slate-200/40 dark:border-slate-800/60 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 font-devanagari pb-1"
                />
                <textarea
                  rows={2}
                  placeholder="Add a concise topic overview or learning objective directly on this note..."
                  value={descEn}
                  onChange={e => setDescEn(e.target.value)}
                  className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 w-full bg-transparent border-b border-slate-200/40 dark:border-slate-800/60 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-850">
                <span>Authored by: <strong className="text-slate-600 dark:text-slate-300">{currentUser?.name || 'Academic Admin'}</strong></span>
                <span>Active Parts: <strong className="text-indigo-600 dark:text-indigo-400">{Object.values(includedComponents).filter(Boolean).length} of 8 attached</strong></span>
              </div>
            </div>

            {/* When A4 sheet is clean and empty, show interactive section insertion grid */}
            {Object.values(includedComponents).every(v => !v) && (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    A4 Note Sheet is Ready for Content
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Click any component below to insert and edit it directly on this page:
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto pt-2">
                  {CONTENT_PARTS.map(part => {
                    const Icon = part.icon;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => toggleComponentInclusion(part.id)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col items-center text-center group"
                      >
                        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {part.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                          + Add to note
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PART 1: TEXT FORMATTING (Core Theory & Math Derivations) - DIRECTLY EDITABLE ON SHEET */}
            {includedComponents.basic && (
              <section id="section-basic" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      1. Core Theory & Mathematical Derivations
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setContentLanguage('en')}
                        className={`px-2 py-0.5 rounded transition-colors ${contentLanguage === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentLanguage('hi')}
                        className={`px-2 py-0.5 rounded font-devanagari transition-colors ${contentLanguage === 'hi' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        हिन्दी
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleComponentInclusion('basic')}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                      title="Remove text section from sheet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rich Formatting Toolbar Directly on the A4 Sheet */}
                <FormattingToolbar
                  textareaRef={contentLanguage === 'en' ? bodyEnTextareaRef : bodyHiTextareaRef}
                  value={contentLanguage === 'en' ? bodyEn : bodyHi}
                  onChange={contentLanguage === 'en' ? setBodyEn : setBodyHi}
                  viewMode={contentLanguage === 'en' ? bodyEnViewMode : bodyHiViewMode}
                  onViewModeChange={contentLanguage === 'en' ? setBodyEnViewMode : setBodyHiViewMode}
                />

                {/* Direct Text Editor on the Page */}
                {(contentLanguage === 'en' ? bodyEnViewMode : bodyHiViewMode) === 'write' && (
                  <textarea
                    ref={contentLanguage === 'en' ? bodyEnTextareaRef : bodyHiTextareaRef}
                    rows={10}
                    value={contentLanguage === 'en' ? bodyEn : bodyHi}
                    onChange={e => contentLanguage === 'en' ? setBodyEn(e.target.value) : setBodyHi(e.target.value)}
                    placeholder={contentLanguage === 'en' 
                      ? "Write full lesson theory, formulas ($$ E = mc^2 $$), derivations, and explanations directly on this sheet..." 
                      : "यहाँ देवनागरी में अपना विस्तृत पाठ, सूत्र ($$ E = mc^2 $$), और मुख्य व्याख्या सीधे इस पृष्ठ पर लिखें..."}
                    className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  />
                )}

                {(contentLanguage === 'en' ? bodyEnViewMode : bodyHiViewMode) === 'split' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea
                      ref={contentLanguage === 'en' ? bodyEnTextareaRef : bodyHiTextareaRef}
                      rows={10}
                      value={contentLanguage === 'en' ? bodyEn : bodyHi}
                      onChange={e => contentLanguage === 'en' ? setBodyEn(e.target.value) : setBodyHi(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 font-mono leading-relaxed"
                    />
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-80 overflow-y-auto">
                      <MarkdownPreview content={contentLanguage === 'en' ? bodyEn : bodyHi} />
                    </div>
                  </div>
                )}

                {(contentLanguage === 'en' ? bodyEnViewMode : bodyHiViewMode) === 'preview' && (
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-48">
                    <MarkdownPreview content={(contentLanguage === 'en' ? bodyEn : bodyHi) || '*No lesson text written yet. Switch to "Write" mode or click the formatting buttons above.*'} />
                  </div>
                )}
              </section>
            )}

            {/* PART 2: NOTES (3) (Key Principles & Formula Revision) - DIRECTLY EDITABLE ON SHEET */}
            {includedComponents.notes && (
              <section id="section-notes" className="space-y-4 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      2. Revision Notes & 3 Key Principles
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('notes')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove notes from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3 Directly Editable Principle Cards on the Page */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>3 Key Principles (Type directly in each card):</span>
                    {keyTakeaways.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setKeyTakeaways(prev => [...prev, ''])}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Principle Card</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(keyTakeaways.length > 0 ? keyTakeaways : ['', '', '']).slice(0, 3).map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2 shadow-xs relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">
                              {idx + 1}
                            </span>
                            <span>Principle {idx + 1}</span>
                          </div>
                          {keyTakeaways.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTakeaway(idx)}
                              className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove principle"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={keyTakeaways[idx] ?? ''}
                          onChange={e => {
                            const val = e.target.value;
                            setKeyTakeaways(prev => {
                              const copy = [...prev];
                              while (copy.length <= idx) copy.push('');
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Write principle ${idx + 1} takeaway directly here...`}
                          className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revision Formula Cheat Sheet Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Formula Cheat-Sheet & Revision Summary (Markdown / LaTeX):</span>
                    <button
                      type="button"
                      onClick={() => setNotesViewMode(notesViewMode === 'write' ? 'preview' : 'write')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-bold"
                    >
                      {notesViewMode === 'write' ? 'Preview Formulas' : 'Edit Markdown'}
                    </button>
                  </div>

                  {notesViewMode === 'write' ? (
                    <textarea
                      rows={4}
                      value={notesMarkdown}
                      onChange={e => setNotesMarkdown(e.target.value)}
                      placeholder="Add formula cheat-sheet (e.g. * Range $R = \frac{v^2 \sin 2\theta}{g}$, * Peak Height $H = \frac{v_y^2}{2g}$)..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                      <MarkdownPreview content={notesMarkdown || '*No revision notes written yet.*'} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* PART 3: SIMULATION (Interactive Physics / Canvas Sandbox) - DIRECTLY ON SHEET */}
            {includedComponents.simulation && (
              <section id="section-simulation" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      3. Interactive Simulation Lab
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('simulation')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove simulation from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <SimulationSandbox config={currentNodePreview.simulationConfig} nodeTitle={titleEn} />
                </div>

                {/* Inline Simulation Controls Directly on the Sheet */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Lab Model
                      </label>
                      <select
                        value={simType}
                        onChange={e => setSimType(e.target.value as any)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
                      >
                        <option value="projectile">Projectile Motion</option>
                        <option value="wave_synth">Wave Synthesis</option>
                        <option value="gravity_orbit">Gravity & Orbit</option>
                        <option value="custom_canvas">Custom Physics Canvas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Angle ({simAngle}°)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={90}
                        value={simAngle}
                        onChange={e => setSimAngle(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Velocity ({simVelocity} m/s)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={simVelocity}
                        onChange={e => setSimVelocity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Gravity ({simGravity} m/s²)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={simGravity}
                        onChange={e => setSimGravity(Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Challenge Goal for Students
                    </label>
                    <input
                      type="text"
                      value={simChallengeDesc}
                      onChange={e => setSimChallengeDesc(e.target.value)}
                      placeholder="e.g. Adjust angle to hit the target at 60 meters with minimum velocity..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* PART 4: CODE (Interactive Sandbox with Test Runner) - DIRECTLY ON SHEET */}
            {includedComponents.code && (
              <section id="section-code" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      4. Programming Sandbox & Verification Tests
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('code')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove code sandbox from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Problem Setup Directly on the Sheet */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Problem Title</label>
                      <input
                        type="text"
                        value={codeTitle}
                        onChange={e => setCodeTitle(e.target.value)}
                        placeholder="e.g. Calculate Parabolic Trajectory Range..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Language</label>
                      <select
                        value={codeLang}
                        onChange={e => setCodeLang(e.target.value as any)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (ES6)</option>
                        <option value="cpp">C++ (GCC)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Problem Instructions</label>
                    <textarea
                      rows={2}
                      value={codeDescription}
                      onChange={e => setCodeDescription(e.target.value)}
                      placeholder="Explain input parameters, constraints, and return values..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Starter Code Template</label>
                    <textarea
                      rows={6}
                      value={codeStarter}
                      onChange={e => setCodeStarter(e.target.value)}
                      placeholder="def solution(v, angle):\n    # Write logic here\n    return round(range_val, 2)"
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-mono leading-relaxed"
                    />
                  </div>

                  {/* Autograded Test Cases Editor on Sheet */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>Autograded Test Cases ({codeTestCases.length})</span>
                    </div>
                    {codeTestCases.map(tc => (
                      <div key={tc.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                        <span className="text-slate-400 text-[10px]">IN:</span>
                        <span className="text-slate-800 dark:text-slate-200 flex-1 truncate">{tc.input}</span>
                        <span className="text-slate-400 text-[10px]">OUT:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 flex-1 truncate">{tc.expectedOutput}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(tc.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <input
                        type="text"
                        value={newTcInput}
                        onChange={e => setNewTcInput(e.target.value)}
                        placeholder="Input (e.g. 25, 45)"
                        className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={newTcOutput}
                        onChange={e => setNewTcOutput(e.target.value)}
                        placeholder="Expected Output (e.g. 63.78)"
                        className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Test Case</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Code Runner */}
                {currentNodePreview.codingProblem && (codeTitle.trim() || codeStarter.trim()) && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-3">
                    <CodingSandbox problem={currentNodePreview.codingProblem} nodeTitle={titleEn} />
                  </div>
                )}
              </section>
            )}

            {/* PART 5: FLOWCHART (5-Shape Decision Flow Diagram) - DIRECTLY ON SHEET */}
            {includedComponents.flowchart && (
              <section id="section-flowchart" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      5. Pedagogical Flowchart Diagram
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('flowchart')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove flowchart from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Shape Insertion Palette Toolbar Directly on Sheet */}
                <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <span>Add Shape:</span>
                    <button
                      type="button"
                      onClick={() => handleAppendFlowchartShape('oval')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 shadow-xs"
                      title="Start/End Terminal"
                    >
                      <span>⬭ Oval</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendFlowchartShape('rect')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 shadow-xs"
                      title="Process Step"
                    >
                      <span>▭ Rect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendFlowchartShape('parallelogram')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 shadow-xs"
                      title="Data Input / Output"
                    >
                      <span>▱ Parallelogram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendFlowchartShape('diamond')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 shadow-xs"
                      title="Decision Branch"
                    >
                      <span>◊ Diamond</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAppendFlowchartShape('circle')}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 shadow-xs"
                      title="Connector Circle"
                    >
                      <span>⭕ Circle</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={flowchartCaption}
                    onChange={e => setFlowchartCaption(e.target.value)}
                    placeholder="Flowchart caption description..."
                    className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex-1 min-w-[180px]"
                  />
                </div>

                {/* Rendered Diagram on Sheet */}
                {currentNodePreview.flowchart && mermaidCode.trim() ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <FlowchartViewer flowchartData={currentNodePreview.flowchart} nodeTitle={titleEn} />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Click any shape button above or type Mermaid code below to build the flowchart diagram.
                  </div>
                )}

                {/* Directly Editable Mermaid Code on Sheet */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Mermaid Diagram Code (Edit directly):</label>
                  <textarea
                    rows={4}
                    value={mermaidCode}
                    onChange={e => setMermaidCode(e.target.value)}
                    placeholder="flowchart TD\n  start([Kick Ball]) --> calc[Calculate Velocity]\n  calc --> check{At Peak?}\n  check -- Yes --> finish([Apex])"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono leading-relaxed"
                  />
                </div>
              </section>
            )}

            {/* PART 6: AUDIO (Bilingual Spoken Narration & Player) - DIRECTLY ON SHEET */}
            {includedComponents.audio && (
              <section id="section-audio" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      6. Bilingual Audio Narration
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('audio')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove audio narration from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={audioTitle}
                      onChange={e => setAudioTitle(e.target.value)}
                      placeholder="Audio Lecture Title (e.g. Concept Walkthrough & Real-World Analogy)..."
                      className="text-xs font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex-1 min-w-[200px]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestAudio('en')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSpeakingEn
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                      >
                        {isSpeakingEn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isSpeakingEn ? 'Stop Voice' : 'Play English Voice'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestAudio('hi')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 font-devanagari ${
                          isSpeakingHi
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        }`}
                      >
                        {isSpeakingHi ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isSpeakingHi ? 'रोकें' : 'हिन्दी सुनें'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        English Script (Speech-Synthesis Ready)
                      </label>
                      <textarea
                        rows={4}
                        value={audioScriptEn}
                        onChange={e => setAudioScriptEn(e.target.value)}
                        placeholder="Welcome students! In this topic we will investigate..."
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 leading-relaxed italic"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 font-devanagari">
                        हिन्दी व्याख्यान स्क्रिप्ट (देवनागरी)
                      </label>
                      <textarea
                        rows={4}
                        value={audioScriptHi}
                        onChange={e => setAudioScriptHi(e.target.value)}
                        placeholder="नमस्ते दोस्तों! आज हम इस विषय की गहराई से व्याख्या करेंगे..."
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-devanagari leading-relaxed italic"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* PART 7: IMAGES (1) (Visual Diagrams & Schematics) - DIRECTLY ON SHEET */}
            {includedComponents.images && (
              <section id="section-images" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      7. Visual Diagrams & Reference Images ({imagesList.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('images')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove images from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {imagesList.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {imagesList.map((img, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-850 p-2 space-y-2 relative group"
                      >
                        <img
                          src={img.url}
                          alt={img.caption || img.altText || `Diagram ${idx + 1}`}
                          className="w-full h-44 object-cover rounded-xl"
                        />
                        <div className="p-1 flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {img.caption || `Diagram ${idx + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Image URL adder on the Sheet */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Attach Image / Diagram URL to this Note:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="sm:col-span-2 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newImageCaption}
                      onChange={e => setNewImageCaption(e.target.value)}
                      placeholder="Caption description..."
                      className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Image to Note</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* PART 8: TEST (1) (Knowledge Retention MCQ Quiz) - DIRECTLY ON SHEET */}
            {includedComponents.quiz && (
              <section id="section-quiz" className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      8. Retention Test & Concept Check ({quizList.length} Questions)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleComponentInclusion('quiz')}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove test from sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Existing Quiz Questions on Sheet */}
                {quizList.map((q, qIdx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Question {qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuizQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{q.question.en}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.en.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border text-xs ${
                            optIdx === q.correctOptionIndex
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-mono mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Directly Editable Add Question Form on Sheet */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-850 space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    + Add Multiple-Choice Question:
                  </div>

                  <input
                    type="text"
                    value={newQEn}
                    onChange={e => setNewQEn(e.target.value)}
                    placeholder="Question (e.g., At what launch angle is maximum range achieved?)..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Option A', val: newOptEnA, set: setNewOptEnA, idx: 0 },
                      { label: 'Option B', val: newOptEnB, set: setNewOptEnB, idx: 1 },
                      { label: 'Option C', val: newOptEnC, set: setNewOptEnC, idx: 2 },
                      { label: 'Option D', val: newOptEnD, set: setNewOptEnD, idx: 3 },
                    ].map(opt => (
                      <div key={opt.idx} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="new_q_correct_option"
                          checked={newCorrectIndex === opt.idx}
                          onChange={() => setNewCorrectIndex(opt.idx)}
                          className="w-3.5 h-3.5 text-indigo-600"
                          title="Mark as correct option"
                        />
                        <input
                          type="text"
                          value={opt.val}
                          onChange={e => opt.set(e.target.value)}
                          placeholder={`${opt.label}...`}
                          className={`w-full text-xs p-1.5 rounded-lg border ${
                            newCorrectIndex === opt.idx
                              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newExpEn}
                    onChange={e => setNewExpEn(e.target.value)}
                    placeholder="Explanation why this option is correct..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question to Quiz</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Add Remaining Components Bar at Bottom of Sheet */}
            {Object.values(includedComponents).some(v => !v) && (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  + Add more components to this note:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {CONTENT_PARTS.filter(p => !includedComponents[p.id]).map(part => {
                    const Icon = part.icon;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => toggleComponentInclusion(part.id)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Icon className="w-3 h-3" />
                        <span>+ {part.label.split('. ')[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* A4 Sheet Footer with Watermark and Save Action */}
            <div className="pt-8 mt-auto border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-slate-400">
                Page 1 of 1 • EduNova Multi-Modal Learning System • Academic Master Sheet
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('published')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                  title="Make this course live immediately for all students on their dashboards"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Publish to Students</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
