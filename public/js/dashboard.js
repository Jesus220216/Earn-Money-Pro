import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// REFERIDO
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");
if (ref) {
  sessionStorage.setItem("referrer", ref);
}

let user;
let balance = 0;
let lastWithdraw = 0;
let lastVideoTime = 0;
let currentRotation = 0;

// 🎥 VIDEOS (NO DEPENDEN DEL TIEMPO REAL)
const videos = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4"
];

let videoIndex = 0;
let videosLeft = 0;
let seconds = 0;
let interval;
let earningsToday = 0;
let userEarnings = 0;


// LOGIN
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
  generateRefLink();
});

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
      spinDate: new Date().toDateString()
    });

    sessionStorage.removeItem("referrer");
  }
}
// BALANCE
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

// 🎥 VIDEO REAL (FORZADO A 10 SEG)
window.startVideo = async () => {

  if (Date.now() - lastVideoTime < 10000)
    return showToast("Espera ⏳");
  if (videosLeft <= 0)
    return showToast("No hay más videos ❌");
if (document.hidden) {
  return showToast("No hagas trampa ❌");
}
  
  lastVideoTime = Date.now();

  const video = document.getElementById("videoPlayer");

  video.src = videos[videoIndex];
  video.play();

  seconds = 0;

  interval = setInterval(async () => {

    seconds++;
    document.getElementById("timerText").innerText = seconds + "/10";

    if (seconds >= 10) {
      clearInterval(interval);
      video.pause();

      await addMoney(0.03);
      showToast("Ganaste $0.03 🎥");

      videosLeft--;
      videoIndex = (videoIndex + 1) % videos.length;

      await updateDoc(doc(db, "users", user.uid), { videosLeft });

      document.getElementById("videosLeft").innerText =
        "Restantes: " + videosLeft;
    }

  }, 1000);
};

// ENCUESTA
window.survey = () => {
  window.open(`https://timewall.io/wall?uid=${user.uid}`, "_blank");
   window.open("https://omg10.com/4/10828691", "_blank");
};

// OFERTAS
window.lootably = () => {
  window.open(`https://wall.lootably.com/?placement=TU_ID&uid=${user.uid}`, "_blank");
   window.open("https://omg10.com/4/10828691", "_blank");
};


// 🎰 RULETA (ANIMACIÓN REAL)
window.spin = async () => {

  const wheel = document.getElementById("wheel");
window.open("https://omg10.com/4/10828691", "_blank");
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};

  if ((data.spins || 0) >= 10)
    return showToast("Límite alcanzado ❌");

  await updateDoc(ref, { spins: increment(1) });

  const reward = [0.05, 0.01, 0.02][Math.floor(Math.random() * 3)];

  const spinDeg = 1080 + Math.random() * 360;
  currentRotation += spinDeg;

  wheel.style.transition = "transform 3s ease-out";
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(async () => {
    await addMoney(reward);
    showToast("Ganaste $" + reward + " 🎰");
    updateSpinUI((data.spins || 0) + 1);
  }, 3000);
};

// 💰 DINERO
async function addMoney(amount) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.data() || {};

    let finalAmount = amount;

    // BONUS nuevo usuario
    if ((data.balance || 0) < 1) {
      finalAmount *= 1.5;
    }

    // VIP
    if (data.vip === true) {
      finalAmount *= 2;
    }

    // límite diario
    if (userEarnings > 2) {
      return showToast("Límite diario alcanzado 💸");
    }

    userEarnings += finalAmount;

    // 💰 pagar usuario
    await setDoc(ref, {
      balance: increment(finalAmount)
    }, { merge: true });

    // 💎 PAGAR REFERIDOR (AQUÍ ESTÁ LA MAGIA)
    if (data.referrer) {
      const refUser = doc(db, "users", data.referrer);

      const commission = finalAmount * 0.10;

      await setDoc(refUser, {
        balance: increment(commission),
        referralEarnings: increment(commission)
      }, { merge: true });

      console.log("💎 Comisión referida:", commission);
    }

    console.log("💰 Usuario ganó:", finalAmount);

  } catch (e) {
    console.error("❌ ERROR addMoney:", e);
    showToast("Error ❌");
  }
}
// 🎁 DAILY
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
window.open("https://omg10.com/4/10828691", "_blank");
  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000)
    return showToast("Ya reclamaste ❌");

 await setDoc(refUser, {
  referrals: increment(1),
  referralEarnings: increment(0.10),
  balance: increment(0.05)
}, { merge: true });

  showToast("Ganaste $0.20 🎁");
};

// 💳 RETIRO
window.withdraw = async () => {

  if (Date.now() - lastWithdraw < 10000)
    return showToast("Espera ⏳");
window.open("https://omg10.com/4/10828691", "_blank");
  lastWithdraw = Date.now();

  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!amount || amount <= 0) return showToast("Monto inválido ❌");
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
        <div style="margin:10px;padding:10px;background:#1f1f1f;border-radius:10px;">
          💰 $${w.amount} <br>
          📊 ${w.status}
        </div>
      `;
    });
  });
}

// 🔗 LINK REFERIDO
function generateRefLink() {
  document.getElementById("refLink").value =
    `${window.location.origin}?ref=${user.uid}`;
}

window.copyRef = () => {
  const input = document.getElementById("refLink");
  input.select();
  document.execCommand("copy");
  showToast("Link copiado 🔗");
};

// UI
function updateSpinUI(spins) {
  document.getElementById("spinCount").innerText =
    spins + " / 10 giros";
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

window.testMoney = () => addMoney(0.5);

// LOGOUT
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};
