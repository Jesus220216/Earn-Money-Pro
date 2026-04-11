// =====================================
// 💼 EARNPRO SAAS CORE ENGINE
// =====================================

import { auth, db } from "./firebase.js";
import {
  doc, getDoc, setDoc, updateDoc,
  increment, addDoc, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// =====================
// STATE
// =====================

let user;
let balance = 0;
let geo = "US";

// =====================
// INIT USER (SAAS)
// =====================

async function initUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      balance: 1,
      revenue: 0,
      clicks: 0,
      sessions: 1,
      createdAt: Date.now()
    });
  }
}

// =====================
// TRACK EVENT (SAAS CORE)
// =====================

async function track(event, data = {}) {
  if (!user) return;

  await addDoc(collection(db, "tracking"), {
    userId: user.uid,
    event,
    geo,
    data,
    time: Date.now()
  });
}

// =====================
// REVENUE ENGINE
// =====================

async function revenue(amount, source) {
  await updateDoc(doc(db, "users", user.uid), {
    revenue: increment(amount),
    balance: increment(amount)
  });

  await addDoc(collection(db, "revenue_logs"), {
    userId: user.uid,
    amount,
    source,
    time: Date.now()
  });
}

// =====================
// CLICK TRACKING
// =====================

window.trackClick = async (type) => {
  await track("click", { type });

  await updateDoc(doc(db, "users", user.uid), {
    clicks: increment(1)
  });
};

// =====================
// SMART LINK
// =====================

window.openAd = () => {
  trackClick("smartlink");
  window.open("https://omg10.com/4/10751693", "_blank");
};

// =====================
// AUTH SYSTEM
// =====================

auth.onAuthStateChanged(async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await initUser();

  track("session_start");
});
