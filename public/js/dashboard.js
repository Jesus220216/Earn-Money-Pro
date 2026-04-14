// ============================================
// 💼 EARNPRO DASHBOARD - PRO V16 FIXED
// ============================================

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 STATE
// ============================================

let user = null;
let balance = 0;
let videosLeft = 6;
let taskCooldown = false;

const CPA_LINK = "https://getafilenow.com/1890309";

// ============================================
// 🧠 FILTER OFFERS
// ============================================

function isGoodOffer(o) {
  const t = (o.title || "").toLowerCase();
  const p = parseFloat(o.payout || 0);

  return (
    p >= 0.30 &&
    !t.includes("crypto") &&
    !t.includes("casino") &&
    !t.includes("bet") &&
    !t.includes("trading") &&
    (
      t.includes("app") ||
      t.includes("install") ||
      t.includes("download") ||
      t.includes("game")
    )
  );
}

// ============================================
// 🔗 OPEN CPA SAFE
// ============================================

function openCPA(url, name = "offer") {
  if (!user?.uid) return;

  const finalURL =
    url + (url.includes("?") ? "&" : "?") +
    "subid=" + encodeURIComponent(user.uid);

  addDoc(collection(db, "clicks"), {
    uid: user.uid,
    offer: url,
    name,
    timestamp: Date.now()
  });

  showToast("💰 Abriendo oferta...");

  window.open(finalURL, "_blank");
}

// ============================================
// 🔥 CPA ROTATOR
// ============================================

function triggerCPA() {
  const r = Math.random();

  if (r < 0.4) {
    return openCPA(CPA_LINK, "smart-fallback");
  }

  loadBestOffer();
}

// ============================================
// 💰 BEST OFFER
// ============================================

async function loadBestOffer() {
  try {
    const res = await fetch(
      `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`
    );

    const data = await res.json();
    const offers = data.offers || [];

    const filtered = offers.filter(isGoodOffer);

    const best = filtered.sort(
      (a, b) => parseFloat(b.payout) - parseFloat(a.payout)
    )[0];

    if (best?.offerlink) {
      openCPA(best.offerlink, best.title);
    } else {
      openCPA(CPA_LINK, "fallback");
    }

  } catch (e) {
    openCPA(CPA_LINK, "error");
  }
}

// ============================================
// 🎮 TASK SYSTEM
// ============================================

function doTask() {
  if (taskCooldown) return showToast("⏳ Espera...");

  taskCooldown = true;
  triggerCPA();

  setTimeout(() => (taskCooldown = false), 2500);
}

window.startVideo = () => {
  if (videosLeft <= 0) return showToast("❌ Sin videos");

  videosLeft--;
  doTask();
};

window.playGame = () => {
  showToast("🎮 Jugando...");
  doTask();
};

window.spin = () => {
  if (Math.random() < 0.25) {
    showToast("🎉 BONUS!");
  }
  doTask();
};

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastDailyDate === today) {
    return showToast("❌ Ya reclamado");
  }

  await updateDoc(ref, {
    lastDailyDate: today,
    todayEarnings: increment(0.2),
    balance: increment(0.2)
  });

  showToast("🎁 +$0.20");
};

// ============================================
// 🔗 REFERRAL SYSTEM
// ============================================

window.copyRef = async () => {
  const link = `${window.location.origin}/index.html?ref=${user.uid}`;
  await navigator.clipboard.writeText(link);
  showToast("🔗 Copiado");
};

window.shareWhatsApp = () => {
  const link = `${window.location.origin}/index.html?ref=${user.uid}`;
  const text = `💰 Gana dinero aquí: ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
};

// ============================================
// 💳 WITHDRAW
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value.trim();

  if (!email || amount < 5)
    return showToast("Mínimo $5");

  if (amount > balance)
    return showToast("Saldo insuficiente");

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

  showToast("💸 Enviado");
};

// ============================================
// 📊 ADMIN (FIXED SINGLE VERSION)
// ============================================

async function loadAdminStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const clicksSnap = await getDocs(collection(db, "clicks"));

    set("adminUsers", usersSnap.size);
    set("adminClicks", clicksSnap.size);

  } catch (e) {
    console.log("admin error", e);
  }
}

// ============================================
// 📡 REALTIME
// ============================================

function set(id, value, money = false) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = money
    ? `$${parseFloat(value || 0).toFixed(2)}`
    : value;
}

function setupRealtime() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;

    const d = snap.data();

    balance = d.balance || 0;
    videosLeft = d.videosLeft ?? videosLeft;

    set("balance", balance, true);
    set("availableBalance", balance, true);
    set("todayEarnings", d.todayEarnings || 0, true);
    set("videos", `${videosLeft}/6`);
    set("refCount", d.referrals || 0);

    document.getElementById("refLink").value =
      `${window.location.origin}/index.html?ref=${user.uid}`;
  });
}

// ============================================
// 🚪 AUTH INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (!u) {
    window.location.href = "index.html";
    return;
  }

  user = u;

  setupRealtime();
  loadAdminStats();
});

// ============================================
// 🔔 TOAST
// ============================================

function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style =
    "position:fixed;bottom:20px;right:20px;background:#22c55e;color:#000;padding:10px;border-radius:8px;z-index:9999;";
  document.body.appendChild(t);

  setTimeout(() => t.remove(), 2500);
}
