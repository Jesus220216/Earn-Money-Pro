import { auth, db } from "./firebase.js";
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

window.register = async () => {
  const email = email.value;
  const pass = pass.value;

  const res = await createUserWithEmailAndPassword(auth, email, pass);

  await setDoc(doc(db, "users", res.user.uid), {
    balance: 0,
    videosToday: 0,
    lastReset: new Date().toDateString(),
    lastClaim: 0
  });

  alert("Cuenta creada");
};

window.login = async () => {
  const email = email.value;
  const pass = pass.value;

  await signInWithEmailAndPassword(auth, email, pass);

  window.location.href = "dashboard.html";
};