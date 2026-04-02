import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc,
  increment, addDoc, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 REFERIDO
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");
if (ref) localStorage.setItem("referrer", ref);

let user;
let balance = 0;

// 🎥 VIDEO GLOBAL
const videos = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4"
];

let videoIndex = 0;
let videosLeft = 0;
let watching = false;
let seconds = 0;
let interval;
let lastVideoTime = 0;

// 🔐 LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await checkSpinLimit();
  await checkVideoLimit();

  const snap = await getDoc(doc(db, "users", user.uid));
  updateSpinUI(snap.data()?.spins || 0);

  realtimeBalance();
});

// 👤 USER
async function initUser() {
  const referrer = localStorage.getItem("referrer");
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,

      // 🎥 VIDEO SYSTEM
      videosLeft: 6,
      videoDate: new Date().toDateString(),

      // 🎰 RULETA
      spins: 0,
      spinDate: new Date().toDateString()
    });

    if (referrer && referrer !== user.uid) {
      await updateDoc(doc(db, "users", referrer), {
        referrals: increment(1)
      });
    }
  }
}

// 💰 BALANCE
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    animateBalance(data.balance || 0);

    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("refEarn").innerText =
      (data.referralEarnings || 0).toFixed(2);
  });
}

function animateBalance(newValue) {
  balance = newValue;

  document.getElementById("balance").innerText =
    "$" + newValue.toFixed(2);

  document.querySelector(".balance-mini").innerText =
    "$" + newValue.toFixed(2);
}

// 🎥 VIDEO
window.startVideo = async () => {

  if (Date.now() - lastVideoTime < 10000) {
    showToast("Espera ⏳");
    return;
  }

  if (videosLeft <= 0) {
    showToast("No hay más videos ❌");
    return;
  }

  lastVideoTime = Date.now();

  const video = document.getElementById("videoPlayer");

  video.src = videos[videoIndex];
  video.load();
  video.play().catch(() => {
    showToast("Toca el video ▶️");
  });

  watching = true;
  seconds = 0;

  interval = setInterval(async () => {

    if (!watching) {
      clearInterval(interval);
      video.pause();
      return;
    }

    seconds++;

    document.getElementById("timerText").innerText =
      seconds + "/10";

    if (seconds >= 10) {
      clearInterval(interval);
      video.pause();

      addMoney(0.09);
      showToast("Ganaste $0.09 🎥");

      videosLeft--;
      videoIndex = (videoIndex + 1) % videos.length;

      await updateDoc(doc(db, "users", user.uid), {
        videosLeft: videosLeft
      });

      document.getElementById("videosLeft").innerText =
        "Restantes: " + videosLeft;
    }

  }, 1000);
};

// ⛔ seguridad video
document.addEventListener("visibilitychange", () => {
  if (document.hidden) watching = false;
});

// 📋 ENCUESTAS
window.survey = () => {
  window.open(`https://timewall.io/wall?uid=${user.uid}`, "_blank");
};

// 🎁 LOOTABLY
window.lootably = () => {
  window.open(`https://wall.lootably.com/?placement=TU_ID&uid=${user.uid}`, "_blank");
};

// 🎮 JUEGO
window.game = () => {
  const reward = Math.random() < 0.7 ? 0.01 : 0.05;
  addMoney(reward);
  showToast("Ganaste $" + reward.toFixed(2));
};

// 🎁 DAILY
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const last = snap.data().lastDaily || 0;

  if (Date.now() - last < 86400000) {
    showToast("Ya reclamaste ❌");
    return;
  }

  await updateDoc(ref, {
    lastDaily: Date.now(),
    balance: increment(0.20)
  });

  showToast("Ganaste $0.20 🎁");
};

// 🎰 RULETA
window.spin = async () => {

  const wheel = document.getElementById("wheel");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  if ((data.spins || 0) >= 10) {
    showToast("Límite alcanzado ❌");
    return;
  }

  await updateDoc(ref, { spins: increment(1) });

  const deg = Math.floor(3600 + Math.random() * 1000);
  wheel.style.transform = `rotate(${deg}deg)`;

  const reward = [0.01, 0.02, 0.05][Math.floor(Math.random() * 3)];

  setTimeout(() => {
    addMoney(reward);
    showToast("Ganaste $" + reward + " 🎰");
    updateSpinUI((data.spins || 0) + 1);
  }, 3000);
};

// 💰 ADD MONEY
async function addMoney(amount) {
  if (amount > 0.5) return;

  await setDoc(doc(db, "users", user.uid), {
    balance: increment(amount)
  }, { merge: true });
}

// 💳 RETIRO
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);

  if (!amount || amount <= 0) return showToast("Monto inválido");
  if (amount > balance) return showToast("Saldo insuficiente");

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    amount,
    date: Date.now()
  });

  showToast("Retiro enviado");
};

// 🚪 LOGOUT
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// 🎰 UI
function updateSpinUI(spins) {
  document.getElementById("spinCount").innerText =
    spins + " / 10 giros";
}

// 🔄 RESET RULETA
async function checkSpinLimit() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const today = new Date().toDateString();

  if (snap.data()?.spinDate !== today) {
    await updateDoc(ref, { spinDate: today, spins: 0 });
  }
}

// 🎥 RESET VIDEO
async function checkVideoLimit() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const data = snap.data() || {};
  const today = new Date().toDateString();

  if (data.videoDate !== today) {
    await updateDoc(ref, {
      videosLeft: 6,
      videoDate: today
    });

    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText =
    "Restantes: " + videosLeft;
}

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
  t.style.fontWeight = "bold";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
