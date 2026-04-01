import { auth, db } from "./firebase.js";

import {
onAuthStateChanged, signOut
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

  await initUser();
  loadBalance();
});

// 👤 CREAR USUARIO
async function initUser(){
  const ref = doc(db,"users",user.uid);
  const snap = await getDoc(ref);

  if(!snap.exists()){
    await setDoc(ref,{ balance:0 });
  }
}

// 💰 CARGAR BALANCE
async function loadBalance(){
  const snap = await getDoc(doc(db,"users",user.uid));
  const d = snap.data();

  document.getElementById("balance").innerText =
    "$"+d.balance.toFixed(2);
}

// 🎥 VIDEO
let t=0, interval;

window.startVideo = ()=>{
  t = 0;

  interval = setInterval(()=>{
    t++;
    document.getElementById("timerText").innerText = t+"/20";

    if(t >= 20){
      clearInterval(interval);
      addMoney(0.02);
      alert("Ganaste $0.02");
    }
  },1000);
};

// 📋 ENCUESTA
window.survey = ()=>{
  addMoney(0.10);
  alert("Ganaste $0.10");
};

// 🧩 TAREA
window.task = ()=>{
  addMoney(0.15);
  alert("Ganaste $0.15");
};

// 🎮 JUEGO
window.game = ()=>{
  let r = Math.random();
  let reward = r < 0.7 ? 0.01 : 0.05;

  addMoney(reward);
  alert("Ganaste $" + reward.toFixed(2));
};

// 💸 SUMAR DINERO
async function addMoney(amount){
  await updateDoc(doc(db,"users",user.uid),{
    balance: increment(amount)
  });

  loadBalance();
}

// 💳 RETIRO
window.withdraw = async ()=>{
  const email = document.getElementById("email").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if(!amount || amount <= 0){
    alert("Monto inválido");
    return;
  }

  const snap = await getDoc(doc(db,"users",user.uid));
  const balance = snap.data().balance;

  if(amount > balance){
    alert("Saldo insuficiente");
    return;
  }

  await addDoc(collection(db,"withdrawals"),{
    userId:user.uid,
    email,
    amount,
    status:"pending",
    date:Date.now()
  });

  alert("Retiro enviado");
};

// 🚪 LOGOUT
window.logout = async ()=>{
  await signOut(auth);
  location.href="index.html";
};
