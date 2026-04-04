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

// 💰 MONETAG
let lastAdTime = 0;
function openAdSafe() {
  if (Date.now() - lastAdTime < 30000) return;
  lastAdTime = Date.now();
  window.open("https://omg10.com/4/10828691", "_blank");
}

// 🔐 ANTI SPAM RETIRO
let lastWithdraw = 0;

// 🎥 VIDEO
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
  loadWithdrawals();
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
      videosLeft: 6,
      videoDate: new Date().toDateString(),
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
    balance = data.balance || 0;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.querySelector(".balance-mini").innerText = "$" + balance.toFixed(2);

    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("refEarn").innerText =
      (data.referralEarnings || 0).toFixed(2);
  });
}

// 🎥 VIDEO
window.startVideo = async () => {

  if (Date.now() - lastVideoTime < 10000) {
    return showToast("Espera ⏳");
  }

  if (videosLeft <= 0) {
    return showToast("No hay más videos ❌");
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
    document.getElementById("timerText").innerText = seconds + "/10";

    if (seconds >= 10) {
      clearInterval(interval);
      video.pause();

      openAdSafe(); // 💰 ANUNCIO SOLO CUANDO TERMINA (MEJOR CONVERSIÓN)

      await addMoney(0.03);
      showToast("Ganaste $0.03 🎥");

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

// 🎮 JUEGO
window.game = () => {
  openAdSafe();
  const reward = Math.random() < 0.7 ? 0.01 : 0.05;
  addMoney(reward);
  showToast("Ganaste $" + reward.toFixed(2));
};

// 🎰 RULETA
window.spin = async () => {

  openAdSafe();

  const wheel = document.getElementById("wheel");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  if ((data.spins || 0) >= 10) {
    return showToast("Límite alcanzado ❌");
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

  if (Date.now() - lastWithdraw < 10000) {
    return showToast("Espera ⏳");
  }
  lastWithdraw = Date.now();

  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!amount || amount <= 0) return showToast("Monto inválido ❌");
  if (amount < 5) return showToast("Mínimo $5 ❌");
  if (amount > balance) return showToast("Saldo insuficiente ❌");

  try {
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

  } catch (e) {
    console.error(e);
    showToast("Error ❌");
  }
};

// 📜 HISTORIAL
function loadWithdrawals() {
  const q = collection(db, "withdrawals");

  onSnapshot(q, (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu => {
      const w = docu.data();
      if (w.userId !== user.uid) return;

      let color = "orange";
      if (w.status === "approved") color = "#22c55e";
      if (w.status === "rejected") color = "#ef4444";

      div.innerHTML += `
        <div style="margin:10px;padding:10px;background:#1f1f1f;border-radius:10px;">
          💰 $${w.amount} <br>
          📧 ${w.email || "-"} <br>
          📊 <span style="color:${color}">${w.status}</span>
        </div>
      `;
    });
  });
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
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
