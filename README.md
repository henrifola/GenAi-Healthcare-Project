# 🩺 HaruCare

**HaruCare** is an AI-powered healthcare companion system designed to analyze smart watch data (like Fitbit) and provide users with personalized daily insights and recommendations using Generative AI.

The goal is to make health data **understandable**, **actionable**, and **motivational** — all in natural language.

---

## 🚀 Features

- 🔗 Integration with Fitbit/smartwatch data APIs
- 🧠 GPT-powered daily insights and health tips
- 📊 Interactive UI using Chakra UI
- 🌐 Built with Next.js App Router and TypeScript

---

## 🛠️ Tech Stack

- **Next.js (App Router)**
- **React**
- **TypeScript**
- **Chakra UI**
- **OpenAI GPT API**
- **Fitbit API**
- **MongoDB (future integration)**
- **Axios (for REST API calls)**

---

## 📂 Folder Structure

```
healthcare-system/
├── .next/                   ← Next.js build output
├── .vscode/                 ← VS Code settings (optional)
├── node_modules/            ← Dependencies
├── public/                  ← Static files served at root (/)
│   ├── favicon.ico
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/                 ← App Router entry point
│   │   ├── home/
│   │   │   └── page.tsx     ← Home page (route: "/")
│   │   ├── social/          ← Social features
│   │   │   ├── activities/  ← Group activities
│   │   │   │   ├── page.tsx
│   │   │   │   └── ClientActivitiesPage.tsx
│   │   │   ├── challenges/  ← Weekly challenges
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx     ← Social hub page
│   │   ├── ClientLayout.tsx ← Client-side layout with providers
│   │   ├── layout.tsx       ← Global layout
│   │   └── page.tsx         ← Re-exports home/page.tsx as root
│   │
│   ├── components/          ← Reusable UI components
│   ├── context/             ← React contexts (Auth, Theme, etc.)
│   ├── hooks/               ← Custom React hooks
│   ├── styles/              ← CSS Modules and global styles
│   │   ├── globals.css
│   │   ├── theme.ts         ← Chakra UI theme configuration
│   │   └── page.module.css
│   └── utils/               ← Helper functions
│
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── yarn.lock
└── README.md
```

---

## 🧰 Installation & Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/harucare.git
cd harucare
```

### 2. Install dependencies

Using Yarn:
```bash
yarn install
```

Or with npm:
```bash
npm install
```

### 3. Run the development server

```bash
yarn dev
# or
npm run dev
```

### 4. Open in browser

Go to: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing GPT & Fitbit API (coming soon)

- GPT integration will live under `src/app/api/gpt/route.ts`
- Fitbit API calls will be handled securely through backend API routes

---

## 📅 Roadmap

- [x] Set up Next.js App Router
- [x] Chakra UI integration
- [ ] Fitbit OAuth and data sync
- [ ] GPT prompt templates and response logic
- [ ] MongoDB integration for user history
- [ ] User dashboard and insights page

---

## 🧑‍💻 Authors

Built with ❤️ by HaruCare Team