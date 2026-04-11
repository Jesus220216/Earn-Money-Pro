const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(express.json());

// 🔐 FIREBASE
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} catch (e) {
  console.error("❌ FIREBASE_KEY ERROR");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔐 SECRET
const SECRET = "EarnPro_SECURE_9xLk29@2026";

// 🌐 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 ADMIN
app.get("/admin", (req, res) => {
  res.send("ADMIN OK 🔥");
});


// ============================================
// 💰 GANANCIAS (ANTI FRAUDE)
// ============================================
app.post("/reward", async (req, res) => {
  try {
    const { uid, amount } = req.body;

    if (!uid || !amount) return res.send("invalid");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid amount");

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

    // 🛑 ANTI SPAM
    if (now - (user.lastEarn || 0) < 15000)
      return res.send("too fast");

    // 🛑 LÍMITE DIARIO
    if ((user.dailyEarn || 0) >= 5)
      return res.send("daily limit");

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
// 🎁 LOOT BOX (PROBABILIDADES)
// ============================================
function getRewardType() {
  const rand = Math.random() * 100;

  if (rand < 80) return "common";
  if (rand < 95) return "rare";
  if (rand < 99) return "epic";
  return "legendary";
}

function getRewardAmount(type) {
  switch(type) {
    case "common": return 0.01;
    case "rare": return 0.03;
    case "epic": return 0.1;
    case "legendary": return 0.5;
  }
}


// ============================================
// 🎯 POSTBACK CPA (REAL + BONUS)
// ============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all("/postback", async (req, res) => {
  try {
    // 👇 SOPORTA GET Y POST
    const data = req.method === "POST" ? req.body : req.query;

    const subid = data.subid || data.tracking_id;
    const payout = data.payout;
    const password = data.password;

    // 🔐 (OPCIONAL PERO RECOMENDADO)
    if (password && password !== "EarnPro2026") {
      return res.send("denied");
    }

    if (!subid || !payout)
      return res.send("invalid");

    const value = parseFloat(payout);
    if (isNaN(value)) return res.send("invalid amount");

    // 🛑 PROTECCIÓN
    if (value > 10) return res.send("blocked");

    const userRef = db.collection("users").doc(subid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    const userData = userDoc.data();

    // 🛑 ANTI DUPLICADO PRO
    if (
      userData.lastCPA === value &&
      Date.now() - (userData.lastUpdate || 0) < 60000
    ) {
      return res.send("duplicate");
    }

    // 🎁 BONUS
    const type = getRewardType();
    const bonus = getRewardAmount(type);
    const total = value + bonus;

    const offer_id = data.offer_id || "unknown";

// 📊 LOG DE CONVERSIÓN
const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
const ua = req.headers["user-agent"] || "";

await db.collection("conversions").add({
  uid: subid,
  payout: value,
  offer: offer_id,
  bonus,
  total,
  ip,
  ua,
  date: Date.now()
});

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(total),
      lastRewardType: type,
      lastBonus: bonus,
      lastCPA: value,
      lastTotal: total,
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

// 🔥 KEEP ALIVE (Render Free Fix)
setInterval(() => {
  console.log("🔥 keep alive");
}, 300000);


