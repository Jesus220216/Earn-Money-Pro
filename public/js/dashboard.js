// ============================================
// EarnPro Dashboard - PRO FINAL REAL FIX
// ============================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const LINK = "https://omg10.com/4/10751693";

let user;
let balance = 0;
let videosLeft = 0;

let lastAdTime = 0;
const AD_COOLDOWN = 180000;

// ============================================
// 💰 GANAR DINERO (FIX REAL)
// ============================================
async function earn(amount = 0.01){
  try{
    if(!user) return;

    const now = Date.now();

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
      if(text === "too fast") showToast("Espera ⏱");
      if(text === "limit") showToast("Límite diario ❌");
      return false;
    }

    return true;

  }catch(e){
    console.log(e);
    return false;
  }
}

// ============================================
// 🔐 LOGIN
// ============================================
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();

  realtimeBalance();
  loadWithdrawals();
  generateRefLink();
});

// ============================================
// 🧠 INIT USER
// ============================================
async function initUser() {
  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    await setDoc(refDoc, {
      uid: user.uid,
      balance: 0,
      referrals: 0,
      todayEarnings: 0,
      todayDate: new Date().toDateString(),
      videosLeft: 6,
      lastEarn: 0,
      dailyEarn: 0
    });
  }
}

// ============================================
// 💰 REALTIME (CLAVE)
// ============================================
function realtimeBalance() {
  onSnapshot(doc(db, "users", user.uid), (snap) => {

    if(!snap.exists()) return;

    const data = snap.data();

    balance = data.balance || 0;
    videosLeft = data.videosLeft || 0;

    document.getElementById("balance").innerText = "$" + balance.toFixed(2);
    document.getElementById("todayEarnings").innerText = "$" + (data.todayEarnings || 0).toFixed(2);
    document.getElementById("videos").innerText = 6 - videosLeft;
    document.getElementById("refCount").innerText = data.referrals || 0;
  });
}

// ============================================
// 🎥 VIDEO
// ============================================
window.startVideo = async function(){
  if(videosLeft <= 0){
    showToast("Sin videos ❌");
    return;
  }

  const ok = await earn(0.02);

  if(ok){
    await updateDoc(doc(db, "users", user.uid), {
      videosLeft: increment(-1)
    });

    showToast("Ganaste $0.02 🎥");
  }
};

// ============================================
// 🎮 JUEGO
// ============================================
window.playGame = async function(){
  const ok = await earn(0.05);
  if(ok) showToast("Ganaste $0.05 🎮");
};

// ============================================
// 🎰 RULETA
// ============================================
window.spin = async function(){
  const rewards = [0.01,0.02,0.05,0.1,0];
  const reward = rewards[Math.floor(Math.random()*rewards.length)];

  const ok = await earn(reward);

  if(ok) showToast("Ganaste $" + reward.toFixed(2));
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

  const ok = await earn(0.2);

  if(ok) showToast("Ganaste $0.20 🎁");
};

// ============================================
// 💳 RETIRO
// ============================================
window.withdraw = async function(){
  const amount = parseFloat(document.getElementById("amount").value);
  const email = document.getElementById("email").value;

  if(amount < 5 || amount > balance){
    showToast("Error ❌");
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
