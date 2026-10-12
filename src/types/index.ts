export type Language = 'en' | 'hi';

export type AgeBand = 'all' | 'kids' | 'teens' | 'adults' | (string & {});

export type UserRole = 
  | 'super_admin'       // Full access: users, courses, languages, site settings, global override
  | 'branch_admin'      // Scoped to a content subtree (e.g. 'Science' or 'Physics'), creates & oversees content admins
  | 'content_admin'     // Creates and formats content; takes care of display & submits for branch approval
  | 'content_creator'   // Alias / compatible with content_admin
  | 'reviewer'          // Reviews content, approves/edits translations
  | 'learner'           // Enrolls in courses, learns, tracks progress, takes quizzes
  | (string & {});

export type BranchCategory = 'pcmb' | 'cs' | 'other' | (string & {});

export interface AdminRemark {
  id: string;
  remark: string;
  author: string;
  timestamp: string;
}

export interface UserNotification {
  id: string;
  sender: string;
  senderRole: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AdminTask {
  id: string;
  adminId: string;
  adminName: string;
  assignedBy: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  createdAt: string;
  score?: number;
}

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  language: 'python' | 'javascript' | 'cpp' | 'java';
  description: string;
  starterCode: string;
  testCases: CodingTestCase[];
}

export interface User {
  id: string;
  studentId?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  ageBand?: AgeBand;
  branchCategory?: BranchCategory; // 'pcmb' | 'cs' | 'other'
  assignedNodeId?: string;     // For Branch Admin or Content Creator (root of their assigned subtree)
  assignedBranchName?: string;
  preferredLanguage: Language;
  enrolledCourseIds: string[]; // List of root/course IDs the user has access to
  isEmailVerified?: boolean;
  xp: number;
  streakDays: number;
  adminRemarks?: AdminRemark[];
  notifications?: UserNotification[];
  createdBy?: string;          // Branch Admin ID who created this Content Admin
  performanceScore?: number;   // 0-100 evaluation score assigned by Branch Admin
  evaluationRating?: number;   // 1-5 star quality rating assigned by Branch Admin
  evaluationRemarks?: string;  // Detailed progress review feedback by Branch Admin
  lastEvaluatedAt?: string;    // Timestamp of last progress review
  createdAt?: string;
}

export type NodeType = 
  | 'category'     // e.g., STEM, Humanities, Languages
  | 'subject'      // e.g., Physics, Mathematics, Biology
  | 'topic'        // e.g., Mechanics, Optics, Calculus
  | 'subtopic'     // e.g., Newton's Laws of Motion, Kinematics
  | 'sub_subtopic' // e.g., Second Law & Momentum, Free Body Diagrams
  | 'lesson'       // Core multimedia reading lesson
  | 'video'        // Concept video with interactive checkpoints
  | 'simulation'   // Interactive physics/math canvas simulator
  | 'quiz'         // Interactive retention assessment
  | (string & {});

export type NodeStatus = 'draft' | 'in_review' | 'needs_revision' | 'published';

export type CourseAccessLevel = 'public' | 'enrolled_only' | 'admin_only';

export interface NodeTranslation {
  language: Language;
  title: string;
  description: string;
  body?: string;               // Markdown or rich text
  summary?: string;            // Key takeaway bullet points
  transcript?: string;         // Video transcript
  videoTitle?: string;
}

export interface VideoCheckpoint {
  id: string;
  timestampSeconds: number;
  question: {
    en: string;
    hi: string;
  };
  options: {
    en: string[];
    hi: string[];
  };
  correctIndex: number;
  explanation: {
    en: string;
    hi: string;
  };
}

export interface VideoData {
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  checkpoints: VideoCheckpoint[];
  captionsUrl?: {
    en?: string;
    hi?: string;
  };
}

export interface SimulationConfig {
  type: 'projectile' | 'wave_synth' | 'gravity_orbit' | 'custom_canvas';
  initialParams: Record<string, number | string | boolean>;
  instructions: {
    en: string;
    hi: string;
  };
  challenges: {
    id: string;
    description: { en: string; hi: string };
    targetCondition: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: {
    en: string;
    hi: string;
  };
  options: {
    en: string[];
    hi: string[];
  };
  correctOptionIndex: number;
  explanation: {
    en: string;
    hi: string;
  };
}

export interface Flashcard {
  id: string;
  front: {
    en: string;
    hi: string;
  };
  back: {
    en: string;
    hi: string;
  };
  hint?: {
    en: string;
    hi: string;
  };
}

export interface ContentNode {
  id: string;
  parentId: string | null;
  path: string;                // Materialized path, e.g. "root.science.physics.mechanics"
  depth: number;
  type: NodeType;
  order: number;
  status: NodeStatus;
  targetAgeBand?: AgeBand;
  accessLevel?: CourseAccessLevel;
  icon?: string;
  badge?: string;
  estimatedMinutes?: number;
  enrolledCount?: number;
  translations: {
    en?: NodeTranslation;
    hi?: NodeTranslation;
  };
  videoData?: VideoData;
  simulationConfig?: SimulationConfig;
  codingProblem?: CodingProblem;
  quizQuestions?: QuizQuestion[];
  flashcards?: Flashcard[];
  audioExplanation?: {
    audioUrl?: string;
    narrationTitle?: string;
    scriptEn?: string;
    scriptHi?: string;
    durationSeconds?: number;
  };
  flowchart?: {
    mermaidCode?: string;
    caption?: string;
    flowchartType?: string;
  };
  images?: {
    url: string;
    caption?: string;
    altText?: string;
  }[];
  notes?: {
    title?: string;
    contentMarkdown?: string;
    keyTakeaways?: string[];
  };
  createdBy: string;
  updatedAt: string;
  branchAdminRemark?: string;    // Remarks / feedback from Branch Admin explaining fixes needed before public release
  reviewRemarks?: AdminRemark[]; // Historic audit log of branch remarks
  submittedBy?: string;          // Content Admin who submitted the node
  reviewedBy?: string;           // Branch Admin who approved or requested changes
  reviewedAt?: string;           // Timestamp of review
  tags?: string[];
  api_tags?: string[];
}

export interface LearnerProgress {
  nodeId: string;
  completed: boolean;
  score?: number;
  lastVisited: string;
  notes?: string;
  bookmarked?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  nodeId?: string;
  details: string;
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle?: string;
  content: string;               // Full Markdown/Rich content
  hindiTitle?: string;
  hindiSubtitle?: string;
  hindiContent?: string;
  coverImage?: string;           // URL of header hero image
  coverImageCaption?: string;    // Image attribution or caption
  authorId: string;              // e.g. 'user_super_admin'
  authorName: string;            // 'Priyanka'
  authorRole: string;            // 'Founder & Chief Academic Officer'
  authorAvatar: string;          // Author image
  authorBio?: string;            // Bio text for story footer
  publishedAt: string;           // ISO timestamp
  updatedAt?: string;
  readingTimeMinutes: number;    // Computed from word count (e.g. 4)
  status: 'draft' | 'published'; // Public visibility status
  tags: string[];                // Categories e.g. ['Cognitive Science', 'Simulations']
  claps: number;                 // Medium-style claps
  views: number;                 // View count
  featured?: boolean;            // Highlighted story on landing page
}
