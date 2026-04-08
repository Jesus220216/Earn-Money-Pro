import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let user;
let balance = 0;
let videosLeft = 6;

// LOGIN
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";
  user = u;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      balance: 0,
      videosLeft: 6,
      referrals: 0
    });
  }

  loadUser();
});

// CARGAR USUARIO
async function loadUser(){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const data = snap.data();

  balance = data.balance || 0;
  videosLeft = data.videosLeft || 0;

  updateUI();
}

// UI
function updateUI(){
  document.getElementById("balance").innerText = "$" + balance.toFixed(2);

  const mini = document.querySelector(".balance-mini");
  if (mini) mini.innerText = "$" + balance.toFixed(2);

  document.getElementById("videosLeft").innerText = "Left: " + videosLeft;
}

// 🎥 VIDEO
window.startVideo = async () => {
  if (videosLeft <= 0) return alert("No videos left");

  document.getElementById("videoPlayer").src =
    "https://www.w3schools.com/html/mov_bbb.mp4";

  setTimeout(async () => {
    await updateDoc(doc(db, "users", user.uid), {
      balance: increment(0.03),
      videosLeft: increment(-1)
    });

    loadUser();
    alert("Ganaste $0.03");
  }, 10000);
};

// 🎰 SPIN
window.spin = async () => {
  const reward = Math.random() * 0.1;

  await updateDoc(doc(db, "users", user.uid), {
    balance: increment(reward)
  });

  loadUser();
  alert("Ganaste $" + reward.toFixed(2));
};

// 🎁 DAILY
window.daily = async () => {
  await updateDoc(doc(db, "users", user.uid), {
    balance: increment(0.2)
  });

  loadUser();
  alert("Ganaste $0.20");
};

// 🔥 CPA
window.openLocker = function () {
  const url = `https://www.cpagrip.com/show.php?l=1889035&subid=${user.uid}`;
  window.open(url, "_blank");
};

// 💸 RETIRO
window.withdraw = async () => {
  const amount = parseFloat(document.getElementById("amount").value);

  if (amount > balance) return alert("Saldo insuficiente");

  await updateDoc(doc(db, "users", user.uid), {
    balance: increment(-amount)
  });

  loadUser();
  alert("Retiro enviado");
};

// LOGOUT
window.logout = function () {
  signOut(auth).then(() => location.href = "index.html");
};
