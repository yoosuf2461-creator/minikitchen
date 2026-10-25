# MiniKitchen — Evaluator Q&A & Live Testing Cheat Sheet

This guide is designed for your presentation and viva. It gives you **short, natural, human answers** (no heavy jargon) and explains **step-by-step how evaluators will test the app live**.

---

## 🎯 Part 1: Common Questions & Simple Answers

### Q1: "Where is the data stored? Why didn't you use a cloud database like MongoDB or Supabase?"
> **Simple Answer to give:**  
> *"I used a local JSON document database (`data/restaurant.json`) so that **anyone evaluating this project can clone it and run it immediately without setting up accounts or database keys**.  
> The code is cleanly separated in `db.ts`, so if we want to connect Supabase or PostgreSQL for a live production launch, we only need to change that single file."*

---

### Q2: "How does the AI Chatbot work? What happens when a customer asks for a table?"
> **Simple Answer to give:**  
> *"It's connected directly to the Google Gemini AI.  
> When a customer says 'I want a table tonight', the AI notices what details are missing (like their name, time, party size, or phone number) and asks for them conversationally.  
> Once it has everything, it automatically saves the booking into our database with status **PENDING**.  
> **Important rule:** The AI is strictly programmed to never say 'Confirmed'. It gives a pending receipt and tells the customer that a dining room manager has to approve the booking first."*

---

### Q3: "How does the admin dashboard update the public website?"
> **Simple Answer to give:**  
> *"The admin dashboard and the website share the same live backend API.  
> When an admin marks an item 'Sold Out' or edits a price in `/admin`, the change saves instantly to the database. When a guest views the menu on the homepage, that dish immediately appears dimmed with strikethrough pricing (`~~LKR 6,200~~ Sold out`)."*

---

### Q4: "How does admin login and security work?"
> **Simple Answer to give:**  
> *"The admin portal is protected by signed session cookies. Only logged-in managers can edit the menu, change opening hours, or view reservations.  
> There is also a built-in rate limiter that temporarily locks out login attempts if someone enters the wrong password 5 times."*

---

### Q5: "What if someone doesn't have an internet connection or the Gemini API key runs out?"
> **Simple Answer to give:**  
> *"The app has an automatic fallback engine. If the Gemini API key is missing or busy, our internal culinary engine steps in to answer menu questions and take pending reservations so the website never crashes."*

---

## 🧪 Part 2: Live Testing Script (What Evaluators Will Test & What to Show)

Evaluators will usually perform these **4 specific tests**. Here is what to click and say:

### Test 1: The AI Concierge Test ("Must-Pass Requirement")
1. **Action**: Click the floating chat icon at the bottom right of the homepage.
2. **What to type**:
   ```
   Hi, I'd like to book a table for 2 people tonight.
   ```
3. **What happens**: Remy (the AI) will warmly greet the guest and ask for the missing details (Name, Time, Phone number).
4. **Follow-up response**:
   ```
   My name is Tharindu, 8 PM, phone 077 123 4567
   ```
5. **Expected result**:
   - The AI generates a booking receipt.
   - The receipt clearly says **Status: PENDING** (it will NOT say confirmed).
   - The AI tells the guest: *"A dining room manager will review and confirm your table shortly."*
6. **Verify in Admin**: Open `/admin` in a new tab $\rightarrow$ click the **Pending** tab $\rightarrow$ you will see Tharindu's reservation with the badge `AI Concierge (Remy)`.

---

### Test 2: Live Menu Sync (Sold Out Toggle)
1. **Action**: Open `/admin` and go to the **Menu Management** tab.
2. **Action**: Find **Slow-Roasted Jaffna Black Pork** (or any dish) and click the **● Available** button.
3. **What happens**: The button turns grey into **○ Sold Out**.
4. **Action**: Go back to the public homepage and scroll down to the Menu section.
5. **Expected result**:
   - The dish photo turns grayscale/dimmed.
   - The price shows strikethrough: `~~LKR 6,200~~ Sold out`.
   - If someone asks Remy in chat *"Is the Black Pork available?"*, Remy will answer that it is currently sold out for the evening!

---

### Test 3: Public Website Reservation Form
1. **Action**: Scroll to the **"Reserve a Table"** section on the homepage.
2. **Action**:
   - Use the `— 2 +` stepper to pick party size.
   - Select a session chip (`Dinner · 19:30`).
   - Enter a Name and Phone/Email.
   - Click **"Submit Table Request"**.
3. **Expected result**:
   - A digital reservation confirmation card pops up with a reference ID (e.g. `RES-8924`).
   - The reservation immediately appears in `/admin` under **Pending** with the badge `Website Form`.

---

### Test 4: Manager Approval & Operations
1. **Action**: In `/admin`, find the pending reservation.
2. **Action**: Click the green **"Confirm Table"** button.
3. **Expected result**:
   - The status updates instantly to **Confirmed**.
   - The counter updates (e.g. Confirmed: 4).
4. **Action**: Switch to the **Operating Hours** tab.
5. **Action**: Toggle Monday from Open to **Closed / Rest Day**.
6. **Expected result**:
   - Scroll to the footer or contact section on the homepage: Monday now says **Closed (Rest Day)**.

---

## 🔑 Evaluator Credentials Quick Reference

| Role | URL | Username | Password |
| :--- | :--- | :--- | :--- |
| **Public Dining Site** | `http://localhost:3000` | N/A | N/A |
| **Admin Portal** | `http://localhost:3000/admin` | `admin` | `minikitchen2026` |
| **Hamburger Menu Link** | Top-right menu on `/` | Directly links to `/admin/login` for testing convenience |

