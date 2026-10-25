# MiniKitchen — Project Submission & Evaluation Dossier

> **Artisanal Seasonal Dining Web Application, AI Concierge & Management Platform**  
> Built with Next.js 16 (App Router), Google Gemini API, Supabase Cloud PostgreSQL, and Tailwind CSS v4.

---

## 📌 Submission Links & Credentials

| Deliverable | URL / Link | Notes & Credentials |
| :--- | :--- | :--- |
| 🎥 **Video Walkthrough** | [Google Drive Video Demo](https://drive.google.com/file/d/1s32ucdlQjRi66pvO1vaQOgVXRf7gpm3h/view) | Full feature demonstration & viva walkthrough |
| 🌐 **Live Production Site** | [https://minikitchen-mkc4-delta.vercel.app](https://minikitchen-mkc4-delta.vercel.app/) | Deployed on Vercel Edge Serverless |
| 💻 **GitHub Repository** | [https://github.com/yoosuf2461-creator/minikitchen](https://github.com/yoosuf2461-creator/minikitchen) | Clean repository with full commit history |
| 🛡️ **Admin Portal** | [https://minikitchen-mkc4-delta.vercel.app/admin](https://minikitchen-mkc4-delta.vercel.app/admin) | Protected dining room management dashboard |
| 🔑 **Admin Login** | [https://minikitchen-mkc4-delta.vercel.app/admin/login](https://minikitchen-mkc4-delta.vercel.app/admin/login) | **Username:** `admin`<br>**Password:** `minikitchen2026`<br>*(Also accessible via homepage hamburger menu)* |

---

## 🚀 Executive Summary

**MiniKitchen** is a full-stack artisanal restaurant web application that blends bespoke editorial design with production-grade engineering and conversational AI:

1. **Anti-AI Slop Public Website**: Bespoke typography (`Italiana` display & `Outfit` body), tailored dark aesthetic (`#121110`), 60fps Lenis inertial scrolling, authentic food photography, and zero generic boilerplate elements.
2. **Conversational AI Concierge ("Remy")**: Direct integration with Google Gemini 2.5 Flash. Features multi-turn intent extraction, live dietary recommendations (Gluten-Free, Vegan, Vegetarian), menu price awareness in Sri Lankan Rupees (LKR), and an automated booking tool.
3. **Strict Non-Confirmation Safety Rule**: As required, Remy **strictly never confirms** reservations on its own; it persists them with **`Status: PENDING`** and issues a receipt with a disclaimer requiring human manager review.
4. **Full-Featured Operational Admin Portal (`/admin`)**: Protected by secure session cookies, enabling managers to approve/decline reservations, toggle dish availability (`Available` $\leftrightarrow$ `Sold Out`) with live site sync, update 7-day service schedules, and edit restaurant information.
5. **1-Click Multi-Channel Notification Dispatch**: When confirming a booking, managers get an automated drawer with pre-formatted messages for **WhatsApp**, **Native Mobile SMS**, **Gmail Web**, **Outlook Web**, and **Desktop Mail App** (with automatic clipboard fallback).
6. **Dual-Layer Cloud & Offline Persistence**: Production data persists in a Supabase PostgreSQL cloud database for seamless multi-device live sync, with an automatic fallback to local atomic JSON storage (`data/restaurant.json`).

---

## 🧪 3-Minute Live Evaluator Verification Guide

Evaluators can test and verify all core competencies using these quick steps:

### Test 1: AI Concierge Must-Pass Workflow ("Remy")
1. Open the [Live Site](https://minikitchen-mkc4-delta.vercel.app/) and click the floating chat icon in the bottom-right corner.
2. Inquire naturally:  
   *`"Hi, I'd like to book a table for 2 people tonight."`*
3. Remy warmly acknowledges your request and identifies missing details (Guest Name, Time, and Contact Number).
4. Provide the details:  
   *`"My name is Tharindu Jayawardena, 8:00 PM, phone 077 123 4567"`*
5. **Observe the result**:
   - Remy calls the booking engine and outputs a digital receipt.
   - **Verification**: The receipt displays **`Status: PENDING`** with an explicit notice that a dining room manager will review and confirm.
6. Open `/admin` $\rightarrow$ click the **Pending** tab $\rightarrow$ the reservation appears in real-time with the badge `AI Concierge (Remy)`.

### Test 2: Table Confirmation & Multi-Channel Dispatch
1. In `/admin` under **Pending**, click **"Confirm Table"** on any reservation.
2. The booking updates to **`Confirmed`** immediately in the database.
3. The **Notification Dispatch Drawer** opens automatically with a personalized guest message.
4. **Test the dispatch channels**:
   - **WhatsApp**: Click **💬 WhatsApp** to open WhatsApp Web/App pre-filled with the booking details.
   - **SMS**: Click **📱 SMS** to open your mobile device's native messaging composer.
   - **Gmail Web**: Click **📮 Gmail** to open Gmail Web compose in a new tab with recipient, subject, and body ready.
   - **Outlook Web**: Click **📧 Outlook** to open Outlook Web compose with all details pre-filled.
   - **Mail App**: Click **✉️ Mail App** to trigger your desktop client; it also automatically copies the full email to your clipboard with an instant visual toast notification (`✓ Copied to Clipboard!`).

### Test 3: Live Menu Sync & Sold-Out Toggling
1. In `/admin`, switch to the **Seasonal Menu** tab.
2. Locate any dish (e.g., *Slow-Roasted Jaffna Black Pork*) and click **● Available**.
3. It toggles to **○ Sold Out**.
4. In another tab or on your phone, open the [Homepage Menu](https://minikitchen-mkc4-delta.vercel.app/#menu).
5. **Observe**: The dish card is immediately desaturated with strikethrough pricing (`~~LKR 6,200~~ Sold out`).
6. Ask Remy in chat: *"Is the Black Pork available tonight?"* $\rightarrow$ Remy responds that it is sold out for the evening and recommends alternatives.

### Test 4: Mobile Responsiveness
1. Open `/admin` on an iPhone, Android device, or Chrome DevTools Mobile View (`Ctrl+Shift+M`).
2. Swipe across the navigation tabs (`Table Reservations`, `Seasonal Menu`, `Hours & Operations`).
3. Notice touch targets ($\ge 44\text{px}$), horizontal scroll chips, password visibility toggle, and full responsive layout.

---

## 🏗️ System Architecture & Engineering Highlights

```mermaid
graph TD
    Client[Public Web Client / Mobile] -->|Browses Menu / Books Table| NextApp[Next.js 16 App Router]
    Client -->|Conversational Chat| ChatAPI[/api/chat - Gemini 2.5 Flash]
    Admin[Manager Mobile / Desktop] -->|Auth Session Cookie| AdminPortal[/admin & /admin/login]
    
    NextApp --> DBRouter{Dual-Layer Persistence}
    ChatAPI --> DBRouter
    AdminPortal --> DBRouter
    
    DBRouter -->|Production Cloud| Supabase[(Supabase PostgreSQL)]
    DBRouter -->|Offline / Local Fallback| JSONStore[(Atomic restaurant.json)]
    
    AdminPortal -->|Confirm Action| Dispatcher[Notification Dispatch Engine]
    Dispatcher --> WhatsApp[WhatsApp Web/App API]
    Dispatcher --> SMS[Native Mobile SMS]
    Dispatcher --> Gmail[Gmail Web Compose]
    Dispatcher --> Outlook[Outlook Web Compose]
    Dispatcher --> Mailto[RFC Mailto + Clipboard]
```

### 1. Dual-Layer Persistence Architecture
- **Cloud Database (Supabase PostgreSQL)**: Tables for `reservations`, `menu_items`, and `restaurant_settings` with public RLS policies. Changes made on one device (e.g., phone in admin) reflect instantly on another (e.g., laptop on public menu).
- **Atomic Local JSON Fallback**: If network fails or during offline evaluation, `src/lib/db.ts` seamlessly reads and writes to `data/restaurant.json` atomically with temporary swap files, ensuring zero downtime.

### 2. Guardrailed AI Concierge Engine
- **Engine**: Google Gemini 2.5 Flash with structured system instructions via `@google/genai`.
- **Tool Calling**: When complete reservation parameters are detected, the model triggers the `create_pending_reservation` tool.
- **Fail-Safe Fallback**: If the Gemini API quota is exceeded or offline, a built-in deterministic heuristic rule engine takes over seamlessly to gather details and generate pending reservations.

### 3. Security & Best Practices
- **Signed Session Authentication**: Admin routes use HTTP-only cookies; unauthenticated requests are redirected to `/admin/login`.
- **Credential Protection**: Public client keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are safely separated; `GEMINI_API_KEY` remains strictly server-side.
- **Rate Limiting**: Consecutive failed login attempts trigger temporary lockout protection.

---

## 💻 Tech Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.4.3 (Turbopack, App Router, React 19) |
| **Language** | TypeScript 5 (Strict Mode, 100% Type-Safe) |
| **Styling** | Tailwind CSS v4, Custom Design Tokens, CSS Variables |
| **AI Integration** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Database** | Supabase PostgreSQL (`@supabase/supabase-js`) & Atomic Local JSON |
| **UX & Motion** | Lenis Smooth Scroll (`lenis`), Lucide Icons (`lucide-react`) |
| **Deployment** | Vercel Edge Serverless Platform |

---

## 📂 Project Repository Structure

```
minikitchen/
├── data/
│   └── restaurant.json         # Atomic local document fallback database
├── public/
│   └── images/menu/            # Curated artisanal culinary photography
├── qa/
│   └── EVALUATOR-QA.md         # Evaluator viva questions & cheat sheet
├── src/
│   ├── app/
│   │   ├── admin/              # Operational Admin Portal & Login
│   │   ├── api/                # REST endpoints (auth, chat, menu, reservations, restaurant)
│   │   ├── layout.tsx          # Root layout with font optimization & smooth scroll
│   │   └── page.tsx            # Public dining homepage
│   ├── components/             # Reusable UI (Hero, Menu, BookingForm, ChatBot, Admin, etc.)
│   └── lib/                    # Supabase client, Gemini API handler, DB abstraction, Types
├── supabase-schema.sql         # Supabase PostgreSQL schema & seeding script
├── README.md                   # Comprehensive technical documentation
└── SUBMISSION.md               # Official submission file
```

---

*Submitted by yoosuf2461-creator for MiniKitchen Technical Evaluation.*
