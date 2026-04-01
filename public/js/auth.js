import { auth } from "./firebase.js";
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

window.register = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if(pass.length < 6){
    alert("Mínimo 6 caracteres");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("Cuenta creada");
    location.href = "dashboard.html";
  } catch (e) {
    alert(e.message);
  }
};

window.login = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "dashboard.html";
  } catch (e) {
    alert(e.message);
  }
};
