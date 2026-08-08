const axios = require("axios");

const CONTENT_API = "https://content-api.wildberries.ru";
const PRICES_API = "https://discounts-prices-api.wildberries.ru";

function getApiKey() {
  const apiKey = process.env.WILDBERRIES_API_KEY;

  if (!apiKey) {
    throw new Error("WILDBERRIES_API_KEY tapılmadı");
  }

  return apiKey;
}

async function getCardsList({ limit = 50 } = {}) {
  const response = await axios.post(
    `${CONTENT_API}/content/v2/get/cards/list`,
    {
      settings: {
        cursor: { limit },
        filter: { withPhoto: -1 }
      }
    },
    {
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.cards || [];
}

async function getPricesByNmId() {
  const response = await axios.get(`${PRICES_API}/api/v2/list/goods/filter`, {
    params: { limit: 1000, offset: 0 },
    headers: {
      Authorization: getApiKey()
    }
  });

  const listGoods = response.data?.data?.listGoods || [];
  const priceMap = new Map();

  for (const good of listGoods) {
    const size = good.sizes && good.sizes[0];
    const price = size?.discountedPrice ?? size?.price;

    if (price !== undefined) {
      priceMap.set(good.nmID, price);
    }
  }

  return priceMap;
}

module.exports = { getCardsList, getPricesByNmId };
