// ============================================
// 🔥 EARNPRO NIVEL DIOS - FULL MONETIZATION AI
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 💰 CONFIG CPA (TUS IDS REALES)
// ============================================

const SMARTLINK = "https://omg10.com/4/10751693";
const ADGATE_ID = "5716144";
const LOCKER_ID = "1889035";
const CPX_TOKEN = "03c90bec5058337763c7fa0911a84656";

// ⏳ CONFIG
const COOLDOWN = 900000;

// ============================================
// VARIABLES
// ============================================

let user;
let balance = 0;
let videosLeft = 0;
let boxInterval = null;
let taskCooldown = false;
let userGeo = "unknown";

// ============================================
// 🌍 DETECTAR GEO + DEVICE
// ============================================

async function detectUserEnv() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    userGeo = data.country_code || "US";
  } catch {
    userGeo = "US";
  }
}

// ============================================
// 🤖 ANTI BOT AVANZADO
// ============================================

function isBot() {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("bot") || ua.includes("crawler")) return true;
  if (!window.navigator.webdriver === false) return true;
  if (screen.width < 300) return true;

  return false;
}

function lockTask(time = 15000) {
  taskCooldown = true;
  setTimeout(() => taskCooldown = false, time);
}

// ============================================
// 🧠 SMART MONETIZATION AI
// ============================================

function smartMonetization() {
  if (taskCooldown || isBot()) return;

  lockTask(15000);

  const rand = Math.random();

  // 🔥 GEO OPTIMIZATION
  if (["US", "CA", "UK", "AU"].includes(userGeo)) {
    if (rand < 0.4) return openOfferwall();
    if (rand < 0.7) return openLocker();
    return openAd();
  }

  // 🌍 RESTO DEL MUNDO
  if (rand < 0.6) return openAd();
  if (rand < 0.85) return openOfferwall();
  return openLocker();
}

// ============================================
// 🔗 SMARTLINK
// ============================================

function openAd() {
  window.open(`${SMARTLINK}?uid=${user?.uid}`, "_blank");
}

// ============================================
// 🔥 OFFERWALL ADGATE
// ============================================

window.openOfferwall = () => {
  const frame = document.getElementById("offerwallFrame");

  if (frame) {
    frame.src = `https://wall.adgatemedium.com/?aff_id=${ADGATE_ID}&user_id=${user.uid}`;
  }

  showToast("💰 Ofertas premium cargadas");
};

// ============================================
// 🔒 CPA LOCKER
// ============================================

window.openLocker = () => {
  if (document.getElementById("lockerScript")) return;

  const s = document.createElement("script");
  s.id = "lockerScript";
  s.src = `https://playabledownloads.com/script_include.php?id=${LOCKER_ID}&subid=${user.uid}`;
  s.async = true;

  document.body.appendChild(s);

  showToast("🔒 Desbloquea la recompensa");
};

// ============================================
// 🎥 VIDEO
// ============================================

window.startVideo = async () => {
  if (videosLeft <= 0) return showToast("Sin videos ❌");

  smartMonetization();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.03),
      videosLeft: increment(-1),
      todayEarnings: increment(0.03)
    });

    videosLeft--;
    document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;

    showToast("Ganaste $0.03 🎥");
  }, 8000);
};

// ============================================
// 🎰 RULETA
// ============================================

window.spin = async () => {
  smartMonetization();

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });

      showToast(`Ganaste $${reward}`);
    }
  }, 3000);
};

// ============================================
// 🎁 DAILY
// ============================================

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000) return showToast("Ya reclamado ❌");

  smartMonetization();

  setTimeout(async () => {
    await updateDoc(ref, {
      balance: increment(0.2),
      lastDaily: Date.now(),
      todayEarnings: increment(0.2)
    });

    showToast("Ganaste $0.20 🎁");
  }, 8000);
};

// ============================================
// 🎮 JUEGO
// ============================================

window.playGame = async () => {
  smartMonetization();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    showToast("Ganaste $0.05 🎮");
  }, 12000);
};

// ============================================
// 🎁 CAJA
// ============================================

window.openBox = async () => {
  if (taskCooldown) return showToast("Espera ⏳");

  smartMonetization();
};

// ============================================
// 💳 RETIRO
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
    date: Date.now()
  });

  await updateDoc(doc(db, "users", user.uid), {
    balance: increment(-amount)
  });

  showToast("Retiro enviado 🚀");
};

// ============================================
// 🔥 FIREBASE INIT
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
  initBoxTimer();
});

// ============================================
// RESTO (NO TOCAR)
// ============================================

async function initUser() {
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 1,
      videosLeft: 6,
      spins: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString(),
      todayEarnings: 0,
      todayDate: new Date().toDateString(),
      lastBox: 0
    });
  }
}

async function resetDaily() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastReset !== today) {
    await updateDoc(ref, {
      videosLeft: 6,
      spins: 0,
      lastReset: today,
      todayEarnings: 0
    });
    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;
}

function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};

    balance = data.balance || 0;
    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("todayEarnings").innerText = "$" + (data.todayEarnings || 0).toFixed(2);

    document.getElementById("videos").innerText = 6 - (data.videosLeft || 0);
  });
}

function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(d => {
      const w = d.data();
      if (w.userId !== user.uid) return;
      div.innerHTML += `<p>-$${w.amount}</p>`;
    });
  });
}

function generateRefLink() {
  document.getElementById("refLink").value = `${window.location.origin}?ref=${user.uid}`;
}

window.copyRef = async () => {
  await navigator.clipboard.writeText(document.getElementById("refLink").value);
  showToast("Copiado ✅");
};

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
