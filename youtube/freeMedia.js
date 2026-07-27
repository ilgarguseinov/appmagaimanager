const axios = require("axios");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const TTS_VOICE = process.env.YOUTUBE_TTS_VOICE || "en-US-GuyNeural";

async function generateFreeThumbnail(prompt, { width = 1792, height = 1024 } = {}) {
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt);

  const { data } = await axios.get(url, {
    params: { width, height, nologo: "true" },
    responseType: "arraybuffer"
  });

  return Buffer.from(data).toString("base64");
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("close", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function generateFreeVoiceover(text, voiceName = TTS_VOICE) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);
  const buffer = await streamToBuffer(audioStream);

  tts.close();

  return buffer.toString("base64");
}

module.exports = { generateFreeThumbnail, generateFreeVoiceover };
