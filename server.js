const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const SHOP = process.env.SHOPIFY_SHOP;
const CLIENT_ID = process.env.SHOPIFY_API_KEY;
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET;

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

            <button class="ai-button">
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
app.listen(PORT, () => {
console.log("AppMag AI Manager running on port " + PORT);
});
