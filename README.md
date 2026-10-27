# TaskFlow 🚀

A modern, high-performance task and project management web application built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Firebase**.

TaskFlow is designed to help individuals and teams organize tasks effortlessly through multiple views (List, Kanban board, Calendar), prioritize effectively with natural language quick-add, track productivity statistics, and stay focused with an integrated Focus Mode.

---

## ✨ Features

- 🔐 **Authentication & Security**:
  - Google Sign-In and Email/Password authentication powered by Firebase Auth.
  - Multi-tab offline persistence with Firestore.
  - Granular Cloud Firestore security rules with full ownership isolation.
- 📋 **Flexible Task Management**:
  - **Views**: List View, Drag-and-Drop Kanban Board (`@dnd-kit`), and Monthly Calendar View.
  - **Priorities**: Low, Medium, High, and Urgent indicators.
  - **Subtasks**: Break down complex tasks into checkable subtasks.
  - **Recycle Bin**: Soft-delete with easy restore or permanent deletion.
- ⚡ **Natural Language Quick Add**:
  - Type intuitively like `"Submit financial report tomorrow 09:00 #work p1"` and let the parser detect due dates, tags, and priorities automatically.
- 🎯 **Focus Mode**:
  - Distraction-free Pomodoro-style timer to maximize deep work sessions.
- 📊 **Productivity Statistics**:
  - Interactive charts powered by Recharts (completion rates, task distribution, weekly trends).
- 🌐 **Internationalization (i18n)**:
  - Full multi-language support (English and Indonesian).
- 🎨 **Modern UI & Themes**:
  - Sleek glassmorphism design with responsive dark mode, light mode, and system preference detection.
- 💾 **Data Management**:
  - Export and import your data anytime via JSON (backup) or CSV (spreadsheets).

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **State & Routing**: React Context API, [React Router v7](https://reactrouter.com/)
- **Backend & Database**: [Firebase Authentication](https://firebase.google.com/products/auth), [Cloud Firestore](https://firebase.google.com/products/firestore)
- **Utilities**: [dnd-kit](https://dndkit.com/), [date-fns](https://date-fns.org/), [i18next](https://www.i18next.com/), [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/), [@firebase/rules-unit-testing](https://firebase.google.com/docs/rules/unit-tests)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- A [Firebase Project](https://console.firebase.google.com/) with **Authentication** and **Cloud Firestore** enabled.

### 1. Clone the Repository

```bash
git clone https://github.com/FriesX/taskflow.git
cd taskflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Firebase credentials:

```env
VITE_USE_EMULATOR=false
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> 🔒 **Security Notice**: Never commit `.env` or `.env.local` to public version control. The repository's `.gitignore` is already preconfigured to exclude them.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite development server with HMR |
| `npm run build` | Compiles TypeScript and builds optimized production bundle |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs Oxlint linter for fast code analysis |
| `npm test` | Runs unit tests using Vitest |
| `npm run test:rules` | Runs Firestore security rules tests against Firebase Emulator |
| `npm run emulators` | Starts local Firebase Emulators (Auth & Firestore) |

---

## 🔒 Security & Privacy

- All user data in Cloud Firestore is strictly isolated per authenticated user ID (`request.auth.uid == userId`).
- Environment variables and credentials are excluded from version control via `.gitignore`.
- Unit tests ensure authorization and security rules cannot be breached.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
