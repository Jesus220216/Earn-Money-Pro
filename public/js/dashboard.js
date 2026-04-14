// ============================================
// 💼 EARNPRO DASHBOARD - IMPERIO TOTAL V13
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
// 🧠 APRENDIZAJE (OFERTA MÁS USADA)
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
// 💰 ROTADOR INTELIGENTE
// ============================================

async function triggerCPA() {
  const r = Math.random();

  // 50% smartlink (estable)
  if (r < 0.5) return openCPA(CPA_LINK, "smart");

  // 25% oferta aprendida
  const learned = await getTopOffer();
  if (learned && r < 0.75) return openCPA(learned, "learned");

  // 25% feed filtrado
  loadAndOpenBestOffer();
}

// ============================================
// 🧠 FILTRO DE OFERTAS (IMPORTANTE)
// ============================================

function loadAndOpenBestOffer() {
  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(r => r.json())
    .then(data => {
      if (!data.offers?.length) return openCPA(CPA_LINK, "fallback");

      const filtered = data.offers.filter(o => {
        const t = (o.title || "").toLowerCase();
        const p = parseFloat(o.payout);

        return (
          p >= 0.2 &&
          !t.includes("deposit") &&
          !t.includes("crypto") &&
          !t.includes("casino") &&
          !t.includes("bet") &&
          !t.includes("trading")
        );
      });

      const pick = filtered.length
        ? filtered.sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))[0]
        : data.offers[Math.floor(Math.random() * data.offers.length)];

      openCPA(pick.offerlink, pick.title);
    })
    .catch(() => openCPA(CPA_LINK, "error"));
}

// ============================================
// 🔗 ABRIR CPA + TRACKING + MONETAG CONTROLADO
// ============================================

function openCPA(url, name = "offer") {
  if (!user?.uid) return;

  const finalURL =
    url + (url.includes("?") ? "&" : "?") +
    "subid=" + encodeURIComponent(user.uid);

  // Guardar click
  try {
    addDoc(collection(db, "clicks"), {
      uid: user.uid,
      offer: url,
      name,
      ts: Date.now()
    });
  } catch {}

  showToast("⚡ Completa un paso rápido para ganar");

  setTimeout(() => {
    window.open(finalURL, "_blank");

    // Monetag SOLO 25% (evita penalización)
    if (Math.random() < 0.25) {
      try {
        const s = document.createElement("script");
        s.src = "https://al5sm.com/tag.min.js";
        s.dataset.zone = "10877528";
        document.body.appendChild(s);
      } catch {}
    }

  }, 500);
}

// ============================================
// ⭐ OFFERWALL ADGEM
// ============================================

window.openOfferwall = () => {
  if (!user?.uid) return showToast("Inicia sesión ❌");

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

  setTimeout(() => (taskCooldown = false), 2500);
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
