import { auth, db } from "./firebase.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
doc, getDoc, setDoc, updateDoc,
increment, addDoc, collection
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let user;

// 🔐 LOGIN
onAuthStateChanged(auth, async (u)=>{
  if(!u){
    location.href="index.html";
    return;
  }

  user = u;

  document.getElementById("userEmail").innerText = user.email;

  await initUser();
  loadUser();
  loadOfferwalls();
});

// 👤 USER
async function initUser(){
  const ref = doc(db,"users",user.uid);
  const snap = await getDoc(ref);

  if(!snap.exists()){
    await setDoc(ref,{
      balance:0,
      videosToday:0,
      lastClaim:0,
      lastReset:new Date().toDateString()
    });
  }
}

// 📊 LOAD
async function loadUser(){
  const snap = await getDoc(doc(db,"users",user.uid));
  const d = snap.data();

  document.getElementById("balance").innerText =
    "$"+d.balance.toFixed(2);
}

// 🎥 VIDEO
let watching=false, seconds=0, interval;

document.getElementById("videoBtn").onclick = ()=>{
  if(watching) return;

  watching=true;
  seconds=0;

  interval=setInterval(()=>{
    seconds++;
    document.getElementById("timerText").innerText = seconds+"/20";

    if(seconds>=20){
      reward();
    }
  },1000);
};

async function reward(){
  clearInterval(interval);

  await updateDoc(doc(db,"users",user.uid),{
    balance: increment(0.02)
  });

  alert("Ganaste $0.02");
  loadUser();
}

// 🎮 GAME
document.getElementById("gameBtn").onclick = async ()=>{
  let r = Math.random();
  let reward = r < 0.7 ? 0.01 : r < 0.9 ? 0.05 : 0.2;

  await updateDoc(doc(db,"users",user.uid),{
    balance: increment(reward)
  });

  alert("Ganaste $" + reward);
  loadUser();
};

// 💸 RETIRO
document.getElementById("withdrawBtn").onclick = async ()=>{
  const email = document.getElementById("withdrawEmail").value;
  const amount = parseFloat(document.getElementById("withdrawAmount").value);

  const snap = await getDoc(doc(db,"users",user.uid));
  const balance = snap.data().balance;

  if(amount > balance){
    alert("Saldo insuficiente");
    return;
  }

  await addDoc(collection(db,"withdrawals"),{
    userId:user.uid,
    amount,
    email,
    status:"pending"
  });

  alert("Retiro enviado");
};

// 🚪 LOGOUT
document.getElementById("logoutBtn").onclick = async ()=>{
  await signOut(auth);
  location.href="index.html";
};

// 🔥 OFFERWALLS REALES
function loadOfferwalls(){

  // 🔹 CPX Research (ENCUESTAS)
  document.getElementById("cpxFrame").src =
    "https://offers.cpx-research.com/index.php?app_id=TU_APP_ID&ext_user_id="+user.uid;

  // 🔹 AdGate (TAREAS)
  document.getElementById("offerFrame").src =
    "https://wall.adgate.media/?id=TU_ID&userId="+user.uid;
}
