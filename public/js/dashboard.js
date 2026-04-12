// ============================================
// 💼 EARNPRO DASHBOARD CORE SYSTEM - REPAIRED
// ============================================

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 VARIABLES GLOBALES
// ============================================

let user;
let balance = 0;
let videosLeft = 6;
let taskCooldown = false;
let completedOffers = 0;
const MAX_VIDEOS = 6;
const VIDEO_TIME = 20000; // 20 segundos

// ============================================
// 💰 CPA CORE SYSTEM
// ============================================

function openCPA(url, offerId = "unknown") {
  if (!user || !user.uid) return;

  const finalURL =
    url +
    (url.includes("?") ? "&" : "?") +
    "tracking_id=" + encodeURIComponent(user.uid) +
    "&offer_id=" + encodeURIComponent(offerId);

  window.open(finalURL, "_blank");
  showToast("💰 Completa la oferta para ganar dinero real");
}

function triggerCPA() {
  if (!user || !user.uid) return;
  // CPA Locker Script (PlayableDownloads)
  const s = document.createElement("script");
  s.src = "https://playabledownloads.com/script_include.php?id=1889666&tracking_id=" + encodeURIComponent(user.uid);
  s.async = true;
  document.body.appendChild(s);
  showToast("💰 Completa la oferta para ganar dinero real");
}

// ============================================
// 🎰 ACCIONES DE GANANCIA
// ============================================

window.startVideo = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  if (videosLeft <= 0) return showToast("Sin videos hoy ❌");

  taskCooldown = true;
  openCPA("https://omg10.com/4/10751693", "video_01");
  showToast("🎥 Reproduciendo video... 20s");

  setTimeout(async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(0.02),
        videosLeft: increment(-1),
        todayEarnings: increment(0.02)
      });
      showToast("✅ Video completado +$0.02");
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, VIDEO_TIME);
};

window.playGame = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  taskCooldown = true;
  openCPA("https://www.profitablecpmratenetwork.com/a97wfwyyb", "game_01");
  showToast("🎮 Jugando... 10s");

  setTimeout(async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(0.05),
        todayEarnings: increment(0.05)
      });
      showToast("🎮 Juego completado +$0.05");
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, 10000);
};

window.spin = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  taskCooldown = true;
  openCPA("https://omg10.com/4/10751693", "spin_01");
  showToast("🎰 Girando ruleta...");

  const rewards = [0.01, 0.02, 0.05, 0.10];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });
      showToast(`🎰 ¡Ganaste $${reward.toFixed(2)}!`);
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, 4000);
};

window.daily = async () => {
  if (taskCooldown) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastDailyDate === today) {
    return showToast("Ya reclamado hoy ❌");
  }

  taskCooldown = true;
  openCPA("https://omg10.com/4/10751693", "daily_01");

  try {
    await updateDoc(ref, {
      balance: increment(0.20),
      todayEarnings: increment(0.20),
      lastDailyDate: today
    });
    showToast("🎁 Recompensa diaria +$0.20");
  } catch (e) {
    console.error(e);
  }
  taskCooldown = false;
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!email || isNaN(amount) || amount < 5) {
    return showToast("Mínimo $5.00 y email válido ❌");
  }

  if (amount > balance) {
    return showToast("Saldo insuficiente ❌");
  }

  try {
    await addDoc(collection(db, "withdrawals"), {
      userId: user.uid,
      amount: amount,
      email: email,
      status: "pending",
      date: Date.now()
    });

    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(-amount)
    });

    showToast("🚀 Retiro solicitado con éxito");
    document.getElementById("amount").value = "";
  } catch (e) {
    showToast("Error al procesar retiro ❌");
    console.error(e);
  }
};

// ============================================
// 🔗 REFERIDOS
// ============================================

window.copyRef = async () => {
  const el = document.getElementById("refLink");
  if (!el || el.value === "Cargando...") return;
  await navigator.clipboard.writeText(el.value);
  showToast("Enlace copiado ✅");
};

// ============================================
// 📡 REAL TIME DATA & UI
// ============================================

function set(id, value, isCurrency = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = isCurrency ? "$" + parseFloat(value).toFixed(2) : value;
}

function setupRealtime() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (!snap.exists()) return;
    const d = snap.data();
    
    balance = d.balance || 0;
    videosLeft = d.videosLeft !== undefined ? d.videosLeft : 6;

    // Actualizar UI
    set("balance", balance, true);
    set("availableBalance", balance, true);
    set("todayEarnings", d.todayEarnings || 0, true);
    set("videos", (6 - videosLeft) + "/6");
    set("videosLeft", videosLeft);
    set("refCount", d.referrals || 0);
    set("totalReferrals", d.referrals || 0);
    set("referralEarnings", d.referralEarnings || 0, true);
    
    const refLink = window.location.origin + "/index.html?ref=" + user.uid;
    const refInput = document.getElementById("refLink");
    if (refInput) refInput.value = refLink;

    // Reset diario de videos si es necesario
    const today = new Date().toDateString();
    if (d.lastResetDate !== today) {
      updateDoc(doc(db, "users", user.uid), {
        videosLeft: 6,
        todayEarnings: 0,
        lastResetDate: today
      });
    }
  });
}

// ============================================
// 🔥 OFERTAS CPAGRIP
// ============================================

window.loadOffers = () => {
  const container = document.getElementById("offers");
  if (!container) return;
  
  const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.offers || data.offers.length === 0) {
        container.innerHTML = "<p>No hay ofertas disponibles en tu región.</p>";
        return;
      }

      let html = "";
      data.offers.slice(0, 5).forEach(offer => {
        html += `
          <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.1);">
            <h4 style="color:#fff; margin-bottom:5px;">${offer.title}</h4>
            <p style="color:#22c55e; font-weight:bold; font-size:14px; margin-bottom:10px;">Gana hasta $2.50 💸</p>
            <a href="${offer.offerlink}" target="_blank" style="display:block; text-align:center; background:#22c55e; color:#000; padding:8px; border-radius:5px; text-decoration:none; font-weight:bold; font-size:13px;">🚀 COMPLETAR AHORA</a>
          </div>
        `;
      });
      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = "<p>Error al cargar ofertas.</p>";
    });
};

window.openLocker = () => {
  triggerCPA();
};

// ============================================
// 🚪 AUTH & INIT
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

window.logout = () => {
  auth.signOut().then(() => window.location.href = "index.html");
};

// ============================================
// 🔔 TOAST
// ============================================

function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#22c55e;
    color:#000;
    padding:12px 20px;
    border-radius:8px;
    z-index:9999;
    font-weight:600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
