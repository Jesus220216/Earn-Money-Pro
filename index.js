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

  // 🔐 seguridad
  if (secret !== SECRET) {
    return res.send("denied");
  }

  // 🚫 validación
  if (!userID || !amount || !transactionID) {
    return res.send("error");
  }

  try {
    const txRef = db.collection("transactions").doc(transactionID);
    const txSnap = await txRef.get();

    // 🚫 evitar pagos duplicados
    if (txSnap.exists) {
      return res.send("duplicado");
    }

    // 💰 sumar dinero al usuario
    await db.collection("users").doc(userID).set({
      balance: admin.firestore.FieldValue.increment(parseFloat(amount))
    }, { merge: true });

    // 💾 guardar transacción
    await txRef.set({
      userID,
      amount: parseFloat(amount),
      revenue: parseFloat(revenue || 0),
      date: Date.now()
    });

    console.log("💰 Pago recibido:", {
      userID,
      amount,
      revenue,
      transactionID
    });

    res.send("ok");

  } catch (e) {
    console.error("❌ Error en postback:", e);
    res.send("fail");
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});
