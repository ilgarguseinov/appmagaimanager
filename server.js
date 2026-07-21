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
        <a class="button" href="/api/products">
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

app.get("/api/products", async (req, res) => {
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

res.json(response.data);
} catch (error) {
res.status(error.response?.status || 500).json({
error: "Failed to get Shopify products",
details: error.response?.data || error.message
});
}
});

app.listen(PORT, () => {
console.log("AppMag AI Manager running on port " + PORT);
});
