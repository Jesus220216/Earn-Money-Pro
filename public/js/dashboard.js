// ============================================
// 🔥 EARNPRO PRO - REAL MONEY MONETIZATION SYSTEM
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc,
  increment, addDoc, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 💰 CPA / ADS CONFIG
// ============================================

const SMARTLINK = "https://omg10.com/4/10751693";
const ADGATE_ID = "5716144";
const LOCKER_ID = "1889035";

// ============================================
// ⚙️ SYSTEM CONFIG
// ============================================

const COOLDOWN = 900000;

// ============================================
// STATE
// ============================================

let user;
let balance = 0;
let videosLeft = 0;
let taskCooldown = false;
let userGeo = "US";
let userDevice = "desktop";

// ============================================
// 🌍 GEO DETECTION
// ============================================

async function detectUserEnv() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    userGeo = data.country_code || "US";
  } catch {
    userGeo = "US";
  }

  userDevice = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

// ============================================
// 🚨 FIXED ANTI BOT SYSTEM
// ============================================

function isBot() {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("bot") || ua.includes("crawler")) return true;
  if (navigator.webdriver) return true;
  if (!navigator.languages || navigator.languages.length === 0) return true;
  if (screen.width < 300 || screen.height < 300) return true;

  return false;
}

// ============================================
// 📊 TRACKING ENGINE (REAL MONETIZATION CORE)
// ============================================

async function trackEvent(type, extra = {}) {
  if (!user) return;

  await addDoc(collection(db, "tracking"), {
    userId: user.uid,
    type,
    geo: userGeo,
    device: userDevice,
    time: Date.now(),
    ...extra
  });
}

// ============================================
// 💸 REVENUE TRACKING
// ============================================

async function trackRevenue(amount, source) {
  if (!user) return;

  await updateDoc(doc(db, "users", user.uid), {
    revenue: increment(amount),
    balance: increment(amount)
  });

  await addDoc(collection(db, "revenue_logs"), {
    userId: user.uid,
    amount,
    source,
    time: Date.now(),
    geo: userGeo
  });
}

// ============================================
// ⏳ COOLDOWN
// ============================================

function lockTask(time = 15000) {
  taskCooldown = true;
  setTimeout(() => taskCooldown = false, time);
}

// ============================================
// 🧠 SMART MONETIZATION (DATA-BASED, NOT RANDOM)
// ============================================

function smartMonetization() {
  if (taskCooldown || isBot()) return;

  lockTask(15000);

  trackEvent("monetization_trigger");

  // GEO OPTIMIZATION REAL
  if (["US", "CA", "UK", "AU"].includes(userGeo)) {
    if (userDevice === "mobile") return openOfferwall();
    return openAd();
  }

  return openAd();
}

// ============================================
// 🔗 SMARTLINK (WITH TRACKING)
// ============================================

function openAd() {
  trackEvent("smartlink_click");
  window.open(`${SMARTLINK}?uid=${user?.uid}`, "_blank");
}

// ============================================
// 🔥 OFFERWALL
// ============================================

window.openOfferwall = () => {
  trackEvent("offerwall_open");

  const frame = document.getElementById("offerwallFrame");

  if (frame) {
    frame.src = `https://wall.adgatemedium.com/?aff_id=${ADGATE_ID}&user_id=${user.uid}`;
  }

  showToast("💰 Offerwall cargado");
};

// ============================================
// 🔒 LOCKER
// ============================================

window.openLocker = () => {
  trackEvent("locker_open");

  if (document.getElementById("lockerScript")) return;

  const s = document.createElement("script");
  s.id = "lockerScript";
  s.src = `https://playabledownloads.com/script_include.php?id=${LOCKER_ID}&subid=${user.uid}`;
  s.async = true;

  document.body.appendChild(s);

  showToast("🔒 Desbloquea recompensa");
};

// ============================================
// 🎥 VIDEO (REAL TRACKED EARNINGS)
// ============================================

window.startVideo = async () => {
  if (videosLeft <= 0) return showToast("Sin videos ❌");

  smartMonetization();
  await trackEvent("video_start");

  setTimeout(async () => {
    const earn = 0.03;

    await trackRevenue(earn, "video");

    await updateDoc(doc(db, "users", user.uid), {
      videosLeft: increment(-1),
      todayEarnings: increment(earn)
    });

    videosLeft--;

    document.getElementById("videosLeft").innerText =
      "Restantes: " + videosLeft;

    showToast("Ganaste $" + earn);
  }, 8000);
};

// ============================================
// 🎰 SPIN (TRACKED)
// ============================================

window.spin = async () => {
  smartMonetization();
  await trackEvent("spin");

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await trackRevenue(reward, "spin");

      await updateDoc(doc(db, "users", user.uid), {
        todayEarnings: increment(reward)
      });

      showToast(`Ganaste $${reward}`);
    }
  }, 3000);
};

// ============================================
// 🎁 DAILY BONUS
// ============================================

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000) return showToast("Ya reclamado ❌");

  smartMonetization();
  await trackEvent("daily_claim");

  const earn = 0.2;

  setTimeout(async () => {
    await trackRevenue(earn, "daily");

    await updateDoc(ref, {
      lastDaily: Date.now(),
      todayEarnings: increment(earn)
    });

    showToast("Ganaste $0.20 🎁");
  }, 8000);
};

// ============================================
// 🎮 GAME
// ============================================

window.playGame = async () => {
  smartMonetization();
  await trackEvent("game_play");

  const earn = 0.05;

  setTimeout(async () => {
    await trackRevenue(earn, "game");

    await updateDoc(doc(db, "users", user.uid), {
      todayEarnings: increment(earn)
    });

    showToast("Ganaste $0.05 🎮");
  }, 12000);
};

// ============================================
// 💳 WITHDRAW
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!email || amount < 5 || amount > balance) {
    return showToast("Error ❌");
  }

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    amount,
    email,
    status: "pending",
    time: Date.now()
  });

  await updateDoc(doc(db, "users", user.uid), {
    balance: increment(-amount)
  });

  await trackEvent("withdraw_request", { amount });

  showToast("Retiro enviado 🚀");
};

// ============================================
// 🔥 INIT
// ============================================

onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await detectUserEnv();
  await initUser();
  await resetDaily();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// ============================================
// USER INIT
// ============================================

async function initUser() {
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 1,
      videosLeft: 6,
      todayEarnings: 0,
      revenue: 0,
      lastDaily: 0,
      createdAt: Date.now()
    });
  }
}

// ============================================
// BALANCE REALTIME
// ============================================

function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};

    balance = data.balance || 0;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.getElementById("todayEarnings").innerText = "$" + (data.todayEarnings || 0).toFixed(2);
  });
}

// ============================================
// UTILS
// ============================================

function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style = "position:fixed;bottom:20px;right:20px;background:#10B981;color:#fff;padding:10px;border-radius:8px;z-index:9999;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};

// ============================================
// 🏢 EARNPRO ENTERPRISE LAYER (ADD-ON)
// ============================================

// 📊 ENTERPRISE METRICS STRUCTURE
const enterprise = {
  sessions: 0,
  clicks: 0,
  conversions: 0,
  revenue: 0,
  botBlocks: 0
};

// ============================================
// 📈 KPI TRACKER (REAL BUSINESS METRICS)
// ============================================

async function logKPI(type, value = 1) {
  if (!user) return;

  const ref = doc(db, "enterprise_kpi", "global");

  await updateDoc(ref, {
    [type]: increment(value),
    lastUpdate: Date.now()
  }).catch(async () => {
    await setDoc(ref, {
      [type]: value,
      createdAt: Date.now()
    });
  });
}

// ============================================
// 🧾 USER AUDIT LOG (ENTERPRISE TRACKING)
// ============================================

async function auditLog(action, data = {}) {
  if (!user) return;

  await addDoc(collection(db, "audit_logs"), {
    userId: user.uid,
    action,
    data,
    geo: userGeo,
    device: userDevice,
    time: Date.now()
  });
}

// ============================================
// 💰 ENTERPRISE REVENUE ENGINE
// ============================================

async function enterpriseRevenue(amount, source) {
  await logKPI("revenue", amount);

  await addDoc(collection(db, "enterprise_revenue"), {
    userId: user.uid,
    amount,
    source,
    geo: userGeo,
    time: Date.now()
  });

  enterprise.revenue += amount;
}

// ============================================
// 👆 CLICK TRACKING PRO (MONETIZATION CORE)
// ============================================

async function trackClick(type) {
  enterprise.clicks++;

  await logKPI("clicks", 1);

  await addDoc(collection(db, "click_events"), {
    userId: user.uid,
    type,
    geo: userGeo,
    device: userDevice,
    time: Date.now()
  });
}

// ============================================
// 🚨 FRAUD DETECTION ENTERPRISE
// ============================================

function enterpriseAntiFraud() {
  const suspicious =
    navigator.webdriver ||
    screen.width < 320 ||
    !navigator.languages ||
    navigator.hardwareConcurrency < 2;

  if (suspicious) {
    enterprise.botBlocks++;

    auditLog("bot_blocked", {
      reason: "suspicious_device"
    });

    return true;
  }

  return false;
}

// ============================================
// 🔗 OVERRIDE SMARTLINK (ENTERPRISE TRACKING)
// ============================================

function openAd() {
  if (enterpriseAntiFraud()) return;

  trackClick("smartlink");

  auditLog("smartlink_open");

  window.open(`${SMARTLINK}?uid=${user?.uid}`, "_blank");
}

// ============================================
// 🔥 OVERRIDE OFFERWALL (ENTERPRISE)
// ============================================

window.openOfferwall = () => {
  if (enterpriseAntiFraud()) return;

  trackClick("offerwall");

  auditLog("offerwall_open");

  const frame = document.getElementById("offerwallFrame");

  if (frame) {
    frame.src = `https://wall.adgatemedium.com/?aff_id=${ADGATE_ID}&user_id=${user.uid}`;
  }

  showToast("💰 Offerwall activo");
};

// ============================================
// 🔒 OVERRIDE LOCKER (ENTERPRISE)
// ============================================

window.openLocker = () => {
  if (enterpriseAntiFraud()) return;

  trackClick("locker");

  auditLog("locker_open");

  if (document.getElementById("lockerScript")) return;

  const s = document.createElement("script");
  s.id = "lockerScript";
  s.src = `https://playabledownloads.com/script_include.php?id=${LOCKER_ID}&subid=${user.uid}`;
  s.async = true;

  document.body.appendChild(s);

  showToast("🔒 Recompensa bloqueada");
};

// ============================================
// 📊 ENTERPRISE DASHBOARD DATA EXPORT
// ============================================

window.getEnterpriseStats = async () => {
  const ref = doc(db, "enterprise_kpi", "global");
  const snap = await getDoc(ref);

  const data = snap.data() || {};

  console.log("📊 ENTERPRISE STATS:", {
    clicks: data.clicks || 0,
    revenue: data.revenue || 0,
    conversions: data.conversions || 0,
    botBlocks: enterprise.botBlocks
  });

  return data;
};

// ============================================
// 🔥 AUTO SESSION TRACKING
// ============================================

async function startSession() {
  enterprise.sessions++;

  await logKPI("sessions", 1);

  await auditLog("session_start", {
    page: location.href
  });
}

// ============================================
// 🚀 INIT ENTERPRISE LAYER
// ============================================

onAuthStateChanged(auth, async (u) => {
  if (!u) return;

  user = u;

  await startSession();
});
