const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(express.json());

// 🔐 FIREBASE (seguro)
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

// 🌐 STATIC
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 💰 REWARD
app.post("/reward", async (req, res) => {
  try {
    const { uid, amount } = req.body;

    if (!uid || !amount) return res.send("invalid");

    const value = parseFloat(amount);
    if (isNaN(value)) return res.send("invalid");

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.send("no user");

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(value)
    });

    res.send("ok");

  } catch (err) {
    console.error(err);
    res.send("error");
  }
});

// 🚀 START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on " + PORT);
});
