import { auth, db } from "./firebase.js";
import {
doc, getDoc, setDoc, updateDoc,
addDoc, collection, increment
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let user;

// LOGIN
auth.onAuthStateChanged(async (u)=>{
  if(!u) return;
  user = u;

  await initUser();
  await loadUser();
  createRef();
});

// CREAR USUARIO
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

// CARGAR
async function loadUser(){
  const snap = await getDoc(doc(db,"users",user.uid));
  const d = snap.data();

  document.getElementById("balance").innerText = "$"+d.balance.toFixed(2);
  document.getElementById("daily").innerText = "Videos: "+(d.videosToday||0)+"/10";
}

// REFERIDO
function createRef(){
  document.getElementById("refLink").value =
    location.origin+"?ref="+user.uid;
}

// VIDEO
let watching=false, seconds=0, interval;

window.startVideo = ()=>{
  if(watching) return alert("Ya viendo");

  watching = true;
  seconds = 0;

  interval = setInterval(timer,1000);
};

function timer(){
  seconds++;
  document.getElementById("timerText").innerText = seconds+"/20";

  if(seconds >= 20){
    reward();
  }
}

// BLOQUEO CAMBIO DE PESTAÑA
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    watching=false;
    clearInterval(interval);
    alert("No salir de la pestaña");
  }
});

// RECOMPENSA
async function reward(){
  clearInterval(interval);

  const ref = doc(db,"users",user.uid);
  const snap = await getDoc(ref);
  const d = snap.data();

  const today = new Date().toDateString();

  if(d.lastReset !== today){
    await updateDoc(ref,{
      videosToday:0,
      lastReset:today
    });
  }

  if((d.videosToday||0) >= 10){
    alert("Límite diario");
    return;
  }

  if(Date.now() - (d.lastClaim||0) < 60000){
    alert("Espera 60s");
    return;
  }

  await updateDoc(ref,{
    balance: increment(0.02),
    videosToday: increment(1),
    lastClaim: Date.now(),
    lastReset: today
  });

  alert("Ganaste $0.02");
  loadUser();
}

// RETIRO
window.withdraw = async ()=>{
  const amountValue = parseFloat(document.getElementById("amount").value);
  const paypalValue = document.getElementById("email").value;

  if(!amountValue || amountValue < 5){
    alert("Mínimo $5");
    return;
  }

  const ref = doc(db,"users",user.uid);
  const snap = await getDoc(ref);
  const balance = snap.data().balance;

  if(amountValue > balance){
    alert("Saldo insuficiente");
    return;
  }

  await addDoc(collection(db,"withdrawals"),{
    userId:user.uid,
    amount:amountValue,
    paypal:paypalValue,
    status:"pending",
    date:Date.now()
  });

  alert("Retiro enviado");
};