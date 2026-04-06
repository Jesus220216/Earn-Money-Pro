import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔐 VERIFICAR CAPTCHA
async function verifyCaptcha(token) {
  const res = await fetch('/verify-captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  return await res.json();
}

// 🔥 REGISTER
window.register = async (token) => {

  const captcha = await verifyCaptcha(token);

  if (!captcha.success) {
    alert("Bot detectado ❌");
    return;
  }

  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if (pass.length < 6) {
    alert("Mínimo 6 caracteres");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    const referrer = sessionStorage.getItem("referrer");

    await setDoc(doc(db, "users", user.uid), {
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      videoDate: new Date().toDateString(),
      spins: 0,
      spinDate: new Date().toDateString()
    });

    sessionStorage.removeItem("referrer");

    alert("Cuenta creada 🚀");
    location.href = "dashboard.html";

  } catch (e) {
    alert(e.message);
  }
};

// 🔐 LOGIN
window.login = async (token) => {

  const captcha = await verifyCaptcha(token);

  if (!captcha.success) {
    alert("Acceso bloqueado ❌");
    return;
  }

  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    location.href = "dashboard.html";
  } catch (e) {
    alert(e.message);
  }
};
