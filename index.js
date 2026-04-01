const express = require("express");
const admin = require("firebase-admin");

const app = express();

// 🔥 CONFIG FIREBASE ADMIN
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🚀 POSTBACK TIMEWALL
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

    console.log("Pago recibido:", userID, amount);

    res.send("ok");
  } catch (e) {
    console.error(e);
    res.send("fail");
  }
});

// SERVER
app.listen(3000, () => console.log("Servidor activo"));
