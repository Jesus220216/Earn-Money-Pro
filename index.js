const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();

// 🔐 Firebase
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

// 💰 POSTBACK (TimeWall)
app.get("/postback", async (req, res) => {

  // ✅ VALIDACIÓN CORRECTA (AQUÍ VA)
  if (req.query.secret !== SECRET) {
    return res.send("denied");
  }

  const userID = req.query.userID;
  const amount = parseFloat(req.query.amount);

  if (!userID || !amount) {
    return res.send("error");
  }

  try {
    await db.collection("users").doc(userID).set({
      balance: admin.firestore.FieldValue.increment(amount)
    }, { merge: true });

    console.log("Pago:", userID, amount);

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
