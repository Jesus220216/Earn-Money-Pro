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

// 📁 FRONTEND

// 🔥 ADMIN PRIMERO
app.get("/admin", (req, res) => {
  res.send("ADMIN OK 🔥");
});

// 🔥 TEST
app.get("/ping", (req, res) => {
  res.send("server actualizado");
});

// 🔥 STATIC DESPUÉS
app.use(express.static(path.join(__dirname, "public")));

// 🔥 HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔐 SECRET
const SECRET = "EarnPro_SECURE_9xLk29@2026";

// 💰 POSTBACK SEGURO
app.get("/postback", async (req, res) => {
  const { userID, amount, transactionID, revenue, secret } = req.query;

  if (secret !== SECRET) return res.send("denied");
  if (!userID || !amount || !transactionID) return res.send("error");

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 5) {
    return res.send("invalid amount");
  }

  try {
    const txRef = db.collection("transactions").doc(transactionID);
    const txSnap = await txRef.get();

    if (txSnap.exists) return res.send("duplicate");

    const userRef = db.collection("users").doc(userID);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.send("no user");

    const userData = userSnap.data();
    const now = Date.now();

    // 🚫 anti spam
    if (userData.lastReward && now - userData.lastReward < 5000) {
      return res.send("too fast");
    }

    // 🚫 anti fraude básico
    if (userData.balance > 100 && userData.referrals === 0) {
      await db.collection("fraud_logs").add({
        userID,
        reason: "balance sospechoso",
        date: now
      });
      return res.send("blocked");
    }

    // 💰 sumar dinero
    await userRef.set({
      balance: admin.firestore.FieldValue.increment(parsedAmount),
      lastReward: now
    }, { merge: true });

    // 💸 referidos
    if (userData.referrer) {
      const commission = parsedAmount * 0.10;

      await db.collection("users").doc(userData.referrer).set({
        balance: admin.firestore.FieldValue.increment(commission),
        referralEarnings: admin.firestore.FieldValue.increment(commission)
      }, { merge: true });
    }

    // 💾 guardar transacción
    await txRef.set({
      userID,
      amount: parsedAmount,
      revenue: parseFloat(revenue || 0),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      date: now
    });

    console.log("✅ Pago:", userID, parsedAmount);

    res.send("ok");

  } catch (e) {
    console.error(e);
    res.send("fail");
  }
});

// 👑 ADMIN USERS
app.get("/admin/users", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const snap = await db.collection("users").get();
  const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.json(users);
});

// 💳 ADMIN WITHDRAWALS
app.get("/admin/withdrawals", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const snap = await db.collection("withdrawals").get();
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.json(data);
});

// ✅ APROBAR
app.get("/admin/approve", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const { id } = req.query;

  await db.collection("withdrawals").doc(id).update({
    status: "approved"
  });

  res.send("approved");
});

// ❌ RECHAZAR
app.get("/admin/reject", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const { id } = req.query;

  await db.collection("withdrawals").doc(id).update({
    status: "rejected"
  });

  res.send("rejected");
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server activo en puerto " + PORT);
});
