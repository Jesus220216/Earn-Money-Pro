const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔐 FIREBASE
let serviceAccount;
try {
  if (process.env.FIREBASE_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  } else {
    console.warn("⚠️ FIREBASE_KEY not found in environment variables");
  }
} catch (e) {
  console.error("❌ FIREBASE_KEY PARSE ERROR");
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Fallback para desarrollo local si existe el archivo (opcional)
  console.log("🚀 Running without Firebase Admin (Check environment variables)");
}

const db = admin.apps.length ? admin.firestore() : null;

// 🔐 SECRET para Admin
const SECRET = "Jhadenjerielpro2201";

// 🌐 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 ADMIN
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ============================================
// 🎯 POSTBACK CPA (REAL + BONUS)
// ============================================
app.all("/postback", async (req, res) => {
  if (!db) return res.status(500).send("Database not initialized");
  
  try {
    const data = req.method === "POST" ? req.body : req.query;
    const subid = data.subid || data.tracking_id;
    const payout = parseFloat(data.payout || 0);
    const password = data.password;

    if (password && password !== "EarnPro2026") return res.send("denied");
    if (!subid || isNaN(payout)) return res.send("invalid");

    const userRef = db.collection("users").doc(subid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.send("no user");

    // Bonus aleatorio (Gamificación)
    const bonus = Math.random() < 0.1 ? 0.10 : 0.02; 
    const total = payout + bonus;

    await db.collection("conversions").add({
      uid: subid,
      payout: payout,
      bonus: bonus,
      total: total,
      offer: data.offer_id || "unknown",
      date: Date.now(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
    });

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(total),
      todayEarnings: admin.firestore.FieldValue.increment(total),
      lastUpdate: Date.now()
    });

    console.log("💰 POSTBACK OK:", subid, total);
    res.send("ok");
  } catch (err) {
    console.error("❌ postback error:", err);
    res.send("error");
  }
});

// ============================================
// 💳 ADMIN: GESTIÓN DE RETIROS
// ============================================
app.get("/admin/withdrawals", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");
  if (!db) return res.json([]);
  
  const snap = await db.collection("withdrawals").orderBy("date", "desc").get();
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(data);
});

app.get("/admin/approve", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");
  const { id } = req.query;
  if (!id || !db) return res.send("invalid");

  await db.collection("withdrawals").doc(id).update({ status: "approved" });
  res.send("ok");
});

app.get("/admin/reject", async (req, res) => {
  if (req.query.secret !== SECRET) return res.send("denied");
  const { id } = req.query;
  if (!id || !db) return res.send("invalid");

  const withdrawRef = db.collection("withdrawals").doc(id);
  const withdrawDoc = await withdrawRef.get();
  
  if (withdrawDoc.exists && withdrawDoc.data().status === "pending") {
    const data = withdrawDoc.data();
    // Reembolsar al usuario
    await db.collection("users").doc(data.userId).update({
      balance: admin.firestore.FieldValue.increment(data.amount)
    });
    await withdrawRef.update({ status: "rejected" });
    res.send("ok");
  } else {
    res.send("already processed or not found");
  }
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
