// ============================================
// 💼 EARNPRO DASHBOARD CORE SYSTEM - PRO VERSION (V4)
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
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 VARIABLES GLOBALES
// ============================================

let user;
let balance = 0;
let videosLeft = 6;
let taskCooldown = false;
const MAX_VIDEOS = 6;
const VIDEO_TIME = 20000; // 20 segundos
const REF_COMMISSION = 0.10; // 10% de comisión para el referente

// ============================================
// 💰 CPA CORE SYSTEM (PLAYABLE DOWNLOADS & OMG10)
// ============================================

function triggerCPA(lockerId = "1889666") {
  if (!user || !user.uid) return;
  
  const oldScript = document.getElementById("cpa-locker-script");
  if (oldScript) oldScript.remove();

  const s = document.createElement("script");
  s.id = "cpa-locker-script";
  s.src = `https://playabledownloads.com/script_include.php?id=${lockerId}&tracking_id=${encodeURIComponent(user.uid)}`;
  s.async = true;
  document.body.appendChild(s);
  
  showToast("💰 Completa la oferta rápida para continuar");
}

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

// ============================================
// 📝 LOG DE ACTIVIDAD (TIEMPO REAL)
// ============================================

async function logActivity(type, amount) {
  try {
    // Solo registramos actividades significativas para no saturar
    await addDoc(collection(db, "activities"), {
      userId: user.uid,
      userName: user.displayName || "Usuario",
      type: type, // 'ganancia' o 'retiro'
      amount: amount,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error al registrar actividad:", e);
  }
}

function setupActivityLog() {
  const container = document.getElementById("activityLog");
  if (!container) return;

  const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10));
  
  onSnapshot(q, (snap) => {
    let html = "";
    snap.forEach((doc) => {
      const act = doc.data();
      const time = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const color = act.type === 'retiro' ? '#ef4444' : '#22c55e';
      const icon = act.type === 'retiro' ? '💸' : '💰';
      const text = act.type === 'retiro' ? 'solicitó un retiro de' : 'ganó';

      html += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:13px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">${icon}</span>
            <div>
              <span style="color:#fff; font-weight:bold;">${act.userName.split(' ')[0]}</span>
              <span style="color:#aaa;"> ${text} </span>
              <span style="color:${color}; font-weight:bold;">$${parseFloat(act.amount).toFixed(2)}</span>
            </div>
          </div>
          <span style="color:#666; font-size:11px;">${time}</span>
        </div>
      `;
    });
    container.innerHTML = html || "<p style='color:#666; text-align:center; padding:10px;'>Esperando actividad...</p>";
  });
}

// ============================================
// 👥 LÓGICA DE REFERIDOS (COMISIONES)
// ============================================

async function giveCommission(amount) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (userData && userData.referredBy) {
      const referrerId = userData.referredBy;
      const commission = amount * REF_COMMISSION;
      
      await updateDoc(doc(db, "users", referrerId), {
        balance: increment(commission),
        referralEarnings: increment(commission)
      });
    }
  } catch (e) {
    console.error("Error al dar comisión:", e);
  }
}

// ============================================
// 🎰 ACCIONES DE GANANCIA
// ============================================

window.startVIPTask = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  taskCooldown = true;
  openCPA("https://omg10.com/4/10868360", "vip_task_01");
  showToast("💎 Tarea VIP iniciada... ¡Gana más!");

  setTimeout(async () => {
    try {
      const reward = 0.10;
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });
      await giveCommission(reward);
      await logActivity('ganancia', reward);
      showToast(`✅ Tarea VIP completada +$${reward}`);
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, 15000);
};

window.startVideo = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  if (videosLeft <= 0) return showToast("Sin videos hoy ❌");

  taskCooldown = true;
  triggerCPA("1889035");
  showToast("🎥 Reproduciendo video... 20s");

  setTimeout(async () => {
    try {
      const reward = 0.02;
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        videosLeft: increment(-1),
        todayEarnings: increment(reward)
      });
      await giveCommission(reward);
      await logActivity('ganancia', reward);
      showToast(`✅ Video completado +$${reward}`);
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, VIDEO_TIME);
};

window.playGame = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  taskCooldown = true;
  triggerCPA("1889035");
  showToast("🎮 Jugando... 10s");

  setTimeout(async () => {
    try {
      const reward = 0.05;
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });
      await giveCommission(reward);
      await logActivity('ganancia', reward);
      showToast(`🎮 Juego completado +$${reward}`);
    } catch (e) {
      console.error(e);
    }
    taskCooldown = false;
  }, 10000);
};

window.spin = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  taskCooldown = true;
  triggerCPA("1889035");
  showToast("🎰 Girando ruleta...");

  const rewards = [0.01, 0.02, 0.05, 0.10];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });
      await giveCommission(reward);
      await logActivity('ganancia', reward);
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
  triggerCPA("1889666");

  try {
    const reward = 0.20;
    await updateDoc(ref, {
      balance: increment(reward),
      todayEarnings: increment(reward),
      lastDailyDate: today
    });
    await giveCommission(reward);
    await logActivity('ganancia', reward);
    showToast(`🎁 Recompensa diaria +$${reward}`);
  } catch (e) {
    console.error(e);
  }
  taskCooldown = false;
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amountInput = document.getElementById("amount");
  const emailInput = document.getElementById("email");
  
  if (!amountInput || !emailInput) return;

  const amount = parseFloat(amountInput.value);
  const email = emailInput.value.trim();
  const currentBalance = Math.round(balance * 100) / 100;

  if (!email || isNaN(amount) || amount < 5) {
    return showToast("Mínimo $5.00 y email válido ❌");
  }

  if (amount > currentBalance) {
    return showToast(`Saldo insuficiente ❌ (Tienes $${currentBalance.toFixed(2)})`);
  }

  triggerCPA("1889666");

  try {
    await addDoc(collection(db, "withdrawals"), {
      userId: user.uid,
      amount: amount,
      email: email,
      status: "pending",
      date: Date.now(),
      timestamp: new Date()
    });

    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(-amount)
    });

    await logActivity('retiro', amount);
    showToast("🚀 Retiro solicitado con éxito");
    amountInput.value = "";
  } catch (e) {
    console.error("Error detallado de Firebase:", e);
    if (e.code === 'permission-denied') {
      showToast("Error: Sin permisos en la base de datos ❌");
    } else {
      showToast("Error al procesar retiro ❌");
    }
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
    
    balance = parseFloat(d.balance) || 0;
    videosLeft = d.videosLeft !== undefined ? d.videosLeft : 6;

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
// 🔥 OFERTAS CPAGRIP (OFFER WALL PRO)
// ============================================

window.loadOffers = () => {
  const container = document.getElementById("offers");
  if (!container) return;
  
  container.innerHTML = `<div style="text-align:center; padding:20px; color:#aaa;">Cargando mejores ofertas... ⏳</div>`;
  
  const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.offers || data.offers.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#ff4444;'>No hay ofertas disponibles en tu región actualmente.</p>";
        return;
      }

      let html = `<div style="display:grid; grid-template-columns: 1fr; gap:15px;">`;
      const sortedOffers = data.offers.sort((a, b) => b.payout - a.payout).slice(0, 8);

      sortedOffers.forEach(offer => {
        const payout = (parseFloat(offer.payout) || 0.50).toFixed(2);
        html += `
          <div style="background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); padding:18px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); transition: transform 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
              <h4 style="color:#fff; margin:0; font-size:15px; flex:1; padding-right:10px;">${offer.title}</h4>
              <span style="background:#22c55e; color:#000; padding:3px 8px; border-radius:20px; font-size:12px; font-weight:bold;">+$${payout}</span>
            </div>
            <p style="color:#aaa; font-size:12px; margin-bottom:15px;">${offer.description || 'Completa esta acción para recibir tu recompensa.'}</p>
            <a href="${offer.offerlink}" target="_blank" 
               onclick="giveCommission(${payout})"
               style="display:block; text-align:center; background:#22c55e; color:#000; padding:10px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px; box-shadow: 0 4px 10px rgba(34,197,94,0.2);">
               ⚡ COMPLETAR AHORA
            </a>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = "<p style='text-align:center; color:#ff4444;'>Error al conectar con el servidor de ofertas.</p>";
    });
};

window.openLocker = () => {
  triggerCPA("1889666");
};

// ============================================
// 🚪 AUTH & INIT
// ============================================

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;
    setupRealtime();
    loadOffers();
    setupActivityLog(); // Iniciamos el log de actividad
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
