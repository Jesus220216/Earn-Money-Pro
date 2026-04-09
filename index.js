const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(express.json());

// 🔐 FIREBASE
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔐 SECRET
const SECRET = process.env.SECRET;

// 🌐 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================
// 💰 REWARD SYSTEM PRO (FIX REAL)
// ============================================
app.post("/reward", async (req, res) => {
  try {
    const { uid, amount } = req.body;

    if (!uid || !amount) return res.send("invalid");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid");

    if (value > 0.1) return res.send("too high");

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    const user = userDoc.data();
    const now = Date.now();
    const today = new Date().toDateString();

    // 🔄 RESET DIARIO AUTOMÁTICO
    if (user.todayDate !== today) {
      await userRef.update({
        todayEarnings: 0,
        todayDate: today,
        dailyEarn: 0
      });
    }

    // 🛑 ANTI SPAM
    if (now - (user.lastEarn || 0) < 10000)
      return res.send("too fast");

    // 🛑 LÍMITE DIARIO
    if ((user.dailyEarn || 0) >= 5)
      return res.send("limit");

    // 💰 UPDATE REAL
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(value),
      todayEarnings: admin.firestore.FieldValue.increment(value),
      dailyEarn: (user.dailyEarn || 0) + value,
      lastEarn: now
    });

    res.send("ok");

  } catch (err) {
    console.log(err);
    res.send("error");
  }
});

// ============================================
// 🎯 POSTBACK CPA
// ============================================
app.get("/postback", async (req, res) => {
  try {
    const { uid, amount, secret } = req.query;

    if (!uid || !amount || !secret)
      return res.send("invalid");

    if (secret !== SECRET)
      return res.send("denied");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid");

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(value),
      todayEarnings: admin.firestore.FieldValue.increment(value)
    });

    res.send("ok");

  } catch (err) {
    console.log(err);
    res.send("error");
  }
});

// ============================================
// 💳 RETIROS
// ============================================
app.get("/admin/withdrawals", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const snap = await db.collection("withdrawals").get();
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  res.json(data);
});

app.get("/admin/approve", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  await db.collection("withdrawals").doc(req.query.id).update({
    status: "approved"
  });

  res.send("ok");
});

app.get("/admin/reject", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  await db.collection("withdrawals").doc(req.query.id).update({
    status: "rejected"
  });

  res.send("ok");
});

// ============================================
// 🚀 START
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on " + PORT);
});
