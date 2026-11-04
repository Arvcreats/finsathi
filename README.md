# 💰 FinSathi — Your Free Personal Finance Advisor

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Price: Free](https://img.shields.io/badge/Price-Free-brightgreen.svg)
![Made with HTML/CSS/JS](https://img.shields.io/badge/Made%20with-HTML%20%2B%20CSS%20%2B%20JS-orange.svg)
![No Sign-Up](https://img.shields.io/badge/Sign--Up-Not%20Required-blue.svg)

**FinSathi** is a free personal finance advisor that anyone can use — no sign-up, no fees, no app download. Enter your income, expenses and a money goal, and FinSathi builds your complete plan in seconds: budget check, monthly savings, goal timeline, emergency fund target, and friendly AI advice based on your own numbers.

> Most finance advisors and apps charge money. FinSathi is built to be **free for everyone, forever**.

---

## 🌐 Live Demo

👉 **[Open FinSathi](https://root-access-009.github.io/finsathi/)** *(link activates once GitHub Pages is turned on)*

## 📱 Install on Your Phone (like an app)

1. Open the live link in **Chrome** (Android) or **Safari** (iPhone)
2. Tap the menu (⋮) → **Add to Home screen**
3. FinSathi now sits on your home screen like a normal app — no Play Store needed

It also works on any laptop/desktop browser from the same link.

## ✨ Features

- **Instant money plan** — monthly savings, amount needed per month for your goal, and whether the goal is achievable in your target time (or how long it will actually take)
- **50/30/20 budget check** — animated bars compare your Needs / Wants / Savings against the ideal 50-30-20 split
- **Emergency fund target** — automatically calculated as 6 months of your essential expenses
- **Honest numbers** — all maths is done by code, never guessed by AI; if your spending exceeds your income, FinSathi shows the real negative figure instead of hiding it
- **AI advice** — tap *Get My Advice* for a short, practical plan in simple English, ending with 3 clear action points
- **Ask FinSathi** — a chat where you can ask follow-up questions about your own budget and goals
- **Your own API key** — every user enters their own free Gemini key, so there is no shared limit and no cost to anyone
- **Private by design** — everything runs in your browser. Your numbers are never sent to any server except Google's Gemini API (only when you ask for AI advice), and your key is stored only in your own browser

## 🔑 Get Your Free Gemini API Key (2 minutes)

The AI features need a free Google Gemini API key — it's your personal key and costs nothing:

1. Go to **[aistudio.google.com](https://aistudio.google.com)**
2. Sign in with your Google account
3. Click **Get API key** → **Create API key**
4. Copy the key, paste it into FinSathi's *FinSathi AI Advice* section, and tap **Save** (you only do this once)

> ⚠️ Never share your API key with anyone or post it publicly.

## 🛠️ Run It Locally

FinSathi is a single file — `index.html`. Just download it and open it in Chrome, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

> Note: open it in a real browser (Chrome). In-app file previews block the AI calls.

## 🗂️ Project Structure

```
finsathi/
├── index.html    ← the complete app (UI + calculations + AI)
├── README.md     ← this file
└── LICENSE       ← MIT License
```

## 🔄 Updates & Suggestions

FinSathi is a living project — **it is updated and improved from time to time** (new features, design changes and fixes). Check this repository for the latest version.

Have an idea, found a problem, or want a change? **Suggestions are welcome!** Open an [Issue](../../issues) in this repository and describe what you have in mind.

## 🛡️ Who Can Edit This Code?

Only the repository owner can change this code. This is a public repository, so anyone can **view** it and **fork** (make their own copy) it to experiment — but nobody else can edit or publish changes to this original repository. Suggestions come through Issues, and the owner decides what gets added.

## ⚠️ Disclaimer

FinSathi is an **educational money planner, not a SEBI-registered financial advisor**. It does not recommend any specific stock, mutual fund or crypto. For serious investment decisions, please consult a registered professional.

## 👤 Author

**Atharv Patel** — First-year B.Com student at MIT.
Built FinSathi so that good money planning is free for everyone, not just for people who can pay an advisor.

*FinSathi — Aspire. Save. Achieve.*

## 📄 License

Released under the [MIT License](LICENSE) — free to use, share and improve.
