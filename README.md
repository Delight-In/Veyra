# 🎓 Veyra (वेयरा) / EduNova — Advanced Multilingual Learning Platform & STEM Publishing Studio

> **“जो आप जानते हैं, उससे भी आगे देखें।” — “See beyond what you know.”**  
> *Next-Generation Multilingual Education with Unlimited-Depth Scoped Hierarchy, Hands-on HTML5 Kinetic Simulations, Active Video Checkpoints, Medium-Style STEM Publishing, Interactive Coding Sandbox, and High-Concurrency Backend.*

---

## 🌟 Executive Overview & Architectural Highlights

**Veyra** (founded on the EduNova architecture) is an enterprise-grade educational platform engineered to dismantle linguistic, socioeconomic, and conceptual barriers in STEM (Physics, Chemistry, Mathematics, Biology) and Computer Science across all learner demographics.

Under the academic and administrative vision of **Priyanka**, Veyra blends rigorous scientific pedagogical design with cutting-edge web architecture, offering:

### Core Capabilities:

1. **Multi-Layer Role-Based Access Control (Scoped RBAC)**:
   * **Super Admin**: Complete platform governance, user directory with real-time search/filters/pagination, role promotion, branch assignment, broadcast notifications, private messaging, student/creator performance remarks, platform-wide visitor analytics, and database audit logs.
   * **Branch Admin**: Scoped administrative authority over an assigned branch subtree. Oversees and appoints Content Creators within their domain, reviews and approves submitted lesson nodes with feedback remarks, and conducts quantitative evaluations (0–100 performance score, 1–5 star rating, qualitative progress reviews).
   * **Content Creator / Content Admin**: Authors rich multimedia curriculum nodes, interactive HTML5 simulations, coding challenges, video checkpoints, Mermaid flowcharts, flashcards, quizzes, and side-by-side Hindi/English translations within authorized branches.
   * **Bilingual Reviewer / Translator**: Manages translation workflows with side-by-side diff comparisons, edits bilingual text, and publishes approved materials.
   * **Learner (Student)**: Personalized learning dashboard, automated student identifier (`STU-XXXX`), course enrollment/unenrollment, gamified XP, daily streak tracking, interactive notes, 3D flashcards, coding sandbox, and active-recall quizzes.

2. **Unlimited-Depth Materialized Path Hierarchy**:
   * Nodes structured with materialized path notation (`root.category.subject.topic.subtopic.sub_subtopic`):
     `Category` → `Subject` → `Topic` → `Subtopic` → `Sub-subtopic` → `Interactive Leaves (Lessons | Simulations | Videos | Coding Challenges | Quizzes | Flashcards)`
   * PostgreSQL `ltree` extension compatibility (`src/data/schema.sql`) and MongoDB document schema with instant breadcrumbs, subtree query isolation, and depth tracking.

3. **Medium-Style STEM Blogging & Publishing Engine (`/blogs`, `/admin/create-blog`)**:
   * **Distraction-Free Publishing Studio**: Rich Markdown editor with formatting toolbar, real-time live preview, and an interactive **Flowchart Shape Builder** generating dynamic Mermaid diagrams.
   * **Media Hosting**: Dedicated image upload service (`/api/blogs/upload-image`) saving high-resolution graphics to `/public/uploads/` with base64 and drag-and-drop support.
   * **Dual-Language Audio Narration**: Synchronized paragraph-by-paragraph text-to-speech engine (`BlogAudioPlayer`) powered by the Web Speech API with selectable Indian accent and Hindi voices.
   * **Reader Community**: Claps counter, view tracking, estimated read-time calculation, tag filtering, and search.

4. **Interactive Virtual Labs & Kinetic Simulations (`/simulations`, `/classroom`)**:
   * **Physics Lab**: Real-time Projectile Motion & Kinematics simulator with variable launch angle, initial velocity, planetary gravity presets (Earth $9.8\text{ m/s}^2$, Moon $1.62\text{ m/s}^2$, Jupiter $24.79\text{ m/s}^2$), live trajectory overlays, target challenge mode, and complementary angle trajectories.
   * **Trigonometry & Waves Lab**: Interactive Sine/Cosine synthesizer coupled with the Web Audio API for harmonic acoustic tone generation.
   * **Multi-Language Coding Sandbox**: In-browser code runner supporting **Python**, **JavaScript**, **C++**, and **Java** with automated test-case evaluation.
   * **Interactive Concept Videos**: Timestamped retention checkpoint pause-points, dual subtitles, adjustable playback speeds (0.75x–2.0x), and searchable transcripts.
   * **3D Flashcards & Active Recall Quizzes**: Interactive flipping flashcard decks and instant-feedback quizzes with bilingual explanations.

5. **100% Native Bilingual Foundation (Hindi & English)**:
   * Instant language toggle (`हिन्दी` / `English`) persisted across all sessions.
   * Native Devanagari typography with `Noto Sans Devanagari` and proportional line-height.
   * Web Speech API integration in native Hindi (`hi-IN`) and English (`en-IN` / `en-US`).
   * Fallback engine for graceful degradation with missing-translation indicators.

6. **Age-Adaptive User Experiences**:

7. **Production-Grade Backend Security & Resilience**:
   * Express 5 + Node.js + TypeScript RESTful architecture with MongoDB (Mongoose 9+) high-concurrency connection pooling (up to 50 concurrent sockets).
   * JWT authentication with Bearer tokens (`veyra_auth_token`) and 6-digit email OTP verification via Nodemailer (with local terminal preview in development).
   * OWASP security headers (CSP, HSTS, anti-clickjacking `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
   * Sliding-window memory-safe rate limiting with automatic garbage collection.
   * NoSQL injection sanitizer stripping `$` and `.` parameter keys.
   * Atomic visitor metrics tracking (`/api/stats/visitors`, `/api/stats/visit`).
   * System health monitoring (`/api/health`) tracking memory heap, uptime, and database status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18.3, TypeScript 5.7, Vite 6.1 |
| **Styling & Design System** | Tailwind CSS 3.4, PostCSS, Custom Age-Adaptive Skin Tokens |
| **Typography** | Inter, Noto Sans Devanagari, Fredoka (Kids), Space Grotesk (Teens) |
| **Icons & Visuals** | Lucide React |
| **Simulations & Multimedia** | HTML5 Canvas API, Web Audio API, Web Speech API (TTS), Mermaid.js Diagrams |
| **Backend Framework** | Node.js, Express 5.2, TypeScript (via `tsx`) |
| **Database & ODM** | MongoDB 6+ / Atlas, Mongoose 9.1 (with PostgreSQL 15+ `ltree` DDL specification in `src/data/schema.sql`) |
| **Authentication & Security** | JWT (`jsonwebtoken`), `bcryptjs` (salt rounds 12), OWASP CSP/HSTS Middleware, NoSQL Injection Defense, Rate Limiter |
| **Email & Verification** | Nodemailer (SMTP transport with automated local console dispatch) |
| **State & Persistence** | React Context API, LocalStorage Token/State Caching, MongoDB Connection Pool |

---

## 📁 Repository Structure

```
c:/Users/priya/OneDrive/Desktop/EduNova/
├── index.html                           # Root HTML with Google Fonts & responsive meta
├── package.json                         # Dependencies & dev scripts (veyra-platform)
├── postcss.config.js                    # PostCSS configuration
├── tailwind.config.js                   # Age-adaptive themes, fonts & custom colors
├── tsconfig.json                        # TypeScript configuration (strict mode)
├── vite.config.ts                       # Vite bundler with @/ alias & backend proxy (/api)
├── .env.example                         # Environment configuration template
├── dist/                                # Production build bundle
├── public/
│   └── uploads/                         # Statically served uploaded blog images
├── server/                              # Full-Stack Express 5 & MongoDB Backend
│   ├── index.ts                         # Server entrypoint, middleware, health check & DB pool
│   ├── config/
│   │   └── seed.ts                      # Automated MongoDB bootstrap for initial users & content
│   ├── middleware/
│   │   ├── auth.ts                      # JWT authentication, role verification & optional auth
│   │   └── security.ts                  # OWASP headers, sliding-window rate limit, NoSQL sanitizer
│   ├── models/
│   │   ├── Blog.ts                      # Blog schema (Medium-style posts, claps, tags, author)
│   │   ├── ContentNode.ts               # Materialized path course hierarchy schema
│   │   ├── User.ts                      # User schema with roles, student IDs, remarks, evaluations
│   │   └── Visitor.ts                   # Platform visitor counter schema
│   ├── routes/
│   │   ├── authRoutes.ts                # Register, OTP verify, login, password reset, /me
│   │   ├── blogRoutes.ts                # Blog CRUD, claps, image file upload (/upload-image)
│   │   ├── contentRoutes.ts             # Course nodes CRUD, study notes, flashcard updates
│   │   ├── statsRoutes.ts               # Real-time visitor analytics counter
│   │   └── userRoutes.ts                # User management, creator evaluation, enroll, broadcast
│   └── services/
│       └── mailService.ts               # Nodemailer SMTP & local console OTP verification service
└── src/                                 # Frontend Client Application
    ├── main.tsx                         # React entrypoint
    ├── index.css                        # Tailwind directives & Devanagari typography
    ├── App.tsx                          # App shell, context providers & scoped role routing
    ├── types/
    │   └── index.ts                     # TypeScript definitions (User, ContentNode, Blog, etc.)
    ├── i18n/
    │   └── translations.ts              # Hindi & English bilingual UI dictionary
    ├── services/
    │   └── api.ts                       # Typed client API layer (Auth, Users, Content, Blogs, Stats)
    ├── utils/
    │   ├── blogSpeech.ts                # Dual-language paragraph speech parser
    │   ├── pasteHtmlToMarkdown.ts       # HTML-to-Markdown clipboard converter
    │   └── speechVoice.ts               # Indian-accented Web Speech voice selector
    ├── context/
    │   ├── AuthContext.tsx              # Scoped RBAC, JWT tokens & demo persona switcher
    │   ├── BlogContext.tsx              # Blog post state, claps, views & editor actions
    │   ├── ContentContext.tsx           # Content tree CRUD, node lookups & path queries
    │   ├── LanguageContext.tsx          # Language switching & Web Speech API synthesis
    │   ├── StudyContext.tsx             # XP points, daily streaks, progress tracking, notes
    │   └── ThemeContext.tsx             # Age-adaptive skins & dark mode
    ├── data/
    │   ├── initialNodes.ts              # Unlimited-depth seeded curriculum hierarchy
    │   ├── initialUsers.ts              # Pre-configured demo personas & accounts
    │   └── schema.sql                   # PostgreSQL DDL with ltree & index definitions
    └── components/
        ├── admin/                       # Administrative & Authoring Dashboards
        │   ├── BranchAdminDashboard.tsx # Branch-scoped management & creator evaluations
        │   ├── ContentCreatorWorkspace.tsx # Rich lesson node authoring studio
        │   ├── FlowchartShapeBuilder.tsx # Interactive Mermaid diagram shape visualizer
        │   ├── FormattingToolbar.tsx    # Markdown formatting toolbar
        │   ├── MarkdownPreview.tsx      # Real-time Markdown previewer
        │   ├── MediumBlogEditor.tsx     # Full-featured Medium-style publishing studio
        │   ├── ReviewTranslationQueue.tsx # Side-by-side translation review & diffs
        │   └── SuperAdminDashboard.tsx  # Global platform administration & user directory
        ├── auth/
        │   └── AuthModal.tsx            # Modal for login, OTP registration & persona switcher
        ├── blogs/
        │   └── BlogAudioPlayer.tsx      # Bilingual paragraph audio player with Indian accent
        ├── classroom/                   # Interactive Classroom Learning Suite
        │   ├── AudioExplanationPlayer.tsx # Audio player for Devanagari/English lesson narration
        │   ├── ClassroomView.tsx        # Central classroom workspace layout
        │   ├── CodingSandbox.tsx        # In-browser multi-language code runner with test cases
        │   ├── CourseAccessGate.tsx     # Enrollment & authentication check gate
        │   ├── FlashcardDeck.tsx        # 3D flipping flashcards with Hindi/English front & back
        │   ├── FlowchartViewer.tsx      # Mermaid diagram renderer
        │   ├── LessonNotes.tsx          # Markdown notes with key takeaways
        │   ├── QuizEngine.tsx           # Active-recall assessment with instant explanations
        │   ├── SimulationSandbox.tsx    # HTML5 physics & wave audio simulators
        │   ├── TextToSpeechButton.tsx   # Text-to-speech speaker button
        │   └── VideoPlayer.tsx          # Video player with concept retention checkpoints
        ├── common/
        │   └── VeyraLogo.tsx            # SVG logo with Infinity Prism & Devanagari badge
        ├── courses/
        │   ├── Breadcrumbs.tsx          # Materialized path breadcrumb navigation
        │   ├── CourseBrowser.tsx        # Multi-category curriculum tree explorer
        │   └── CourseCard.tsx           # Course card with age-band badges & progress
        ├── layout/
        │   ├── AgeBandSelector.tsx      # Wonder, Quest, and Mastery zone selector
        │   ├── Footer.tsx               # Multilingual footer with DPDP compliance notice
        │   └── Navbar.tsx               # Responsive navbar with portal switching & alerts
        └── pages/
            ├── AboutPage.tsx            # Platform mission, leadership & pedagogical philosophy
            ├── AdminPage.tsx            # Admin gate routing to Super or Branch Admin dashboard
            ├── AuthPage.tsx             # Full-page authentication & password recovery
            ├── BenefitsPage.tsx         # Pedagogical advantages & learning methodologies
            ├── BlogsPage.tsx            # Medium-style multilingual article feed
            ├── ClassroomPage.tsx        # Dedicated lesson viewer & interactive workspace
            ├── ContactPage.tsx          # Contact, support & grievance redressal portal
            ├── ContentPage.tsx          # Content Studio for Creators & Reviewers
            ├── CoursesPage.tsx          # Course catalog & syllabus view
            ├── CreateBlogPage.tsx       # Dedicated blog creation view
            ├── LandingPage.tsx          # Hero, visitor counters, preview simulations & CTAs
            ├── SimulationsPage.tsx      # Standalone interactive simulation playground
            └── StudentDashboard.tsx     # Student learning portal with enrollment & metrics
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```
---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB instance running on port 27017, or a MongoDB Atlas connection string. *(If MongoDB is offline, the backend gracefully starts in standalone mode).*

### 2. Installation
```bash
npm install
```

### 3. Run Development Server (Full-Stack)
Run both the Express backend and the Vite frontend simultaneously with a single command:
```bash
npm run dev:all
```
* **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000)
* **Backend API**: Accessible at [http://localhost:5000](http://localhost:5000) (Proxy configured automatically in `vite.config.ts`)

### 4. Running Components Separately (Optional)
* **Backend Server Only**:
  ```bash
  npm run server
  ```
* **Frontend Dev Server Only**:
  ```bash
  npm run dev
  ```

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 📡 REST API Reference

The backend provides a structured REST API under `/api`:

### System & Health
* `GET /api/health` — Server health, uptime, heap/RSS memory usage, and MongoDB status.
* `GET /api/stats/visitors` — Current platform visitor count.
* `POST /api/stats/visit` — Atomically increment platform visitor count.

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new account with email verification OTP.
* `POST /api/auth/verify-email` — Verify 6-digit OTP and issue JWT.
* `POST /api/auth/resend-code` — Resend verification OTP.
* `POST /api/auth/login` — Sign in with email and password.
* `GET /api/auth/me` — Retrieve authenticated user profile.
* `POST /api/auth/forgot-password` — Initiate password recovery OTP.
* `POST /api/auth/reset-password` — Reset password using verified OTP.

### User & Team Governance (`/api/users`)
* `GET /api/users` — Paginated user directory with search and role filters *(Super Admin only)*.
* `POST /api/users` — Create Branch Admins or Content Admins.
* `GET /api/users/my-creators` — List Content Creators managed by the authenticated Branch Admin.
* `PATCH /api/users/:id/evaluate` — Submit quantitative and qualitative creator evaluation *(Branch Admin only)*.
* `GET /api/users/child/:identifier` — Retrieve student learning record for parent portal.
* `POST /api/users/enroll` — Enroll student into a course node.
* `POST /api/users/unenroll` — Unenroll student from a course.
* `POST /api/users/:id/remark` — Add administrative remark to user profile *(Super Admin only)*.
* `POST /api/users/:id/message` — Send direct notification message.
* `POST /api/users/broadcast` — Dispatch platform-wide broadcast notification *(Super Admin only)*.
* `PATCH /api/users/:id/role` — Update user role *(Super Admin only)*.
* `DELETE /api/users/:id` — Remove user account *(Super Admin only)*.

### Course Content Hierarchy (`/api/content`)
* `GET /api/content` — Retrieve course nodes (scoped by status and role).
* `GET /api/content/:id` — Retrieve single course node details.
* `POST /api/content` — Create course node *(Super Admin, Branch Admin, Content Creator)*.
* `PUT /api/content/:id` — Update course node and submit for review.
* `DELETE /api/content/:id` — Delete course node *(Super Admin, Branch Admin)*.
* `POST /api/content/:id/notes` — Save or update student/lesson notes.
* `POST /api/content/:id/flashcards` — Update flashcard deck for node.

### STEM Blog & Publishing Studio (`/api/blogs`)
* `GET /api/blogs` — List published articles with tags, search, and author info.
* `GET /api/blogs/:id` — Retrieve full article by ID.
* `POST /api/blogs/create-blog` — Publish or save draft article *(Super Admin, Branch Admin)*.
* `POST /api/blogs/upload-image` — Upload and host blog images to `/public/uploads/`.
* `POST /api/blogs/:id/clap` — Increment article clap count.
* `DELETE /api/blogs/:id` — Delete article *(Super Admin, Branch Admin)*.

---

## 📜 Compliance, Accessibility & Ethical Standards

* **Digital Personal Data Protection (DPDP) Act 2023**: Verifiable parental lookup gate, zero behavioral profiling for children under 18, and no public profile or social feed exposure for minors.
* **WCAG 2.1 AA Accessibility**: High-contrast dark and light modes, keyboard navigation, screen-reader semantic HTML, Devanagari typography legibility, and integrated text-to-speech narration.
* **OWASP Application Security**: Strict Content Security Policy, HSTS, sanitized inputs, rate-limited authentication, and token-based state authorization.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
