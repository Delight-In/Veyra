# 🎓 EduNova (एडु-नोवा) — Advanced Multilingual Learning Platform

> **हर आयु, हर भाषा, संपूर्ण शिक्षा** — *Next-Generation Multilingual Education with Unlimited-Depth Scoped Hierarchy, Hands-on HTML5 Kinetic Simulations, and Active Video Checkpoints.*

---

## 🌟 Executive Overview & Architectural Highlights

EduNova is a production-grade educational platform built to eliminate linguistic and conceptual barriers in STEM, mathematics, and nature sciences across all learner demographics.

### Core Capabilities:
1. **Multi-Layer Role-Based Access Control (Scoped RBAC)**:
   * **Super Admin**: Complete platform oversight, language management, global tree overrides, user permissions, audit logs.
   * **Branch Admin**: Scoped authority over an assigned node in the hierarchy (e.g. `Natural Sciences` or `Physics`). Automatically inherits management rights over all child and descendant subtopics, appointing creators and reviewing content within their branch subtree.
   * **Content Creator**: Authors lessons, interactive simulations, concept videos, quizzes, and side-by-side Hindi/English translations within authorized branches.
   * **Bilingual Reviewer / Translator**: Manages translation workflows, side-by-side diffs, and publishes submitted lessons.
   * **Learner**: Personalized classroom experience, active-recall quizzes, interactive simulations, streak tracking, and XP.
   * **Parent / Guardian**: DPDP Act 2023 compliant child account oversight, screen time limits, and parent-gate protected settings.

2. **Unlimited-Depth Content Hierarchy**:
   * Nodes structured via PostgreSQL `ltree` materialized paths:
     `Category` → `Subject` → `Topic` → `Subtopic` → `Sub-subtopic` → `Interactive Leaves (Simulation | Video | Lesson | Quiz | Flashcards)`
   * Seamless parent-child relationship management with instant breadcrumbs and subtree search.

3. **100% Native Bilingual Support (Hindi & English)**:
   * Persistent language switcher (`हिन्दी` / `English`) visible on every page.
   * Full Unicode Devanagari typography with `Noto Sans Devanagari` and proportional line-height.
   * Web Speech API narration in native Hindi (`hi-IN`) and English (`en-US`).
   * Fallback engine for seamless degradation with missing-translation alert chips.

4. **Age-Adaptive UI Design**:
   * **Kids (5–8 yrs) — 🧸 Wonder Zone**: Playful, vibrant visuals, large buttons, audio-first read aloud, no open social exposure.
   * **Teens (9–17 yrs) — ⚡ Quest Zone**: Gamified streaks, badges, quest-like progress cards, dark/neon accents.
   * **Adults (18+ yrs) — 🎯 Mastery Zone**: Clean, distraction-free typography, exam syllabus tags, and personal markdown note taking.

5. **Kinetic HTML5 & Web Audio Simulations**:
   * **Physics Lab**: Real-time Projectile Motion & Kinematics simulator with variable angle, speed, planetary gravity presets (Moon, Earth, Jupiter), target challenge, and complementary angle overlay.
   * **Trigonometry & Waves Lab**: Interactive Sine/Cosine synthesizer connected to real-time Web Audio API sound synthesis.

6. **Interactive Video Explanations with Checkpoints**:
   * Concept video player with automatic checkpoint pause-points that test concept retention right when memories form.
   * Variable playback speeds (0.75x to 2.0x), dual subtitles, and searchable timestamped transcripts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript 5, Vite 6 |
| **Styling & Design** | Tailwind CSS 3, Custom Design Tokens for Age Skins |
| **Typography** | Inter, Noto Sans Devanagari, Fredoka (Kids), Space Grotesk (Teens) |
| **Simulations & Multimedia** | HTML5 Canvas API, Web Audio API, Web Speech API (TTS) |
| **Icons & Visuals** | Lucide React |
| **Database Architecture** | PostgreSQL 15+ with `ltree` extension (`src/data/schema.sql`) |
| **State & Persistence** | React Context + LocalStorage persistence engine with seed data |

---

## 📁 Repository Structure

```
c:/Users/priya/OneDrive/Desktop/EduNova/
├── index.html                           # Root HTML with Google Fonts
├── package.json                         # Dependencies & scripts
├── postcss.config.js                    # PostCSS configuration
├── tailwind.config.js                   # Age-adaptive themes & colors
├── tsconfig.json                        # TypeScript compiler options
├── vite.config.ts                       # Vite bundler with @/ path alias
├── dist/                                # Production build bundle
└── src/
    ├── main.tsx                         # React application entrypoint
    ├── index.css                        # Tailwind directives & Devanagari styling
    ├── App.tsx                          # App shell, context providers, routing
    ├── types/                           # TypeScript domain definitions
    │   └── index.ts                     # User, Role, ContentNode, Translation, etc.
    ├── i18n/
    │   └── translations.ts              # Hindi & English UI dictionary
    ├── data/
    │   ├── initialNodes.ts              # Unlimited-depth seeded hierarchy
    │   ├── initialUsers.ts              # Pre-configured demo personas
    │   └── schema.sql                   # Complete PostgreSQL DDL with ltree
    ├── context/
    │   ├── AuthContext.tsx              # Scoped RBAC & persona switching
    │   ├── LanguageContext.tsx          # i18n & Web Speech API synthesis
    │   ├── ThemeContext.tsx             # Age-adaptive skins & dark mode
    │   ├── ContentContext.tsx           # Tree management, CRUD & audit logs
    │   └── StudyContext.tsx             # XP, streaks, progress, notes
    └── components/
        ├── layout/                      # Navbar, Footer, AgeBandSelector
        ├── landing/                     # Hero, Categories, Sim preview, Science
        ├── courses/                     # CourseBrowser, CourseCard, Breadcrumbs
        ├── classroom/                   # VideoPlayer, SimulationSandbox, QuizEngine, Notes
        ├── admin/                       # SuperAdmin, BranchAdmin, Creator, Reviewer, Parent
        └── pages/                       # Landing, Courses, Classroom, About, Contact, Admin
```

---

## 🚀 Getting Started

### 1. Development Server
```bash
npm install
npm run dev:all
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build
```bash
npm run build
npm run preview
```

---

## 📜 Compliance & Ethics
* **Digital Personal Data Protection (DPDP) Act 2023**: Verifiable parental consent gate, no behavioral profiling for children under 18, and no public profile exposure for minors.
* **WCAG 2.1 AA Accessibility**: High-contrast modes, screen-reader semantic HTML, Devanagari typography legibility, and integrated text-to-speech.
