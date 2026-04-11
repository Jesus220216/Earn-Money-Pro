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
let step = 1 + Math.floor(Math.random() * 2);
let completedOffers = 0;


// ============================================
// 💰 CPA CORE SYSTEM (OBLIGATORIO)
// ============================================

function openCPA(url, offerId = "unknown") {
  if (!user || !user.uid) return;

  const finalURL =
    url +
    (url.includes("?") ? "&" : "?") +
    "tracking_id=" + encodeURIComponent(user.uid) +
    "&offer_id=" + encodeURIComponent(offerId);

  window.open(finalURL, "_blank");
  showToast("💰 Completa la oferta para ganar dinero real");
}


// ============================================
// 🎰 CPA ACTIONS (BOTONES)
// ============================================

window.startVideo = () => {
  openCPA("https://omg10.com/4/10751693", "video_01");
};

window.playGame = () => {
  openCPA("https://www.profitablecpmratenetwork.com/a97wfwyyb", "game_01");
};

window.spin = () => {
  openCPA("https://omg10.com/4/10751693", "spin_01");
};

window.daily = () => {
  openCPA("https://omg10.com/4/10751693", "daily_01");
};

window.openBox = () => {
  openCPA("https://omg10.com/4/10751693", "box_01");
};


// ============================================
// 🔒 CPA LOCKER (PLAYABLE DOWNLOADS)
// ============================================

function triggerCPA() {
  if (!user || !user.uid) return;

  if (document.getElementById("cpaLockerScript")) return;

  const s = document.createElement("script");
  s.id = "cpaLockerScript";

  s.src =
    "https://playabledownloads.com/script_include.php" +
    "?id=1889666" +
    "&tracking_id=" + encodeURIComponent(user.uid) +
    "&offer_id=locker_01";

  s.async = true;

  document.body.appendChild(s);

  showToast("💰 Completa la oferta para ganar dinero real");
}


// ============================================
// 📊 PROGRESS SYSTEM
// ============================================

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


// ============================================
// 🔄 DAILY RESET
// ============================================

function checkDailyReset() {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem("progressReset");

  if (lastReset !== today) {
    completedOffers = 0;
    localStorage.setItem("progressReset", today);
    updateProgress();
  }
}


// ============================================
// 🧩 STEP SYSTEM (GAMIFICATION)
// ============================================

function updateSteps() {
  const s1 = document.getElementById("step1");
  const s2 = document.getElementById("step2");
  const s3 = document.getElementById("step3");

  if (!s1 || !s2 || !s3) return;

  if (step === 1) {
    s1.innerHTML = "🟡 Paso 1: Haz clic en una oferta";
  }

  if (step === 2) {
    s1.innerHTML = "✅ Paso 1 completado";
    s2.innerHTML = "🟡 Paso 2: Completa el registro";
  }

  if (step === 3) {
    s2.innerHTML = "✅ Paso 2 completado";
    s3.innerHTML = "🟡 Paso 3: Recibe tu dinero";
  }
}

function nextStep() {
  if (step < 3) step++;

  updateSteps();

  if (step === 2) {
    showToast("⚠️ Completa el registro para ganar dinero");
  }

  if (step === 3) {
    showToast("💰 Esperando confirmación de la oferta...");
  }
}

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

  triggerCPA(); // 🔥 CPA

  trackOfferClick();
  nextStep();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.02),
      videosLeft: increment(-1),
      todayEarnings: increment(0.02)
    });

    videosLeft--;
    showToast("🎥 Video completado + posible recompensa CPA");
    taskCooldown = false;
  }, 8000);
};

// ============================================
// 🎮 GAME
// ============================================

window.playGame = async () => {
  if (taskCooldown) return;

  taskCooldown = true;

  triggerCPA(); // 🔥 CPA

  trackOfferClick();
  nextStep();

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    showToast("🎮 Jugaste + posible ganancia CPA");
    taskCooldown = false;
  }, 10000);
};
// ============================================
// 🎰 RULETA
// ============================================

window.spin = async () => {
  if (taskCooldown) return;

  taskCooldown = true;

  triggerCPA(); // 🔥 CPA

  trackOfferClick();
  nextStep();

  const rewards = [0, 0.01, 0.02, 0.05, 0.1];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  setTimeout(async () => {
    if (reward > 0) {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(reward),
        todayEarnings: increment(reward)
      });

      showToast("🎰 +" + reward + " + CPA activo 💰");
    } else {
      showToast("🎰 Intenta otra vez + CPA activo");
    }

    taskCooldown = false;
  }, 4000);
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

  triggerCPA(); // 🔥 CPA

  trackOfferClick();
  nextStep();

  await updateDoc(ref, {
    balance: increment(0.2),
    lastDaily: Date.now(),
    todayEarnings: increment(0.2)
  });

  showToast("🎁 Daily + CPA activo 💰");
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

  const reward = (Math.random() * (3 - 0.5) + 0.5).toFixed(2);

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
        margin-bottom:10px;
      ">
        Gana hasta $${reward} 💸
      </p>

      <a href="${offer.offerlink}" 
         target="_blank" 
         rel="noopener noreferrer"
         style="
           display:block;
           text-align:center;
           padding:10px;
           background:linear-gradient(90deg,#10B981,#059669);
           color:#fff;
           border-radius:8px;
           text-decoration:none;
           font-weight:bold;
           transition:0.2s;
         ">
         🚀 Empezar ahora
      </a>

      <p style="
        font-size:11px;
        color:#999;
        margin-top:8px;
      ">
        ⏳ Oferta limitada
      </p>

    </div>
  `;
});
      
auth.onAuthStateChanged((u) => {
  if (u) {
    user = u;

   setTimeout(() => {
  loadOffers();
  showToast("🔥 Nuevas ofertas disponibles");
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

// 🔥 AUTO LOAD OFERTAS
setTimeout(() => {
  if (user) {
    loadOffers();
  }
}, 2000);

async function saveClick() {
  try {
    await addDoc(collection(db, "clicks"), {
      uid: user.uid,
      date: Date.now()
    });
  } catch (e) {
    console.error("click error", e);
  }
}
