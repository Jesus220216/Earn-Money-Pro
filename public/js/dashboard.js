import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

// VARIABLES
let user;
let balance = 0;
let videosLeft = 0;

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

// 🧠 CREAR USUARIO + REFERIDOS
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

  // 🔥 NUEVO
  todayEarnings: 0,
  todayDate: new Date().toDateString()
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

// RESET DIARIO
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

  document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;
}

// BALANCE
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data() || {};

    // 💰 BALANCE TOTAL
    balance = data.balance || 0;
    document.getElementById("balance").innerText =
      "$" + balance.toFixed(2);

    // 👥 REFERIDOS
    document.getElementById("refCount").innerText =
      data.referrals || 0;

    // 📅 GANADO HOY
    const todayDate = new Date().toDateString();

    if (data.todayDate !== todayDate) {
      // reset automático diario
      updateDoc(doc(db, "users", user.uid), {
        todayEarnings: 0,
        todayDate: todayDate
      });
    }

    const today = data.todayEarnings || 0;

    document.getElementById("today").innerText =
      "$" + today.toFixed(2);

    // 🎥 VIDEOS VISTOS HOY
    const videosWatched = (6 - (data.videosLeft || 0));

    document.getElementById("videos").innerText =
      videosWatched;
  });
}

// 🎥 VIDEO (FIX REAL)
window.startVideo = () => {
  const video = document.getElementById("videoPlayer");

  video.src = "https://www.w3schools.com/html/mov_bbb.mp4";
  video.play();

  openAd();

  setTimeout(async () => {
   await updateDoc(doc(db, "users", user.uid), {
  balance: increment(0.02),
  videosLeft: increment(-1),
  todayEarnings: increment(0.02) // 🔥 AÑADIR
});
    videosLeft--;
    document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;

    showToast("Ganaste $0.03 🎥");
  }, 10000);
};

// 🎰 RULETA CON ANIMACIÓN
window.spin = async () => {
  const wheel = document.getElementById("wheel");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let spins = snap.data()?.spins || 0;

  if (spins >= 10) return showToast("Límite alcanzado ❌");

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
        balance: increment(reward)
      });

      showToast(`Ganaste $${reward} 🎰`);
    }

    if (spins === 10) {
     await updateDoc(ref, {
  balance: increment(reward),
  todayEarnings: increment(reward) // 🔥
});

      showToast("BONUS $1 🔥");
    }

  }, 4000);
};

// 🎮 JUEGO REAL + DINERO
window.playGame = async () => {
  openAd();

  setTimeout(async () => {
   await updateDoc(doc(db, "users", user.uid), {
  balance: increment(0.05),
  todayEarnings: increment(0.05) // 🔥
});

    showToast("Ganaste $0.05 🎮");
  }, 15000);
};

// 🎁 DAILY
window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (Date.now() - snap.data()?.lastDaily < 86400000)
    return showToast("Ya reclamaste ❌");

  openAd();

  setTimeout(async () => {
    await updateDoc(ref, {
  balance: increment(0.2),
  lastDaily: Date.now(),
  todayEarnings: increment(0.2) // 🔥
});

    showToast("Ganaste $0.20 🎁");
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

// REFERIDOS
function generateRefLink() {
  document.getElementById("refLink").value =
    `${window.location.origin}?ref=${user.uid}`;
}

// COPIAR
window.copyRef = async () => {
  const text = document.getElementById("refLink").value;
  await navigator.clipboard.writeText(text);
  showToast("Link copiado ✅");
};

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
window.logout = function () {
  signOut(auth)
    .then(() => {
      alert("Sesión cerrada");
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
