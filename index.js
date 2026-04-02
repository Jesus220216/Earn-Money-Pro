const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();

// 🔐 FIREBASE
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 📁 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// 🟢 INDEX (TU WEB)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔐 SECRET
const SECRET = "123abc";

// 💰 POSTBACK (TIMEWALL PRO)
app.get("/postback", async (req, res) => {
  const { userID, amount, transactionID, revenue, secret } = req.query;

  // 🔐 Validar secreto
  if (secret !== SECRET) {
    return res.send("denied");
  }

  // ❌ Validar datos obligatorios
  if (!userID || !amount || !transactionID) {
    return res.send("error");
  }

  // 💣 Validar amount (anti hack)
  if (isNaN(amount) || amount <= 0 || amount > 5) {
    return res.send("invalid amount");
  }

  try {
    const txRef = db.collection("transactions").doc(transactionID);
    const txSnap = await txRef.get();

    // 🚫 evitar duplicados
    if (txSnap.exists) {
      return res.send("duplicate");
    }

    // 💰 sumar dinero
    await db.collection("users").doc(userID).set({
      balance: admin.firestore.FieldValue.increment(parseFloat(amount))
    }, { merge: true });

  // 💸 REFERIDOS
const userRef = await db.collection("users").doc(userID).get();
const userData = userRef.data();

if (userData?.referrer) {
  const commission = parseFloat(amount) * 0.10;

  await db.collection("users").doc(userData.referrer).set({
    balance: admin.firestore.FieldValue.increment(commission),
    referralEarnings: admin.firestore.FieldValue.increment(commission)
  }, { merge: true });

  console.log("🎁 Comisión referida:", commission);
}
    
    // 💾 guardar transacción
    await txRef.set({
      userID,
      amount: parseFloat(amount),
      revenue: parseFloat(revenue || 0),
      date: Date.now()
    });

    console.log("✅ Pago real:", userID, amount);

    res.send("ok");

  } catch (e) {
    console.error(e);
    res.send("fail");
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
