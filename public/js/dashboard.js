// ============================================
// 💼 EARNPRO DASHBOARD CORE SYSTEM - IMPERIO CPA V9
// ============================================

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 VARIABLES
// ============================================

let user;
let balance = 0;
let videosLeft = 6;
let taskCooldown = false;

const REF_COMMISSION = 0.10;

// 🔥 SMARTLINK PRO (CPAGrip)
const CPA_LINK = "https://getafilenow.com/1890309";

// ============================================
// 🌍 DETECTOR DE PAÍS (BÁSICO)
// ============================================

function getUserCountry() {
  return navigator.language || "es-DO";
}

// ============================================
// 💰 ROTADOR IMPERIO
// ============================================

function triggerCPA() {
  const rand = Math.random();
  const country = getUserCountry();

  // 🌎 Ajuste por país (más conversión)
  if (country.includes("US")) {
    if (rand < 0.5) return loadAndOpenBestOffer();
    return openCPA(CPA_LINK, "us_smart");
  }

  // 🌎 LATAM (RD incluido)
  if (rand < 0.7) {
    openCPA(CPA_LINK, "latam_smart");
  } else {
    loadAndOpenBestOffer();
  }
}

// ============================================
// 🧠 MEJOR OFERTA AUTOMÁTICA
// ============================================

function loadAndOpenBestOffer() {
  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(res => res.json())
    .then(data => {
      if (!data.offers || data.offers.length === 0) {
        openCPA(CPA_LINK, "fallback");
        return;
      }

      // 🔥 filtrar ofertas malas
      const filtered = data.offers.filter(o => parseFloat(o.payout) >= 0.50);

      // 🔥 elegir mejor payout
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

  // 🔥 guardar click
  try {
    addDoc(collection(db, "clicks"), {
      uid: user.uid,
      offer: offerId,
      url: finalURL,
      timestamp: Date.now()
    });
  } catch (e) {}

  // 🔥 mensaje optimizado
  showToast("🔥 Gana dinero fácil ahora");

  // 🔥 delay psicológico
  setTimeout(() => {
    window.open(finalURL, "_blank");
  }, 800);
}

// ============================================
// ⭐ ADGEM OFFERWALL
// ============================================

window.openOfferwall = function () {
  if (!user || !user.uid) return showToast("Inicia sesión ❌");

  const url = `https://adunits.adgem.com/wall?appid=32365&playerid=${user.uid}&subid=${user.uid}`;
  window.open(url, "_blank");
};

// ============================================
// 🎮 ACCIONES CENTRALIZADAS
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
// ⭐ PREMIUM
// ============================================

window.openSubscription = () => {
  doTask();

  setTimeout(() => {
    window.openOfferwall();
  }, 1200);
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
// 🔗 REFERIDOS
// ============================================

window.copyRef = async () => {
  const el = document.getElementById("refLink");
  await navigator.clipboard.writeText(el.value);
  showToast("Copiado ✅");
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
    set("availableBalance", balance, true);
    set("todayEarnings", d.todayEarnings || 0, true);
    set("videosLeft", videosLeft);
    set("refCount", d.referrals || 0);

    document.getElementById("refLink").value =
      window.location.origin + "/index.html?ref=" + user.uid;
  });
}

// ============================================
// 🔥 OFERTAS VISUALES
// ============================================

window.loadOffers = () => {
  const container = document.getElementById("offers");

  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`)
    .then(res => res.json())
    .then(data => {
      let html = "";

      const offers = data.offers
        .filter(o => parseFloat(o.payout) >= 0.30)
        .sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))
        .slice(0, 8);

      offers.forEach(offer => {
        html += `
        <div style="padding:15px;border:1px solid #333;border-radius:10px;">
          <h4>${offer.title}</h4>
          <p>$${offer.payout}</p>
          <a href="#" onclick="openCPA('${offer.offerlink}','${offer.title}');return false;"
            style="background:#22c55e;padding:10px;display:block;text-align:center;border-radius:8px;">
            COMPLETAR
          </a>
        </div>`;
      });

      container.innerHTML = html;
    });
};

// ============================================
// 🚪 INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;
    setupRealtime();
    loadOffers();
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

