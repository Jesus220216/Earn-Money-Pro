// ============================================
// EarnPro Dashboard - JavaScript Mejorado
// Integración con Firebase + UI Profesional
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

// VARIABLES GLOBALES
let user;
let balance = 0;
let videosLeft = 0;

// ============================================
// 🔥 ANUNCIO
// ============================================
function openAd() {
  window.open(LINK, "_blank");
}

// ============================================
// LOGIN - AUTENTICACIÓN
// ============================================
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await resetDaily();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// ============================================
// 🧠 CREAR USUARIO + REFERIDOS
// ============================================
async function initUser() {
  const referrer = new URLSearchParams(window.location.search).get("ref");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 1,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      spins: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString(),
      todayEarnings: 0,
      todayDate: new Date().toDateString()
    });

    // Bonus inicial
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    // REFERIDO
    if (referrer && referrer !== user.uid) {
      const refUser = doc(db, "users", referrer);
      const refSnap = await getDoc(refUser);

      if (refSnap.exists()) {
        await updateDoc(refUser, {
          referrals: increment(1),
          referralEarnings: increment(0.5),
          balance: increment(0.5)
        });
      }
    }
  }
}

// ============================================
// RESET DIARIO
// ============================================
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
      todayEarnings: 0,
      todayDate: today
    });
    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;
}

// ============================================
// 💰 BALANCE EN TIEMPO REAL
// ============================================
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};

    // 💰 BALANCE TOTAL
    balance = data.balance || 0;
    document.getElementById("balance").innerText = "$" + balance.toFixed(2);

    // 👥 REFERIDOS
    document.getElementById("refCount").innerText = data.referrals || 0;

    // 📅 GANADO HOY
    const todayDate = new Date().toDateString();

    if (data.todayDate !== todayDate) {
      // Reset automático diario
      updateDoc(doc(db, "users", user.uid), {
        todayEarnings: 0,
        todayDate: todayDate
      });
    }

    const today = data.todayEarnings || 0;
    document.getElementById("todayEarnings").innerText = "$" + today.toFixed(2);

    // 🎥 VIDEOS VISTOS HOY
    const videosWatched = 6 - (data.videosLeft || 0);
    document.getElementById("videos").innerText = videosWatched;
  });
}

// ============================================
// 🎥 VER VIDEO
// ============================================
window.startVideo = async () => {
  if (videosLeft <= 0) {
    showToast("No hay videos disponibles hoy ❌");
    return;
  }

  const video = document.getElementById("videoPlayer");
  video.src = "https://www.w3schools.com/html/mov_bbb.mp4";
  video.play();

  openAd();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.02),
      videosLeft: increment(-1),
      todayEarnings: increment(0.02)
    });
    videosLeft--;
    document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;

    showToast("Ganaste $0.02 🎥");
  }, 10000);
};

function loadMonetizationScript() {
  // Evita doble carga
  if (window.scriptLoaded) return;
  if (document.querySelector('script[data-monetization="true"]')) return;

  const s = document.createElement("script");
  s.src = "https://playabledownloads.com/script_include.php?id=1889113";
  s.async = true;
  s.setAttribute("data-monetization", "true");

  (document.body || document.head).appendChild(s);

  window.scriptLoaded = true;
}

function goToOffer(uid) {
  const link = `https://omg10.com/4/10751693?uid=${uid}`;
  window.open(link, "_blank");
}

window.openBox = async () => {
  const user = auth.currentUser;

  if (!user) {
    showToast("Inicia sesión");
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();

  const now = Date.now();
  const last = data?.lastBox || 0;

 // ⏳ 15 MINUTOS
  if (now - last < 900000) {
    const min = Math.ceil((900000 - (now - last)) / 60000);
    showToast(`Espera ${min} min ⏳`);
    return;
  }

  // 🔗 SOLO CPA (SIN SCRIPT ROTO)
  goToOffer(user.uid);

  await updateDoc(ref, {
    lastBox: now
  });

  showToast("Completa la oferta 🎁");
};
// ============================================
// 🎰 RULETA CON ANIMACIÓN
// ============================================
window.spin = async () => {
  const wheel = document.getElementById("wheel");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let spins = snap.data()?.spins || 0;

  if (spins >= 10) {
    showToast("Límite alcanzado hoy ❌");
    return;
  }

  spins++;
  await updateDoc(ref, { spins });

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const index = Math.floor(Math.random() * rewards.length);
  const reward = rewards[index];

  // 🎡 ANIMACIÓN
  const deg = 360 * 5 + (index * (360 / rewards.length));
  wheel.style.transform = `rotate(${deg}deg)`;

  openAd();

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });

      showToast(`Ganaste $${reward.toFixed(2)} 🎰`);
    }

    if (spins === 10) {
      await updateDoc(ref, {
        balance: increment(1),
        todayEarnings: increment(1)
      });

      showToast("BONUS $1 🔥");
    }
  }, 4000);
};

// ============================================
// 🎮 JUEGO REAL + DINERO
// ============================================
window.playGame = async () => {
  openAd();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    showToast("Ganaste $0.05 🎮");
  }, 15000);
};

// ============================================
// 🎁 DAILY BONUS
// ============================================
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const lastDaily = snap.data()?.lastDaily || 0;

  if (Date.now() - lastDaily < 86400000) {
    showToast("Ya reclamaste hoy ❌");
    return;
  }

  openAd();

  setTimeout(async () => {
    await updateDoc(ref, {
      balance: increment(0.2),
      lastDaily: Date.now(),
      todayEarnings: increment(0.2)
    });

    showToast("Ganaste $0.20 🎁");
  }, 10000);
};

// ============================================
// 💳 RETIRO
// ============================================
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  // Validaciones
  if (!email || !email.includes("@")) {
    showToast("Email inválido ❌");
    return;
  }

  if (isNaN(amount) || amount < 5) {
    showToast("Mínimo $5 ❌");
    return;
  }

  if (amount > balance) {
    showToast("Saldo insuficiente ❌");
    return;
  }

  try {
    // Crear documento de retiro
    await addDoc(collection(db, "withdrawals"), {
      userId: user.uid,
      amount,
      email,
      status: "pending",
      date: Date.now()
    });

    // Descontar del balance
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(-amount)
    });

    // Limpiar formulario
    document.getElementById("amount").value = "";
    document.getElementById("email").value = "";

    showToast("Retiro enviado 🚀");
  } catch (error) {
    console.error("Error en retiro:", error);
    showToast("Error al procesar retiro ❌");
  }
};

// ============================================
// HISTORIAL DE RETIROS
// ============================================
function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    let hasWithdrawals = false;

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      hasWithdrawals = true;

      const statusEmoji = w.status === "completed" ? "✅" : w.status === "pending" ? "⏳" : "❌";
      const statusText = w.status === "completed" ? "Completado" : w.status === "pending" ? "Pendiente" : "Rechazado";

      div.innerHTML += `
        <div class="activity-item">
          <div class="activity-dot ${w.status === 'completed' ? 'completed' : 'pending'}"></div>
          <div class="activity-info">
            <p class="activity-type">Retiro ${statusEmoji}</p>
            <p class="activity-time">${statusText} - ${new Date(w.date).toLocaleDateString()}</p>
          </div>
          <p class="activity-amount">-$${w.amount.toFixed(2)}</p>
        </div>
      `;
    });

    if (!hasWithdrawals) {
      div.innerHTML = `
        <div class="activity-item">
          <div class="activity-dot completed"></div>
          <div class="activity-info">
            <p class="activity-type">Sin retiros aún</p>
            <p class="activity-time">Realiza tu primer retiro</p>
          </div>
          <p class="activity-amount">$0.00</p>
        </div>
      `;
    }
  });
}

// ============================================
// 🔗 LINK DE REFERIDOS
// ============================================
function generateRefLink() {
  document.getElementById("refLink").value = `${window.location.origin}?ref=${user.uid}`;
}

// ============================================
// 📋 COPIAR LINK
// ============================================
window.copyRef = async () => {
  const text = document.getElementById("refLink").value;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Link copiado ✅");
  } catch (error) {
    console.error("Error al copiar:", error);
    showToast("Error al copiar ❌");
  }
};

// ============================================
// 🔔 NOTIFICACIONES (TOAST)
// ============================================
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.background = "#10B981";
  t.style.color = "white";
  t.style.padding = "12px 16px";
  t.style.borderRadius = "8px";
  t.style.fontWeight = "600";
  t.style.zIndex = "9999";
  t.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
  t.style.fontFamily = "'Poppins', sans-serif";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ============================================
// 🚪 LOGOUT
// ============================================
window.logout = function () {
  signOut(auth)
    .then(() => {
      showToast("Sesión cerrada ✅");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    })
    .catch((error) => {
      console.error("Error:", error);
      showToast("Error al cerrar sesión ❌");
    });
};
