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
res.json({
status: "ok",
message: "AppMag AI Manager is running"
});
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
