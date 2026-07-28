const path = require("path");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const youtubeRouter = require("./youtube/router");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/youtube", youtubeRouter);

app.get("/spaceflight-simulator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spaceflight-simulator.html"));
});

const PORT = process.env.PORT || 3000;

const SHOP = process.env.SHOPIFY_SHOP;
const CLIENT_ID = process.env.SHOPIFY_API_KEY;
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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
        <h2>YouTube Avtomatlaşdırma</h2>
        <p>
          n8n stilində 5 AI agenti ilə YouTube kanalını avtomatlaşdır.
        </p>
        <a class="button" href="/youtube">
          Agentləri aç
        </a>
      </div>

      <div class="card">
        <h2>Spaceflight Simulator Fansite</h2>
        <p>
          Spaceflight Simulator oyunu üçün fan-sayt nümunəsi.
        </p>
        <a class="button" href="/spaceflight-simulator">
          Sayta bax
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
