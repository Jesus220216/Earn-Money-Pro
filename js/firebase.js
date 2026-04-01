import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBklJc4WZjOsE7XroizPn73hTryR3lXwhY",
  authDomain: "earn-money-pro-626e6.firebaseapp.com",
  projectId: "earn-money-pro-626e6",
  storageBucket: "earn-money-pro-626e6.firebasestorage.app",
  messagingSenderId: "403991623859",
  appId: "1:403991623859:web:dfbf6a8f7f4b4562b058c6",
  measurementId: "G-DJ3LWJEBW6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
