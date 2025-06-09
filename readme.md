
# Monaa

**Monaa** is an AI-powered personal finance tracker that helps users manage and visualize their spending through a modern mobile app. It supports voice-based and manual transaction logging, budget planning, recurring entries, and powerful analytics — all wrapped in a beautiful and intuitive UI.

---

## 🚀 Features

- 🎙️ **Voice-powered transaction entry** (in-app & iOS widget-ready)
- 💰 **Monthly budget planning** with dynamic progress feedback
- 📊 **Interactive analytics**: pie charts, line graphs, and breakdowns
- 🔁 **Recurring transactions** with pause/resume & auto-generation
- 📅 **Month carousel** to filter data dynamically by month
- 📄 **PDF export** of financial summaries (iOS supported)
- 🔐 **JWT & Secure Cookie-based Authentication**
- 🧠 **AI integration** (FastAPI model parses voice data into structured transactions)

---

## 🧰 Tech Stack

### Frontend (React Native w/ Expo)
- `react-native-reanimated-carousel`
- `react-native-gifted-charts`
- `react-native-modal-datetime-picker`
- `expo-av` (for recording)
- `expo-print` / `react-native-html-to-pdf`
- `@react-navigation/native`

### Backend (Node.js + Express)
- `MongoDB` with Mongoose ODM
- `jsonwebtoken` for auth
- `bcryptjs` for password hashing
- `cookie-parser` + `http-only` cookies for secure token handling
- RESTful API architecture (CRUD for transactions, budgets, recurring)

### AI Service (Python + FastAPI)
- Speech-to-text processing using Whisper
- NLP model to extract transaction details: `amount`, `category`, `date`, `type`
- `/predict-voice` route returns parsed result from `.m4a` audio

### Widget (iOS)
- Planned: React Native + Swift bridge OR direct Swift/WidgetKit for voice recording and transaction sync

---

## 🗂️ Folder Structure

```
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   └── server.js
├── frontend (React Native)
│   ├── screens
│   ├── components
│   ├── utils
│   ├── constants
│   └── App.tsx
├── ai-service (FastAPI)
│   ├── main.py
│   ├── model.py
│   └── utils/audio_parser.py
```

---

## 🔄 API Overview

| Endpoint                          | Method | Description                                |
|----------------------------------|--------|--------------------------------------------|
| `/api/v1/auth/register`          | POST   | Register new user                          |
| `/api/v1/auth/login`             | POST   | Login with email/password                  |
| `/api/v1/auth/refresh-token`     | POST   | Get new access token using refresh token   |
| `/api/v1/transactions`           | GET/POST | Fetch or create user transactions          |
| `/api/v1/budgets`                | GET/POST | Fetch or create user budget                |
| `/api/v1/recurring-items`        | GET/POST | Manage recurring transactions              |
| `/api/predict-voice` (FastAPI)   | POST   | Upload `.m4a` and receive structured data  |

---

## 📲 Voice Transaction Flow

1. User records `.m4a` audio
2. Audio sent to FastAPI `/predict-voice`
3. API returns: `{ amount, type, category, date }`
4. App shows preview modal for confirmation
5. User confirms → transaction saved via Node.js `/transactions`

---

## 📸 Screenshots

_Add here when ready:_
- Home screen (budget + chart)
- Transaction summary pie chart
- Voice entry modal

---

## 🛠️ Installation & Setup

### 1. Backend
```bash
cd backend
npm install
npm run dev  # Uses nodemon
```

### 2. Frontend
```bash
cd frontend
npm install
npx expo start
```

### 3. FastAPI AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🔒 Auth Strategy

- JWT access + refresh tokens
- HTTP-only cookies for secure sessions
- Token refresh on app boot
- Global `401` handler + refresh retry
- Redirect unauthenticated users to login

---

## 🧪 Testing

- Unit-tested key controllers
- Manual QA of flows (voice, recurring, budget progress, etc.)
- Persistent session checks with refresh logic

---

## ✅ Latest Commit

> _"Implemented full monthly carousel sync with transaction and budget update, replaced pie chart with interactive gifted-charts, added PDF export and summary modal."_ — `June 8, 2025`

---

## 📄 License

MIT License

---

## 🙌 Credits

Created with ❤️ by [Sagar Parmar](https://github.com/your-profile) — AI + Finance @ Centennial College

---

> _"Track smarter. Speak your spend. Monaa your money."_ 💬💸
