function loadOffers() {
  const uid = localStorage.getItem("uid");

  fetch(`https://www.cpagrip.com/common/offer_feed_json.php?user_id=2515689&pubkey=34053872c6552fb19c9838ebb8b56138&tracking_id=${uid}`)
    .then(res => res.json())
    .then(data => {
      let html = "";

      data.offers.forEach(offer => {
        html += `
          <div class="card">
            <h3>${offer.title}</h3>
            <a href="${offer.offerlink}" target="_blank">
              💰 Completar oferta
            </a>
          </div>
        `;
      });

      document.getElementById("offers").innerHTML = html;
    });
}

  user = u;

  await initUser();

  track("session_start");
});
