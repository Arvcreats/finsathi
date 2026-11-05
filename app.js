/* ============================================================
   FinSathi — app.js (Stage 3: persistence + 3 languages)
   Principle: ALL calculations are done by code, never by AI.
   The AI (optional) only explains the plan in words.
   ============================================================ */

// ⚙️ CONFIG — verify the model name in Google AI Studio before deploying.
// If "gemini-3.8-flash" ever returns a 404, check aistudio.google.com for the
// current free Flash model name and change ONLY this one line.
var CONFIG = {
  GEMINI_MODEL: "gemini-3.8-flash",
  GEMINI_API_BASE: "https://generativelanguage.googleapis.com/v1beta/models/",
  STORAGE_KEY: "finsathi_key",
  THEME_KEY: "finsathi_theme",
  LANG_KEY: "finsathi_lang",
  DATA_KEY: "finsathi_data_v2",
  INSTALL_KEY: "finsathi_install_dismissed",
  SEEN_KEY: "finsathi_seen_version",
  // Bump APP_VERSION on every release AND update whatsnew_text in all
  // 3 languages below — the What's New strip then shows once per user.
  APP_VERSION: "2.1"
};

// ==CALC START==
// Pure calculation — no DOM, no AI. Safe to unit-test.
/* Example test cases (expected results):
   calcPlan(50000, 22000, 13000, 40000, 6, 6)
     -> savings 15000, neededPerMonth 6666.67, achievable true, actualMonths 2.7, emergency 132000
   calcPlan(30000, 20000, 12000, 40000, 6, 3)
     -> savings -2000 (honest negative, never hidden), achievable false, actualMonths Infinity, emergency 60000   */
function calcPlan(income, needs, wants, goalAmount, targetMonths, efMonths){
  efMonths = (efMonths === undefined || efMonths === null) ? 6 : efMonths;
  var savings = income - needs - wants;
  var needsPct = income > 0 ? (needs / income) * 100 : 0;
  var wantsPct = income > 0 ? (wants / income) * 100 : 0;
  var savPct   = income > 0 ? (savings / income) * 100 : 0;
  var neededPerMonth = targetMonths > 0 ? goalAmount / targetMonths : 0;
  var achievable = savings >= neededPerMonth && savings > 0;
  var actualMonths = savings > 0 ? Math.round((goalAmount / savings) * 10) / 10 : Infinity;
  var emergency = needs * efMonths;
  return { savings:savings, needsPct:needsPct, wantsPct:wantsPct, savPct:savPct,
           neededPerMonth:neededPerMonth, achievable:achievable,
           actualMonths:actualMonths, emergency:emergency, efMonths:efMonths };
}
// ==CALC END==

// ---------- Formatting ----------
function inr(n){
  if (n === null || n === undefined || !isFinite(n)) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ---------- Validation (pure — returns error CODES + warnings, no DOM) ----------
function validateInputs(v){
  var errors = {};
  function isNum(x){ return x !== "" && x !== null && !isNaN(parseFloat(x)); }
  if (!v.name || !String(v.name).trim()) errors.name = "name_required";
  if (!isNum(v.age)) errors.age = "age_required";
  else if (v.age < 18 || v.age > 100) errors.age = "age_range";
  if (!isNum(v.income)) errors.income = "income_required";
  else if (v.income < 0) errors.income = "income_negative";
  else if (v.income === 0) errors.income = "income_zero";
  if (!isNum(v.needs)) errors.needs = "needs_required";
  else if (v.needs < 0) errors.needs = "needs_negative";
  if (!isNum(v.wants)) errors.wants = "wants_required";
  else if (v.wants < 0) errors.wants = "wants_negative";
  if (!v.goalName || !String(v.goalName).trim()) errors.goalName = "goalname_required";
  if (!isNum(v.goalAmount)) errors.goalAmount = "goalamount_required";
  else if (v.goalAmount <= 0) errors.goalAmount = "goalamount_positive";
  if (!isNum(v.months)) errors.months = "months_required";
  else if (v.months < 1) errors.months = "months_min";
  else if (Math.floor(v.months) !== v.months) errors.months = "months_whole";
  var warnings = [];
  if (!errors.income && !errors.needs && !errors.wants && isNum(v.income) && isNum(v.needs) && isNum(v.wants)){
    if (v.needs + v.wants > v.income)
      warnings.push({ code:"overspend", a: inr(v.needs + v.wants), b: inr(v.income) });
  }
  return { errors: errors, warnings: warnings };
}

// ---------- i18n ----------
var I18N = {
en: {
  brand_tag:"Your free personal finance advisor",
  step_income:"Income", step_expenses:"Expenses", step_goal:"Goal",
  s1_title:"About you & your income", s2_title:"Your monthly expenses", s3_title:"Your goal",
  lbl_name:"Your Name", lbl_age:"Age (years)", lbl_income:"Monthly Income (₹)",
  lbl_needs:"Monthly NEEDS — rent, food, bills, travel (₹)", lbl_wants:"Monthly WANTS — eating out, shopping, fun (₹)",
  lbl_ef:"Emergency Fund — how many months of needs?", ef_3:"3 months", ef_6:"6 months (recommended)", ef_9:"9 months",
  lbl_goalname:"Goal Name", lbl_goalamount:"Goal Amount (₹)", lbl_months:"In How Many Months?",
  ph_name:"e.g. Rahul Sharma", ph_key:"Paste your Gemini API key here", ph_chat:"Type your question… (press Enter)",
  btn_continue:"Continue", btn_back:"Back", btn_seeplan:"See My Plan", btn_reset:"Reset all data",
  m_needed:"Needed for Goal / Month", m_feasible:"Goal Achievable?",
  budget_h:"50/30/20 Budget Check", budget_sub:"Ideal split: Needs 50% • Wants 30% • Savings 20%",
  bar_needs:"Needs", bar_wants:"Wants", bar_savings:"Savings", bar_ideal:"(ideal {x}%)",
  fineprint:"All calculations are done by code — exact, never guessed by AI.",
  disc_text:"<b>Disclaimer:</b> FinSathi is an educational money planner, not a SEBI-registered financial advisor. It does not recommend any specific stock, mutual fund or crypto.",
  made_by:"Made by ARV 🫶 • FinSathi — Aspire. Save. Achieve.",
  goals_title:"Goals", goals_empty:"Multiple goals with progress tracking arrive in the next build stage. Your main goal already lives in the Plan tab.",
  track_title:"Track", track_empty:"The expense tracker arrives in the next build stage — add entries, and your needs/wants totals will fill themselves in.",
  ask_title:"FinSathi AI Advice", ask_sub:"Optional: a short personal advice based on your plan. Needs your own free Gemini API key (setup below). The planner works fully without AI.",
  setup_summary:"Advanced / AI setup — add your free Gemini API key",
  setup_li1:"Go to <b>aistudio.google.com</b> and sign in with your Google account.",
  setup_li2:"Click <b>Get API key</b> → <b>Create API key</b>.",
  setup_li3:"Copy the key, paste it below, and tap <b>Save</b>. You only do this once.",
  setup_note:"Your key is saved only in this browser. It is never sent anywhere except Google's Gemini API when you ask for advice. Never share your key with anyone.",
  btn_save_key:"Save", btn_advice:"Get My Advice", chat_title:"Ask FinSathi",
  chat_sub:"Ask anything about your budget, savings or goal — answers use your own plan.", btn_send:"Send",
  tab_plan:"Plan", tab_goals:"Goals", tab_track:"Track", tab_ask:"Ask",
  hero_save:"You save every month", hero_over:"You overspend every month",
  hero_sub_year:"That is {x} a year, {name}.", hero_sub_zero:"Income and spending are exactly equal — nothing is left over.",
  hero_sub_neg:"Spending is {x} more than income each month.",
  emergency_k:"Emergency Fund Target ({x} months)",
  feas_yes:"Yes, on time", feas_no:"Not yet possible", feas_months:"{x} months needed",
  warn_overspend:"Your needs + wants ({a}) are more than your income ({b}). The plan will show negative savings — that is the honest picture, and the first thing to fix.",
  verdict_neg:"<b>The honest truth:</b> right now your savings are zero or negative — your spending equals or exceeds your income. The goal becomes possible only when savings turn positive. Start by cutting <b>Wants</b> first.",
  verdict_ok:"<b>Great news!</b> Keep saving at this pace and <b>{goal}</b> will be yours within your target time. Just don't break the savings habit in between!",
  verdict_close:"<b>Close — just needs a push:</b> at your current saving rate, <b>{goal}</b> will take <b>{months} months</b> (your target is {target}). You need to save {needed} per month — about {extra} extra.",
  err_name_required:"Please enter your name.", err_age_required:"Please enter your age.", err_age_range:"Age must be between 18 and 100.",
  err_income_required:"Please enter your monthly income.", err_income_negative:"Income cannot be negative.", err_income_zero:"Income must be more than 0 to build a plan.",
  err_needs_required:"Please enter your monthly needs amount.", err_needs_negative:"Needs cannot be negative.",
  err_wants_required:"Please enter your monthly wants amount.", err_wants_negative:"Wants cannot be negative.",
  err_goalname_required:"Please name your goal.", err_goalamount_required:"Please enter the goal amount.", err_goalamount_positive:"Goal amount must be more than 0.",
  err_months_required:"Please enter the number of months.", err_months_min:"Months must be at least 1.", err_months_whole:"Months must be a whole number.",
  st_key_saved:"Key saved — you only need to enter it once.",
  st_need_key:"First add your free Gemini API key in 'Advanced / AI setup' above (it takes 2 minutes).",
  st_thinking:"FinSathi is thinking…",
  st_429:"Free limit reached — the free plan allows only a few requests per minute. Wait about a minute, then tap ONCE. Please don't keep tapping.",
  st_badkey:"The API key looks invalid. Please check it in 'Advanced / AI setup' and save it again.",
  st_error:"Something went wrong (error {x}). Please try again in a little while.",
  st_network:"Could not reach the AI service. If you opened this file inside an app preview, that preview blocks AI calls — open it in Chrome, or use the live website link instead.",
  st_need_plan:"First build your plan in the Plan tab — the advice is based on that plan.",
  chart_h:"Your money at a glance", chart_line_h:"Savings growth", chart_goal_lbl:"Goal {x}", line_end:"{x} by month {m}",
  wi_h:"What-if: play with your numbers", wi_sub:"Move the sliders and watch the goal change — live.",
  wi_cut:"Cut wants by", wi_inc:"Extra income", wi_time:"More time for the goal",
  wi_newsav:"New monthly savings", wi_newneed:"Needed / month", wi_reach:"Goal reached in",
  wi_note:"Playing only — your saved plan does not change.", wi_same:"This is your current plan — move a slider to play.",
  wi_now_possible:"With these changes, the goal is reached on time.", wi_sooner:"The goal comes {x} months sooner than your current plan.",
  wi_still_neg:"Savings are still not positive — cut wants more or add some income.", wi_good:"Looking good — as good as, or better than, your current plan.",
  saved_note:"Saved in this browser", reset_confirm:"Clear all saved data (numbers, plan, goals and expenses)? Your API key and theme will stay.",
  st_reset_done:"Data cleared.",
  g_add:"Add a goal", g_add_btn:"Add goal", g_name:"Goal name", g_amount:"Target amount (₹)", g_saved:"Already saved (₹)", g_months:"Months to reach",
  g_max:"You can track up to 5 goals.", g_empty:"No goals yet — add your first goal above.", g_remaining:"Remaining", g_permonth:"Per month",
  g_atrate:"At your savings rate", g_edit:"Edit", g_delete:"Delete", g_save:"Save changes", g_cancel:"Cancel",
  g_total_saved:"Total saved", g_total_target:"Total target", g_of:"of", g_norate:"Make a plan first", g_del_confirm:"Delete this goal?",
  g_err:"Please add a goal name and a target amount above 0.", g_err_months:"Months must be at least 1.", ph_goal:"e.g. New Laptop",
  tr_h:"Expense tracker", tr_sub:"Add what you spend. Monthly needs and wants totals are calculated for you.", tr_label:"What was it?",
  tr_amount:"Amount (₹)", tr_cat:"Type", tr_need:"Need", tr_want:"Want", tr_date:"Date", tr_add:"Add entry",
  tr_empty:"No entries for this month yet.", tr_needs_total:"Needs this month", tr_wants_total:"Wants this month",
  tr_use:"Use these totals in my plan", tr_used:"Tracker totals copied to your plan.", tr_del_confirm:"Delete this entry?", tr_month:"Month",
  ph_expense:"e.g. Groceries", tr_err:"Please add what it was and an amount above 0.", tr_nothing:"This month has no totals to copy yet.",
  sip_h:"SIP / Investment growth", sip_sub:"See how a monthly investment can grow over time. You enter the expected return — it is an estimate, not a promise.",
  sip_monthly:"Monthly investment (₹)", sip_return:"Expected return (% per year)", sip_years:"For how many years",
  sip_invested:"You invest", sip_gains:"Est. growth", sip_value:"Est. value at end",
  sip_note:"Estimate only. Market returns change and are never guaranteed. This is not a recommendation of any fund or stock.",
  sip_err:"Please enter a monthly amount above 0, a return of 0 or more, and at least 1 year.",
  emi_h:"Loan / EMI planner", emi_sub:"Know your EMI and the true cost of a loan before you sign.",
  emi_amount:"Loan amount (₹)", emi_rate:"Interest (% per year)", emi_months:"Tenure (months)", emi_extra:"Extra payment / month (₹, optional)",
  emi_emi:"Monthly EMI", emi_total:"Total you pay", emi_interest:"Total interest",
  emi_err:"Please enter a loan amount above 0, interest of 0 or more, and a tenure of at least 1 month.",
  emi_payoff:"Loan finishes in {x} months", emi_saved:"Paying extra saves you {x} in interest and finishes the loan {m} months early.",
  btn_calc_tool:"Calculate", exp_wa:"Share on WhatsApp", exp_img:"Save as image", exp_pdf:"Save as PDF",
  share_title:"My FinSathi Money Plan", share_saves:"Every month I save: {x}", share_goal:"Goal: {g} — {a} in {m} months",
  share_split:"Needs {n}% • Wants {w}% • Savings {s}%", share_cta:"Make your own free plan: https://arvcreats.github.io/finsathi/",
  print_h:"My Money Plan", install_title:"Get the FinSathi app — free, works offline", install_btn:"Install",
  install_ios:"To install: tap the Share button, then 'Add to Home Screen'.",
  whatsnew_label:"What's new:", whatsnew_text:"Fresh look, up to 5 savings goals, an expense tracker, SIP & EMI calculators — and FinSathi now installs like a real app!"
},
hi: {
  brand_tag:"आपका मुफ़्त पर्सनल फाइनेंस सलाहकार",
  step_income:"आय", step_expenses:"खर्च", step_goal:"लक्ष्य",
  s1_title:"आपके बारे में और आपकी आय", s2_title:"आपके मासिक खर्च", s3_title:"आपका लक्ष्य",
  lbl_name:"आपका नाम", lbl_age:"उम्र (साल)", lbl_income:"मासिक आय (₹)",
  lbl_needs:"मासिक ज़रूरतें — किराया, खाना, बिल, यात्रा (₹)", lbl_wants:"मासिक चाहतें — बाहर खाना, शॉपिंग, मज़ा (₹)",
  lbl_ef:"इमरजेंसी फंड — कितने महीनों की ज़रूरतों का?", ef_3:"3 महीने", ef_6:"6 महीने (सही रहेगा)", ef_9:"9 महीने",
  lbl_goalname:"लक्ष्य का नाम", lbl_goalamount:"लक्ष्य की रकम (₹)", lbl_months:"कितने महीनों में?",
  ph_name:"जैसे: राहुल शर्मा", ph_key:"अपनी Gemini API key यहाँ डालें", ph_chat:"अपना सवाल लिखें… (Enter दबाएँ)",
  btn_continue:"आगे बढ़ें", btn_back:"पीछे", btn_seeplan:"मेरा प्लान देखें", btn_reset:"सारा डेटा रीसेट करें",
  m_needed:"लक्ष्य के लिए / महीना चाहिए", m_feasible:"लक्ष्य पूरा होगा?",
  budget_h:"50/30/20 बजट जांच", budget_sub:"सही बंटवारा: ज़रूरतें 50% • चाहतें 30% • बचत 20%",
  bar_needs:"ज़रूरतें", bar_wants:"चाहतें", bar_savings:"बचत", bar_ideal:"(सही {x}%)",
  fineprint:"सारे हिसाब कोड से होते हैं — सटीक, AI के अंदाज़े से कभी नहीं।",
  disc_text:"<b>डिस्क्लेमर:</b> FinSathi एक शैक्षणिक मनी प्लानर है, SEBI-पंजीकृत वित्तीय सलाहकार नहीं है। यह किसी खास स्टॉक, म्यूचुअल फंड या क्रिप्टो की सलाह नहीं देता।",
  made_by:"ARV द्वारा निर्मित 🫶 • FinSathi — Aspire. Save. Achieve.",
  goals_title:"लक्ष्य", goals_empty:"कई लक्ष्य और उनकी प्रगति अगले बिल्ड चरण में आएगी। आपका मुख्य लक्ष्य पहले से Plan टैब में है।",
  track_title:"ट्रैक", track_empty:"खर्च ट्रैकर अगले बिल्ड चरण में आएगा — एंट्री जोड़ते ही आपकी ज़रूरतों/चाहतों के कुल अपने आप भर जाएँगे।",
  ask_title:"FinSathi AI सलाह", ask_sub:"वैकल्पिक: आपके प्लान पर आधारित छोटी सी निजी सलाह। इसके लिए आपकी अपनी मुफ़्त Gemini API key चाहिए (नीचे सेटअप)। प्लानर बिना AI के भी पूरी तरह काम करता है।",
  setup_summary:"एडवांस्ड / AI सेटअप — अपनी मुफ़्त Gemini API key जोड़ें",
  setup_li1:"<b>aistudio.google.com</b> पर जाएँ और अपने Google खाते से साइन इन करें।",
  setup_li2:"<b>Get API key</b> → <b>Create API key</b> पर क्लिक करें।",
  setup_li3:"Key कॉपी करें, नीचे डालें, और <b>Save</b> दबाएँ। यह सिर्फ़ एक बार करना है।",
  setup_note:"आपकी key सिर्फ़ इसी ब्राउज़र में सहेजी जाती है। सलाह मांगने पर यह सिर्फ़ Google के Gemini API को जाती है। अपनी key किसी के साथ कभी साझा न करें।",
  btn_save_key:"सहेजें", btn_advice:"मेरी सलाह लें", chat_title:"FinSathi से पूछें",
  chat_sub:"अपने बजट, बचत या लक्ष्य के बारे में कुछ भी पूछें — जवाब आपके अपने प्लान पर आधारित होंगे।", btn_send:"भेजें",
  tab_plan:"प्लान", tab_goals:"लक्ष्य", tab_track:"ट्रैक", tab_ask:"पूछें",
  hero_save:"आप हर महीने बचाते हैं", hero_over:"आप हर महीने ज़्यादा खर्च करते हैं",
  hero_sub_year:"यानी एक साल में {x}, {name}।", hero_sub_zero:"आय और खर्च बराबर हैं — कुछ नहीं बचता।",
  hero_sub_neg:"खर्च आय से {x} ज़्यादा है, हर महीने।",
  emergency_k:"इमरजेंसी फंड लक्ष्य ({x} महीने)",
  feas_yes:"हाँ, समय पर", feas_no:"अभी संभव नहीं", feas_months:"{x} महीने चाहिए",
  warn_overspend:"आपकी ज़रूरतें + चाहतें ({a}) आपकी आय ({b}) से ज़्यादा हैं। प्लान में बचत नेगेटिव दिखेगी — यही सच्ची तस्वीर है, और यही सबसे पहले ठीक करना है।",
  verdict_neg:"<b>सच्ची बात:</b> अभी आपकी बचत शून्य या नेगेटिव है — खर्च आय के बराबर या ज़्यादा है। लक्ष्य तभी संभव होगा जब बचत पॉज़िटिव होगी। सबसे पहले <b>चाहतें</b> घटाएँ।",
  verdict_ok:"<b>बढ़िया खबर!</b> इसी रफ्तार से बचाते रहें तो <b>{goal}</b> आपके तय समय में मिल जाएगा। बस बचत की आदत बीच में न टूटे!",
  verdict_close:"<b>बस थोड़ा सा धक्का और:</b> आपकी मौजूदा बचत की रफ्तार से <b>{goal}</b> को <b>{months} महीने</b> लगेंगे (आपका लक्ष्य {target} महीने है)। आपको हर महीने {needed} बचाना है — यानी करीब {extra} अतिरिक्त।",
  err_name_required:"कृपया अपना नाम लिखें।", err_age_required:"कृपया अपनी उम्र लिखें।", err_age_range:"उम्र 18 से 100 के बीच होनी चाहिए।",
  err_income_required:"कृपया अपनी मासिक आय लिखें।", err_income_negative:"आय नेगेटिव नहीं हो सकती।", err_income_zero:"प्लान बनाने के लिए आय 0 से ज़्यादा होनी चाहिए।",
  err_needs_required:"कृपया अपनी मासिक ज़रूरतों की रकम लिखें।", err_needs_negative:"ज़रूरतें नेगेटिव नहीं हो सकतीं।",
  err_wants_required:"कृपया अपनी मासिक चाहतों की रकम लिखें।", err_wants_negative:"चाहतें नेगेटिव नहीं हो सकतीं।",
  err_goalname_required:"कृपया अपने लक्ष्य का नाम लिखें।", err_goalamount_required:"कृपया लक्ष्य की रकम लिखें।", err_goalamount_positive:"लक्ष्य की रकम 0 से ज़्यादा होनी चाहिए।",
  err_months_required:"कृपया महीनों की संख्या लिखें।", err_months_min:"महीने कम से कम 1 होने चाहिए।", err_months_whole:"महीने पूरी संख्या में होने चाहिए।",
  st_key_saved:"Key सहेज ली गई — यह सिर्फ़ एक बार डालनी है।",
  st_need_key:"पहले ऊपर 'एडवांस्ड / AI सेटअप' में अपनी मुफ़्त Gemini API key डालें (2 मिनट लगेंगे)।",
  st_thinking:"FinSathi सोच रहा है…",
  st_429:"मुफ़्त सीमा पूरी हो गई — मुफ़्त प्लान में हर मिनट कुछ ही अनुरोध मिलते हैं। करीब एक मिनट रुकें, फिर सिर्फ़ एक बार दबाएँ। बार-बार न दबाएँ।",
  st_badkey:"API key गलत लग रही है। 'एडवांस्ड / AI सेटअप' में जाँचकर फिर सहेजें।",
  st_error:"कुछ गलत हो गया (एरर {x})। थोड़ी देर बाद फिर कोशिश करें।",
  st_network:"AI सेवा तक पहुँच नहीं हो पाई। अगर आपने यह फ़ाइल किसी ऐप के प्रीव्यू में खोली है, तो वह AI कॉल रोकता है — इसे Chrome में खोलें, या लाइव वेबसाइट लिंक का उपयोग करें।",
  st_need_plan:"पहले Plan टैब में अपना प्लान बनाएँ — सलाह उसी प्लान पर आधारित होती है।",
  chart_h:"आपके पैसे एक नज़र में", chart_line_h:"बचत की बढ़त", chart_goal_lbl:"लक्ष्य {x}", line_end:"महीने {m} तक {x}",
  wi_h:"क्या हो अगर: नंबरों से खेलें", wi_sub:"स्लाइडर घुमाएँ और देखें लक्ष्य कैसे बदलता है — लाइव।",
  wi_cut:"चाहतें घटाएँ", wi_inc:"अतिरिक्त आय", wi_time:"लक्ष्य के लिए और समय",
  wi_newsav:"नई मासिक बचत", wi_newneed:"चाहिए / महीना", wi_reach:"लक्ष्य कितने में मिलेगा",
  wi_note:"सिर्फ़ खेलने के लिए — आपका सहेजा प्लान नहीं बदलता।", wi_same:"यह आपका मौजूदा प्लान है — खेलने के लिए कोई स्लाइडर घुमाएँ।",
  wi_now_possible:"इन बदलावों से लक्ष्य समय पर पूरा होगा।", wi_sooner:"लक्ष्य आपके मौजूदा प्लान से {x} महीने पहले मिलेगा।",
  wi_still_neg:"बचत अभी भी पॉज़िटिव नहीं है — चाहतें और घटाएँ या कुछ आय जोड़ें।", wi_good:"बढ़िया — आपके मौजूदा प्लान जितना अच्छा, या उससे बेहतर।",
  saved_note:"इस ब्राउज़र में सहेजा गया", reset_confirm:"सारा सहेजा हुआ डेटा (नंबर, प्लान, लक्ष्य और खर्च) मिटा दें? आपकी API key और थीम बनी रहेगी।",
  st_reset_done:"डेटा मिटा दिया गया।",
  g_add:"लक्ष्य जोड़ें", g_add_btn:"लक्ष्य जोड़ें", g_name:"लक्ष्य का नाम", g_amount:"लक्ष्य की रकम (₹)", g_saved:"पहले से बचाए (₹)", g_months:"कितने महीनों में",
  g_max:"आप अधिकतम 5 लक्ष्य ट्रैक कर सकते हैं।", g_empty:"अभी कोई लक्ष्य नहीं — ऊपर अपना पहला लक्ष्य जोड़ें।", g_remaining:"बाकी", g_permonth:"प्रति महीना",
  g_atrate:"आपकी बचत की रफ्तार से", g_edit:"बदलें", g_delete:"मिटाएँ", g_save:"बदलाव सहेजें", g_cancel:"रद्द करें",
  g_total_saved:"कुल बचाए", g_total_target:"कुल लक्ष्य", g_of:"में से", g_norate:"पहले प्लान बनाएँ", g_del_confirm:"यह लक्ष्य मिटा दें?",
  g_err:"कृपया लक्ष्य का नाम और 0 से बड़ी रकम डालें।", g_err_months:"महीने कम से कम 1 होने चाहिए।", ph_goal:"जैसे: नया लैपटॉप",
  tr_h:"खर्च ट्रैकर", tr_sub:"जो खर्च करें, जोड़ते जाएँ। महीने की ज़रूरतों और चाहतों के कुल अपने आप निकलेंगे।", tr_label:"किस चीज़ पर खर्च?",
  tr_amount:"रकम (₹)", tr_cat:"प्रकार", tr_need:"ज़रूरत", tr_want:"चाहत", tr_date:"तारीख़", tr_add:"एंट्री जोड़ें",
  tr_empty:"इस महीने की कोई एंट्री नहीं है।", tr_needs_total:"इस महीने की ज़रूरतें", tr_wants_total:"इस महीने की चाहतें",
  tr_use:"ये कुल मेरे प्लान में डालें", tr_used:"ट्रैकर के कुल आपके प्लान में डाल दिए गए।", tr_del_confirm:"यह एंट्री मिटा दें?", tr_month:"महीना",
  ph_expense:"जैसे: किराना", tr_err:"कृपया बताएँ किस पर खर्च हुआ और 0 से बड़ी रकम डालें।", tr_nothing:"इस महीने अभी कोई कुल नहीं है जिसे डाला जा सके।",
  sip_h:"SIP / निवेश वृद्धि", sip_sub:"देखें मासिक निवेश समय के साथ कैसे बढ़ सकता है। अपेक्षित रिटर्न आप डालते हैं — यह अनुमान है, वादा नहीं।",
  sip_monthly:"मासिक निवेश (₹)", sip_return:"अपेक्षित रिटर्न (% प्रति वर्ष)", sip_years:"कितने वर्षों के लिए",
  sip_invested:"आपका निवेश", sip_gains:"अनुमानित वृद्धि", sip_value:"अंत में अनुमानित मूल्य",
  sip_note:"सिर्फ़ अनुमान। बाज़ार के रिटर्न बदलते हैं और कभी निश्चित नहीं होते। यह किसी फंड या स्टॉक की सिफ़ारिश नहीं है।",
  sip_err:"कृपया 0 से बड़ी मासिक रकम, 0 या अधिक रिटर्न, और कम से कम 1 वर्ष डालें।",
  emi_h:"लोन / EMI प्लानर", emi_sub:"साइन करने से पहले अपनी EMI और लोन की असली लागत जान लें।",
  emi_amount:"लोन की रकम (₹)", emi_rate:"ब्याज (% प्रति वर्ष)", emi_months:"अवधि (महीने)", emi_extra:"अतिरिक्त भुगतान / महीना (₹, वैकल्पिक)",
  emi_emi:"मासिक EMI", emi_total:"कुल भुगतान", emi_interest:"कुल ब्याज",
  emi_err:"कृपया 0 से बड़ी लोन रकम, 0 या अधिक ब्याज, और कम से कम 1 महीने की अवधि डालें।",
  emi_payoff:"लोन {x} महीनों में ख़त्म होगा", emi_saved:"अतिरिक्त भुगतान से आप ब्याज में {x} बचाएँगे और लोन {m} महीने पहले ख़त्म होगा।",
  btn_calc_tool:"हिसाब करें", exp_wa:"WhatsApp पर साझा करें", exp_img:"इमेज के रूप में सहेजें", exp_pdf:"PDF के रूप में सहेजें",
  share_title:"मेरा FinSathi मनी प्लान", share_saves:"हर महीने मेरी बचत: {x}", share_goal:"लक्ष्य: {g} — {m} महीनों में {a}",
  share_split:"ज़रूरतें {n}% • चाहतें {w}% • बचत {s}%", share_cta:"अपना मुफ़्त प्लान बनाएँ: https://arvcreats.github.io/finsathi/",
  print_h:"मेरा मनी प्लान", install_title:"FinSathi ऐप लें — मुफ़्त, ऑफ़लाइन भी चलेगा", install_btn:"इंस्टॉल करें",
  install_ios:"इंस्टॉल करने के लिए: Share बटन दबाएँ, फिर 'Add to Home Screen' चुनें।",
  whatsnew_label:"नया क्या है:", whatsnew_text:"नया लुक, 5 तक बचत लक्ष्य, खर्च ट्रैकर, SIP और EMI कैलकुलेटर — और अब FinSathi असली app की तरह install होता है!"
},
hinglish: {
  brand_tag:"Aapka free personal finance advisor",
  step_income:"Income", step_expenses:"Kharch", step_goal:"Goal",
  s1_title:"Aapke baare me aur aapki income", s2_title:"Aapke monthly kharch", s3_title:"Aapka goal",
  lbl_name:"Aapka Naam", lbl_age:"Umar (saal)", lbl_income:"Monthly Income (₹)",
  lbl_needs:"Monthly NEEDS — rent, khana, bills, travel (₹)", lbl_wants:"Monthly WANTS — bahar khana, shopping, maza (₹)",
  lbl_ef:"Emergency Fund — kitne mahino ki needs ka?", ef_3:"3 months", ef_6:"6 months (recommended)", ef_9:"9 months",
  lbl_goalname:"Goal ka Naam", lbl_goalamount:"Goal Amount (₹)", lbl_months:"Kitne months me?",
  ph_name:"jaise: Rahul Sharma", ph_key:"Apni Gemini API key yahan daalein", ph_chat:"Apna sawaal likho… (Enter dabao)",
  btn_continue:"Aage Badho", btn_back:"Peeche", btn_seeplan:"Mera Plan Dekho", btn_reset:"Saara data reset karo",
  m_needed:"Goal ke liye / month chahiye", m_feasible:"Goal pura hoga?",
  budget_h:"50/30/20 Budget Check", budget_sub:"Sahi bantwara: Needs 50% • Wants 30% • Savings 20%",
  bar_needs:"Needs", bar_wants:"Wants", bar_savings:"Savings", bar_ideal:"(ideal {x}%)",
  fineprint:"Saare hisaab code se hote hain — exact, AI ke andaze se kabhi nahi.",
  disc_text:"<b>Disclaimer:</b> FinSathi ek educational money planner hai, SEBI-registered financial advisor nahi hai. Ye kisi khaas stock, mutual fund ya crypto ki salah nahi deta.",
  made_by:"ARV dwara nirmit 🫶 • FinSathi — Aspire. Save. Achieve.",
  goals_title:"Goals", goals_empty:"Kai goals aur unki progress agle build stage me aayegi. Aapka main goal pehle se Plan tab me hai.",
  track_title:"Track", track_empty:"Expense tracker agle build stage me aayega — entry jodte hi aapke needs/wants ke total apne aap bhar jayenge.",
  ask_title:"FinSathi AI Salah", ask_sub:"Optional: aapke plan par based chhoti si personal salah. Iske liye aapki apni free Gemini API key chahiye (neeche setup). Planner bina AI ke bhi pura kaam karta hai.",
  setup_summary:"Advanced / AI setup — apni free Gemini API key jodo",
  setup_li1:"<b>aistudio.google.com</b> par jao aur apne Google account se sign in karo.",
  setup_li2:"<b>Get API key</b> → <b>Create API key</b> par click karo.",
  setup_li3:"Key copy karo, neeche daalo, aur <b>Save</b> dabao. Ye sirf ek baar karna hai.",
  setup_note:"Aapki key sirf isi browser me save hoti hai. Salah maangne par ye sirf Google ke Gemini API ko jaati hai. Apni key kisi ke saath kabhi share mat karo.",
  btn_save_key:"Save Karo", btn_advice:"Meri Salah Lo", chat_title:"FinSathi se Poocho",
  chat_sub:"Apne budget, savings ya goal ke baare me kuch bhi poocho — jawab aapke apne plan par based honge.", btn_send:"Bhejo",
  tab_plan:"Plan", tab_goals:"Goals", tab_track:"Track", tab_ask:"Poocho",
  hero_save:"Aap har month bachate hain", hero_over:"Aap har month zyada kharch karte hain",
  hero_sub_year:"Matlab ek saal me {x}, {name}.", hero_sub_zero:"Income aur kharch barabar hain — kuch nahi bachta.",
  hero_sub_neg:"Kharch income se {x} zyada hai, har month.",
  emergency_k:"Emergency Fund Target ({x} months)",
  feas_yes:"Haan, time par", feas_no:"Abhi possible nahi", feas_months:"{x} months chahiye",
  warn_overspend:"Aapke needs + wants ({a}) aapki income ({b}) se zyada hain. Plan me savings negative dikhegi — yahi sachhi tasveer hai, aur yahi sabse pehle theek karna hai.",
  verdict_neg:"<b>Sachhi baat:</b> abhi aapki savings zero ya negative hai — kharch income ke barabar ya zyada hai. Goal tabhi possible hoga jab savings positive hogi. Sabse pehle <b>Wants</b> ghatao.",
  verdict_ok:"<b>Badhiya khabar!</b> Isi speed se bachate rahe to <b>{goal}</b> aapke tay time me mil jayega. Bas savings ki aadat beech me na toote!",
  verdict_close:"<b>Bas thoda sa push aur:</b> aapki current savings speed se <b>{goal}</b> ko <b>{months} months</b> lagenge (aapka target {target} months hai). Aapko har month {needed} bachana hai — yani kareeb {extra} extra.",
  err_name_required:"Kripya apna naam likho.", err_age_required:"Kripya apni umar likho.", err_age_range:"Umar 18 se 100 ke beech honi chahiye.",
  err_income_required:"Kripya apni monthly income likho.", err_income_negative:"Income negative nahi ho sakti.", err_income_zero:"Plan banane ke liye income 0 se zyada honi chahiye.",
  err_needs_required:"Kripya apni monthly needs ki rakam likho.", err_needs_negative:"Needs negative nahi ho sakti.",
  err_wants_required:"Kripya apni monthly wants ki rakam likho.", err_wants_negative:"Wants negative nahi ho sakti.",
  err_goalname_required:"Kripya apne goal ka naam likho.", err_goalamount_required:"Kripya goal ki rakam likho.", err_goalamount_positive:"Goal ki rakam 0 se zyada honi chahiye.",
  err_months_required:"Kripya months ki sankhya likho.", err_months_min:"Months kam se kam 1 hone chahiye.", err_months_whole:"Months puri sankhya me hone chahiye.",
  st_key_saved:"Key save ho gayi — ye sirf ek baar daalni hai.",
  st_need_key:"Pehle upar 'Advanced / AI setup' me apni free Gemini API key daalo (2 minute lagenge).",
  st_thinking:"FinSathi soch raha hai…",
  st_429:"Free limit khatm ho gayi — free plan me har minute kuch hi requests milti hain. Kareeb ek minute ruko, phir sirf EK baar dabao. Baar-baar mat dabao.",
  st_badkey:"API key galat lag rahi hai. 'Advanced / AI setup' me jaanchkar phir save karo.",
  st_error:"Kuch galat ho gaya (error {x}). Thodi der baad phir koshish karo.",
  st_network:"AI service tak pahunch nahi ho payi. Agar aapne ye file kisi app ke preview me kholi hai, to wo AI calls rokta hai — ise Chrome me kholo, ya live website link ka use karo.",
  st_need_plan:"Pehle Plan tab me apna plan banao — salah usi plan par based hoti hai.",
  chart_h:"Aapke paise ek nazar me", chart_line_h:"Savings ki growth", chart_goal_lbl:"Goal {x}", line_end:"Month {m} tak {x}",
  wi_h:"What-if: numbers se khelo", wi_sub:"Slider ghumao aur dekho goal kaise badalta hai — live.",
  wi_cut:"Wants ghatao", wi_inc:"Extra income", wi_time:"Goal ke liye aur time",
  wi_newsav:"Nayi monthly savings", wi_newneed:"Chahiye / month", wi_reach:"Goal kitne me milega",
  wi_note:"Sirf khelne ke liye — aapka saved plan nahi badalta.", wi_same:"Ye aapka current plan hai — khelne ke liye koi slider ghumao.",
  wi_now_possible:"In changes se goal time par pura hoga.", wi_sooner:"Goal aapke current plan se {x} months pehle milega.",
  wi_still_neg:"Savings abhi bhi positive nahi hai — wants aur ghatao ya kuch income jodo.", wi_good:"Badhiya — aapke current plan jitna achha, ya usse behtar.",
  saved_note:"Is browser me save ho gaya", reset_confirm:"Saara saved data (numbers, plan, goals aur kharch) mita dein? Aapki API key aur theme bani rahegi.",
  st_reset_done:"Data clear ho gaya.",
  g_add:"Goal jodo", g_add_btn:"Goal jodo", g_name:"Goal ka naam", g_amount:"Target amount (₹)", g_saved:"Pehle se bachaye (₹)", g_months:"Kitne months me",
  g_max:"Aap zyada se zyada 5 goals track kar sakte hain.", g_empty:"Abhi koi goal nahi — upar apna pehla goal jodo.", g_remaining:"Baaki", g_permonth:"Per month",
  g_atrate:"Aapki savings speed se", g_edit:"Badlo", g_delete:"Mitao", g_save:"Changes save karo", g_cancel:"Cancel",
  g_total_saved:"Total bachaye", g_total_target:"Total target", g_of:"me se", g_norate:"Pehle plan banao", g_del_confirm:"Ye goal mita dein?",
  g_err:"Kripya goal ka naam aur 0 se badi rakam daalo.", g_err_months:"Months kam se kam 1 hone chahiye.", ph_goal:"jaise: New Laptop",
  tr_h:"Expense tracker", tr_sub:"Jo kharch karo, jodte jao. Month ki needs aur wants ke total apne aap nikalenge.", tr_label:"Kis cheez par kharch?",
  tr_amount:"Rakam (₹)", tr_cat:"Type", tr_need:"Need", tr_want:"Want", tr_date:"Date", tr_add:"Entry jodo",
  tr_empty:"Is month ki koi entry nahi hai.", tr_needs_total:"Is month ki needs", tr_wants_total:"Is month ki wants",
  tr_use:"Ye total mere plan me daalo", tr_used:"Tracker ke total aapke plan me daal diye gaye.", tr_del_confirm:"Ye entry mita dein?", tr_month:"Month",
  ph_expense:"jaise: Groceries", tr_err:"Kripya batao kis par kharch hua aur 0 se badi rakam daalo.", tr_nothing:"Is month abhi koi total nahi hai jise dala ja sake.",
  sip_h:"SIP / Investment growth", sip_sub:"Dekho monthly investment time ke saath kaise badh sakta hai. Expected return aap daalte ho — ye estimate hai, promise nahi.",
  sip_monthly:"Monthly investment (₹)", sip_return:"Expected return (% per year)", sip_years:"Kitne saalon ke liye",
  sip_invested:"Aapka investment", sip_gains:"Est. growth", sip_value:"End me est. value",
  sip_note:"Sirf estimate. Market returns badalte hain aur kabhi guaranteed nahi hote. Ye kisi fund ya stock ki recommendation nahi hai.",
  sip_err:"Kripya 0 se badi monthly rakam, 0 ya zyada return, aur kam se kam 1 saal daalo.",
  emi_h:"Loan / EMI planner", emi_sub:"Sign karne se pehle apni EMI aur loan ki asli cost jaan lo.",
  emi_amount:"Loan amount (₹)", emi_rate:"Interest (% per year)", emi_months:"Tenure (months)", emi_extra:"Extra payment / month (₹, optional)",
  emi_emi:"Monthly EMI", emi_total:"Total payment", emi_interest:"Total interest",
  emi_err:"Kripya 0 se badi loan rakam, 0 ya zyada interest, aur kam se kam 1 month ki tenure daalo.",
  emi_payoff:"Loan {x} months me khatm hoga", emi_saved:"Extra payment se aap interest me {x} bachaoge aur loan {m} months pehle khatm hoga.",
  btn_calc_tool:"Calculate karo", exp_wa:"WhatsApp par share karo", exp_img:"Image ke roop me save karo", exp_pdf:"PDF ke roop me save karo",
  share_title:"Mera FinSathi Money Plan", share_saves:"Har month meri savings: {x}", share_goal:"Goal: {g} — {m} months me {a}",
  share_split:"Needs {n}% • Wants {w}% • Savings {s}%", share_cta:"Apna free plan banao: https://arvcreats.github.io/finsathi/",
  print_h:"Mera Money Plan", install_title:"FinSathi app lo — free, offline bhi chalega", install_btn:"Install karo",
  install_ios:"Install karne ke liye: Share button dabao, phir 'Add to Home Screen' chuno.",
  whatsnew_label:"Naya kya hai:", whatsnew_text:"Naya look, 5 tak savings goals, kharcha tracker, SIP aur EMI calculator — aur ab FinSathi asli app ki tarah install hota hai!"
}
};
var LANG_INSTR = {
  en: "in simple, friendly English",
  hi: "in simple, friendly Hindi written in Devanagari script",
  hinglish: "in simple, friendly Hinglish — Hindi mixed with English, written in Roman (Latin) script, the way young Indians chat"
};
var state = { lang: "en" };
function t(key){ return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }
function fmt(str, map){ return String(str).replace(/\{(\w+)\}/g, function(_, k){ return map[k] !== undefined ? map[k] : _; }); }

// ---------- DOM helpers ----------
function $(id){ return document.getElementById(id); }
function raw(id){ return $(id).value; }
function numOr(id){ var v = parseFloat($(id).value); return isNaN(v) ? "" : v; }
function reducedMotion(){ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

var lastPlan = null, lastInputs = null;

var FIELD_MAP = { name:"f-name", age:"f-age", income:"f-income", needs:"f-needs", wants:"f-wants",
                  goalName:"f-goalname", goalAmount:"f-goalamount", months:"f-months", efMonths:"f-efmonths" };
var ERR_MAP = { name:"e-name", age:"e-age", income:"e-income", needs:"e-needs", wants:"e-wants",
                goalName:"e-goalname", goalAmount:"e-goalamount", months:"e-months", efMonths:"e-efmonths" };
var STEP_FIELDS = { 1:["name","age","income"], 2:["needs","wants","efMonths"], 3:["goalName","goalAmount","months"] };
var DEFAULTS = { "f-name":"", "f-age":"18", "f-income":"50000", "f-needs":"22000", "f-wants":"13000",
                 "f-efmonths":"6", "f-goalname":"New Laptop", "f-goalamount":"40000", "f-months":"6" };

function gather(){
  return { name: raw("f-name"), age: numOr("f-age"), income: numOr("f-income"),
           needs: numOr("f-needs"), wants: numOr("f-wants"), goalName: raw("f-goalname"),
           goalAmount: numOr("f-goalamount"), months: numOr("f-months"),
           efMonths: parseInt(raw("f-efmonths"), 10) || 6 };
}
function paintErrors(fields, errors){
  fields.forEach(function(k){
    var e = $(ERR_MAP[k]), input = $(FIELD_MAP[k]);
    if (errors[k]){ e.textContent = t("err_" + errors[k]); e.classList.add("show"); input.classList.add("invalid"); }
    else { e.textContent = ""; e.classList.remove("show"); input.classList.remove("invalid"); }
  });
}

// ---------- Persistence ----------
var restoring = false;
function saveData(fromUser){
  if (restoring) return;
  try {
    localStorage.setItem(CONFIG.DATA_KEY, JSON.stringify({ v: gather(), hasPlan: !!lastPlan, goals: appGoals, expenses: appExpenses }));
    if (fromUser) $("saved-note").textContent = t("saved_note");
  } catch(e){ /* storage full/blocked — the app must keep working */ }
}
function loadData(){
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(CONFIG.DATA_KEY) || "null"); } catch(e){ saved = null; }
  if (!saved || !saved.v) return;
  restoring = true;
  var v = saved.v;
  $("f-name").value = v.name || "";       $("f-age").value = (v.age === "" ? "" : v.age);
  $("f-income").value = (v.income === "" ? "" : v.income);
  $("f-needs").value = (v.needs === "" ? "" : v.needs);
  $("f-wants").value = (v.wants === "" ? "" : v.wants);
  $("f-goalname").value = v.goalName || "";
  $("f-goalamount").value = (v.goalAmount === "" ? "" : v.goalAmount);
  $("f-months").value = (v.months === "" ? "" : v.months);
  $("f-efmonths").value = String(v.efMonths || 6);
  restoring = false;
  appGoals = (saved.goals === undefined ? null : saved.goals);
  appExpenses = Array.isArray(saved.expenses) ? saved.expenses : [];
  renderGoals(); renderTrack();
  if (!saved.hasPlan) return;
  var g = gather(), res = validateInputs(g);
  if (Object.keys(res.errors).length) return;
  var p = calcPlan(g.income, g.needs, g.wants, g.goalAmount, g.months, g.efMonths);
  lastPlan = p;
  lastInputs = { name: String(g.name).trim(), age: g.age, income: g.income, needs: g.needs, wants: g.wants,
                 goalName: String(g.goalName).trim(), goalAmount: g.goalAmount, months: g.months, efMonths: g.efMonths };
  seedGoalsIfNeeded();
  renderPlan(false);
}
Object.keys(FIELD_MAP).forEach(function(k){
  var el = $(FIELD_MAP[k]);
  el.addEventListener("input", function(){
    $(ERR_MAP[k]).textContent = ""; $(ERR_MAP[k]).classList.remove("show");
    el.classList.remove("invalid");
    saveData(true);
  });
  el.addEventListener("change", function(){ saveData(true); });
});
$("btn-reset").addEventListener("click", function(){
  if (!window.confirm(t("reset_confirm"))) return;
  try { localStorage.removeItem(CONFIG.DATA_KEY); } catch(e){}
  Object.keys(DEFAULTS).forEach(function(id){ $(id).value = DEFAULTS[id]; });
  paintErrors(Object.keys(FIELD_MAP), {});
  lastPlan = null; lastInputs = null;
  appGoals = null; appExpenses = []; editingGoalId = null;
  renderGoals(); renderTrack();
  $("results").classList.add("hidden");
  $("form-warn").classList.add("hidden");
  goToStep(1);
  $("saved-note").textContent = t("st_reset_done");
});

// ---------- Language ----------
function applyLang(lang){
  state.lang = I18N[lang] ? lang : "en";
  try { localStorage.setItem(CONFIG.LANG_KEY, state.lang); } catch(e){}
  $("lang-select").value = state.lang;
  document.documentElement.lang = state.lang === "hi" ? "hi" : "en";
  document.querySelectorAll("[data-i18n]").forEach(function(el){ el.textContent = t(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-html]").forEach(function(el){ el.innerHTML = t(el.getAttribute("data-i18n-html")); });
  document.querySelectorAll("[data-i18n-ph]").forEach(function(el){ el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
  renderWhatsNew();
  if (lastPlan && lastInputs) renderPlan(false);
  refreshWarning();
  renderGoals(); renderTrack();
}
$("lang-select").addEventListener("change", function(){ applyLang(this.value); });

// ---------- Theme ----------
function applyTheme(thm){
  document.documentElement.setAttribute("data-theme", thm);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", thm === "light" ? "#f3f6f4" : "#0a0f0d");
}
applyTheme(localStorage.getItem(CONFIG.THEME_KEY) || "dark");
$("btn-theme").addEventListener("click", function(){
  var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next); try { localStorage.setItem(CONFIG.THEME_KEY, next); } catch(e){}
});

// ---------- Views (bottom navigation) ----------
function switchView(name){
  ["plan","goals","track","ask"].forEach(function(v){ $("view-" + v).classList.toggle("hidden", v !== name); });
  document.querySelectorAll(".tab").forEach(function(tb){ tb.classList.toggle("is-active", tb.getAttribute("data-view") === name); });
  window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
}
document.querySelectorAll(".tab").forEach(function(tb){
  tb.addEventListener("click", function(){ switchView(tb.getAttribute("data-view")); });
});

// ---------- 3-step flow ----------
var currentStep = 1;
function goToStep(n){
  currentStep = n;
  [1,2,3].forEach(function(s){ $("step-" + s).classList.toggle("hidden", s !== n); });
  document.querySelectorAll(".step-dot").forEach(function(d){
    var g = parseInt(d.getAttribute("data-goto"), 10);
    d.classList.toggle("is-active", g === n);
    d.classList.toggle("is-done", g < n);
  });
}
function validateStep(n){
  var res = validateInputs(gather());
  paintErrors(STEP_FIELDS[n], res.errors);
  return !STEP_FIELDS[n].some(function(k){ return res.errors[k]; });
}
function refreshWarning(){
  var res = validateInputs(gather());
  var wb = $("form-warn");
  if (res.warnings.length){ wb.textContent = fmt(t("warn_overspend"), { a: res.warnings[0].a, b: res.warnings[0].b }); wb.classList.remove("hidden"); }
  else wb.classList.add("hidden");
}
$("btn-next-1").addEventListener("click", function(){ if (validateStep(1)){ refreshWarning(); goToStep(2); } });
$("btn-back-2").addEventListener("click", function(){ goToStep(1); });
$("btn-next-2").addEventListener("click", function(){ refreshWarning(); if (validateStep(2)) goToStep(3); });
$("btn-back-3").addEventListener("click", function(){ goToStep(2); });
document.querySelectorAll(".step-dot").forEach(function(d){
  d.addEventListener("click", function(){
    var g = parseInt(d.getAttribute("data-goto"), 10);
    if (g < currentStep) goToStep(g);
  });
});

// ---------- Count-up ----------
function countUp(el, to){
  if (reducedMotion() || !isFinite(to)){ el.textContent = inr(to); return; }
  var start = null, dur = 750;
  function tick(ts){
    if (!start) start = ts;
    var pr = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - pr, 3);
    el.textContent = inr(Math.round(to * e));
    if (pr < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------- Render the plan ----------
function renderPlan(animate){
  var p = lastPlan, i = lastInputs;
  $("results").classList.remove("hidden");
  var heroNum = $("hero-num");
  heroNum.classList.toggle("neg", p.savings < 0);
  $("hero-label").textContent = p.savings < 0 ? t("hero_over") : t("hero_save");
  if (animate) countUp(heroNum, p.savings); else heroNum.textContent = inr(p.savings);
  $("hero-sub").textContent = p.savings > 0
    ? fmt(t("hero_sub_year"), { x: inr(p.savings * 12), name: i.name.split(" ")[0] })
    : (p.savings === 0 ? t("hero_sub_zero") : fmt(t("hero_sub_neg"), { x: inr(-p.savings) }));
  $("m-needed").textContent = inr(p.neededPerMonth);
  $("m-emergency").textContent = inr(p.emergency);
  $("m-emergency-k").textContent = fmt(t("emergency_k"), { x: p.efMonths });
  var feas = $("m-feasible");
  if (p.achievable){ feas.textContent = t("feas_yes"); feas.style.color = "var(--grn-strong)"; }
  else if (!isFinite(p.actualMonths)){ feas.textContent = t("feas_no"); feas.style.color = "var(--red)"; }
  else { feas.textContent = fmt(t("feas_months"), { x: p.actualMonths }); feas.style.color = "var(--gold)"; }
  function bar(id, tid, pct, ideal, label){
    $(id).style.width = Math.max(0, Math.min(100, pct)) + "%";
    $(tid).textContent = label + " " + pct.toFixed(1) + "% " + fmt(t("bar_ideal"), { x: ideal });
  }
  function fillBars(){
    bar("b-needs", "b-needs-txt", p.needsPct, 50, t("bar_needs"));
    bar("b-wants", "b-wants-txt", p.wantsPct, 30, t("bar_wants"));
    bar("b-sav",   "b-sav-txt",   p.savPct,   20, t("bar_savings"));
  }
  if (animate) requestAnimationFrame(fillBars); else fillBars();
  var vd = $("verdict");
  if (p.savings <= 0) vd.innerHTML = t("verdict_neg");
  else if (p.achievable) vd.innerHTML = fmt(t("verdict_ok"), { goal: i.goalName });
  else vd.innerHTML = fmt(t("verdict_close"), { goal: i.goalName, months: p.actualMonths, target: i.months,
                                                needed: inr(p.neededPerMonth), extra: inr(p.neededPerMonth - p.savings) });
  renderCharts();
  initWhatIf();
}

$("btn-calc").addEventListener("click", function(){
  var v = gather();
  var res = validateInputs(v);
  paintErrors(Object.keys(FIELD_MAP), res.errors);
  if (Object.keys(res.errors).length){
    for (var s = 1; s <= 3; s++){
      if (STEP_FIELDS[s].some(function(k){ return res.errors[k]; })){ goToStep(s); break; }
    }
    return;
  }
  lastPlan = calcPlan(v.income, v.needs, v.wants, v.goalAmount, v.months, v.efMonths);
  lastInputs = { name: String(v.name).trim(), age: v.age, income: v.income, needs: v.needs, wants: v.wants,
                 goalName: String(v.goalName).trim(), goalAmount: v.goalAmount, months: v.months, efMonths: v.efMonths };
  seedGoalsIfNeeded();
  renderPlan(true);
  saveData(false);
  $("results").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
});

// ---------- Gemini AI (optional — single attempt, friendly errors) ----------
function getKey(){ return localStorage.getItem(CONFIG.STORAGE_KEY) || ""; }
var keyInput = $("f-key");
keyInput.value = getKey();
$("btn-key").addEventListener("click", function(){
  try { localStorage.setItem(CONFIG.STORAGE_KEY, keyInput.value.trim()); } catch(e){}
  $("key-status").textContent = t("st_key_saved");
});

async function askGemini(prompt, statusEl){
  var key = getKey();
  if (!key){
    statusEl.textContent = t("st_need_key");
    var d = $("ai-setup"); if (d) d.open = true;
    return null;
  }
  var url = CONFIG.GEMINI_API_BASE + CONFIG.GEMINI_MODEL + ":generateContent?key=" + encodeURIComponent(key);
  statusEl.textContent = t("st_thinking");
  try {
    var res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] }) });
    if (res.status === 429){ statusEl.textContent = t("st_429"); return null; }
    if (res.status === 400 || res.status === 403){ statusEl.textContent = t("st_badkey"); return null; }
    if (!res.ok){ statusEl.textContent = fmt(t("st_error"), { x: res.status }); return null; }
    var data = await res.json();
    var tx = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
             data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
             data.candidates[0].content.parts[0].text;
    statusEl.textContent = "";
    return tx || null;
  } catch(e){
    statusEl.textContent = t("st_network");
    return null;
  }
}

function planContext(){
  if (!lastPlan || !lastInputs) return null;
  var i = lastInputs, p = lastPlan;
  return "User: " + i.name + ", age " + i.age + ". Monthly income " + inr(i.income) +
    ", needs " + inr(i.needs) + " (" + p.needsPct.toFixed(1) + "%), wants " + inr(i.wants) +
    " (" + p.wantsPct.toFixed(1) + "%), monthly savings " + inr(p.savings) + " (" + p.savPct.toFixed(1) + "%)." +
    " Goal: " + i.goalName + " of " + inr(i.goalAmount) + " in " + i.months + " months; needs " +
    inr(p.neededPerMonth) + " per month; " + (p.achievable ? "achievable on time" : ("at current rate takes " + p.actualMonths + " months")) +
    ". Emergency fund target " + inr(p.emergency) + " (" + p.efMonths + " months of needs).";
}

$("btn-advice").addEventListener("click", async function(){
  var st = $("ai-status");
  var ctx = planContext();
  if (!ctx){ st.textContent = t("st_need_plan"); switchView("plan"); return; }
  var btn = this; btn.disabled = true;
  var prompt = "You are FinSathi, a friendly, encouraging personal finance advisor for an Indian user. " +
    "Here is the user's calculated money plan: " + ctx +
    " Give brief, practical budgeting and goal advice " + LANG_INSTR[state.lang] + ", strictly under 200 words. " +
    "Strictly DO NOT recommend any specific stock, mutual fund or crypto. " +
    "End with EXACTLY 3 bullet points of clear action items.";
  var ans = await askGemini(prompt, st);
  btn.disabled = false;
  if (ans){
    var box = $("advice-box");
    box.textContent = ans; box.classList.remove("hidden");
    box.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  }
});

// ---------- What's New strip (shows once per APP_VERSION) ----------
function renderWhatsNew(){
  $("whatsnew-label").textContent = t("whatsnew_label");
  $("whatsnew-text").textContent = t("whatsnew_text");
}
function initWhatsNew(){
  renderWhatsNew();
  var seen = null;
  try{ seen = localStorage.getItem(CONFIG.SEEN_KEY); }catch(e){}
  if (seen !== CONFIG.APP_VERSION) $("whatsnew-bar").classList.remove("hidden");
}
$("btn-whatsnew-x").addEventListener("click", function(){
  $("whatsnew-bar").classList.add("hidden");
  try{ localStorage.setItem(CONFIG.SEEN_KEY, CONFIG.APP_VERSION); }catch(e){}
});

// ---------- Chat ----------
var chatlog = $("chatlog");
function addMsg(cls, text){
  var d = document.createElement("div");
  d.className = "msg " + cls; d.textContent = text;
  chatlog.appendChild(d); chatlog.scrollTop = chatlog.scrollHeight;
  return d;
}
async function sendChat(){
  var inp = $("f-chat");
  var q = inp.value.trim(); if (!q) return;
  var st = $("chat-status");
  var ctx = planContext();
  if (!ctx){ st.textContent = t("st_need_plan"); return; }
  if (!getKey()){ st.textContent = t("st_need_key"); var d = $("ai-setup"); if (d) d.open = true; return; }
  inp.value = "";
  addMsg("u", q);
  var btn = $("btn-chat"); btn.disabled = true;
  var prompt = "You are FinSathi, a friendly personal finance advisor. User's money plan: " + ctx +
    " Answer the user's question " + LANG_INSTR[state.lang] + ", under 100 words. Never recommend specific stocks, mutual funds or crypto. " +
    "Focus on budgeting, saving and goal planning. Question: " + q;
  var ans = await askGemini(prompt, st);
  btn.disabled = false;
  if (ans) addMsg("a", ans);
}
$("btn-chat").addEventListener("click", sendChat);
$("f-chat").addEventListener("keydown", function(e){ if (e.key === "Enter") sendChat(); });

// ---------- Charts (hand-rolled SVG — no library, works offline) ----------
function donutFractions(income, needs, wants){
  var denom = Math.max(income, needs + wants, 1);
  var sav = Math.max(0, income - needs - wants);
  return { needs: needs / denom, wants: wants / denom, sav: sav / denom };
}
function projectSavings(savings, n){
  var out = [];
  for (var m = 0; m <= n; m++) out.push(savings * m);
  return out;
}
function renderCharts(){
  var p = lastPlan, i = lastInputs;
  if (!p || !i) return;
  // Donut
  var C = 2 * Math.PI * 52;
  var f = donutFractions(i.income, i.needs, i.wants);
  function seg(id, frac, offsetFrac){
    var el = $(id), len = Math.max(0, frac * C);
    el.setAttribute("stroke-dasharray", len + " " + Math.max(0, C - len));
    el.setAttribute("stroke-dashoffset", -offsetFrac * C);
  }
  seg("seg-needs", f.needs, 0);
  seg("seg-wants", f.wants, f.needs);
  seg("seg-sav", f.sav, f.needs + f.wants);
  $("donut-pct").textContent = p.savPct.toFixed(0) + "%";
  $("donut-pct").style.color = p.savings < 0 ? "var(--red)" : "var(--grn-strong)";
  var rows = [
    ["#38bdf8", t("bar_needs"), i.needs, p.needsPct],
    ["var(--gold)", t("bar_wants"), i.wants, p.wantsPct],
    ["var(--grn)", t("bar_savings"), p.savings, p.savPct]
  ];
  $("donut-legend").innerHTML = rows.map(function(r){
    return '<div class="legend-row"><span class="legend-dot" style="background:' + r[0] + '"></span>' +
           "<span>" + r[1] + '</span><span class="lv">' + inr(r[2]) + " • " + r[3].toFixed(0) + "%</span></div>";
  }).join("");
  // Line: projected cumulative savings vs goal
  var base = i.months;
  var need = isFinite(p.actualMonths) ? Math.ceil(p.actualMonths) : base;
  var N = Math.min(36, Math.max(base, p.savings > 0 ? need : base, 1));
  var vals = projectSavings(p.savings, N);
  var W = 320, H = 160, padL = 6, padR = 6, padT = 14, padB = 16, plotW = W - padL - padR, plotH = H - padT - padB;
  var ymax = Math.max(i.goalAmount, vals[N]), ymin = Math.min(0, vals[N]), range = (ymax - ymin) || 1;
  function X(m){ return padL + plotW * (m / N); }
  function Y(v){ return padT + plotH * (1 - (v - ymin) / range); }
  var pts = vals.map(function(v, m){ return X(m).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
  var zeroY = Y(Math.max(ymin, Math.min(ymax, 0)));
  var area = "M" + X(0).toFixed(1) + "," + zeroY.toFixed(1) + " L" + pts.split(" ").join(" L") + " L" + X(N).toFixed(1) + "," + zeroY.toFixed(1) + " Z";
  $("linechart").innerHTML =
    '<path d="' + area + '" fill="rgba(34,197,94,.13)" stroke="none"></path>' +
    '<line x1="' + padL + '" y1="' + Y(i.goalAmount) + '" x2="' + (W - padR) + '" y2="' + Y(i.goalAmount) + '" stroke="var(--gold)" stroke-width="1.4" stroke-dasharray="5 4"></line>' +
    '<polyline points="' + pts + '" fill="none" stroke="var(--grn)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></polyline>' +
    '<circle cx="' + X(N) + '" cy="' + Y(vals[N]) + '" r="4" fill="var(--grn)"></circle>';
  $("line-start").textContent = inr(0);
  $("line-goal").textContent = fmt(t("chart_goal_lbl"), { x: inr(i.goalAmount) });
  $("line-end").textContent = fmt(t("line_end"), { x: inr(vals[N]), m: N });
}

// ---------- What-if sliders (sandbox — never touches the saved plan) ----------
var wiBound = false;
function initWhatIf(){
  var i = lastInputs; if (!i) return;
  var cut = $("wi-cut"), inc = $("wi-inc"), mon = $("wi-months");
  cut.max = Math.max(0, i.wants); cut.value = 0;
  inc.max = Math.max(0, Math.round(i.income * 0.5)); inc.value = 0;
  mon.value = 0;
  if (!wiBound){
    wiBound = true;
    [cut, inc, mon].forEach(function(el){ el.addEventListener("input", updateWhatIf); });
  }
  updateWhatIf();
}
function updateWhatIf(){
  var i = lastInputs, base = lastPlan; if (!i || !base) return;
  var cut = parseFloat($("wi-cut").value) || 0;
  var inc = parseFloat($("wi-inc").value) || 0;
  var mon = parseFloat($("wi-months").value) || 0;
  $("wi-cut-v").textContent = inr(cut);
  $("wi-inc-v").textContent = inr(inc);
  $("wi-months-v").textContent = "+" + mon;
  var np = calcPlan(i.income + inc, i.needs, i.wants - cut, i.goalAmount, i.months + mon, i.efMonths);
  var sEl = $("wi-savings");
  sEl.textContent = inr(np.savings);
  sEl.style.color = np.savings < 0 ? "var(--red)" : "var(--grn-strong)";
  $("wi-needed").textContent = inr(np.neededPerMonth);
  $("wi-reach").textContent = isFinite(np.actualMonths) ? fmt(t("feas_months"), { x: np.actualMonths }) : t("feas_no");
  var note = $("wi-note");
  if (cut === 0 && inc === 0 && mon === 0) note.textContent = t("wi_same");
  else if (np.savings <= 0) note.textContent = t("wi_still_neg");
  else if (np.achievable && !base.achievable) note.textContent = t("wi_now_possible");
  else if (np.achievable) note.textContent = t("wi_good");
  else {
    var diff = Math.round((base.actualMonths - np.actualMonths) * 10) / 10;
    note.textContent = diff > 0 ? fmt(t("wi_sooner"), { x: diff }) : t("wi_good");
  }
}

// ---------- Calculators + export (Stage 6) ----------
// Pure: future value of a monthly SIP-style investment (annuity due).
function sipFutureValue(monthly, annualPct, years){
  var n = Math.round(years * 12), r = annualPct / 100 / 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}
// Pure: standard EMI + totals.
function emiCalc(principal, annualPct, months){
  var r = annualPct / 100 / 12;
  var emi = r === 0 ? principal / months
    : principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  return { emi: emi, total: emi * months, interest: emi * months - principal };
}
// Pure: payoff with an extra monthly payment (amortisation loop).
function emiWithExtra(principal, annualPct, months, extra){
  var base = emiCalc(principal, annualPct, months);
  var r = annualPct / 100 / 12, bal = principal, m = 0, totalInt = 0;
  while (bal > 0.005 && m < 1200){
    var interest = bal * r;
    var pay = Math.min(base.emi + extra, bal + interest);
    bal -= (pay - interest); totalInt += interest; m++;
  }
  return { months: m, totalInterest: totalInt, interestSaved: base.interest - totalInt, monthsSaved: months - m };
}
$("s-calc").addEventListener("click", function(){
  var monthly = parseFloat($("s-monthly").value), ret = parseFloat($("s-return").value), years = parseFloat($("s-years").value);
  if (isNaN(monthly) || monthly <= 0 || isNaN(ret) || ret < 0 || isNaN(years) || years < 1){ $("s-status").textContent = t("sip_err"); return; }
  $("s-status").textContent = "";
  var fv = sipFutureValue(monthly, ret, years), invested = monthly * Math.round(years * 12);
  $("s-invested").textContent = inr(invested);
  $("s-gains").textContent = inr(fv - invested);
  $("s-value").textContent = inr(fv);
  $("s-results").classList.remove("hidden");
});
$("l-calc").addEventListener("click", function(){
  var P = parseFloat($("l-amount").value), rate = parseFloat($("l-rate").value),
      months = parseInt($("l-months").value, 10), extra = parseFloat($("l-extra").value);
  if (isNaN(P) || P <= 0 || isNaN(rate) || rate < 0 || isNaN(months) || months < 1){ $("l-status").textContent = t("emi_err"); return; }
  if (isNaN(extra) || extra < 0) extra = 0;
  $("l-status").textContent = "";
  var e = emiCalc(P, rate, months);
  $("l-emi").textContent = inr(e.emi);
  $("l-total").textContent = inr(e.total);
  $("l-interest").textContent = inr(e.interest);
  $("l-results").classList.remove("hidden");
  var payoff = $("l-payoff");
  if (extra > 0){
    var x = emiWithExtra(P, rate, months, extra);
    payoff.innerHTML = "<b>" + fmt(t("emi_payoff"), { x: x.months }) + ".</b> " +
      fmt(t("emi_saved"), { x: inr(x.interestSaved), m: x.monthsSaved });
    payoff.classList.remove("hidden");
  } else payoff.classList.add("hidden");
});

// ----- Share / export -----
function shareText(){
  var p = lastPlan, i = lastInputs;
  var lines = [ "🌿 " + t("share_title"),
    fmt(t("share_saves"), { x: inr(p.savings) }),
    fmt(t("share_goal"), { g: i.goalName, a: inr(i.goalAmount), m: i.months }),
    fmt(t("share_split"), { n: p.needsPct.toFixed(0), w: p.wantsPct.toFixed(0), s: p.savPct.toFixed(0) }),
    t("share_cta") ];
  return lines.join("\n");
}
$("btn-wa").addEventListener("click", function(){
  if (!lastPlan) return;
  window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank");
});
function fillPrintArea(){
  var p = lastPlan, i = lastInputs;
  var rows = [
    [t("lbl_income"), inr(i.income)], [t("bar_needs"), inr(i.needs)], [t("bar_wants"), inr(i.wants)],
    [t("m_needed"), inr(p.neededPerMonth)], [fmt(t("emergency_k"), { x: p.efMonths }), inr(p.emergency)],
    [t("lbl_goalname"), i.goalName + " — " + inr(i.goalAmount)], [t("m_feasible"),
      p.achievable ? t("feas_yes") : (isFinite(p.actualMonths) ? fmt(t("feas_months"), { x: p.actualMonths }) : t("feas_no"))]
  ];
  var goalsHtml = "";
  if (appGoals && appGoals.length){
    goalsHtml = "<h2>" + t("goals_title") + "</h2><table>" + appGoals.map(function(g){
      var s = goalStats(g, p.savings);
      return "<tr><td>" + esc(g.name) + "</td><td>" + inr(g.saved) + " " + t("g_of") + " " + inr(g.amount) + " (" + s.pct + "%)</td></tr>";
    }).join("") + "</table>";
  }
  $("print-area").innerHTML = "<h1>FinSathi</h1><div>" + t("print_h") + " — " + esc(i.name) + "</div>" +
    '<div class="p-hero">' + inr(p.savings) + "</div><div>" + (p.savings < 0 ? t("hero_over") : t("hero_save")) + "</div>" +
    "<table>" + rows.map(function(r){ return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("") + "</table>" +
    goalsHtml + '<p class="p-disc">' + t("disc_text").replace(/<[^>]+>/g, "") + "</p>";
}
$("btn-pdf").addEventListener("click", function(){
  if (!lastPlan) return;
  fillPrintArea();
  window.print();
});
$("btn-img").addEventListener("click", function(){
  if (!lastPlan) return;
  var p = lastPlan, i = lastInputs;
  var c = document.createElement("canvas"); c.width = 1080; c.height = 1150;
  var x = c.getContext("2d");
  x.fillStyle = "#0a0f0d"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#22c55e"; x.fillRect(0, 0, c.width, 14);
  x.fillStyle = "#edf5f0"; x.font = "800 54px 'Plus Jakarta Sans', sans-serif";
  x.fillText("FinSathi", 60, 100);
  x.fillStyle = "#93a89b"; x.font = "500 30px 'Plus Jakarta Sans', sans-serif";
  x.fillText(t("print_h") + " — " + i.name, 60, 152);
  x.fillStyle = "#93a89b"; x.font = "600 28px 'Plus Jakarta Sans', sans-serif";
  x.fillText(p.savings < 0 ? t("hero_over") : t("hero_save"), 60, 250);
  x.fillStyle = p.savings < 0 ? "#f87171" : "#4ade80"; x.font = "800 110px 'Plus Jakarta Sans', sans-serif";
  x.fillText(inr(p.savings), 60, 370);
  x.fillStyle = "#edf5f0"; x.font = "600 36px 'Plus Jakarta Sans', sans-serif";
  var lines = [
    fmt(t("share_goal"), { g: i.goalName, a: inr(i.goalAmount), m: i.months }),
    t("m_needed") + ": " + inr(p.neededPerMonth),
    fmt(t("emergency_k"), { x: p.efMonths }) + ": " + inr(p.emergency),
    t("m_feasible") + ": " + (p.achievable ? t("feas_yes") : (isFinite(p.actualMonths) ? fmt(t("feas_months"), { x: p.actualMonths }) : t("feas_no")))
  ];
  lines.forEach(function(ln, k){ x.fillText(ln, 60, 480 + k * 58); });
  var split = [[t("bar_needs"), p.needsPct, "#38bdf8"], [t("bar_wants"), p.wantsPct, "#e9c46a"], [t("bar_savings"), p.savPct, "#22c55e"]];
  x.font = "600 30px 'Plus Jakarta Sans', sans-serif";
  split.forEach(function(s, k){
    var y = 760 + k * 84;
    x.fillStyle = "#93a89b"; x.fillText(s[0] + " " + s[1].toFixed(0) + "%", 60, y);
    x.fillStyle = "rgba(255,255,255,.10)"; x.fillRect(60, y + 14, 960, 22);
    x.fillStyle = s[2]; x.fillRect(60, y + 14, Math.max(0, Math.min(100, s[1])) / 100 * 960, 22);
  });
  x.fillStyle = "#93a89b"; x.font = "400 24px 'Plus Jakarta Sans', sans-serif";
  x.fillText("arvcreats.github.io/finsathi", 60, 1080);
  var a = document.createElement("a");
  a.download = "finsathi-plan.png";
  a.href = c.toDataURL("image/png");
  a.click();
});

// ---------- Goals + expense tracker (Stage 5) ----------
var appGoals = null;          // null = untouched (seed from plan once); [] = user has none
var appExpenses = [];
var editingGoalId = null;
var uidSeq = 0;
function uid(prefix){ uidSeq++; return prefix + Date.now().toString(36) + uidSeq; }
function esc(s){
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// Pure helpers (unit-testable)
function goalStats(g, planSavings){
  var remaining = Math.max(0, g.amount - g.saved);
  var pct = g.amount > 0 ? Math.min(100, Math.round((g.saved / g.amount) * 100)) : 0;
  var perMonth = g.months > 0 ? remaining / g.months : 0;
  var monthsAtRate = (planSavings && planSavings > 0) ? (remaining === 0 ? 0 : Math.round((remaining / planSavings) * 10) / 10) : null;
  return { remaining: remaining, pct: pct, perMonth: perMonth, monthsAtRate: monthsAtRate };
}
function monthTotals(expenses, ym){
  var needs = 0, wants = 0;
  (expenses || []).forEach(function(e){
    if (String(e.date || "").slice(0, 7) !== ym) return;
    if (e.cat === "want") wants += e.amount; else needs += e.amount;
  });
  return { needs: needs, wants: wants };
}
function seedGoalsIfNeeded(){
  if (appGoals === null && lastInputs){
    appGoals = [{ id: uid("g"), name: lastInputs.goalName, amount: lastInputs.goalAmount, saved: 0, months: lastInputs.months }];
    saveData(false); renderGoals();
  }
}
function renderGoals(){
  var list = appGoals || [];
  var totT = 0, totS = 0;
  list.forEach(function(g){ totT += g.amount; totS += Math.min(g.saved, g.amount); });
  $("g-total-target").textContent = list.length ? inr(totT) : "—";
  $("g-total-saved").textContent = list.length ? inr(totS) : "—";
  $("goals-empty").classList.toggle("hidden", list.length > 0);
  $("g-add").textContent = editingGoalId ? t("g_save") : t("g_add_btn");
  $("g-add").disabled = !editingGoalId && list.length >= 5;
  $("g-cancel").classList.toggle("hidden", !editingGoalId);
  var planSav = lastPlan ? lastPlan.savings : null;
  $("goals-list").innerHTML = list.map(function(g){
    var s = goalStats(g, planSav);
    var rate = s.monthsAtRate === null ? t("g_norate") : (s.monthsAtRate === 0 ? t("feas_yes") : fmt(t("feas_months"), { x: s.monthsAtRate }));
    return '<div class="goal-card">' +
      '<div class="goal-top"><span class="goal-name">' + esc(g.name) + '</span>' +
      '<span class="goal-amt">' + inr(g.saved) + " " + t("g_of") + " " + inr(g.amount) + "</span></div>" +
      '<div class="bar-track" style="margin-top:9px"><div class="bar-fill" style="background:var(--grn);width:' + s.pct + '%"></div></div>' +
      '<div class="goal-stats"><span>' + t("g_remaining") + " <b>" + inr(s.remaining) + "</b></span>" +
      "<span>" + t("g_permonth") + " <b>" + inr(s.perMonth) + "</b></span>" +
      "<span>" + t("g_atrate") + " <b>" + rate + "</b></span>" +
      "<span><b>" + s.pct + "%</b></span></div>" +
      '<div class="goal-actions"><button class="mini-btn" type="button" data-action="edit" data-id="' + g.id + '">' + t("g_edit") + "</button>" +
      '<button class="mini-btn danger" type="button" data-action="del" data-id="' + g.id + '">' + t("g_delete") + "</button></div></div>";
  }).join("");
}
function clearGoalForm(){
  editingGoalId = null;
  $("g-name").value = ""; $("g-amount").value = ""; $("g-saved").value = 0; $("g-months").value = 12;
  $("g-status").textContent = "";
  renderGoals();
}
$("g-add").addEventListener("click", function(){
  var name = $("g-name").value.trim();
  var amount = parseFloat($("g-amount").value);
  var saved = parseFloat($("g-saved").value);
  var months = parseInt($("g-months").value, 10);
  if (!name || isNaN(amount) || amount <= 0){ $("g-status").textContent = t("g_err"); return; }
  if (isNaN(months) || months < 1){ $("g-status").textContent = t("g_err_months"); return; }
  if (isNaN(saved) || saved < 0) saved = 0;
  if (editingGoalId){
    appGoals = (appGoals || []).map(function(g){
      return g.id === editingGoalId ? { id: g.id, name: name, amount: amount, saved: saved, months: months } : g;
    });
  } else {
    if (!appGoals) appGoals = [];
    if (appGoals.length >= 5){ $("g-status").textContent = t("g_max"); return; }
    appGoals.push({ id: uid("g"), name: name, amount: amount, saved: saved, months: months });
  }
  clearGoalForm(); saveData(true);
});
$("g-cancel").addEventListener("click", clearGoalForm);
$("goals-list").addEventListener("click", function(e){
  var btn = e.target.closest("button[data-action]"); if (!btn) return;
  var id = btn.getAttribute("data-id");
  var g = (appGoals || []).filter(function(x){ return x.id === id; })[0];
  if (!g) return;
  if (btn.getAttribute("data-action") === "del"){
    if (!window.confirm(t("g_del_confirm"))) return;
    appGoals = appGoals.filter(function(x){ return x.id !== id; });
    if (editingGoalId === id) editingGoalId = null;
    renderGoals(); saveData(true);
  } else {
    editingGoalId = id;
    $("g-name").value = g.name; $("g-amount").value = g.amount;
    $("g-saved").value = g.saved; $("g-months").value = g.months;
    $("g-status").textContent = "";
    renderGoals();
    $("g-name").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  }
});

// ----- Tracker -----
function todayStr(){
  var d = new Date();
  function p2(n){ return (n < 10 ? "0" : "") + n; }
  return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
}
function renderTrack(){
  var ym = $("x-month").value || todayStr().slice(0, 7);
  var tot = monthTotals(appExpenses, ym);
  $("x-needs-total").textContent = inr(tot.needs);
  $("x-wants-total").textContent = inr(tot.wants);
  var rows = appExpenses.filter(function(e){ return String(e.date || "").slice(0, 7) === ym; })
    .slice().sort(function(a, b){ return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  $("x-empty").classList.toggle("hidden", rows.length > 0);
  $("x-list").innerHTML = rows.map(function(e){
    return '<div class="x-row"><div class="x-main"><div class="x-label">' + esc(e.label) + '</div>' +
      '<div class="x-date">' + esc(e.date) + '</div></div>' +
      '<span class="chip ' + (e.cat === "want" ? "want" : "need") + '">' + (e.cat === "want" ? t("tr_want") : t("tr_need")) + "</span>" +
      '<span class="x-amt">' + inr(e.amount) + "</span>" +
      '<button class="x-del" type="button" data-xdel="' + e.id + '" aria-label="Delete">×</button></div>';
  }).join("");
}
$("x-add").addEventListener("click", function(){
  var label = $("x-label").value.trim();
  var amount = parseFloat($("x-amount").value);
  if (!label || isNaN(amount) || amount <= 0){ $("x-status").textContent = t("tr_err"); return; }
  var date = $("x-date").value || todayStr();
  appExpenses.push({ id: uid("x"), label: label, amount: amount, cat: $("x-cat").value === "want" ? "want" : "need", date: date });
  $("x-month").value = date.slice(0, 7);
  $("x-label").value = ""; $("x-amount").value = ""; $("x-status").textContent = "";
  renderTrack(); saveData(true);
});
$("x-month").addEventListener("change", renderTrack);
$("x-list").addEventListener("click", function(e){
  var btn = e.target.closest("button[data-xdel]"); if (!btn) return;
  if (!window.confirm(t("tr_del_confirm"))) return;
  var id = btn.getAttribute("data-xdel");
  appExpenses = appExpenses.filter(function(x){ return x.id !== id; });
  renderTrack(); saveData(true);
});
$("x-use").addEventListener("click", function(){
  var ym = $("x-month").value || todayStr().slice(0, 7);
  var tot = monthTotals(appExpenses, ym);
  if (tot.needs === 0 && tot.wants === 0){ $("x-status").textContent = t("tr_nothing"); return; }
  $("f-needs").value = tot.needs; $("f-wants").value = tot.wants;
  saveData(true);
  var g = gather();
  if (!validateInputs(g).errors.income && !validateInputs(g).errors.needs && !validateInputs(g).errors.wants && g.name && String(g.name).trim()){
    var res = validateInputs(g);
    if (!Object.keys(res.errors).length){
      lastPlan = calcPlan(g.income, g.needs, g.wants, g.goalAmount, g.months, g.efMonths);
      lastInputs = { name: String(g.name).trim(), age: g.age, income: g.income, needs: g.needs, wants: g.wants,
                     goalName: String(g.goalName).trim(), goalAmount: g.goalAmount, months: g.months, efMonths: g.efMonths };
      renderPlan(false);
    }
  }
  switchView("plan");
  $("saved-note").textContent = t("tr_used");
});

// ---------- Init ----------
(function initDates(){
  $("x-date").value = todayStr();
  $("x-month").value = todayStr().slice(0, 7);
})();
applyLang(localStorage.getItem(CONFIG.LANG_KEY) || "en");
loadData();

// ---------- PWA install prompt ----------
var deferredInstall = null, installMode = "prompt";
function isStandalone(){
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}
function showInstallBar(){
  var dismissed = false;
  try { dismissed = !!localStorage.getItem(CONFIG.INSTALL_KEY); } catch(e){}
  if (!isStandalone() && !dismissed) $("install-bar").classList.remove("hidden");
}
window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault(); deferredInstall = e; installMode = "prompt"; showInstallBar();
});
window.addEventListener("appinstalled", function(){
  $("install-bar").classList.add("hidden");
  try { localStorage.setItem(CONFIG.INSTALL_KEY, "1"); } catch(e){}
});
$("btn-install").addEventListener("click", async function(){
  if (!deferredInstall) return;
  deferredInstall.prompt();
  var choice = await deferredInstall.userChoice;
  deferredInstall = null;
  if (choice && choice.outcome === "accepted") $("install-bar").classList.add("hidden");
});
$("btn-install-x").addEventListener("click", function(){
  $("install-bar").classList.add("hidden");
  try { localStorage.setItem(CONFIG.INSTALL_KEY, "1"); } catch(e){}
});
// iOS Safari has no beforeinstallprompt — show the manual Share-sheet hint instead.
(function iosInstallHint(){
  var ua = window.navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  if (isIOS && !isStandalone()){
    installMode = "ios";
    $("install-txt").textContent = t("install_ios");
    $("btn-install").classList.add("hidden");
    showInstallBar();
  }
})();
$("lang-select").addEventListener("change", function(){
  if (installMode === "ios") $("install-txt").textContent = t("install_ios");
});

// ---------- PWA: service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline support is a bonus, never an error */ });
  });
}
initWhatsNew();
