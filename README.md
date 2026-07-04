# SkillMates

SkillMates is a skill-sharing and matching platform designed to connect individuals who want to exchange skills. By matching users based on what they want to teach and what they want to learn, SkillMates fosters a collaborative, peer-to-peer educational community.

---

## Core Features

- **Skill-Based Matching Feed**: Connect with other users whose teaching skills align with your learning interests.
- **Skill Verification Quizzes**: Take dynamic, AI-generated quizzes in specific subjects to earn verification badges for your profile.
- **Real-Time Chat**: Message matched peers instantly with support for text, emoji reactions, and file uploads.
- **Audio & Video Calls**: Learn in live sessions using direct peer-to-peer WebRTC calling or Jitsi.
- **Class Scheduler**: Book future tutoring and collaboration time slots using an integrated calendar.
- **Shared Resources**: Upload and share files, guides, or links categorized by topic.

---

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Radix UI
- **Backend**: Supabase (Auth, Database, Realtime, Storage, Edge Functions)
- **Calling**: WebRTC (custom database signaling) + Jitsi React SDK

---

## Folder Structure

- **[src/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src)**: Application source code
  - **[components/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/components)**: Matching UI, real-time chat, quizzes, resources, and shared inputs.
  - **[hooks/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/hooks)**: Custom hooks for WebRTC, presence tracking, and styling.
  - **[pages/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/pages)**: Application views (Landing, Auth, Dashboard, and Profile).
- **[supabase/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/supabase)**: Backend migrations and Edge Functions.

---

## Local Setup

### Prerequisites
Make sure you have **Node.js** (v18 or higher) and **npm** installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root of the project with your Supabase credentials:
```env
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### 4. Build for Production
```bash
npm run build
```
The optimized bundle will be compiled into the `dist/` directory.
