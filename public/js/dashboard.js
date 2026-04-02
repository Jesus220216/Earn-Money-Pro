import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc,
  increment, addDoc, collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🎯 DETECTAR REFERIDO (AL INICIO)
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");

if (ref) {
  localStorage.setItem("referrer", ref);
}

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

  await checkSpinLimit();

  // 🔥 CARGAR DATOS DEL USUARIO
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  // 🎰 ACTUALIZAR UI RULETA
  updateSpinUI(data.spins || 0);

  realtimeBalance();
  generateRefLink();
});

// 👤 CREAR USUARIO + REFERIDOS
async function initUser() {
  const referrer = localStorage.getItem("referrer");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0
    });

    // 🎯 sumar contador al referidor
    if (referrer && referrer !== user.uid) {
      await updateDoc(doc(db, "users", referrer), {
        referrals: increment(1)
      });
    }
  }
}

// 🔗 GENERAR LINK REFERIDO
function generateRefLink() {
  const input = document.getElementById("refLink");
  if (input) {
    input.value = `${window.location.origin}?ref=${user.uid}`;
  }
}

// 💰 BALANCE EN TIEMPO REAL + DATOS
function realtimeBalance() {
  const refDoc = doc(db, "users", user.uid);

  onSnapshot(refDoc, (snap) => {
    const data = snap.data() || {};
    const newBalance = data.balance || 0;

    animateBalance(newBalance);

    // 📊 referidos
    if (document.getElementById("refCount")) {
      document.getElementById("refCount").innerText =
        data.referrals || 0;
    }

    if (document.getElementById("refEarn")) {
      document.getElementById("refEarn").innerText =
        (data.referralEarnings || 0).toFixed(2);
    }
  });
}

// 🎯 ANIMACIÓN PRO BALANCE
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
let videosLeft = 6;
let watching = false;
let seconds = 0;
let interval;

window.startVideo = () => {

  if (videosLeft <= 0) {
    showToast("No hay más videos hoy ❌");
    return;
  }

  const video = document.getElementById("videoPlayer");

  seconds = 0;
  watching = true;

  video.currentTime = 0;
  video.play();

  interval = setInterval(() => {

    if (!watching) {
      clearInterval(interval);
      video.pause();
      showToast("Cancelado ❌");
      return;
    }

    seconds++;
    document.getElementById("timerText").innerText =
      seconds + "/20";

    if (seconds >= 20) {
      clearInterval(interval);

      videosLeft--;
      document.getElementById("videosLeft").innerText =
        "Restantes: " + videosLeft;

      video.pause();

      addMoney(0.09);
      showToast("Ganaste $0.09 🎥");
    }

  }, 1000);
};

// ⛔ detectar cambio de pestaña
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    watching = false;
  }
});

// ⛔ detectar pausa manual
document.getElementById("videoPlayer").addEventListener("pause", () => {
  if (seconds < 20) {
    watching = false;
  }
});

// ❌ DETECTAR SI SALE
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    watching = false;
  }
});

// 📋 TIMEWALL
window.survey = () => {
  window.open(`https://timewall.io/wall?uid=${user.uid}`, "_blank");
};

// 🧩 CPX
window.task = () => {
  window.open(`https://offers.cpx-research.com/index.php?app_id=TU_APP_ID&ext_user_id=${user.uid}`, "_blank");
};

// 🎁 LOOTABLY
window.lootably = () => {
  const win = window.open(
    `https://wall.lootably.com/?placement=TU_PLACEMENT_ID&uid=${user.uid}`,
    "_blank"
  );

  if (!win) {
    showToast("Activa ventanas emergentes ⚠️");
  }
};

// 🎮 JUEGO
window.game = () => {
  let reward = Math.random() < 0.7 ? 0.01 : 0.05;

  addMoney(reward);
  showToast("Ganaste $" + reward.toFixed(2) + " 🎮");
};
// 🎁 DAILY REWARD
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data().lastDaily || 0;

  const now = Date.now();

  if (now - last < 86400000) {
    showToast("Ya reclamaste hoy ❌");
    return;
  }

  await updateDoc(ref, {
    lastDaily: now,
    balance: increment(0.20)
  });

  showToast("Ganaste $0.20 🎁");
};

window.spin = async () => {

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  const today = new Date().toDateString();

  if (data.spinDate !== today) {
    await updateDoc(ref, { spinDate: today, spins: 0 });
  }

  const spins = data.spins || 0;

  if (spins >= 10) {
    showToast("Límite diario alcanzado ❌");
    return;
  }

  await updateDoc(ref, {
    spins: increment(1)
  });

  // 🎡 ANIMACIÓN
  const wheel = document.getElementById("wheel");
  const deg = Math.floor(Math.random() * 360) + 1080;
  wheel.style.transform = `rotate(${deg}deg)`;

  document.getElementById("spinStatus").innerText = "Girando...";

  // 💰 PREMIOS (balanceados)
  const rewards = [
    0.01, 0.01, 0.02, 0.02,
    0.05, 0.01, 0.10 // raro
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(() => {
    addMoney(reward);

    document.getElementById("spinStatus").innerText =
      "Ganaste $" + reward.toFixed(2) + " 🎉";

    showToast("+" + reward.toFixed(2) + " 💰");

    updateSpinUI(spins + 1);

  }, 2000);
};

// 💰 SUMAR DINERO
async function addMoney(amount) {

  // 🧠 ANTIFRAUDE
  if (amount > 0.5) {
    console.warn("Intento sospechoso bloqueado");
    return;
  }

  await setDoc(doc(db, "users", user.uid), {
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

  if (amount < 5) {
    showToast("Mínimo retiro $5 ❌");
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

// 🔔 TOAST
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
// 📊 UI RULETA PRO
function updateSpinUI(spins) {
  const max = 10;

  document.getElementById("spinCount").innerText =
    spins + " / " + max + " giros";

  const percent = (spins / max) * 100;

  document.getElementById("spinFill").style.width =
    percent + "%";
}
// 🧠 RESET LÍMITE DIARIO RULETA
async function checkSpinLimit() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const data = snap.data() || {};
  const today = new Date().toDateString();

  if (data.spinDate !== today) {
    await updateDoc(ref, {
      spinDate: today,
      spins: 0
    });
  }
}
