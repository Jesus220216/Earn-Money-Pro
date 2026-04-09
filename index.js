onst express = require("express");
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

// 🔐 SECRET SEGURO
const SECRET = "EarnPro_SECURE_9xLk29@2026";

// 🌐 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 ADMIN PANEL SIMPLE
app.get("/admin", (req, res) => {
  res.send("ADMIN OK 🔥");
});


// ============================================
// 💰 GANANCIA (ANTI FRAUDE PRO)
// ============================================
app.post("/reward", async (req, res) => {
  try {
    const { uid, amount } = req.body;

    if (!uid || !amount) return res.send("invalid");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid amount");

    // 🛑 límite por acción
    if (value > 0.1) return res.send("too high");

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    const user = userDoc.data();
    const now = Date.now();

    // 🛑 ANTI BOT
    const ua = req.headers["user-agent"] || "";
    if (!ua || ua.length < 10) return res.send("bot");

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // 🛑 ANTI SPAM (tiempo entre acciones)
    if (now - (user.lastEarn || 0) < 15000)
      return res.send("too fast");

    // 🛑 LÍMITE DIARIO
    if ((user.dailyEarn || 0) >= 5)
      return res.send("daily limit");

    // 💰 ACTUALIZAR
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(value),
      dailyEarn: (user.dailyEarn || 0) + value,
      lastEarn: now,
      lastIP: ip
    });

    console.log("💰 Reward:", uid, value);

    res.send("ok");

  } catch (err) {
    console.error("❌ reward error:", err);
    res.send("error");
  }
});


// ============================================
// 🎯 POSTBACK CPA (PROTEGIDO)
// ============================================
app.get("/postback", async (req, res) => {
  try {
    const { uid, amount, secret } = req.query;

    if (!uid || !amount || !secret)
      return res.send("invalid");

    if (secret !== SECRET)
      return res.send("denied");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid amount");

    // 🛑 límite CPA
    if (value > 10) return res.send("blocked");

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(value)
    });

    console.log("🎯 CPA:", uid, value);

    res.send("ok");

  } catch (err) {
    console.error("❌ postback error:", err);
    res.send("error");
  }
});


// ============================================
// 💳 VER RETIROS
// ============================================
app.get("/admin/withdrawals", async (req, res) => {
  if (req.query.secret !== SECRET)
    return res.send("denied");

  const snap = await db.collection("withdrawals").get();

  const data = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  res.json(data);
});


// ============================================
// ✅ APROBAR RETIRO
// ============================================
app.get("/admin/approve", async (req, res) => {
  if (req.query.secret !== SECRET)
    return res.send("denied");

  const { id } = req.query;
  if (!id) return res.send("invalid");

  await db.collection("withdrawals").doc(id).update({
    status: "approved"
  });

  console.log("✅ Approved:", id);

  res.send("ok");
});


// ============================================
// ❌ RECHAZAR RETIRO
// ============================================
app.get("/admin/reject", async (req, res) => {
  if (req.query.secret !== SECRET)
    return res.send("denied");

  const { id } = req.query;
  if (!id) return res.send("invalid");

  await db.collection("withdrawals").doc(id).update({
    status: "rejected"
  });

  console.log("❌ Rejected:", id);

  res.send("ok");
});


// ============================================
// 🚀 START
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server PRO running on port " + PORT);
});

