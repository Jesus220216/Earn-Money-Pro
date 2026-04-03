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

// 🔐 SECRET
const SECRET = "EarnPro_SECURE_9xLk29@2026";

// 🔥 ADMIN PANEL
app.get("/admin", (req, res) => {
  res.send("ADMIN OK 🔥");
});

// 🔥 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 💰 POSTBACK (MEJORADO)
app.get("/postback", async (req, res) => {
  try {
    const { userID, amount, transactionID, secret } = req.query;

    if (secret !== SECRET) return res.send("denied");

    const parsedAmount = parseFloat(amount);
    if (!userID || !parsedAmount) return res.send("error");

    // 🚫 límite duro
    if (parsedAmount > 2) return res.send("blocked");

    const userRef = db.collection("users").doc(userID);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.send("no user");

    const user = userSnap.data();

    // 🚫 límite diario
    if ((user.dailyEarn || 0) > 5) {
      return res.send("limit");
    }

    await userRef.set({
      balance: admin.firestore.FieldValue.increment(parsedAmount),
      dailyEarn: admin.firestore.FieldValue.increment(parsedAmount)
    }, { merge: true });

    res.send("ok");

  } catch (e) {
    console.log(e);
    res.send("fail");
  }
});

// 💳 RETIROS ADMIN
app.get("/admin/withdrawals", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  const snap = await db.collection("withdrawals").get();
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  res.json(data);
});

// ✅ APROBAR
app.get("/admin/approve", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  await db.collection("withdrawals").doc(req.query.id).update({
    status: "approved"
  });

  res.send("ok");
});

// ❌ RECHAZAR
app.get("/admin/reject", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");

  await db.collection("withdrawals").doc(req.query.id).update({
    status: "rejected"
  });

  res.send("ok");
});

// 🚀 SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 IMPERIO ACTIVO");
});
