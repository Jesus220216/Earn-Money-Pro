// ============================================
// EarnPro Dashboard - PRO FULL FIXED FINAL
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔗 LINK MONETIZACIÓN
const LINK = "https://omg10.com/4/10751693";

// VARIABLES
let user;
let balance = 0;
let videosLeft = 0;

// ============================================
// 💰 SISTEMA GANANCIAS PRO (FIX REAL)
// ============================================
let lastAdTime = 0;
const AD_COOLDOWN = 180000;

async function earn(amount = 0.01){
  try{
    if(!user) return;

    const now = Date.now();

    // 🎯 anuncio controlado
    if(now - lastAdTime > AD_COOLDOWN){
      lastAdTime = now;
      window.open(LINK, "_blank");
    }

    const res = await fetch("/reward", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        uid: user.uid,
        amount
      })
    });

    const text = await res.text();

    if(text !== "ok"){
      console.log("Bloqueado:", text);

      if(text === "too fast") showToast("Espera unos segundos ⏱");
      if(text === "daily limit") showToast("Límite diario ❌");

      return;
    }

    showToast("+" + amount.toFixed(2) + " 💰");

  }catch(e){
    console.log("Error earn:", e);
  }
}

// ============================================
// 🔐 LOGIN
// ============================================
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();
  await resetDaily();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
  monitorReferrals();
});

// ============================================
// 🧠 CREAR USUARIO + REFERIDOS
// ============================================
async function initUser() {
  const referrer = new URLSearchParams(window.location.search).get("ref");

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      uid: user.uid,
      email: user.email || "",
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      spins: 0,
      lastDaily: 0,
      lastReset: new Date().toDateString(),
      todayEarnings: 0,
      todayDate: new Date().toDateString(),
      vip: false,
      createdAt: Date.now()
    });

    await updateDoc(refDoc, {
      balance: increment(0.05),
      todayEarnings: increment(0.05)
    });

    // REFERIDOS
    if (referrer && referrer !== user.uid) {
      try {
        const refUser = doc(db, "users", referrer);
        const refSnap = await getDoc(refUser);

        if (refSnap.exists()) {
          await updateDoc(refUser, {
            referrals: increment(1),
            referralEarnings: increment(1),
            balance: increment(1)
          });

          await addDoc(collection(db, "referrals"), {
            referrerId: referrer,
            referredId: user.uid,
            amount: 1,
            date: Date.now()
          });

          showToast("Referido procesado 🎉");
        }
      } catch (e) {}
    }
  }
}

// ============================================
// 📊 REFERIDOS
// ============================================
function monitorReferrals() {
  const q = query(
    collection(db, "referrals"),
    where("referrerId", "==", user.uid)
  );

  onSnapshot(q, (snap) => {
    console.log("Referidos:", snap.size);
  });
}

// ============================================
// 🔄 RESET DIARIO
// ============================================
async function resetDaily() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = new Date().toDateString();

  if (data.lastReset !== today) {
    await updateDoc(ref, {
      videosLeft: 6,
      spins: 0,
      lastReset: today,
      todayEarnings: 0,
      todayDate: today
    });
    videosLeft = 6;
  } else {
    videosLeft = data.videosLeft || 0;
  }

  document.getElementById("videosLeft").innerText = "Restantes: " + videosLeft;
}

// ============================================
// 💰 BALANCE REALTIME
// ============================================
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {

    if(!snap.exists()) return;

    const data = snap.data();

    balance = data.balance || 0;
    document.getElementById("balance").innerText = "$" + balance.toFixed(2);

    document.getElementById("refCount").innerText = data.referrals || 0;
    document.getElementById("todayEarnings").innerText = "$" + (data.todayEarnings || 0).toFixed(2);

    videosLeft = data.videosLeft || 0;
    document.getElementById("videos").innerText = 6 - videosLeft;
  });
}

// ============================================
// 🎥 VIDEO (FIX)
// ============================================
window.startVideo = async function(){
  if(videosLeft <= 0){
    showToast("Sin videos hoy ❌");
    return;
  }

  await earn(0.02);

  await updateDoc(doc(db, "users", user.uid), {
    videosLeft: increment(-1),
    todayEarnings: increment(0.02)
  });

  showToast("Ganaste $0.02 🎥");
};

// ============================================
// 🎮 JUEGO
// ============================================
window.playGame = function(){
  earn(0.05);
  showToast("Ganaste $0.05 🎮");
};

// ============================================
// 🎰 RULETA
// ============================================
window.spin = function(){
  const rewards = [0.01,0.02,0.05,0.1,0];
  const reward = rewards[Math.floor(Math.random()*rewards.length)];

  earn(reward);
  showToast("Ganaste $" + reward.toFixed(2) + " 🎰");
};

// ============================================
// 🎁 DAILY
// ============================================
window.daily = async function(){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const last = snap.data()?.lastDaily || 0;

  if(Date.now() - last < 86400000){
    showToast("Ya reclamaste ❌");
    return;
  }

  await updateDoc(ref, { lastDaily: Date.now() });

  earn(0.2);
  showToast("Ganaste $0.20 🎁");
};

// ============================================
// 💎 VIP
// ============================================
window.buyVIP = async function(){
  if(balance < 5){
    showToast("Necesitas $5 ❌");
    return;
  }

  await updateDoc(doc(db,"users",user.uid),{
    balance: increment(-5),
    vip: true
  });

  showToast("VIP activado 💎");
};

// ============================================
// 💳 RETIRO
// ============================================
window.withdraw = async function(){
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if(!email || !email.includes("@")){
    showToast("Email inválido ❌");
    return;
  }

  if(amount < 5 || amount > balance){
    showToast("Error en monto ❌");
    return;
  }

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
// 📜 HISTORIAL
// ============================================
function loadWithdrawals(){
  onSnapshot(collection(db, "withdrawals"), (snap) => {
    const div = document.getElementById("withdrawList");
    div.innerHTML = "";

    snap.forEach(docu=>{
      const w = docu.data();
      if(w.userId !== user.uid) return;

      div.innerHTML += `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-info">
          <p>Retiro</p>
          <p>${new Date(w.date).toLocaleDateString()}</p>
        </div>
        <p>-$${w.amount.toFixed(2)}</p>
      </div>`;
    });
  });
}

// ============================================
// 🔗 REFERIDOS
// ============================================
function generateRefLink(){
  document.getElementById("refLink").value =
    window.location.origin + "?ref=" + user.uid;
}

window.copyRef = function(){
  navigator.clipboard.writeText(document.getElementById("refLink").value);
  showToast("Copiado ✅");
};

// ============================================
// 🔔 TOAST
// ============================================
function showToast(msg){
  const t=document.createElement("div");
  t.innerText=msg;
  t.style.position="fixed";
  t.style.bottom="20px";
  t.style.right="20px";
  t.style.background="#10B981";
  t.style.color="white";
  t.style.padding="10px";
  t.style.borderRadius="8px";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2000);
}

// ============================================
// 🚪 LOGOUT
// ============================================
window.logout = function(){
  signOut(auth).then(()=>location.href="index.html");
};
