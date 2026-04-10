// ============================================
// 📺 CARGAR SCRIPT DE MONETIZACIÓN (CONTROLADO)
// ============================================
function loadMonetizationScript() {
  // Evitar que cargue varias veces
  if (window.scriptLoaded) return;

  const s = document.createElement("script");
  s.src = "https://playabledownloads.com/script_include.php?id=1889113";
  s.async = true;

  document.body.appendChild(s);

  window.scriptLoaded = true;
}
