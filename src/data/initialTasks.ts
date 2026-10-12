import { AdminTask } from '../types';

export const initialAdminTasks: AdminTask[] = [
  {
    id: 'task_sc_1',
    adminId: 'user_branch_admin_science',
    adminName: 'Dr. Ananya Roy (डॉ. अनन्या रॉय)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Audit Wave Optics & Double-Slit Interference Simulation Canvas',
    description: 'Verify wavelength sliders (380nm - 750nm), slit spacing mathematics, and real-time fringe intensity calculations against NCERT syllabus.',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-03-25',
    createdAt: '2026-03-05T10:00:00Z',
    score: 92
  },
  {
    id: 'task_sc_2',
    adminId: 'user_branch_admin_science',
    adminName: 'Dr. Ananya Roy (डॉ. अनन्या रॉय)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Standardize Kinematics Target Trajectory Equations for Class 11',
    description: 'Ensure launch angle, velocity vector decomposition, and air resistance factors match benchmark physics standards.',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-03-12',
    createdAt: '2026-03-02T09:30:00Z',
    score: 96
  },
  {
    id: 'task_cs_1',
    adminId: 'user_branch_admin_cs',
    adminName: 'Dr. Sameer Khan (डॉ. समीर खान)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Validate Binary Search Tree Insertion and Node Step Animation',
    description: 'Test pointer navigation, left/right subtree invariant guarantees, and step-by-step visual transitions for all corner test cases.',
    priority: 'urgent',
    status: 'completed',
    dueDate: '2026-03-10',
    createdAt: '2026-03-01T11:00:00Z',
    score: 98
  },
  {
    id: 'task_cs_2',
    adminId: 'user_branch_admin_cs',
    adminName: 'Dr. Sameer Khan (डॉ. समीर खान)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Expand In-Browser Python Sandbox Test Suites for Dynamic Programming',
    description: 'Add automated assertions and memory limit tests for 0/1 Knapsack and Longest Common Subsequence challenges.',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-03-29',
    createdAt: '2026-03-06T14:15:00Z',
    score: 89
  },
  {
    id: 'task_phys_1',
    adminId: 'user_creator_physics',
    adminName: 'Vikram Singh (विक्रम सिंह)',
    assignedBy: 'Priyanka (Super Admin)',
    title: "Build Newton's Second Law Free Body Diagram Interactive Simulator",
    description: 'Create multi-surface friction coefficient controls, normal force vectors, and interactive mass pully animations.',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-03-26',
    createdAt: '2026-03-07T12:00:00Z',
    score: 88
  },
  {
    id: 'task_cs_create_1',
    adminId: 'user_creator_cs',
    adminName: 'Neha Gupta (नेहा गुप्ता)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Develop Flowchart Visualizer for Merge Sort and Dijkstra Graph Search',
    description: 'Implement step-by-step state highlighting for each recursive call and shortest-path queue relaxation.',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-04-02',
    createdAt: '2026-03-08T15:30:00Z'
  },
  {
    id: 'task_rev_1',
    adminId: 'user_reviewer_hindi',
    adminName: 'Pooja Verma (पूजा वर्मा)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Devanagari Bilingual Audio Phonetics & Glossary Verification for Quantum Superposition',
    description: 'Verify spoken phonetic clarity, technical Hindi term transliteration, and audio pronunciation accuracy for all quantum state terms.',
    priority: 'high',
    status: 'completed',
    dueDate: '2026-03-14',
    createdAt: '2026-03-03T16:00:00Z',
    score: 95
  },
  {
    id: 'task_math_1',
    adminId: 'user_branch_admin_math',
    adminName: 'Prof. Alok Verma (प्रो. आलोक वर्मा)',
    assignedBy: 'Priyanka (Super Admin)',
    title: 'Review Spaced Repetition Formula Cards & LaTeX Mathematical Notation',
    description: 'Standardize KaTeX typesetting across all calculus, linear algebra, and coordinate geometry flashcards.',
    priority: 'low',
    status: 'in_progress',
    dueDate: '2026-03-30',
    createdAt: '2026-03-08T11:00:00Z',
    score: 91
  }
];
