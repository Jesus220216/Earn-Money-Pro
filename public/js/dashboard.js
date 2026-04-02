import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc,
  increment, addDoc, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let user;
let balance = 0;

// 🔐 LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await initUser();
  realtimeBalance(); // 🔥 tiempo real
});

// 👤 CREAR USUARIO
async function initUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { balance: 0 });
  }
}

// 💰 BALANCE EN TIEMPO REAL + ANIMADO
function realtimeBalance() {
  const ref = doc(db, "users", user.uid);

  onSnapshot(ref, (snap) => {
    const newBalance = snap.data()?.balance || 0;
    animateBalance(newBalance);
  });
}

// 🎯 ANIMACIÓN PRO
function animateBalance(newValue) {
  let start = balance;
  let end = newValue;
  let step = (end - start) / 20;
  let i = 0;

  let interval = setInterval(() => {
    start += step;

    document.getElementById("balance").innerText =
      "$" + start.toFixed(2);

    document.querySelector(".balance-mini").innerText =
      "$" + start.toFixed(2);

    i++;
    if (i >= 20) {
      clearInterval(interval);
      balance = end;
    }
  }, 25);
}

// 🎥 VIDEO
let t = 0, interval;

window.startVideo = () => {
  t = 0;

  interval = setInterval(() => {
    t++;

    document.getElementById("timerText").innerText = t + "/20";

    if (t >= 20) {
      clearInterval(interval);
      addMoney(0.02);
      showToast("Ganaste $0.02 💰");
    }
  }, 1000);
};

// 🎯 TIMEWALL (OFERTAS REALES)
window.offerwall = () => {
  if (!user) {
    alert("Usuario no cargado");
    return;
  }

  const win = window.open(`https://timewall.io/wall?uid=${user.uid}`, "_blank");

  if (!win) {
    alert("Activa las ventanas emergentes ⚠️");
  }
};

// 🧩 TAREA
window.task = () => {
  addMoney(0.15);
  showToast("Ganaste $0.15 💰");
};

// 🎮 JUEGO
window.game = () => {
  let reward = Math.random() < 0.7 ? 0.01 : 0.05;

  addMoney(reward);
  showToast("Ganaste $" + reward.toFixed(2) + " 🎮");
};

// 🎯 LOOTABLY OFFERWALL
window.lootably = () => {
  const url = `https://wall.lootably.com/?placement=TU_PLACEMENT_ID&uid=${user.uid}`;
  const win = window.open(url, "_blank");

  if (!win) {
    alert("Activa las ventanas emergentes ⚠️");
  }
};

// 💰 SUMAR DINERO (FIX PRO)
async function addMoney(amount) {
  const ref = doc(db, "users", user.uid);

  await setDoc(ref, {
    balance: increment(amount)
  }, { merge: true });
}

// 💳 RETIRO
window.withdraw = async () => {
  const email = document.getElementById("email").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if (!amount || amount <= 0) {
    showToast("Monto inválido ❌");
    return;
  }

  if (amount > balance) {
    showToast("Saldo insuficiente ❌");
    return;
  }

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    email,
    amount,
    status: "pending",
    date: Date.now()
  });

  showToast("Retiro enviado 🚀");
};

// 🚪 LOGOUT
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// 🔥 👇 PONLO AQUÍ AL FINAL
window.addEventListener("focus", () => {
  loadBalance();
});

// 🔔 TOAST PRO (sin alert)
function showToast(msg) {
  const toast = document.createElement("div");

  toast.innerText = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#22c55e";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "10px";
  toast.style.color = "black";
  toast.style.fontWeight = "bold";
  toast.style.zIndex = "999";

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}
