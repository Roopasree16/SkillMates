# SkillMates

SkillMates is a premium, modern, Tinder-like skill-sharing and matching platform designed to connect individuals who want to exchange skills. By matching users based on what they want to teach ("skills to teach") and what they want to learn ("skills to learn"), SkillMates fosters a collaborative, peer-to-peer educational community.

---

## Core Features

- **Intelligent Tinder-Style Matching Feed**
  - **Overlapping Interests:** View potential matches who teach what you want to learn, or want to learn what you teach.
  - **Match Percentage Indicators:** A calculated matching rate based on overlapping skill targets.
  - **Swipe Cards:** Tinder-like swipe layout. Swipe right to "Connect" or left to "Pass" on profiles.

- **Interactive Skill Verification Quizzes**
  - **Credibility Test:** Take tests in specific subjects to prove your competency.
  - **Dynamic Quiz Generator:** Quizzes are generated dynamically on demand using Deno Edge Functions and Gemini 2.5 Flash.
  - **Profile Badges:** Passing score grants verification badges visible to others on the matching feed.
  - **Retry Cooldowns:** Built-in 7-day cooldown timer for failed attempts before a retry is allowed.

- **Real-Time Chat & Collaboration**
  - **Instant Messaging:** Real-time text messaging between matched users powered by Supabase Realtime channels.
  - **Emoji Reactions:** React to chat messages.
  - **File & Resource Sharing:** Attach documents directly in the chat dialogue.
  - **Presence Tracker:** Displays user online/offline status and "last active" timestamps.

- **Audio & Video Learning Sessions**
  - **WebRTC Peer-to-Peer Calls:** Direct browser-to-browser voice and video calling.
  - **Supabase Call Signaling:** Uses a real-time `call_signals` database table to exchange SDP offers/answers and ICE candidates.
  - **Jitsi Conference Fallback:** Alternate video calling integration via `@jitsi/react-sdk`.
  - **Class Scheduler:** Integrated calendar module to book time slots for tutoring.

- **Shared Skill Vault (Resources Library)**
  - Centralized resource sharepoint for documents, slides, and links.
  - Materials are categorized by topic/skill for easy filtering.

- **Onboarding & Profile Wizard**
  - Structured wizard to set up profile details (bio, education level, avatar, age).
  - Multi-select interface to manage "Skills to Teach" and "Skills to Learn" dynamically.

---

## Tech Stack

### Frontend & Core
- **Framework:** React 18 + Vite (configured with `@vitejs/plugin-react-swc` for fast builds)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Vanilla CSS (glassmorphism UI, grid structures, animated themes)
- **UI Components:** Shadcn UI + Radix UI primitives + Tailwind CSS Animate
- **Icons:** Lucide React

### Backend & Integrations
- **Database & Realtime:** Supabase PostgreSQL Database, Realtime subscriptions, Storage buckets
- **Authentication:** Supabase Auth (Email / Password credentials)
- **State Management:** `@tanstack/react-query` (react-query) for cache management
- **Video Calling:** Native browser WebRTC + Jitsi React SDK

---

## Project Architecture

Here is the primary folder structure of the repository:

- **[src/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src)**: Application source code
  - **[components/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/components)**: Reusable components
    - **[chat/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/components/chat)**: Chat pane, attachments, WebRTC voice/video (`VideoCall.tsx`), and class scheduler.
    - **[quiz/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/components/quiz)**: Components for selecting, taking, and displaying results of skill tests.
    - **[ui/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/components/ui)**: Reusable atomic components (buttons, badges, avatars, dialogs, calendar, inputs).
  - **[hooks/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/hooks)**: Custom hooks (`useWebRTC.ts` for peer signaling, `usePresence.ts` for tracking online status, `use-toast.ts` for popups).
  - **[integrations/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/integrations)**: Configuration and typings for Supabase client.
  - **[pages/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/src/pages)**: Main views (`Index.tsx` landing, `Auth.tsx` login, `Dashboard.tsx` application feed, `Profile.tsx` editor).
- **[supabase/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/supabase)**: Backend configuration
  - **[migrations/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/supabase/migrations)**: SQL schemas establishing profiles, matches, chat, calling, and resources.
  - **[functions/](file:///c:/Users/gangi/OneDrive/Desktop/SkillMates/supabase/functions)**: Edge functions (e.g., account deletion, quiz generator).

---

## Database Schema & Tables

The Supabase PostgreSQL database includes the following key tables:

| Table | Primary Columns | Purpose |
|---|---|---|
| `profiles` | `id`, `user_id`, `full_name`, `age`, `bio`, `education`, `avatar_url`, `profile_completed` | User info, background details, and completion flags. |
| `skills` | `id`, `name`, `category` | Master list of matching subjects (e.g., React, Python, UI Design). |
| `user_skills` | `id`, `user_id`, `skill_id`, `skill_type` | Links profiles to skills they want to teach (`have`) or learn (`learn`). |
| `connection_requests` | `id`, `from_user_id`, `to_user_id`, `status` | Connect swipes. Statuses are `pending`, `accepted`, or `rejected`. |
| `conversations` | `id`, `participant_1`, `participant_2`, `last_message_at` | Active messaging sessions between paired users. |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `file_url`, `is_read` | Chats logs supporting texts, attachments, and read states. |
| `message_reactions` | `id`, `message_id`, `user_id`, `emoji` | Emoji badges applied by chat participants. |
| `scheduled_calls` | `id`, `conversation_id`, `scheduled_at`, `status`, `call_type` | Planned learning sessions between matches. |
| `call_signals` | `id`, `conversation_id`, `from_user_id`, `to_user_id`, `signal_type`, `signal_data` | WebRTC negotiation packets (SDP/ICE) for P2P video/voice call handshakes. |
| `shared_resources` | `id`, `user_id`, `title`, `file_url`, `category` | Skill resource vault files and shared documents. |
| `skill_verifications` | `id`, `user_id`, `skill_id`, `passed`, `score`, `next_attempt_at` | Tracks quiz results and lockdown retry timers. |
| `notifications` | `id`, `user_id`, `title`, `message`, `is_read`, `type` | Real-time alerts for incoming requests, matches, and calls. |
| `passed_profiles` | `id`, `user_id`, `passed_user_id` | Excludes skipped users from showing up on the match feed. |

---

## How WebRTC Signaling Works

1. **Initiation**: When User A calls User B, the calling screen initiates a WebRTC connection.
2. **Offer Creation**: User A creates an SDP offer and writes a row to `call_signals` with `signal_type: 'offer'`.
3. **Realtime Listeners**: User B is subscribed to the `call_signals` table for their `user_id`. Upon receiving the offer, they answer the call.
4. **Answer Return**: User B creates an SDP answer and writes it back to `call_signals` with `signal_type: 'answer'`.
5. **ICE Exchange**: Both peers generate ICE candidates and save them as `signal_type: 'ice-candidate'`.
6. **Stream Bind**: Realtime subscriptions sync these candidates and offers back and forth, allowing the peers to establish a direct connection and stream voice/video.

---

## Supabase Edge Functions

### 1. `generate-skill-test`
- **Location**: `supabase/functions/generate-skill-test/index.ts`
- **Model**: `google/gemini-2.5-flash`
- **Functionality**: Triggered when a user requests a skill verification test. It queries the Lovable AI gateway to compile 10 multiple-choice questions dynamically, covering a mix of beginner, intermediate, and advanced concepts.
- **Secrets Required**: `LOVABLE_API_KEY` (configured in Supabase Dashboard settings).

### 2. `delete-account`
- **Location**: `supabase/functions/delete-account/index.ts`
- **Functionality**: Performs a cascade deletion of all user data from tables (`profiles`, `connection_requests`, `user_skills`, etc.) before deleting the user from the Supabase authentication registry using service role privileges.

---

## Installation & Local Setup

### Prerequisites
Make sure you have **Node.js** (v18 or higher) and **npm** (or Bun) installed.

### 1. Clone & Navigate
```bash
git clone <YOUR_GIT_URL>
cd SkillMates
```

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Setup Environment Variables
Create a file named `.env` in the root of the project and populate it with your Supabase credentials:
```env
VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
VITE_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

### 4. Run Locally
Start the development server with hot-reloading:
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### 5. Build for Production
To compile and optimize the app for production deployment:
```bash
npm run build
```
This command checks TypeScript types, compiles assets, and deposits the production bundle into the `dist/` directory.

### 6. Deploying Edge Functions
If you are modifying or deploying the Supabase Edge Functions:
```bash
supabase functions deploy generate-skill-test --project-ref your-supabase-project-id
supabase functions deploy delete-account --project-ref your-supabase-project-id
```

---

## Available Scripts

In the project directory, you can run:

- **`npm run dev`**: Runs the app in development mode on port 8080.
- **`npm run build`**: Compiles the TypeScript application and builds it for production.
- **`npm run lint`**: Runs ESLint to check for code quality and styling violations.
- **`npm run preview`**: Serves the built production app locally for testing.
