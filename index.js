const express = require("express");
const admin = require("firebase-admin");

const app = express();

// 🔐 Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🟢 RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.send("Servidor activo 💰");
});

// 💰 POSTBACK
app.get("/postback", async (req, res) => {
  const userID = req.query.userID;
  const amount = parseFloat(req.query.amount);

  if (!userID || !amount) {
    return res.send("error");
  }

  try {
    await db.collection("users").doc(userID).update({
      balance: admin.firestore.FieldValue.increment(amount)
    });

    console.log("Pago:", userID, amount);

    res.send("ok");
  } catch (e) {
    console.error(e);
    res.send("fail");
  }
});

// 🚀 SERVER (IMPORTANTE PARA RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
