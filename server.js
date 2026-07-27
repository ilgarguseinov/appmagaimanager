const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const youtubeRouter = require("./youtube/router");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/youtube", youtubeRouter);

const PORT = process.env.PORT || 3000;

const SHOP = process.env.SHOPIFY_SHOP;
const CLIENT_ID = process.env.SHOPIFY_API_KEY;
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const campaigns = [];
let nextCampaignId = 1;

async function generateAdCopy({ name, product, platform, audience, budget, notes }) {
  const prompt = `
Sən peşəkar reklam mətni (copywriting) üzrə AI mütəxəssissən.

Aşağıdakı reklam kampaniyası üçün qısa və effektiv reklam mətni hazırla:

Kampaniya adı: ${name || "Yoxdur"}
Platforma: ${platform || "Yoxdur"}
Məhsul/Xidmət: ${product || "Yoxdur"}
Hədəf auditoriya: ${audience || "Yoxdur"}
Büdcə: ${budget || "Yoxdur"}
Əlavə qeydlər: ${notes || "Yoxdur"}

Azərbaycan dilində cavab ver. Bu strukturda hazırla:

1. Diqqətçəkən başlıq (2-3 variant)
2. Qısa reklam mətni (1-2 cümlə)
3. Çağırış (call to action)
4. Tövsiyə olunan açar sözlər/hashtag-lər
`;

  const aiResponse = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.6",
      reasoning: {
        effort: "low"
      },
      input: prompt
    },
    {
      headers: {
        "Authorization": "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return (
    aiResponse.data.output_text ||
    aiResponse.data.output
      ?.flatMap(item => item.content || [])
      ?.filter(item => item.type === "output_text")
      ?.map(item => item.text)
      ?.join("\n") ||
    "AI cavabı alınmadı"
  );
}

async function getAccessToken() {
const params = new URLSearchParams();

params.append("grant_type", "client_credentials");
params.append("client_id", CLIENT_ID);
params.append("client_secret", CLIENT_SECRET);

const response = await axios.post(
"https://" + SHOP + "/admin/oauth/access_token",
params.toString(),
{
headers: {
"Content-Type": "application/x-www-form-urlencoded"
}
}
);

return response.data.access_token;
}

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AppMag AI Manager</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f6f6f7;
      margin: 0;
      padding: 40px;
      color: #202223;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #6d7175;
      margin-bottom: 25px;
    }

    .status {
      display: inline-block;
      padding: 8px 12px;
      background: #e3f1df;
      color: #1a7f37;
      border-radius: 20px;
      font-weight: bold;
      margin-bottom: 25px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }

    .card h2 {
      margin-top: 0;
      font-size: 20px;
    }

    .button {
      display: inline-block;
      margin-top: 15px;
      padding: 10px 18px;
      background: #008060;
      color: white;
      text-decoration: none;
      border-radius: 7px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>

<body>
  <div class="container">

    <h1>AppMag AI Manager</h1>

    <p class="subtitle">
      Shopify mağazanız üçün AI idarəetmə paneli
    </p>

    <div class="status">
      ● Shopify bağlantısı aktivdir
    </div>

    <div class="cards">

      <div class="card">
        <h2>Məhsullar</h2>
        <p>
          Shopify mağazasındakı məhsulları görüntülə və analiz et.
        </p>
        <a class="button" href="/products">
          Məhsulları aç
        </a>
      </div>

      <div class="card">
        <h2>AI Analiz</h2>
        <p>
          Məhsul adları, təsvirlər və SEO üçün AI analizi.
        </p>
        <button class="button">
          Tezliklə
        </button>
      </div>

      <div class="card">
        <h2>Mağaza vəziyyəti</h2>
        <p>
          API və server bağlantısını yoxla.
        </p>
        <a class="button" href="/health">
          Statusu yoxla
        </a>
      </div>

      <div class="card">
        <h2>Mağaza statistikası</h2>
        <p>
          Məhsul, sifariş və müştəri sayı kimi əsas göstəricilər.
        </p>
        <a class="button" href="/statistics">
          Statistikanı aç
        </a>
      </div>

      <div class="card">
        <h2>Reklam Kampaniyaları</h2>
        <p>
          Yeni reklam kampaniyası yarat və AI ilə reklam mətni əldə et.
        </p>
        <a class="button" href="/campaigns">
          Kampaniyaları aç
        </a>
      </div>

      <div class="card">
        <h2>YouTube Avtomatlaşdırma</h2>
        <p>
          n8n stilində 5 AI agenti ilə YouTube kanalını avtomatlaşdır.
        </p>
        <a class="button" href="/youtube">
          Agentləri aç
        </a>
      </div>

    </div>
  </div>
</body>
</html>
  `);
});

app.get("/health", (req, res) => {
res.json({
status: "healthy"
});
});

app.get("/products", async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      "https://" + SHOP + "/admin/api/2026-07/products.json",
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );

    const products = response.data.products || [];

    const productCards = products.map((product) => {
      const firstVariant =
        product.variants && product.variants[0]
          ? product.variants[0]
          : {};

      const price = firstVariant.price || "—";
      const stock = firstVariant.inventory_quantity ?? "—";

      const image =
        product.image && product.image.src
          ? product.image.src
          : "";

      return `
        <div class="product-card">

          <div class="image-wrap">
            ${
              image
                ? `<img src="${image}" alt="${product.title}">`
                : `<div class="no-image">Şəkil yoxdur</div>`
            }
          </div>

          <div class="product-info">
            <h3>${product.title}</h3>

            <p><strong>Qiymət:</strong> ${price}</p>
            <p><strong>Stok:</strong> ${stock}</p>
            <p><strong>Status:</strong> ${product.status || "—"}</p>

          <button
  class="ai-button"
  data-title="${encodeURIComponent(product.title || "")}"
  data-description="${encodeURIComponent(product.body_html || "")}"
  data-price="${encodeURIComponent(price || "")}"
  data-stock="${encodeURIComponent(String(stock ?? ""))}"
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

<title>Məhsullar - AppMag AI Manager</title>

<style>


body {
  font-family: Arial, sans-serif;
  background: #f6f6f7;
  margin: 0;
  padding: 40px;
  color: #202223;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back {
  text-decoration: none;
  color: #008060;
  font-weight: bold;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.image-wrap {
  height: 220px;
  background: #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-image {
  color: #777;
}

.product-info {
  padding: 20px;
}

.product-info h3 {
  margin-top: 0;
  font-size: 18px;
}

.ai-button {
  margin-top: 10px;
  padding: 10px 16px;
  background: #008060;
  color: white;
  border: none;
  border-radius: 7px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

</style>

</head>

<body>

<div class="container">

  <div class="topbar">

    <div>
      <h1>Məhsullar</h1>
      <p>Shopify mağazanızdakı məhsullar</p>
    </div>

    <a class="back" href="/">
      ← Dashboard
    </a>

  </div>

  <div class="grid">
    ${productCards}
  </div>

</div>

<script>
async function analyzeProduct(button) {
  const product = {
    title: decodeURIComponent(button.dataset.title || ""),
    description: decodeURIComponent(button.dataset.description || ""),
    price: decodeURIComponent(button.dataset.price || ""),
    stock: decodeURIComponent(button.dataset.stock || "")
  };

  try {
    alert("AI analiz başlayır. Bir neçə saniyə gözləyin...");

    const response = await fetch("/api/ai-analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(
        "AI analiz xətası:\\n" +
        JSON.stringify(data, null, 2)
      );
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

      <pre>
${JSON.stringify(error.response?.data || error.message, null, 2)}
      </pre>
    `);

  }
});
app.get("/statistics", async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const headers = {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    };

    const apiBase = "https://" + SHOP + "/admin/api/2026-07";

    const [shopResult, productsResult, ordersResult, customersResult] =
      await Promise.allSettled([
        axios.get(apiBase + "/shop.json", { headers }),
        axios.get(apiBase + "/products/count.json", { headers }),
        axios.get(apiBase + "/orders/count.json?status=any", { headers }),
        axios.get(apiBase + "/customers/count.json", { headers })
      ]);

    const shop =
      shopResult.status === "fulfilled" ? shopResult.value.data.shop : null;

    const productCount =
      productsResult.status === "fulfilled"
        ? productsResult.value.data.count
        : "—";

    const orderCount =
      ordersResult.status === "fulfilled"
        ? ordersResult.value.data.count
        : "—";

    const customerCount =
      customersResult.status === "fulfilled"
        ? customersResult.value.data.count
        : "—";

    res.send(`
<!DOCTYPE html>
<html lang="az">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Statistika - AppMag AI Manager</title>

<style>

body {
  font-family: Arial, sans-serif;
  background: #f6f6f7;
  margin: 0;
  padding: 40px;
  color: #202223;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back {
  text-decoration: none;
  color: #008060;
  font-weight: bold;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #6d7175;
  font-weight: normal;
}

.stat-card .value {
  font-size: 32px;
  font-weight: bold;
}

.shop-info {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.shop-info h2 {
  margin-top: 0;
}

.shop-info table {
  width: 100%;
  border-collapse: collapse;
}

.shop-info td {
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
}

.shop-info td:first-child {
  color: #6d7175;
  width: 200px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

</style>

</head>

<body>

<div class="container">

  <div class="topbar">

    <div>
      <h1>Mağaza statistikası</h1>
      <p>Shopify mağazanızın əsas göstəriciləri</p>
    </div>

    <a class="back" href="/">
      ← Dashboard
    </a>

  </div>

  <div class="grid">

    <div class="stat-card">
      <h3>Məhsul sayı</h3>
      <div class="value">${productCount}</div>
    </div>

    <div class="stat-card">
      <h3>Sifariş sayı</h3>
      <div class="value">${orderCount}</div>
    </div>

    <div class="stat-card">
      <h3>Müştəri sayı</h3>
      <div class="value">${customerCount}</div>
    </div>

  </div>

  <br>

  ${
    shop
      ? `
  <div class="shop-info">
    <h2>Mağaza məlumatı</h2>
    <table>
      <tr>
        <td>Ad</td>
        <td>${shop.name || "—"}</td>
      </tr>
      <tr>
        <td>Domen</td>
        <td>${shop.domain || "—"}</td>
      </tr>
      <tr>
        <td>Valyuta</td>
        <td>${shop.currency || "—"}</td>
      </tr>
      <tr>
        <td>Plan</td>
        <td>${shop.plan_name || "—"}</td>
      </tr>
      <tr>
        <td>Ölkə</td>
        <td>${shop.country_name || "—"}</td>
      </tr>
      <tr>
        <td>Vaxt zonası</td>
        <td>${shop.iana_timezone || "—"}</td>
      </tr>
    </table>
  </div>
  `
      : `
  <div class="shop-info">
    <h2>Mağaza məlumatı</h2>
    <p>Mağaza məlumatı yüklənə bilmədi.</p>
  </div>
  `
  }

</div>

</body>
</html>
    `);

  } catch (error) {

    res.status(error.response?.status || 500).send(`
      <h2>Statistika yüklənmədi</h2>

      <pre>
${JSON.stringify(error.response?.data || error.message, null, 2)}
      </pre>
    `);

  }
});

app.get("/campaigns", (req, res) => {
  const campaignCards = campaigns
    .slice()
    .reverse()
    .map((campaign) => `
      <div class="campaign-card">
        <div class="campaign-head">
          <h3>${campaign.name}</h3>
          <span class="platform-badge">${campaign.platform}</span>
        </div>
        <p><strong>Məhsul/Xidmət:</strong> ${campaign.product || "—"}</p>
        <p><strong>Hədəf auditoriya:</strong> ${campaign.audience || "—"}</p>
        <p><strong>Büdcə:</strong> ${campaign.budget || "—"}</p>
        ${
          campaign.notes
            ? `<p><strong>Qeydlər:</strong> ${campaign.notes}</p>`
            : ""
        }
        ${
          campaign.adCopy
            ? `<div class="ad-copy"><strong>AI reklam mətni:</strong><pre>${campaign.adCopy}</pre></div>`
            : ""
        }
        <p class="created-at">Yaradıldı: ${new Date(campaign.createdAt).toLocaleString("az-AZ")}</p>
      </div>
    `)
    .join("") || `<p class="empty-state">Hələ heç bir kampaniya yaradılmayıb.</p>`;

  res.send(`
<!DOCTYPE html>
<html lang="az">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Reklam Kampaniyaları - AppMag AI Manager</title>

<style>

body {
  font-family: Arial, sans-serif;
  background: #f6f6f7;
  margin: 0;
  padding: 40px;
  color: #202223;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back {
  text-decoration: none;
  color: #008060;
  font-weight: bold;
}

.layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}

.form-card, .campaign-card, .empty-state {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.form-card h2 {
  margin-top: 0;
}

.form-card label {
  display: block;
  font-weight: bold;
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-card input,
.form-card select,
.form-card textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #c9cccf;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
}

.form-card textarea {
  min-height: 70px;
  resize: vertical;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.checkbox-row input {
  width: auto;
}

.submit-button {
  margin-top: 20px;
  width: 100%;
  padding: 12px 18px;
  background: #008060;
  color: white;
  text-decoration: none;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-size: 15px;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.campaign-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.campaign-head h3 {
  margin: 0;
}

.platform-badge {
  background: #e3f1df;
  color: #1a7f37;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.ad-copy {
  margin-top: 12px;
  background: #f6f6f7;
  border-radius: 8px;
  padding: 12px;
}

.ad-copy pre {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 8px 0 0 0;
}

.created-at {
  color: #6d7175;
  font-size: 12px;
  margin-bottom: 0;
}

.empty-state {
  color: #6d7175;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

</style>

</head>

<body>

<div class="container">

  <div class="topbar">

    <div>
      <h1>Reklam Kampaniyaları</h1>
      <p>Yeni reklam kampaniyası yarat və istəsən AI ilə reklam mətni yaratdır</p>
    </div>

    <a class="back" href="/">
      ← Dashboard
    </a>

  </div>

  <div class="layout">

    <div class="form-card">
      <h2>Yeni kampaniya</h2>

      <form id="campaign-form">

        <label for="name">Kampaniya adı</label>
        <input type="text" id="name" name="name" required>

        <label for="platform">Platforma</label>
        <select id="platform" name="platform">
          <option value="Meta (Facebook/Instagram)">Meta (Facebook/Instagram)</option>
          <option value="Google Ads">Google Ads</option>
          <option value="TikTok">TikTok</option>
          <option value="Digər">Digər</option>
        </select>

        <label for="product">Məhsul/Xidmət</label>
        <input type="text" id="product" name="product">

        <label for="audience">Hədəf auditoriya</label>
        <input type="text" id="audience" name="audience" placeholder="Məs: 18-35 yaş, qadınlar, Bakı">

        <label for="budget">Büdcə (AZN)</label>
        <input type="text" id="budget" name="budget">

        <label for="notes">Əlavə qeydlər</label>
        <textarea id="notes" name="notes"></textarea>

        <div class="checkbox-row">
          <input type="checkbox" id="generateAI" name="generateAI" checked>
          <label for="generateAI" style="margin:0;">AI ilə reklam mətni yarat</label>
        </div>

        <button type="submit" class="submit-button" id="submit-button">
          Kampaniya yarat
        </button>

      </form>
    </div>

    <div class="campaigns-list">
      ${campaignCards}
    </div>

  </div>

</div>

<script>
document.getElementById("campaign-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = document.getElementById("submit-button");
  const form = e.target;

  const payload = {
    name: form.name.value,
    platform: form.platform.value,
    product: form.product.value,
    audience: form.audience.value,
    budget: form.budget.value,
    notes: form.notes.value,
    generateAI: form.generateAI.checked
  };

  submitButton.disabled = true;
  submitButton.textContent = payload.generateAI
    ? "Yaradılır (AI reklam mətni hazırlanır)..."
    : "Yaradılır...";

  try {
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert("Kampaniya yaradıla bilmədi:\\n" + JSON.stringify(data, null, 2));
      submitButton.disabled = false;
      submitButton.textContent = "Kampaniya yarat";
      return;
    }

    window.location.reload();

  } catch (error) {
    alert("Xəta: " + error.message);
    submitButton.disabled = false;
    submitButton.textContent = "Kampaniya yarat";
  }
});
</script>

</body>
</html>
  `);
});

app.post("/api/campaigns", async (req, res) => {
  try {
    const { name, platform, product, audience, budget, notes, generateAI } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Kampaniya adı tələb olunur"
      });
    }

    const campaign = {
      id: nextCampaignId++,
      name,
      platform: platform || "Digər",
      product: product || "",
      audience: audience || "",
      budget: budget || "",
      notes: notes || "",
      adCopy: null,
      createdAt: new Date().toISOString()
    };

    if (generateAI) {
      if (!OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "OPENAI_API_KEY tapılmadı"
        });
      }

      campaign.adCopy = await generateAdCopy(campaign);
    }

    campaigns.push(campaign);

    res.json({
      success: true,
      campaign
    });

  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Kampaniya yaradılarkən xəta baş verdi",
      details: error.response?.data || error.message
    });
  }
});

app.get("/api/campaigns", (req, res) => {
  res.json({
    success: true,
    campaigns
  });
});

app.post("/api/ai-analyze", async (req, res) => {
  try {
    const { title, description, price, stock } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY tapılmadı"
      });
    }

    const prompt = `
Sən e-commerce və Shopify üzrə peşəkar AI analitiksən.

Aşağıdakı məhsulu analiz et:

Məhsul adı: ${title || "Yoxdur"}
Təsvir: ${description || "Yoxdur"}
Qiymət: ${price || "Yoxdur"}
Stok: ${stock ?? "Yoxdur"}

Azərbaycan dilində cavab ver.

Bu strukturda analiz et:

1. Məhsul adının analizi
2. SEO problemləri
3. Daha yaxşı məhsul adı təklifi
4. Satış üçün daha güclü məhsul təsviri
5. Əsas açar sözlər
6. Satış potensialı: 1-10 bal
7. Konkret inkişaf tövsiyələri
`;

    const aiResponse = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-5.6",
        reasoning: {
          effort: "low"
        },
        input: prompt
      },
      {
        headers: {
          "Authorization": "Bearer " + OPENAI_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const outputText =
      aiResponse.data.output_text ||
      aiResponse.data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("\n") ||
      "AI cavabı alınmadı";

    res.json({
      success: true,
      analysis: outputText
    });

  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: "AI analiz zamanı xəta baş verdi",
      details: error.response?.data || error.message
    });
  }
});
app.listen(PORT, () => {
console.log("AppMag AI Manager running on port " + PORT);
});
