const axios = require("axios");
const { extractOutputText, extractJson } = require("../openaiText");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateContent(script) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tapılmadı");
  }

  const scenePrompt = `
Aşağıdakı video ssenarisini çəkiliş/animasiya üçün səhnələrə böl.

Başlıq: ${script.title}
Hook: ${script.hook}
Giriş: ${script.script.intro}
Əsas hissə: ${script.script.body}
Bitiriş: ${script.script.outro}

Cavabı YALNIZ bu JSON formatında qaytar (başqa mətn əlavə etmə):

{
  "scenes": [
    { "sceneNumber": 1, "visual": "ekranda nə göstərilsin", "voiceover": "səsləndirmə mətni", "durationSeconds": 8 }
  ],
  "thumbnailPrompt": "thumbnail üçün görüntü generasiya promptu (ingiliscə, detallı)"
}
`;

  const { data } = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.6",
      reasoning: { effort: "low" },
      input: scenePrompt
    },
    {
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  const contentPlan = extractJson(extractOutputText(data));

  const imageResponse = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: "gpt-image-1",
      prompt: contentPlan.thumbnailPrompt,
      size: "1792x1024"
    },
    {
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  const thumbnailBase64 = imageResponse.data.data?.[0]?.b64_json || null;

  return {
    scenes: contentPlan.scenes,
    thumbnailPrompt: contentPlan.thumbnailPrompt,
    thumbnailBase64
  };
}

module.exports = { generateContent };
