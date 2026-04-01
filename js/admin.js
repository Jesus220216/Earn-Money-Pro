import { db } from "./firebase.js";
import {
collection, getDocs, updateDoc, doc,
getDoc, increment
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const div = document.getElementById("withdrawals");

const snap = await getDocs(collection(db,"withdrawals"));

snap.forEach(d=>{
  const data = d.data();

  div.innerHTML += `
    <p>${data.paypal} - $${data.amount} - ${data.status}
    <button onclick="approve('${d.id}')">Aprobar</button></p>
  `;
});

window.approve = async (id)=>{
  const ref = doc(db,"withdrawals",id);
  const snap = await getDoc(ref);
  const data = snap.data();

  await updateDoc(doc(db,"users",data.userId),{
    balance: increment(-data.amount)
  });

  await updateDoc(ref,{
    status:"approved"
  });

  alert("Pago aprobado");
  location.reload();
};