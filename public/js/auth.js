import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc, increment, addDoc, collection
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

    // 🔥 OBTENER REFERIDO (de sessionStorage o URL)
    let referrer = sessionStorage.getItem("referrer");
    
    // Si no está en sessionStorage, intentar obtener de URL
    if (!referrer) {
      const urlParams = new URLSearchParams(window.location.search);
      referrer = urlParams.get("ref");
    }

    console.log("📝 Creando usuario:", user.uid);
    console.log("🔗 Referrer:", referrer);

    // 🔥 GUARDAR USUARIO EN FIREBASE
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      balance: 0,
      referrer: referrer || null,
      referrals: 0,
      referralEarnings: 0,
      videosLeft: 6,
      videoDate: new Date().toDateString(),
      spins: 0,
      spinDate: new Date().toDateString(),
      todayEarnings: 0,
      todayDate: new Date().toDateString(),
      lastDaily: 0,
      lastReset: new Date().toDateString(),
      vip: false,
      createdAt: Date.now()
    });

    console.log("✅ Usuario creado en Firestore");

    // ============================================
    // 🎯 PROCESAR REFERIDO (IMPORTANTE)
    // ============================================
    if (referrer && referrer !== user.uid) {
      console.log("🎯 Procesando referido...");
      
      try {
        const refUser = doc(db, "users", referrer);
        const refSnap = await getDoc(refUser);

        if (refSnap.exists()) {
          console.log("✅ Referrer encontrado, actualizando...");
          
          // Actualizar referidor
          await updateDoc(refUser, {
            referrals: increment(1),
            referralEarnings: increment(1),
            balance: increment(1)
          });

          // Crear registro de referral (auditoría)
          await addDoc(collection(db, "referrals"), {
            referrerId: referrer,
            referredId: user.uid,
            referredEmail: email,
            amount: 1,
            date: Date.now(),
            status: "completed"
          });

          console.log("✅ Referido procesado correctamente");
          console.log("💰 Referidor recibió: $1.00");
        } else {
          console.warn("⚠️ Referrer no existe:", referrer);
        }
      } catch (error) {
        console.error("❌ Error procesando referido:", error);
      }
    }

    // Limpiar sessionStorage
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
