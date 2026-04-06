import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// REF
const urlParams = new URLSearchParams(window.location.search);
const refParam = urlParams.get("ref");
if (refParam) sessionStorage.setItem("referrer", refParam);

let user;
let balance = 0;
let lastWithdraw = 0;
let lastVideoTime = 0;
let currentRotation = 0;
let videosLeft = 0;
let userEarnings = 0;

// 🔗 TU LINK (EDITA SI QUIERES)
const LINK = "https://omg10.com/4/10751693";

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
  const referrer = sessionStorage.getItem("referrer");
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
  }
}

// BALANCE REALTIME
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};
    balance = data.balance || 0;

    const spins = data.spins || 0;
const left = 10 - spins;

document.getElementById("spinCount").innerText =
  `${spins}/10 giros (te quedan ${left})`;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.querySelector(".balance-mini").innerText = "$" + balance.toFixed(2);

    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("refEarn").innerText =
      (data.referralEarnings || 0).toFixed(2);
  });
}

// 🎥 VIDEO
window.startVideo = async () => {
  if (Date.now() - lastVideoTime < 10000)
    return showToast("Espera ⏳");

  if (videosLeft <= 0)
    return showToast("No hay más videos ❌");

  lastVideoTime = Date.now();

  const video = document.getElementById("videoPlayer");
  video.src = "https://www.w3schools.com/html/mov_bbb.mp4";
  video.play();

  let seconds = 0;

  const interval = setInterval(async () => {
    seconds++;
    document.getElementById("timerText").innerText = seconds + "/10";

    if (seconds >= 10) {
      clearInterval(interval);
      video.pause();

      await addMoney(0.03);
      showToast("Ganaste $0.03 🎥");

      videosLeft--;

      await updateDoc(doc(db, "users", user.uid), { videosLeft });

      document.getElementById("videosLeft").innerText =
        "Restantes: " + videosLeft;
    }
  }, 1000);
};

window.openGame = async () => {
  if (!user) return;

  // abre juego real
 window.open("https://omg10.com/4/10751693", "_blank");

  showToast("Juega 20 segundos ⏳");

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.30)
    });

    showToast("Ganaste $0.30 🎮💰");
  }, 20000);
};

// cambiar juego
window.changeGame = (url) => {
  document.getElementById("gameFrame").src = url;
};

// 🎰 RULETA
window.spin = async () => {
  const wheel = document.getElementById("wheel");
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  let spins = data.spins || 0;

  if (spins >= 10)
    return showToast("Límite alcanzado ❌");

  spins++;

  await updateDoc(ref, { spins });

  // 🎯 PREMIOS
  const rewards = [0.01, 0.02, 0.05, 0.10, 0.50, 0];
  const index = Math.floor(Math.random() * rewards.length);
  const reward = rewards[index];

  // 🎡 ROTACIÓN REAL
  const degPerSegment = 360 / rewards.length;
  const finalDeg = (360 * 5) + (index * degPerSegment);

  wheel.style.transform = `rotate(${finalDeg}deg)`;

  // 💸 abrir anuncio
  window.open(LINK, "_blank");

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(ref, {
        balance: increment(reward)
      });

      showToast(`Ganaste $${reward} 🎰`);
    } else {
      showToast("Sigue intentando 😅");
    }

    // 💎 BONUS AL LLEGAR A 10
    if (spins === 10) {
      await updateDoc(ref, {
        balance: increment(1)
      });

      showToast("🎁 BONUS $1 por completar 10 giros 🔥");
    }

  }, 4000);
};

// 🎁 DAILY
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
window.open("https://omg10.com/4/10751693", "_blank");
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000)
    return showToast("Ya reclamaste ❌");

  window.open(LINK, "_blank");

  showToast("Espera 15s ⏳");

  setTimeout(async () => {
    await updateDoc(ref, {
      balance: increment(0.20),
      lastDaily: Date.now()
    });

    showToast("Ganaste $0.20 🎁");
  }, 15000);
};

// 🎮 JUEGOS
window.game = async () => {
  let last = localStorage.getItem("lastGame") || 0;

  if (Date.now() - last < 60000)
    return showToast("Espera 1 minuto ⏳");

  localStorage.setItem("lastGame", Date.now());

  window.open(LINK, "_blank");

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.25)
    });

    showToast("Ganaste $0.25 🎮");
  }, 20000);
};

window.playGame = async () => {
  if (!user) return;

  const today = new Date().toDateString();
  let data = JSON.parse(localStorage.getItem("games")) || {
    date: today,
    count: 0
  };

  if (data.date !== today) data = { date: today, count: 0 };

  if (data.count >= 10)
    return showToast("Límite diario alcanzado ❌");

  data.count++;
  localStorage.setItem("games", JSON.stringify(data));

  updateGameUI(data.count);

  // 🔥 ABRE LINK (DINERO)
  window.open("https://omg10.com/4/10751693", "_blank");

  // 🔥 SEGUNDO TRIGGER (más ingresos)
  setTimeout(() => {
    window.open("https://omg10.com/4/10751693", "_blank");
  }, 3000);

  showToast("Interactúa unos segundos ⏳");

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.10)
    });

    showToast("Ganaste $0.10🎮💰");
  }, 20000);
};

// 💸 OFERTAS
window.offer = async () => {
  window.open(LINK, "_blank");

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.30)
    });

    showToast("Ganaste $0.30 💸");
  }, 20000);
};

// 💰 SUMAR DINERO
async function addMoney(amount) {
  const ref = doc(db, "users", user.uid);

  await setDoc(ref, {
    balance: increment(amount)
  }, { merge: true });
}

// 💳 RETIRO
window.withdraw = async () => {
  if (Date.now() - lastWithdraw < 10000)
    return showToast("Espera ⏳");

  lastWithdraw = Date.now();

  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!amount || amount < 5)
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

// 📜 HISTORIAL
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

// 🔗 REF
function generateRefLink() {
  document.getElementById("refLink").value =
    `${window.location.origin}?ref=${user.uid}`;
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
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// 🎮 JUEGO REAL
window.rewardGame = async () => {
  if (!user) return;

  let today = new Date().toDateString();
  let data = JSON.parse(localStorage.getItem("gameLimit")) || {
    date: today,
    count: 0
  };

  if (data.date !== today) {
    data = { date: today, count: 0 };
  }

  if (data.count >= 10) {
    return showToast("Límite diario alcanzado ❌");
  }

  data.count++;
  localStorage.setItem("gameLimit", JSON.stringify(data));

  window.open("https://omg10.com/4/10751693", "_blank");

  showToast("Juega 20 segundos ⏳");

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.30)
    });

    showToast("Ganaste $0.10🎮💰");
  }, 20000);
};

function updateGameUI(count) {
  document.getElementById("gameCount").innerText =
    `${count} / 10 juegos`;
}

document.body.addEventListener("click", () => {
  console.log("ads activos");
}, { once: true });

setInterval(() => {
  console.log("usuario activo 💸");
}, 15000);
