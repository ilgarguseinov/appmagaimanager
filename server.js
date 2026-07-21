const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
res.json({ status: "ok", message: "AppMag AI Manager is running" });
});

app.get("/health", (req, res) => {
res.json({ status: "healthy" });
});

app.get("/api/products", async (req, res) => {
try {
const shop = process.env.SHOPIFY_SHOP;
const accessToken = process.env.SHOPIFY_API_SECRET;

const response = await axios.get(
"https://" + shop + "/admin/api/2026-07/products.json",
{
headers: {
"X-Shopify-Access-Token": accessToken,
"Content-Type": "application/json"
}
}
);

res.json(response.data);

} catch (error) {
res.status(500).json({
error: "Failed to get Shopify products",
details: error.response?.data || error.message
});
}
});

app.listen(PORT, () => {
console.log("AppMag AI Manager running on port " + PORT);
});
