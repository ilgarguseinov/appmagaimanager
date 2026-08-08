const DEFAULT_HOSTS = {
  content: "https://content-api.wildberries.ru",
  prices: "https://discounts-prices-api.wildberries.ru",
  marketplace: "https://marketplace-api.wildberries.ru",
  statistics: "https://statistics-api.wildberries.ru",
  advert: "https://advert-api.wildberries.ru"
};

const HOST_ENV_OVERRIDE = {
  content: "WB_CONTENT_API_URL",
  prices: "WB_PRICES_API_URL",
  marketplace: "WB_MARKETPLACE_API_URL",
  statistics: "WB_STATISTICS_API_URL",
  advert: "WB_ADVERT_API_URL"
};

function baseUrlFor(category) {
  const override = process.env[HOST_ENV_OVERRIDE[category]];
  return override || DEFAULT_HOSTS[category];
}

export class WbApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "WbApiError";
    this.status = status;
    this.body = body;
  }
}

export function createWbClient() {
  const apiKey = process.env.WB_API_KEY;

  async function request(category, path, { method = "GET", query, body } = {}) {
    if (!apiKey) {
      throw new WbApiError(
        "WB_API_KEY is not set. Add it to the environment before calling Wildberries API tools."
      );
    }

    const url = new URL(path, baseUrlFor(category));
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json"
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw new WbApiError(
        `Wildberries API request failed: ${method} ${url.pathname} -> ${response.status} ${response.statusText}`,
        { status: response.status, body: data ?? text }
      );
    }

    return data;
  }

  return { request };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
