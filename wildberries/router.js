const express = require("express");
const { getCardsList, getPricesByNmId } = require("./client");
const { analyzeProduct } = require("./aiAnalyze");

const router = express.Router();

router.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wildberries - AppMag AI Manager</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f6f7; margin: 0; padding: 40px; color: #202223; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 32px; margin-bottom: 10px; }
    .subtitle { color: #6d7175; margin-bottom: 25px; }
    .back { text-decoration: none; color: #cb11ab; font-weight: bold; }
    .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 25px; }
    .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .card h2 { margin-top: 0; font-size: 20px; }
    .button { display: inline-block; margin-top: 15px; padding: 10px 18px; background: #cb11ab; color: white; text-decoration: none; border-radius: 7px; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="/">← Dashboard</a>
    <h1>Wildberries</h1>
    <p class="subtitle">Wildberries mağazanız üçün AI idarəetmə paneli</p>

    <div class="cards">
      <div class="card">
        <h2>Məhsullar</h2>
        <p>Wildberries kabinetindəki məhsul kartlarını görüntülə və AI ilə analiz et.</p>
        <a class="button" href="/wildberries/products">Məhsulları aç</a>
      </div>

      <div class="card">
        <h2>Mağaza vəziyyəti</h2>
        <p>Wildberries API bağlantısını yoxla.</p>
        <a class="button" href="/wildberries/health">Statusu yoxla</a>
      </div>
    </div>
  </div>
</body>
</html>
  `);
});

router.get("/health", async (req, res) => {
  try {
    await getCardsList({ limit: 1 });
    res.json({ status: "healthy", connected: true });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      status: "unhealthy",
      connected: false,
      error: error.response?.data || error.message
    });
  }
});

router.get("/products", async (req, res) => {
  try {
    const [cards, prices] = await Promise.all([
      getCardsList({ limit: 50 }),
      getPricesByNmId().catch(() => new Map())
    ]);

    const productCards = cards.map((card) => {
      const photo = card.photos && card.photos[0] ? card.photos[0].big || card.photos[0].c246x328 : "";
      const price = prices.get(card.nmID);

      return `
        <div class="product-card">
          <div class="image-wrap">
            ${
              photo
                ? `<img src="${photo}" alt="${card.title || ""}">`
                : `<div class="no-image">Şəkil yoxdur</div>`
            }
          </div>

          <div class="product-info">
            <h3>${card.title || card.vendorCode || "Adsız məhsul"}</h3>

            <p><strong>Artikul:</strong> ${card.vendorCode || "—"}</p>
            <p><strong>Qiymət:</strong> ${price !== undefined ? price : "—"}</p>

            <button
              class="ai-button"
              data-title="${encodeURIComponent(card.title || "")}"
              data-description="${encodeURIComponent(card.description || "")}"
              data-price="${encodeURIComponent(price !== undefined ? String(price) : "")}"
              data-vendorcode="${encodeURIComponent(card.vendorCode || "")}"
              onclick="analyzeProduct(this)"
            >
              AI Analiz
            </button>
          </div>
        </div>
      `;
    }).join("");

    res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Məhsullar - Wildberries - AppMag AI Manager</title>
<style>
body { font-family: Arial, sans-serif; background: #f6f6f7; margin: 0; padding: 40px; color: #202223; }
.container { max-width: 1200px; margin: 0 auto; }
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.back { text-decoration: none; color: #cb11ab; font-weight: bold; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.image-wrap { height: 220px; background: #f1f1f1; display: flex; align-items: center; justify-content: center; }
.image-wrap img { width: 100%; height: 100%; object-fit: contain; }
.no-image { color: #777; }
.product-info { padding: 20px; }
.product-info h3 { margin-top: 0; font-size: 18px; }
.ai-button { margin-top: 10px; padding: 10px 16px; background: #cb11ab; color: white; border: none; border-radius: 7px; cursor: pointer; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="container">
  <div class="topbar">
    <div>
      <h1>Məhsullar</h1>
      <p>Wildberries mağazanızdakı məhsul kartları</p>
    </div>
    <a class="back" href="/wildberries">← Geri</a>
  </div>

  <div class="grid">
    ${productCards || "<p>Məhsul tapılmadı.</p>"}
  </div>
</div>

<script>
async function analyzeProduct(button) {
  const product = {
    title: decodeURIComponent(button.dataset.title || ""),
    description: decodeURIComponent(button.dataset.description || ""),
    price: decodeURIComponent(button.dataset.price || ""),
    vendorCode: decodeURIComponent(button.dataset.vendorcode || "")
  };

  try {
    alert("AI analiz başlayır. Bir neçə saniyə gözləyin...");

    const response = await fetch("/wildberries/api/ai-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert("AI analiz xətası:\\n" + JSON.stringify(data, null, 2));
      return;
    }

    alert(data.analysis);
  } catch (error) {
    alert("Xəta: " + error.message);
  }
}
</script>
</body>
</html>
    `);
  } catch (error) {
    res.status(error.response?.status || 500).send(`
      <h2>Məhsullar yüklənmədi</h2>
      <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
    `);
  }
});

router.post("/api/ai-analyze", async (req, res) => {
  try {
    const analysis = await analyzeProduct(req.body);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: "AI analiz zamanı xəta baş verdi",
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
