// ============================================
// 💼 EARNPRO DASHBOARD - PRO V16 (FULL SYSTEM)
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
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 VARIABLES
// ============================================

let user;
let balance = 0;
let videosLeft = 6;
let taskCooldown = false;

const CPA_LINK = "https://getafilenow.com/1890309";

// ============================================
// 🧠 FILTRO PRO (ANTI BASURA)
// ============================================

function isGoodOffer(o) {
  const t = (o.title || "").toLowerCase();
  const p = parseFloat(o.payout);

  return (
    p >= 0.30 &&
    !t.includes("crypto") &&
    !t.includes("trading") &&
    !t.includes("casino") &&
    !t.includes("bet") &&
    !t.includes("iq") &&
    (
      t.includes("app") ||
      t.includes("install") ||
      t.includes("download") ||
      t.includes("game") ||
      t.includes("reward")
    )
  );
}

// ============================================
// 💰 ROTADOR INTELIGENTE
// ============================================

async function triggerCPA() {
  const r = Math.random();

  if (r < 0.4) return openCPA(CPA_LINK, "smart");

  loadAndOpenBestOffer();
}

// ============================================
// 🔥 MEJOR OFERTA
// ============================================

function loadAndOpenBestOffer() {
  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(r => r.json())
    .then(data => {

      const filtered = data.offers?.filter(isGoodOffer) || [];

      const pick = filtered.length
        ? filtered.sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))[0]
        : null;

      if (pick) {
        openCPA(pick.offerlink, pick.title);
      } else {
        openCPA(CPA_LINK, "fallback");
      }

    })
    .catch(() => openCPA(CPA_LINK, "error"));
}

// ============================================
// 🔗 OPEN CPA + TRACKING
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

  showToast("💰 Completa la oferta para ganar");

  setTimeout(() => {
    window.open(finalURL, "_blank");
  }, 500);
}

// =============================
// 📲 WHATSAPP VIRAL
// =============================
window.shareWhatsApp = () => {
  const link = document.getElementById("refLink").value;

  const text = `💰 Gana dinero gratis aquí:\n${link}`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
};

// =============================
// 🛠 ADMIN PANEL
// =============================
async function loadAdminStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const clicksSnap = await getDocs(collection(db, "clicks"));

    document.getElementById("adminUsers").innerText = usersSnap.size;
    document.getElementById("adminClicks").innerText = clicksSnap.size;

  } catch (e) {
    console.log("Admin error", e);
  }
}
// ============================================
// 🎮 SISTEMA DE JUEGOS / MISIONES
// ============================================

window.startVideo = () => {
  if (videosLeft <= 0) return showToast("Sin videos ❌");

  videosLeft--;
  doTask();
};

window.playGame = () => {
  showToast("🎮 Jugando misión...");
  doTask();
};

window.spin = () => {
  const win = Math.random();

  if (win < 0.25) {
    showToast("🎉 BONUS ACTIVADO");
  }

  doTask();
};

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const d = snap.data();
  const today = new Date().toDateString();

  if (d.lastDailyDate === today) {
    return showToast("Ya reclamado ❌");
  }

  await updateDoc(ref, {
    lastDailyDate: today,
    todayEarnings: increment(0.2)
  });

  showToast("🎁 Bonus diario +$0.20");
};

// ============================================
// 🔥 SISTEMA VIRAL (REFERIDOS PRO)
// ============================================

window.copyRef = async () => {
  const link =
    window.location.origin + "/index.html?ref=" + user.uid;

  await navigator.clipboard.writeText(link);

  showToast("🔗 Link copiado — invita y gana");
};

window.shareWhatsApp = () => {
  const link =
    window.location.origin + "/index.html?ref=" + user.uid;

  const text = `💰 Gana dinero gratis aquí: ${link}`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value.trim();

  if (!email || amount < 5)
    return showToast("Mínimo $5 ❌");

  if (amount > balance)
    return showToast("Saldo insuficiente ❌");

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

  showToast("💸 Retiro enviado");
};

// ============================================
// 📊 ADMIN PANEL (BÁSICO)
// ============================================

async function loadAdminStats() {
  const usersSnap = await getDocs(collection(db, "users"));
  const clicksSnap = await getDocs(collection(db, "clicks"));

  set("adminUsers", usersSnap.size);
  set("adminClicks", clicksSnap.size);
}

// ============================================
// 📡 REALTIME
// ============================================

function set(id, value, money = false) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = money
    ? "$" + parseFloat(value).toFixed(2)
    : value;
}

function setupRealtime() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;

    const d = snap.data();

    balance = d.balance || 0;
    videosLeft = d.videosLeft ?? 6;

    set("balance", balance, true);
    set("availableBalance", balance, true);
    set("todayEarnings", d.todayEarnings || 0, true);
    set("videosLeft", videosLeft);
    set("refCount", d.referrals || 0);

    document.getElementById("refLink").value =
      window.location.origin + "/index.html?ref=" + user.uid;
  });
}

// ============================================
// 🎮 CORE TASK
// ============================================

function doTask() {
  if (taskCooldown) return showToast("Espera ⏳");

  taskCooldown = true;
  triggerCPA();

  setTimeout(() => (taskCooldown = false), 2500);
}

// ============================================
// 🚪 INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;
    setupRealtime();
    loadAdminStats();
  } else {
    window.location.href = "index.html";
  }
});

// ============================================
// 🔔 TOAST
// ============================================

function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style =
    "position:fixed;bottom:20px;right:20px;background:#22c55e;color:#000;padding:10px;border-radius:8px;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
