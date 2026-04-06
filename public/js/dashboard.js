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

// VARIABLES
let user;
let balance = 0;
let videosLeft = 0;
let lastAction = 0;

// 🔒 ANTI SPAM
function antiSpam() {
  if (Date.now() - lastAction < 3000) return false;
  lastAction = Date.now();
  return true;
}

// 🔥 ANUNCIO
function openAd() {
  window.open(LINK, "_blank");
}

// LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await resetDaily();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// 🧠 CREAR USUARIO + REFERIDO
async function initUser() {
  const referrer = new URLSearchParams(window.location.search).get("ref");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 0.50,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      spins: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString()
    });

    // ✅ SUMAR REFERIDO
    if (referrer && referrer !== user.uid) {
      const refUser = doc(db, "users", referrer);

      await updateDoc(refUser, {
        referrals: increment(1),
        referralEarnings: increment(0.50),
        balance: increment(0.50)
      });
    }
  }
}

// 🔄 RESET DIARIO
async function resetDaily() {
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

// 💰 BALANCE
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

// 🎮 JUEGO
window.playGame = async () => {
  if (!antiSpam()) return showToast("Espera ⏳");

  openAd();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.10)
    });

    showToast("Ganaste $0.10 🎮");
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

  spins++;
  await updateDoc(ref, { spins });

  openAd();

  const rewards = [0.01, 0.02, 0.05, 0.1, 0];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward)
      });
      showToast(`Ganaste $${reward}`);
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
      balance: increment(0.20),
      lastDaily: Date.now()
    });

    showToast("Ganaste $0.20 🎁");
  }, 10000);
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

// 📜 HISTORIAL
function loadWithdrawals() {
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      div.innerHTML += `
        <div style="padding:10px;background:#1f1f1f;margin:5px;border-radius:10px;">
          💰 $${w.amount} - ${w.status}
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

// 📋 COPIAR
window.copyRef = async () => {
  const text = document.getElementById("refLink").value;

  await navigator.clipboard.writeText(text);
  showToast("Copiado ✅");
};

// 🔔 TOAST
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
