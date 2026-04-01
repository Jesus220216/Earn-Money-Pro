import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAr9_H2sbtNM0eg7tXomHBwIhDpDAYXz1w",
  authDomain: "earn-money-pro-a92c7.firebaseapp.com",
  projectId: "earn-money-pro-a92c7",
  storageBucket: "earn-money-pro-a92c7.firebasestorage.app",
  messagingSenderId: "197560363475",
  appId: "1:197560363475:web:672ab7cdc0fdcb8369a726",
  measurementId: "G-F10ELC29CY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
