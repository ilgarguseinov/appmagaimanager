const axios = require("axios");
const { extractOutputText } = require("../youtube/openaiText");

async function analyzeProduct({ title, description, price, vendorCode }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY tapılmadı");
  }

  const prompt = `
Sən Wildberries marketpleysi üzrə peşəkar AI analitiksən.

Aşağıdakı məhsulu analiz et:

Məhsul adı: ${title || "Yoxdur"}
Təsvir: ${description || "Yoxdur"}
Artikul (vendorCode): ${vendorCode || "Yoxdur"}
Qiymət: ${price || "Yoxdur"}

Azərbaycan dilində cavab ver.

Bu strukturda analiz et:

1. Məhsul adının Wildberries axtarış alqoritminə uyğunluğu
2. Xarakteristikalar və SEO problemləri
3. Daha yaxşı məhsul adı təklifi
4. Satış üçün daha güclü məhsul təsviri
5. Əsas açar sözlər
6. Satış potensialı: 1-10 bal
7. Konkret inkişaf tövsiyələri
`;

  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: prompt
    },
    {
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      }
    }
  );

  return extractOutputText(response.data) || "AI cavabı alınmadı";
}

module.exports = { analyzeProduct };
