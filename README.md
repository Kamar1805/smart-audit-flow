# SAPS — Smart Audit & Procurement System

A web-based, AI-powered procurement and audit workflow platform that brings transparency, 
compliance, and speed to organizational spending processes.

---

## 🧠 About

SAPS digitizes and streamlines the end-to-end procurement lifecycle — from initial 
purchase requests through procurement review, audit compliance checks, and final 
finance approval. It uses Google Gemini AI for real-time price anomaly detection 
and compliance risk assessment.

---

## ✨ Features

- 🔐 **Role-Based Access Control** — Separate dashboards for Requesters, Procurement, 
  Audit, Finance, and Executives
- 🤖 **AI-Powered Compliance** — Automated compliance checks and risk scoring via Gemini AI
- 📊 **Price Anomaly Detection** — Real-time market rate analysis to flag suspicious pricing
- 📋 **End-to-End Workflow** — Full request lifecycle tracking with status updates
- 📁 **Document Management** — Attach memos and supporting documents to requests
- 📈 **Executive Dashboard** — High-level analytics and spending insights
- 📄 **PDF Export** — Generate and download audit reports
- 🌙 **Dark Mode** — Full light/dark theme support

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| Backend / Auth | Firebase (Auth + Firestore) |
| AI | Google Gemini API |
| PDF | jsPDF, html2canvas |
| Forms | React Hook Form, Zod |
| State | TanStack Query |

---

## 🔄 How It Works

1. **Requester** — Submits a procurement request with details and attachments
2. **Procurement** — Runs AI price checks, verifies vendor info
3. **Audit** — Reviews documents for policy compliance
4. **Finance** — Verifies budget codes and authorizes payment
5. **Executive** — Monitors all activity via analytics dashboard

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Firebase project with Firestore and Authentication enabled
- Google Gemini API key

### Installation

```bash
git clone https://github.com/your-username/smart-audit-flow.git
cd smart-audit-flow
bun install   # or npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

### Run

```bash
bun dev   # or npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `requester` | Submit and track requests |
| `procurement` | Review, run AI checks |
| `audit` | Compliance review |
| `finance` | Budget approval |
| `executive` | Full analytics view |

---

## 📄 License

This project is for academic/organizational use.
