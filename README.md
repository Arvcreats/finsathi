# FinSathi — Your Free Personal Finance Advisor

![FinSathi logo](logo.png)

**FinSathi** is a free, no-sign-up personal finance planner for Indian users. It builds an honest money plan from your income, expenses and goals — and explains it like a friend, in **English, हिंदी or Hinglish**.

All calculations (budget split, savings, goal timelines, SIP growth, EMIs) are done by **code**, never guessed by AI. The optional AI only explains your plan in words.

**Live app:** https://arvcreats.github.io/finsathi/

## Features

- **3-step money plan** — Income → Expenses → Goal, with inline validation (no negatives, age 18–100, overspend warnings)
- **Hero result** — "You save ₹X every month", 50/30/20 budget check, emergency fund target (3/6/9 months, your choice)
- **Charts** — needs/wants/savings donut + savings-growth projection (hand-rolled SVG, no libraries)
- **What-if sliders** — cut wants, add income, extend time; watch the goal move, live
- **Up to 5 goals** — progress bars, per-month needed, months at your savings rate
- **Expense tracker** — monthly needs/wants totals, one tap to feed them into your plan
- **SIP / growth calculator** — with *your own* expected return % (estimate, never a promise)
- **Loan / EMI planner** — EMI, total interest, and how much an extra monthly payment saves you
- **Share & export** — WhatsApp summary, PNG plan card, print-ready PDF
- **Optional AI advice + chat** — bring your own free Gemini API key; the app is fully useful without it
- **3 languages** — English / हिंदी / Hinglish, including the AI's answers
- **Dark & light themes**, auto-save in your browser, one-tap reset
- **Real PWA** — installable, works offline
- **Android APK** — also available as a real Android app (signed APK, Android 7+); see below

## Android APK

FinSathi also comes as a real Android app — the same live app, opening full-screen without a browser.

**Download:** [FinSathi.apk](https://github.com/Arvcreats/finsathi/releases/latest/download/FinSathi.apk) (from this repo's Releases)

1. Download the APK on your Android phone.
2. Open it from **Files → Downloads** and tap **Install** (Android may ask you to allow "Install unknown apps" once).
3. Works on Android 7.0 or above. Signed APK, package `io.github.arvcreats.finsathi`.

> Prefer not to install anything? The PWA route below works in any browser — iPhone and desktop users should use that one.

## Install the app (PWA)

- **Android (Chrome):** open the live link → tap **Install** in the FinSathi banner (or ⋮ menu → *Install app*).
- **iPhone (Safari):** open the live link → **Share** → **Add to Home Screen**.
- **Desktop (Chrome/Edge):** use the install icon in the address bar.

Once installed, FinSathi opens like a normal app and works offline. Your data never leaves your device (everything is stored in your browser's localStorage).

## Get your free Gemini API key (optional, for AI advice)

1. Go to [aistudio.google.com](https://aistudio.google.com) and sign in with a Google account.
2. Click **Get API key** → **Create API key**.
3. In FinSathi, open the **Ask** tab → **Advanced / AI setup**, paste the key, tap **Save**. One time only.

Your key stays in your browser and is sent only to Google's Gemini API when you ask for advice. Never share your key with anyone.

> **Recommended upgrade path:** for a public deployment at scale, route AI calls through a **Cloudflare Worker proxy** so a shared key is never shipped to browsers, and add per-user rate limits. The current bring-your-own-key model keeps the app free and backend-less.

## Run it locally

No build step, no framework — plain HTML/CSS/vanilla JS:

```bash
git clone https://github.com/Arvcreats/finsathi.git
cd finsathi
python3 -m http.server 8000   # then open http://localhost:8000
```

Files: `index.html` (structure) • `style.css` (design) • `app.js` (logic; `calcPlan()` is a pure, testable function with example cases in comments) • `manifest.json` + `sw.js` (PWA) • `logo.png`.

Money is formatted in the Indian system (₹1,00,000) throughout.

## 🔄 Updates & Suggestions

This repository is updated from time to time with improvements and new features. Suggestions are welcome — please open an **Issue** with your idea.

## 🛡️ Who Can Edit This Code?

Only the repository owner can edit this code and publish changes. The code is public so anyone can **view** it or **fork** it to make their own version, but changes to this live app can only be made by the owner.

## Disclaimer

FinSathi is an **educational money planner**, not a SEBI-registered financial advisor. It does not recommend any specific stock, mutual fund or crypto. Calculator results are estimates based on the numbers and return assumptions *you* enter; market returns are never guaranteed. Please consult a registered advisor for personalised financial advice.

## Author

**ARV** — First-year B.Com student at MIT, Pune.
LinkedIn: https://www.linkedin.com/in/atharv-patel-b89991272 • Book a meeting: https://calendly.com/atharvpatel2008/meeting-with-atharv-patel

MIT License — © 2026 ARV. See [LICENSE](LICENSE).
