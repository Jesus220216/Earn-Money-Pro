import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

let user;
let balance = 0;
let lastWithdraw = 0;
let lastVideoTime = 0;
let videosLeft = 0;

// 🔥 ANUNCIO SEGURO
function openAd() {
  if (window.lastAd && Date.now() - window.lastAd < 5000) return;
  window.lastAd = Date.now();
  window.open(LINK, "_blank");
}

// LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await checkSpinLimit();
  await checkVideoLimit();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// INIT USER
async function initUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get("ref");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      videoDate: new Date().toDateString(),
      spins: 0,
      spinDate: new Date().toDateString(),
      lastDaily: 0
    });

    // 🔥 SUMAR REFERIDO
    if (referrer && referrer !== user.uid) {
      try {
        const refUser = doc(db, "users", referrer);
        const refSnap = await getDoc(refUser);

        if (refSnap.exists()) {
          await updateDoc(refUser, {
            referrals: increment(1),
            referralEarnings: increment(0.50),
            balance: increment(0.50)
          });

          console.log("Referido sumado ✅");
        }
      } catch (e) {
        console.log("Error ref:", e);
      }
    }
  }
}

// BALANCE
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    balance = data.balance || 0;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);

    document.getElementById("refCount").innerText = data.referrals || 0;

document.getElementById("refEarn").innerText =
  (data.referralEarnings || 0).toFixed(2);

    const spins = data.spins || 0;
    const left = 10 - spins;

    document.getElementById("spinCount").innerText =
      `${spins}/10 (te quedan ${left})`;
  });
}

// 🎮 JUEGOS
window.playGame = async () => {
  if (!user) return;

  openAd();

  let today = new Date().toDateString();
  let data = JSON.parse(localStorage.getItem("games")) || { date: today, count: 0 };

  if (data.date !== today) data = { date: today, count: 0 };

  if (data.count >= 10)
    return showToast("Límite diario alcanzado ❌");

  data.count++;
  localStorage.setItem("games", JSON.stringify(data));

  document.getElementById("gameCount").innerText =
    `${data.count} / 10`;

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.10)
    });

    showToast("Ganaste $0.10 🎮");
  }, 20000);
};

// 🎰 RULETA
window.spin = async () => {
  openAd();

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let spins = snap.data()?.spins || 0;

  if (spins >= 10)
    return showToast("Límite alcanzado ❌");

  spins++;
  await updateDoc(ref, { spins });

  const rewards = [0.01, 0.02, 0.05, 0.10, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward)
      });

      showToast(`Ganaste $${reward} 🎰`);
    } else {
      showToast("Sigue intentando 😅");
    }

    if (spins === 10) {
      await updateDoc(ref, {
        balance: increment(1)
      });

      showToast("🎁 BONUS $1 🔥");
    }

  }, 3000);
};

// 🎁 DAILY
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000)
    return showToast("Ya reclamaste hoy ❌");

  openAd();

  setTimeout(async () => {
    await updateDoc(ref, {
      balance: increment(0.20),
      lastDaily: Date.now()
    });

    showToast("Ganaste $0.20 🎁");
  }, 15000);
};

// 🎥 VIDEO
window.startVideo = async () => {
  if (videosLeft <= 0)
    return showToast("No hay más videos ❌");

  openAd();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.03),
      videosLeft: increment(-1)
    });

    videosLeft--;

    document.getElementById("videosLeft").innerText =
      "Restantes: " + videosLeft;

    showToast("Ganaste $0.03 🎥");
  }, 10000);
};

// 💳 RETIRO
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (amount < 5) return showToast("Mínimo $5 ❌");
  if (amount > balance) return showToast("Saldo insuficiente ❌");

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

// HISTORIAL
function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      div.innerHTML += `
        <div style="margin:10px;padding:10px;background:#1f1f1f;border-radius:10px;">
          💰 $${w.amount} <br>
          📊 ${w.status}
        </div>
      `;
    });
  });
}

// RESET
async function checkSpinLimit() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const today = new Date().toDateString();

  if (snap.data()?.spinDate !== today)
    await updateDoc(ref, { spinDate: today, spins: 0 });
}

async function checkVideoLimit() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const today = new Date().toDateString();

  if (data.videoDate !== today) {
    await updateDoc(ref, { videosLeft: 6, videoDate: today });
    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText =
    "Restantes: " + videosLeft;
}

// REF LINK
function generateRefLink() {
  document.getElementById("refLink").value =
    `${window.location.origin}?ref=${user.uid}`;
}

// TOAST
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.background = "#22c55e";
  t.style.padding = "10px";
  t.style.borderRadius = "10px";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// LOGOUT
import { auth, db } from "./firebase.js";
import { 
  onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { 
  doc, getDoc, setDoc, updateDoc, increment, 
  addDoc, collection, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

// 🧠 VARIABLES
let user;
let balance = 0;
let videosLeft = 0;
let lastAction = 0;

// 🔒 ANTI SPAM
function antiSpam() {
  if (Date.now() - lastAction < 4000) return false;
  lastAction = Date.now();
  return true;
}

// 🔥 ABRIR ANUNCIO (CONTROLADO)
function openAd() {
  if (window.lastAd && Date.now() - window.lastAd < 5000) return false;
  window.lastAd = Date.now();
  window.open(LINK, "_blank");
  return true;
}

// LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await resetDailyLimits();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// 🧠 CREAR USUARIO + REFERIDOS
async function initUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get("ref");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 1, // 🎁 bono registro
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      spins: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString()
    });

    // 🔥 REFERIDO
    if (referrer && referrer !== user.uid) {
      try {
        const refUser = doc(db, "users", referrer);
        const refSnap = await getDoc(refUser);

        if (refSnap.exists()) {
          await updateDoc(refUser, {
            referrals: increment(1),
            referralEarnings: increment(0.5),
            balance: increment(0.5)
          });
        }
      } catch {}
    }
  }
}

// 🔄 RESET DIARIO
async function resetDailyLimits() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastReset !== today) {
    await updateDoc(ref, {
      videosLeft: 6,
      spins: 0,
      lastReset: today
    });
    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText =
    "Restantes: " + videosLeft;
}

// 💰 BALANCE REALTIME
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    balance = data.balance || 0;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("refEarn").innerText =
      (data.referralEarnings || 0).toFixed(2);

    document.getElementById("spinCount").innerText =
      `${data.spins || 0}/10`;
  });
}

// 🎮 JUGAR
window.playGame = async () => {
  if (!antiSpam()) return showToast("Espera ⏳");

  if (!openAd()) return;

  let start = Date.now();

  setTimeout(async () => {
    if (Date.now() - start < 15000) return;

    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05)
    });

    showToast("Ganaste $0.05 🎮");
  }, 15000);
};

// 🎰 RULETA
window.spin = async () => {
  if (!antiSpam()) return showToast("Espera ⏳");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let spins = snap.data()?.spins || 0;

  if (spins >= 10)
    return showToast("Límite alcanzado ❌");

  openAd();

  spins++;

  await updateDoc(ref, { spins });

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward)
      });
      showToast(`Ganaste $${reward} 🎰`);
    } else {
      showToast("Nada 😅");
    }

    if (spins === 10) {
      await updateDoc(ref, {
        balance: increment(1)
      });
      showToast("BONUS $1 🔥");
    }

  }, 3000);
};

// 🎁 DAILY
window.daily = async () => {
  if (!antiSpam()) return showToast("Espera ⏳");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000)
    return showToast("Ya reclamaste ❌");

  openAd();

  setTimeout(async () => {
    await updateDoc(ref, {
      balance: increment(0.2),
      lastDaily: Date.now()
    });

    showToast("Ganaste $0.20 🎁");
  }, 10000);
};

// 🎥 VIDEO
window.startVideo = async () => {
  if (!antiSpam()) return showToast("Espera ⏳");

  if (videosLeft <= 0)
    return showToast("No hay más videos ❌");

  openAd();

  let start = Date.now();

  setTimeout(async () => {
    if (Date.now() - start < 10000) return;

    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.02),
      videosLeft: increment(-1)
    });

    videosLeft--;

    document.getElementById("videosLeft").innerText =
      "Restantes: " + videosLeft;

    showToast("Ganaste $0.02 🎥");
  }, 10000);
};

// 💳 RETIRO SEGURO
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!email.includes("@"))
    return showToast("Email inválido ❌");

  if (amount < 5)
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

// 📊 HISTORIAL
function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      div.innerHTML += `
        <div style="margin:10px;padding:10px;background:#1f1f1f;border-radius:10px;">
          💰 $${w.amount} <br>
          📊 ${w.status}
        </div>
      `;
    });
  });
}

// 🔗 REFERIDOS
function generateRefLink() {
  document.getElementById("refLink").value =
    `${window.location.origin}?ref=${user.uid}`;
}

// 📢 TOAST
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.background = "#22c55e";
  t.style.padding = "10px";
  t.style.borderRadius = "10px";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// 🚪 LOGOUT
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// 📋 COPIAR LINK
window.copyRef = async () => {
  const text = document.getElementById("refLink").value;

  try {
    await navigator.clipboard.writeText(text);
    showToast("Link copiado ✅");
  } catch {
    showToast("Error ❌");
  }
};
