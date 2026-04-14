// ============================================
// 💼 EARNPRO DASHBOARD - AUTO GANANCIAS V10
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

const REF_COMMISSION = 0.10;
const CPA_LINK = "https://getafilenow.com/1890309";

// ============================================
// 🧠 AUTO OPTIMIZADOR (APRENDE SOLO)
// ============================================

async function getTopOfferFromClicks() {
  try {
    const q = query(
      collection(db, "clicks"),
      where("uid", "==", user.uid)
    );

    const snap = await getDocs(q);

    if (snap.empty) return null;

    const counts = {};

    snap.forEach(doc => {
      const d = doc.data();
      counts[d.offer] = (counts[d.offer] || 0) + 1;
    });

    // 🔥 elegir el más usado
    let top = null;
    let max = 0;

    for (let key in counts) {
      if (counts[key] > max) {
        max = counts[key];
        top = key;
      }
    }

    return top;
  } catch {
    return null;
  }
}

// ============================================
// 💰 ROTADOR AUTOMÁTICO
// ============================================

async function triggerCPA() {
  const rand = Math.random();

  // 🔥 50% usar smartlink
  if (rand < 0.5) {
    openCPA(CPA_LINK, "smart_auto");
    return;
  }

  // 🔥 intentar usar mejor oferta previa
  const topOffer = await getTopOfferFromClicks();

  if (topOffer && topOffer.startsWith("http")) {
    openCPA(topOffer, "learned_offer");
    return;
  }

  // 🔥 fallback → mejor oferta actual
  loadAndOpenBestOffer();
}

// ============================================
// 🧠 MEJOR OFERTA POR PAYOUT
// ============================================

function loadAndOpenBestOffer() {
  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(res => res.json())
    .then(data => {
      if (!data.offers || data.offers.length === 0) {
        openCPA(CPA_LINK, "fallback");
        return;
      }

      const filtered = data.offers.filter(o => parseFloat(o.payout) >= 0.50);

      const best = filtered.length
        ? filtered.sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))[0]
        : data.offers[Math.floor(Math.random() * data.offers.length)];

      openCPA(best.offerlink, best.title);
    })
    .catch(() => openCPA(CPA_LINK, "error"));
}

// ============================================
// 🔗 OPEN CPA + TRACKING
// ============================================

function openCPA(url, offerId = "unknown") {
  if (!user || !user.uid) {
    showToast("Error usuario ❌");
    return;
  }

  const finalURL =
    url +
    (url.includes("?") ? "&" : "?") +
    "subid=" + encodeURIComponent(user.uid) +
    "&offer_id=" + encodeURIComponent(offerId);

  try {
    addDoc(collection(db, "clicks"), {
      uid: user.uid,
      offer: url,
      name: offerId,
      timestamp: Date.now()
    });
  } catch (e) {}

  showToast("🔥 Generando dinero automático...");

  setTimeout(() => {
    window.open(finalURL, "_blank");
  }, 700);
}

// ============================================
// ⭐ ADGEM
// ============================================

window.openOfferwall = function () {
  if (!user) return showToast("Login requerido ❌");

  const url = `https://adunits.adgem.com/wall?appid=32365&playerid=${user.uid}&subid=${user.uid}`;
  window.open(url, "_blank");
};

// ============================================
// 🎮 ACCIONES
// ============================================

function doTask() {
  if (taskCooldown) return showToast("Espera ⏳");

  taskCooldown = true;
  triggerCPA();

  setTimeout(() => (taskCooldown = false), 3000);
}

window.startVideo = () => {
  if (videosLeft <= 0) return showToast("Sin videos ❌");
  doTask();
};

window.playGame = doTask;
window.spin = doTask;

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastDailyDate === today) {
    return showToast("Ya reclamado ❌");
  }

  doTask();
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value.trim();

  if (!email || isNaN(amount) || amount < 5) {
    return showToast("Mínimo $5 ❌");
  }

  if (amount > balance) {
    return showToast("Saldo insuficiente ❌");
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

  showToast("Retiro solicitado 🚀");
};

// ============================================
// 📡 REALTIME
// ============================================

function set(id, value, money = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = money ? "$" + parseFloat(value).toFixed(2) : value;
}

function setupRealtime() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;

    const d = snap.data();
    balance = d.balance || 0;
    videosLeft = d.videosLeft ?? 6;

    set("balance", balance, true);
    set("videosLeft", videosLeft);
  });
}

// ============================================
// 🚪 INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;
    setupRealtime();
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
  t.style = "position:fixed;bottom:20px;right:20px;background:#22c55e;padding:10px;border-radius:8px;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
