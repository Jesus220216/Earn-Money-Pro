// ============================================
// EarnPro Dashboard - JavaScript PRO FINAL
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

// ⏳ 15 MINUTOS
const COOLDOWN = 900000;

// VARIABLES
let user;
let balance = 0;
let videosLeft = 0;
let timerInterval = null;

// ============================================
// 🔥 ANUNCIO
// ============================================
function openAd() {
  window.open(LINK, "_blank");
}

// ============================================
// LOGIN
// ============================================
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await resetDaily();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
  initBoxTimer();
});

// ============================================
// CREAR USUARIO
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
      lastBox: 0,
      lastReset: new Date().toDateString(),
      todayEarnings: 0,
      todayDate: new Date().toDateString()
    });

    await updateDoc(refDoc, {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    // REFERIDOS
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
// BALANCE REALTIME
// ============================================
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};

    balance = data.balance || 0;
    document.getElementById("balance").innerText = "$" + balance.toFixed(2);

    document.getElementById("refCount").innerText = data.referrals || 0;

    const today = data.todayEarnings || 0;
    document.getElementById("todayEarnings").innerText = "$" + today.toFixed(2);

    const videosWatched = 6 - (data.videosLeft || 0);
    document.getElementById("videos").innerText = videosWatched;
  });
}

// ============================================
// 🎥 VIDEO
// ============================================
window.startVideo = async () => {
  if (videosLeft <= 0) {
    showToast("No hay videos hoy ❌");
    return;
  }

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

// ============================================
// 🔗 CPA
// ============================================
function goToOffer(uid) {
  window.open(`${LINK}?uid=${uid}`, "_blank");
}

// ============================================
// 🎁 OPEN BOX PRO
// ============================================
window.openBox = async () => {
  if (!user) return showToast("Inicia sesión");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();

  const now = Date.now();
  const last = data?.lastBox || 0;

  if (now - last < COOLDOWN) {
    showToast("Espera ⏳");
    startBoxTimer(last);
    return;
  }

  goToOffer(user.uid);

  await updateDoc(ref, {
    lastBox: now
  });

  startBoxTimer(now);

  showToast("Completa la oferta 🎁");
};

// ============================================
// ⏳ TIMER PRO
// ============================================
function startBoxTimer(lastTime) {
  const el = document.getElementById("boxTimer");
  if (!el) return;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const now = Date.now();
    const remaining = COOLDOWN - (now - lastTime);

    if (remaining <= 0) {
      el.innerText = "Disponible 🎁";
      el.style.color = "#10B981";
      clearInterval(timerInterval);
      return;
    }

    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);

    el.innerText = `Disponible en ${min}:${sec.toString().padStart(2, "0")}`;
    el.style.color = "#EF4444";

  }, 1000);
}

// ============================================
// INIT TIMER
// ============================================
async function initBoxTimer() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();

  startBoxTimer(data?.lastBox || 0);
}

// ============================================
// 🎰 RULETA
// ============================================
window.spin = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let spins = snap.data()?.spins || 0;

  if (spins >= 10) return showToast("Límite ❌");

  spins++;
  await updateDoc(ref, { spins });

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  openAd();

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });

      showToast(`Ganaste $${reward.toFixed(2)} 🎰`);
    }
  }, 4000);
};

// ============================================
// 💳 RETIRO
// ============================================
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!email.includes("@")) return showToast("Email inválido");
  if (amount < 5) return showToast("Mínimo $5");
  if (amount > balance) return showToast("Sin saldo");

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
// HISTORIAL
// ============================================
function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      div.innerHTML += `<p>-$${w.amount} (${w.status})</p>`;
    });
  });
}

// ============================================
// REF
// ============================================
function generateRefLink() {
  document.getElementById("refLink").value = `${window.location.origin}?ref=${user.uid}`;
}

// ============================================
// TOAST
// ============================================
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.background = "#10B981";
  t.style.color = "white";
  t.style.padding = "10px";
  t.style.borderRadius = "6px";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ============================================
// LOGOUT
// ============================================
window.logout = () => signOut(auth);
