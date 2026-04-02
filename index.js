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

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Panel</title>
      <style>
        body { font-family: Arial; background: #111; color: white; padding: 20px; }
        .card { background: #1f1f1f; padding: 15px; margin: 10px 0; border-radius: 10px; }
        button { margin: 5px; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; }
        .ok { background: #22c55e; }
        .no { background: #ef4444; }
      </style>
    </head>
    <body>

    <h2>💳 Retiros</h2>
    <div id="list">Cargando...</div>

    <script>
      const SECRET = "123abc";

      async function load() {
        const res = await fetch('/admin/withdrawals?secret=' + SECRET);
        const data = await res.json();

        const div = document.getElementById("list");
        div.innerHTML = "";

        data.forEach(w => {
          div.innerHTML += \`
            <div class="card">
              👤 \${w.userId}<br>
              💰 $\${w.amount}<br>
              📊 \${w.status || "pending"}<br>
              <button class="ok" onclick="approve('\${w.id}')">Aprobar</button>
              <button class="no" onclick="reject('\${w.id}')">Rechazar</button>
            </div>
          \`;
        });
      }

      function approve(id){
        fetch('/admin/approve?id=' + id + '&secret=' + SECRET)
        .then(()=> location.reload());
      }

      function reject(id){
        fetch('/admin/reject?id=' + id + '&secret=' + SECRET)
        .then(()=> location.reload());
      }

      load();
    </script>

    </body>
    </html>
  `);
});

app.get("/ping", (req, res) => {
  res.send("server actualizado");
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
