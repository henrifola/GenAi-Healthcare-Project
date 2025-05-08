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

### 3. Create a `.env.local` file
Create a `.env.local` file in the root directory of the project and add your environment variables. You can use the `.env.example` file as a reference.

```bash
cp .env.example .env.local
```

### 4. Set up MongoDB

스크립트에 실행 권한을 부여했으니 이제 MongoDB를 시작할 수 있습니다. 다음 명령어로 MongoDB를 실행할 수 있습니다:

```bash
./start-mongodb.sh
```

이 스크립트는 .env.local 파일의 환경 변수를 읽어오고 Docker Compose를 사용해 MongoDB를 백그라운드로 실행합니다.

### 구성된 MongoDB 환경

- **데이터베이스**: harucare (환경 변수에서 변경 가능)
- **사용자**: harucare_user
- **비밀번호**: harucare_password
- **포트**: 27017 (기본값)
- **연결 문자열**: mongodb://harucare_user:harucare_password@localhost:27017/harucare

### 자동 생성된 컬렉션 및 인덱스

- `users` 컬렉션 - 사용자 정보 저장 (email 필드에 유니크 인덱스)
- `fitbit_activities` 컬렉션 - Fitbit 데이터 저장 (userId와 date 필드 조합에 유니크 인덱스)

### 5. Run the development server

```bash
yarn dev
# or
npm run dev
```

### 6. Open in browser

Go to: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing GPT & Fitbit API (coming soon)

- GPT integration will live under `src/app/api/gpt/route.ts`
- Fitbit API calls will be handled securely through backend API routes

---

## 📅 Roadmap

- [x] Set up Next.js App Router
- [x] Chakra UI integration
- [x] User authentication with Google OAuth
- [x] Social features (activities & challenges)
- [x] Fitbit OAuth and data sync
- [ ] Integrate GPT API for generated insights
- [x] MongoDB integration for user history
- [x] User dashboard

---

## 🧑‍💻 Authors

Built with ❤️ by HaruCare Team