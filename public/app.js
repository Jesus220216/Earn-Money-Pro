// 🔐 FIREBASE AUTH
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();

let user = null;

// ============================================
// 🔐 CONTROL DE SESIÓN
// ============================================
onAuthStateChanged(auth, (u) => {
  if (!u) {
    window.location.href = "/login.html";
    return;
  }

  user = u;

  console.log("✅ Usuario:", user.uid);

  initUser();

  // 🚀 Cargar ofertas automáticamente
  loadOffers();
});

// ============================================
// 👤 INIT USER (tu lógica actual)
// ============================================
async function initUser() {
  console.log("👤 Init user listo");
}

// ============================================
// 💰 LOAD OFFERS (CPAGRIP)
// ============================================
function loadOffers() {
  if (!user || !user.uid) {
    console.log("⛔ Usuario no listo");
    return;
  }

  const uid = user.uid;

  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${uid}`)
    .then(res => res.json())
    .then(data => {

      const container = document.getElementById("offers");

      // 🛑 Sin ofertas
      if (!data.offers || data.offers.length === 0) {
        container.innerHTML = "<p>No hay ofertas disponibles en tu país 😕</p>";
        return;
      }

      let html = "";

      // 🔥 SOLO LAS MEJORES (TOP 5)
      data.offers.slice(0, 5).forEach(offer => {
        html += `
          <div class="card">
            <h3>${offer.title}</h3>
            <a href="${offer.offerlink}" target="_blank">
              🔥 Gana dinero ahora
            </a>
          </div>
        `;
      });

      container.innerHTML = html;

      console.log("💰 Ofertas cargadas");

    })
    .catch(err => {
      console.error("❌ Error cargando ofertas:", err);
    });
}
