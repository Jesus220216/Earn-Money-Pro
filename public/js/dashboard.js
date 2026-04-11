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

let completedOffers = 0;

function trackOfferClick() {
  if (completedOffers >= 3) return;

  completedOffers++;

  updateProgress();
}

function updateProgress() {
  const bar = document.getElementById("progressBar");
  const text = document.getElementById("progressText");

  if (!bar || !text) return;

  const percent = (completedOffers / 3) * 100;

  bar.style.width = percent + "%";
  text.innerText = `${completedOffers}/3 ofertas completadas`;

  if (completedOffers === 3) {
    showToast("🎁 BONUS desbloqueado +$0.50");
  }
}

function checkDailyReset() {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("progressReset");

  if (lastReset !== today) {
    completedOffers = 0;
    localStorage.setItem("progressReset", today);

    updateProgress();

    console.log("🔄 Reset diario aplicado");
  }
}

// ============================================
// 🌍 AUTH STATE
// ============================================

auth.onAuthStateChanged(async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  checkDailyReset(); // 🔥 AQUÍ

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
// 💰 CPAGRIP JSON OFFERWALL (PRO)
// ============================================

window.loadOffers = () => {
  if (!user || !user.uid) {
    showToast("Usuario no listo ❌");
    return;
  }

 const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${user.uid}&offer_type=Submit Email/Zip&showmobile=1`;

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

  const reward = (Math.random() * (3 - 0.5) + 0.5).toFixed(2);
  const people = Math.floor(Math.random() * 20) + 5;
  const timer = Math.floor(Math.random() * 10) + 5;

  html += `
    <div style="
      background:#fff;
      padding:14px;
      margin-bottom:12px;
      border-radius:12px;
      box-shadow:0 4px 12px rgba(0,0,0,0.08);
      border:1px solid #eee;
    ">
      
      <h4 style="margin-bottom:5px;">💰 ${offer.title}</h4>

      <p style="
        font-size:13px;
        color:#10B981;
        font-weight:bold;
        margin-bottom:6px;
      ">
        Gana hasta $${reward} 💸
      </p>

      <p style="
        font-size:11px;
        color:#ff3b3b;
        font-weight:bold;
      ">
        🔥 ${people} personas haciéndolo ahora
      </p>

      <p style="
        font-size:11px;
        color:#999;
        margin-bottom:10px;
      ">
        ⏳ Expira en ${timer} min
      </p>

      <a href="${offer.offerlink}" 
         target="_blank" 
         rel="noopener noreferrer"
         onclick="trackOfferClick()"
         style="
           display:block;
           text-align:center;
           padding:12px;
           background:linear-gradient(90deg,#10B981,#059669);
           color:#fff;
           border-radius:8px;
           text-decoration:none;
           font-weight:bold;
         ">
         💸 Completar y ganar dinero
      </a>

      <p style="
        font-size:11px;
        color:#10B981;
        font-weight:bold;
        margin-top:8px;
      ">
        🎯 Completa 3 ofertas y gana BONUS
      </p>

    </div>
  `;
});

      container.innerHTML = html;

      showToast("Ofertas cargadas 💰");
    })
    .catch(() => showToast("Error cargando ofertas ❌"));
};

auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;

    setTimeout(() => {
      loadOffers();
    }, 1000);
  }
});

// ============================================
// 🔥 EFECTO GANANCIAS EN VIVO
// ============================================
setInterval(() => {
  const names = ["Carlos", "Ana", "Luis", "Maria", "Jose", "Elena"];
  const name = names[Math.floor(Math.random() * names.length)];
  const amount = (Math.random() * 3 + 0.5).toFixed(2);

  showToast(`💰 ${name} ganó $${amount}`);
}, 8000);

// ============================================
// 🔄 AUTO RECARGA OFERTAS
// ============================================
setInterval(() => {
  if (user) loadOffers();
}, 30000);

// 🔄 RESET PROGRESO CADA 24H
setInterval(() => {
  completedOffers = 0;
  updateProgress();
}, 86400000);

setInterval(() => {
  checkDailyReset();
}, 60000);
