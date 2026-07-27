const axios = require("axios");
const { extractOutputText, extractJson } = require("../openaiText");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function writeScript({ channel, insights }) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tapılmadı");
  }

  const prompt = `
Sən YouTube kanalları üçün peşəkar ssenarist və kontent strateqisən.

Kanal: ${channel.title}
Orta baxış sayı: ${insights.avgViews}
Ən çox izlənən videoların başlıqları:
${insights.topTitles.map((t) => "- " + t).join("\n")}

Ən çox istifadə olunan taglar: ${insights.topTags.join(", ") || "Yoxdur"}

Bu məlumatlara əsaslanaraq, kanalın auditoriyasında işləyəcək YENİ bir video üçün tam ssenari hazırla.

Cavabı YALNIZ bu JSON formatında qaytar (başqa mətn əlavə etmə):

{
  "title": "video başlığı",
  "hook": "ilk 10 saniyəlik hook mətni",
  "script": {
    "intro": "giriş hissəsi",
    "body": "əsas hissə",
    "outro": "bitiriş və CTA"
  },
  "description": "YouTube video təsviri",
  "tags": ["tag1", "tag2"]
}
`;

  const { data } = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: prompt
    },
    {
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return extractJson(extractOutputText(data));
}

module.exports = { writeScript };
