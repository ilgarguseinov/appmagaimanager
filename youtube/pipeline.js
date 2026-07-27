const { analyzeChannel } = require("./agents/channelAnalyzer");
const { analyzeTopVideos } = require("./agents/topVideosAnalyzer");
const { writeScript } = require("./agents/scriptWriter");
const { generateContent } = require("./agents/contentGenerator");
const { publish } = require("./agents/publisher");

async function runPipeline({ channelId, videoFilePath } = {}) {
  const trace = [];

  const channelData = await analyzeChannel(channelId);
  trace.push({
    node: "1. YouTube Kanal Analiz Agenti",
    output: { channel: channelData.channel, videoCount: channelData.videos.length }
  });

  const topVideosData = analyzeTopVideos(channelData);
  trace.push({ node: "2. Ən Çox İzlənən Videolar Agenti", output: topVideosData.insights });

  const script = await writeScript({ channel: channelData.channel, insights: topVideosData.insights });
  trace.push({ node: "3. Mətn/Ssenari Hazırlama Agenti", output: script });

  const content = await generateContent(script);
  trace.push({
    node: "4. Kontent Generasiya Agenti",
    output: {
      scenes: content.scenes.map(({ audioBase64, ...scene }) => scene),
      thumbnailPrompt: content.thumbnailPrompt,
      hasThumbnail: Boolean(content.thumbnailBase64),
      hasVoiceover: content.scenes.every((scene) => Boolean(scene.audioBase64))
    }
  });

  const publishResult = await publish({ videos: channelData.videos, script, videoFilePath });
  trace.push({ node: "5. Ən Yaxşı Vaxtda Yükləmə Agenti", output: publishResult });

  return { trace, channel: channelData.channel, insights: topVideosData.insights, script, content, publishResult };
}

module.exports = { runPipeline };
