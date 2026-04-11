// ============================================
// 💼 EARNPRO DASHBOARD CORE SYSTEM
// ============================================

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ============================================
// 🔐 VARIABLES GLOBALES
// ============================================

let user;
let balance = 0;
let videosLeft = 0;
let taskCooldown = false;

// ============================================
// 🌍 AUTH STATE
// ============================================

auth.onAuthStateChanged(async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await loadUserData();
  await generateRefLink();
  realtimeBalance();
});

// ============================================
// 👤 CREAR USUARIO SI NO EXISTE
// ============================================

async function initUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      balance: 0,
      videosLeft: 6,
      referrals: 0,
      todayEarnings: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString()
    });
  }
}

// ============================================
// 📊 CARGAR DATOS INICIALES
// ============================================

async function loadUserData() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const d = snap.data() || {};

  balance = d.balance || 0;
  videosLeft = d.videosLeft || 0;

  updateUI(d);
}

// ============================================
// 🧠 UI UPDATE
// ============================================

function updateUI(d) {
  set("balance", d.balance);
  set("videos", 6 - (d.videosLeft || 0));
  set("videosLeft", "Restantes: " + (d.videosLeft || 0));
  set("refCount", d.referrals || 0);
  set("todayEarnings", d.todayEarnings || 0);
}

// ============================================
// 💰 VIDEO REWARD
// ============================================

window.startVideo = async () => {
  if (taskCooldown) return showToast("Espera ⏳");
  if (videosLeft <= 0) return showToast("Sin videos ❌");

  taskCooldown = true;

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.02),
      videosLeft: increment(-1),
      todayEarnings: increment(0.02)
    });

    videosLeft--;

    showToast("Ganaste $0.02 🎥");
    taskCooldown = false;
  }, 6000);
};

// ============================================
// 🎮 GAME
// ============================================

window.playGame = async () => {
  if (taskCooldown) return;

  taskCooldown = true;

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    showToast("Ganaste $0.05 🎮");
    taskCooldown = false;
  }, 8000);
};

// ============================================
// 🎰 RULETA
// ============================================

window.spin = async () => {
  if (taskCooldown) return;

  taskCooldown = true;

  const rewards = [0, 0.01, 0.02, 0.05, 0.1];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });

      showToast("Ganaste $" + reward);
    } else {
      showToast("Intenta otra vez ❌");
    }

    taskCooldown = false;
  }, 3000);
};

// ============================================
// 🎁 DAILY REWARD
// ============================================

window.daily = async () => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const last = snap.data()?.lastDaily || 0;

  if (Date.now() - last < 86400000)
    return showToast("Ya reclamado ❌");

  await updateDoc(ref, {
    balance: increment(0.2),
    lastDaily: Date.now(),
    todayEarnings: increment(0.2)
  });

  showToast("Daily $0.20 🎁");
};

// ============================================
// 🎁 BOX / CPA TRIGGER
// ============================================

window.openBox = () => {
  showToast("Oferta cargando... 💰");
  window.open("https://omg10.com", "_blank");
};

// ============================================
// 🔥 CPA OFFERWALL
// ============================================

window.openOfferwall = () => {
  const url = "https://cpagrip.com/show.php?l=YOUR_OFFERWALL_ID&subid=" + user.uid;
  window.open(url, "_blank");
};

// ============================================
// 🔒 LOCKER
// ============================================

window.openLocker = () => {
  const s = document.createElement("script");
  s.src = "https://playabledownloads.com/script_include.php?id=1889035&subid=" + user.uid;
  document.body.appendChild(s);
};

// ============================================
// 💳 RETIRO
// ============================================

window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if (!email || amount < 5 || amount > balance)
    return showToast("Error ❌");

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
// 🔗 REFERIDOS
// ============================================

window.generateRefLink = async () => {
  const link = window.location.origin + "?ref=" + user.uid;

  const el = document.getElementById("refLink");
  if (el) el.value = link;
};

window.copyRef = async () => {
  const el = document.getElementById("refLink");
  await navigator.clipboard.writeText(el.value);
  showToast("Copiado ✅");
};

// ============================================
// 📡 REAL TIME BALANCE
// ============================================

function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {
    const d = snap.data() || {};

    balance = d.balance || 0;
    videosLeft = d.videosLeft || 0;

    set("balance", balance);
    set("videos", 6 - videosLeft);
    set("videosLeft", "Restantes: " + videosLeft);
    set("refCount", d.referrals || 0);
    set("todayEarnings", d.todayEarnings || 0);
  });
}

// ============================================
// 🧠 UI SAFE
// ============================================

function set(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText =
    typeof value === "number"
      ? "$" + value.toFixed(2)
      : value;
}

// ============================================
// 🔔 TOAST
// ============================================

function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#10B981;
    color:#fff;
    padding:10px 15px;
    border-radius:8px;
    z-index:9999;
  `;

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ============================================
// 🚪 LOGOUT
// ============================================

window.logout = () => {
  auth.signOut().then(() => location.href = "index.html");
};

// ============================================
// 💰 CPAGRIP RSS OFFERWALL (FIXED)
// ============================================

// ============================================
// 💰 CPAGRIP JSON OFFERWALL (PRO)
// ============================================

window.loadOffers = () => {
  if (!user || !user.uid) {
    showToast("Usuario no listo ❌");
    return;
  }

  const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {

      const container = document.getElementById("offers");
      if (!container) return;

      if (!data.offers || data.offers.length === 0) {
        container.innerHTML = "<p>No hay ofertas disponibles 😕</p>";
        return;
      }

      let html = "";

      data.offers.slice(0, 6).forEach(offer => {
        html += `
          <div style="
            background:#fff;
            padding:12px;
            margin-bottom:10px;
            border-radius:10px;
            box-shadow:0 2px 8px rgba(0,0,0,0.08);
          ">
            <h4 style="margin-bottom:6px;">💰 ${offer.title}</h4>
            <a href="${offer.offerlink}" target="_blank" rel="noopener noreferrer">
              style="
                display:inline-block;
                padding:8px 12px;
                background:#10B981;
                color:#fff;
                border-radius:6px;
                text-decoration:none;
              ">
              🔥 Ganar dinero ahora
            </a>
          </div>
        `;
      });

      container.innerHTML = html;

      showToast("Ofertas cargadas 💰");
    })
    .catch(() => showToast("Error cargando ofertas ❌"));
};
