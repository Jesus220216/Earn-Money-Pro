import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔥 REGISTER
window.register = async () => {

  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if (pass.length < 6) {
    alert("Mínimo 6 caracteres");
    return;
  }

  try {
    // 🔥 CREAR USUARIO
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // 🔥 OBTENER REFERIDO
    const referrer = sessionStorage.getItem("referrer");

    // 🔥 GUARDAR USUARIO EN FIREBASE
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

    console.log("✅ Usuario creado");

    if (referrer) {
      console.log("🔥 Referido guardado:", referrer);
    }

    // limpiar
    sessionStorage.removeItem("referrer");

    alert("Cuenta creada 🚀");
    location.href = "dashboard.html";

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
};

// 🔐 LOGIN
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
