// ============================================
// 💼 EARNPRO DASHBOARD - PRO REAL V15
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

// 🔥 CPX RESEARCH CONFIG
const CPX_CONFIG = {
  app_id: 32499, // <--- CAMBIA ESTO A 32499
  enabled: true,
  wall_url: "https://wall.cpx-research.com/index.php"
};


// ============================================
// 🧠 SISTEMA DE APRENDIZAJE (TOP OFERTA)
// ============================================

async function getTopOffer() {
  try {
    const q = query(collection(db, "clicks"), where("uid", "==", user.uid));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const map = {};
    snap.forEach(d => {
      const data = d.data();
      map[data.offer] = (map[data.offer] || 0) + 1;
    });

    return Object.keys(map).sort((a, b) => map[b] - map[a])[0];
  } catch {
    return null;
  }
}

// ============================================
// 💰 ROTADOR PRO (MEJORADO)
// ============================================

async function triggerCPA() {
  const r = Math.random();

  // 🔥 40% smartlink (estable)
  if (r < 0.4) return openCPA(CPA_LINK, "smart");

  // 🔥 30% oferta aprendida
  const learned = await getTopOffer();
  if (learned && r < 0.7) return openCPA(learned, "learned");

  // 🔥 30% feed limpio
  loadAndOpenBestOffer();
}

// ============================================
// 🧠 FILTRO ULTRA PRO (ANTI BASURA)
// ============================================

function isGoodOffer(o) {
  const t = (o.title || "").toLowerCase();
  const p = parseFloat(o.payout);

  return (
    p >= 0.30 &&

    // ❌ basura total
    !t.includes("deposit") &&
    !t.includes("crypto") &&
    !t.includes("casino") &&
    !t.includes("bet") &&
    !t.includes("trading") &&
    !t.includes("bitcoin") &&
    !t.includes("forex") &&
    !t.includes("invest") &&
    !t.includes("loan") &&
    !t.includes("credit") &&
    !t.includes("bank") &&
    !t.includes("iq") &&

    // ✅ conversion real
    (
      t.includes("app") ||
      t.includes("install") ||
      t.includes("download") ||
      t.includes("game") ||
      t.includes("reward") ||
      t.includes("gift")
    )
  );
}

// ============================================
// 🔥 MEJOR OFERTA
// ============================================

function loadAndOpenBestOffer() {
  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(r => r.json())
    .then(data => {

      if (!data.offers?.length) {
        return openCPA(CPA_LINK, "fallback");
      }

      const filtered = data.offers.filter(isGoodOffer);

      const pick = filtered.length
        ? filtered.sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))[0]
        : null;

      if (pick) {
        openCPA(pick.offerlink, pick.title);
      } else {
        openCPA(CPA_LINK, "fallback_safe");
      }

    })
    .catch(() => openCPA(CPA_LINK, "error"));
}

// ============================================
// 🔗 OPEN CPA + TRACKING + UX PRO
// ============================================

function openCPA(url, name = "offer") {
  if (!user?.uid) return;

  const finalURL =
    url + (url.includes("?") ? "&" : "?") +
    "subid=" + encodeURIComponent(user.uid);

  // guardar click
  try {
    addDoc(collection(db, "clicks"), {
      uid: user.uid,
      offer: url,
      name,
      timestamp: Date.now()
    });
  } catch {}

  showToast("💰 Completa la oferta y gana dinero");

  // UX delay (mejora conversión)
  setTimeout(() => {
    window.open(finalURL, "_blank");
  }, 600);
}

// ============================================
// ⭐ OFFERWALLS (MULTI)
// ============================================

window.openSubscription = () => {
  if (!user?.uid) return showToast("Login requerido ❌");

  // AdGem
  const adgem = `https://adunits.adgem.com/wall?appid=32365&playerid=${user.uid}&subid=${user.uid}`;
  window.open(adgem, "_blank");
};

// 🔥 CPX RESEARCH WALL
window.openCPXWall = () => {
  if (!user?.uid) return showToast("Login requerido ❌");
  
  if (!CPX_CONFIG.enabled) return showToast("CPX Research no disponible ❌");
  
  const cpxUrl = `${CPX_CONFIG.wall_url}?app_id=${CPX_CONFIG.app_id}&ext_user_id=${user.uid}&tracking_id=${user.uid}`;
  
  showToast("📋 Abriendo encuestas CPX Research...");
  
  setTimeout(() => {
    window.open(cpxUrl, "_blank");
  }, 600);
};

// ============================================
// 🎮 SISTEMA DE GANANCIAS (ENGAGEMENT)
// ============================================

function doTask() {
  if (taskCooldown) return showToast("Espera ⏳");

  taskCooldown = true;
  triggerCPA();

  setTimeout(() => (taskCooldown = false), 2500);
}

window.startVideo = () => {
  if (videosLeft <= 0) return showToast("Sin videos ❌");

  videosLeft--;
  doTask();
};

window.playGame = () => {
  doTask();
};

window.spin = () => {
  const rand = Math.random();

  if (rand < 0.3) {
    showToast("🎉 Ganaste bonus!");
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

  doTask();
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value.trim();

  if (!email || isNaN(amount) || amount < 5)
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

  showToast("Retiro enviado 🚀");
};

// ============================================
// 🔗 REFERIDOS
// ============================================

window.copyRef = async () => {
  const el = document.getElementById("refLink");
  await navigator.clipboard.writeText(el.value);
  showToast("Copiado ✅");
};

// ============================================
// 📡 REALTIME (UI SYNC)
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

    const refInput = document.getElementById("refLink");
    if (refInput) {
      refInput.value =
        window.location.origin + "/index.html?ref=" + user.uid;
    }
  });
}

// ============================================
// 🚪 INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;
    setupRealtime();
    
    // Log CPX integration status
    console.log("✅ CPX Research integrado:", CPX_CONFIG);
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
    "position:fixed;bottom:20px;right:20px;background:#22c55e;color:#000;padding:10px 15px;border-radius:8px;font-weight:bold;z-index:9999;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
